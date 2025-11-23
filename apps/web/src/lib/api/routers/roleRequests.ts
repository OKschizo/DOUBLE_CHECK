import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createRoleRequestSchema,
  reviewRoleRequestSchema,
  type RoleRequest,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission, getUserRole } from './projectMembers';

export const roleRequestsRouter = router({
  /**
   * List all role requests for a project (filtered by permission)
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userRole = await getUserRole(input.projectId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const requestsRef = adminDb.collection('roleRequests');
      let query = requestsRef.where('projectId', '==', input.projectId);

      // Regular users only see their own requests
      if (!['owner', 'admin', 'dept_head'].includes(userRole)) {
        query = query.where('requestedBy', '==', ctx.user.id);
      }

      const snapshot = await query.get();

      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as RoleRequest;
      });

      // Dept heads only see requests for their departments
      if (userRole === 'dept_head') {
        const deptHeadsSnapshot = await adminDb
          .collection('departmentHeads')
          .where('projectId', '==', input.projectId)
          .where('userId', '==', ctx.user.id)
          .get();

        const myDepartments = new Set(deptHeadsSnapshot.docs.map((doc) => doc.data().department));

        return requests.filter(
          (req) =>
            req.requestedBy === ctx.user.id || // Their own requests
            myDepartments.has(req.requestedDepartment) // Or requests for their departments
        );
      }

      return requests;
    }),

  /**
   * Get pending requests count (for badges)
   */
  getPendingCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userRole = await getUserRole(input.projectId, ctx.user.id);
      if (!userRole) {
        return { count: 0 };
      }

      // Only dept heads, admins, and owners see pending counts
      if (!['owner', 'admin', 'dept_head'].includes(userRole)) {
        return { count: 0 };
      }

      const requestsRef = adminDb.collection('roleRequests');
      const query = requestsRef
        .where('projectId', '==', input.projectId)
        .where('status', '==', 'pending');

      const snapshot = await query.get();
      let count = snapshot.size;

      // Dept heads only count their departments
      if (userRole === 'dept_head') {
        const deptHeadsSnapshot = await adminDb
          .collection('departmentHeads')
          .where('projectId', '==', input.projectId)
          .where('userId', '==', ctx.user.id)
          .get();

        const myDepartments = new Set(deptHeadsSnapshot.docs.map((doc) => doc.data().department));

        count = snapshot.docs.filter((doc) =>
          myDepartments.has(doc.data().requestedDepartment)
        ).length;
      }

      return { count };
    }),

  /**
   * Create a new role request
   */
  create: protectedProcedure
    .input(createRoleRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has access to this project
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
        'crew',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Get the crew member to verify ownership and get current data
      const crewDoc = await adminDb.collection('crew').doc(input.crewMemberId).get();

      if (!crewDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Crew member not found' });
      }

      const crewData = crewDoc.data()!;

      // Verify the user is requesting for their own crew card
      if (crewData.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only request changes to your own role',
        });
      }

      // Check if there's already a pending request for this crew member
      const existingSnapshot = await adminDb
        .collection('roleRequests')
        .where('crewMemberId', '==', input.crewMemberId)
        .where('status', '==', 'pending')
        .get();

      if (!existingSnapshot.empty) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have a pending request for this role',
        });
      }

      // Create the request
      const requestsRef = adminDb.collection('roleRequests');
      const docRef = await requestsRef.add({
        projectId: input.projectId,
        crewMemberId: input.crewMemberId,
        requestedBy: ctx.user.id,
        requesterName: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'User',
        currentDepartment: crewData.department,
        currentRole: crewData.role,
        requestedDepartment: input.requestedDepartment,
        requestedRole: input.requestedRole,
        reason: input.reason,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as RoleRequest;
    }),

  /**
   * Review (approve/deny) a role request
   */
  review: protectedProcedure
    .input(reviewRoleRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const requestDoc = await adminDb.collection('roleRequests').doc(input.requestId).get();

      if (!requestDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
      }

      const request = requestDoc.data()!;

      if (request.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request already processed' });
      }

      // Check permissions
      const userRole = await getUserRole(request.projectId, ctx.user.id);

      if (!userRole) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Owner and admin can approve all requests
      const canApproveAll = ['owner', 'admin'].includes(userRole);

      // Dept heads can only approve requests for their departments
      let canApproveDept = false;
      if (userRole === 'dept_head') {
        const deptHeadsSnapshot = await adminDb
          .collection('departmentHeads')
          .where('projectId', '==', request.projectId)
          .where('userId', '==', ctx.user.id)
          .where('department', '==', request.requestedDepartment)
          .get();

        canApproveDept = !deptHeadsSnapshot.empty;
      }

      if (!canApproveAll && !canApproveDept) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to review this request',
        });
      }

      // Update request status
      const newStatus = input.action === 'approve' ? 'approved' : 'denied';
      await requestDoc.ref.update({
        status: newStatus,
        reviewedBy: ctx.user.id,
        reviewerName: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'Reviewer',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewNote: input.reviewNote,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // If approved, update the crew member
      if (input.action === 'approve') {
        await adminDb
          .collection('crew')
          .doc(request.crewMemberId)
          .update({
            department: request.requestedDepartment,
            role: request.requestedRole,
            updatedAt: FieldValue.serverTimestamp(),
          });
      }

      // Send notification email
      try {
        const { emailService } = await import('../services/emailService');
        
        // Fetch requester email
        const userDoc = await adminDb.collection('users').doc(request.requestedBy).get();
        const userData = userDoc.data();
        
        if (userData?.email) {
          // Fetch project name
          const projectDoc = await adminDb.collection('projects').doc(request.projectId).get();
          const projectName = projectDoc.data()?.title || 'Project';

          await emailService.sendRoleRequestNotification({
            toEmail: userData.email,
            toName: request.requesterName,
            projectName: projectName,
            action: input.action === 'approve' ? 'approved' : 'denied',
            role: request.requestedRole,
            department: request.requestedDepartment,
            reviewerName: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'Reviewer',
            reviewNote: input.reviewNote,
          });
        }
      } catch (error) {
        console.error('Failed to send role request notification:', error);
        // Don't fail the request if email fails
      }

      return { success: true };
    }),

  /**
   * Cancel a pending request (by the requester)
   */
  cancel: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const requestDoc = await adminDb.collection('roleRequests').doc(input.requestId).get();

      if (!requestDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
      }

      const request = requestDoc.data()!;

      if (request.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only cancel pending requests' });
      }

      if (request.requestedBy !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only cancel your own requests' });
      }

      await requestDoc.ref.update({
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),
});

