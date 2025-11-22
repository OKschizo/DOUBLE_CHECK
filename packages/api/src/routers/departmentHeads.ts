import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  assignDepartmentHeadSchema,
  removeDepartmentHeadSchema,
  type DepartmentHead,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const departmentHeadsRouter = router({
  /**
   * List all department heads for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const snapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .get();

      const heads = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DepartmentHead;
      });

      return heads;
    }),

  /**
   * Get department heads for a specific department
   */
  getByDepartment: protectedProcedure
    .input(z.object({ projectId: z.string(), department: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .where('department', '==', input.department)
        .get();

      const heads = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DepartmentHead;
      });

      return heads;
    }),

  /**
   * Assign a department head (owner/admin only)
   */
  assign: protectedProcedure
    .input(assignDepartmentHeadSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permissions - only owner and admin can assign department heads
      const canAssign = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!canAssign) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can assign department heads',
        });
      }

      // Check if this user is already a department head for this department
      const existing = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .where('department', '==', input.department)
        .where('userId', '==', input.userId)
        .limit(1)
        .get();

      if (!existing.empty) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is already a department head for this department',
        });
      }

      // Create department head assignment
      const docRef = await adminDb.collection('departmentHeads').add({
        projectId: input.projectId,
        department: input.department,
        userId: input.userId,
        userName: input.userName,
        assignedBy: ctx.user.id,
        assignedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get the project member to get their email
      const memberSnapshot = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', input.userId)
        .limit(1)
        .get();

      // Update or create crew card for this user with the correct department
      if (!memberSnapshot.empty) {
        const memberData = memberSnapshot.docs[0].data();
        const userEmail = memberData.userEmail;

        // Find existing crew card for this user
        const crewSnapshot = await adminDb
          .collection('crew')
          .where('projectId', '==', input.projectId)
          .where('userId', '==', input.userId)
          .limit(1)
          .get();

        if (!crewSnapshot.empty) {
          // Update existing crew card with correct department
          const crewDoc = crewSnapshot.docs[0];
          await crewDoc.ref.update({
            department: input.department,
            role: crewDoc.data().role || 'Department Head',
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          // Create new crew card if one doesn't exist
          // Try to match by email first
          const emailCrewSnapshot = await adminDb
            .collection('crew')
            .where('projectId', '==', input.projectId)
            .where('email', '==', userEmail)
            .limit(1)
            .get();

          if (!emailCrewSnapshot.empty) {
            // Link existing crew card to user
            const crewDoc = emailCrewSnapshot.docs[0];
            await crewDoc.ref.update({
              userId: input.userId,
              department: input.department,
              role: crewDoc.data().role || 'Department Head',
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            // Create new crew card
            await adminDb.collection('crew').add({
              projectId: input.projectId,
              userId: input.userId,
              name: input.userName,
              department: input.department,
              role: 'Department Head',
              email: userEmail,
              createdBy: ctx.user.id,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // Note: We don't change the projectMember role here
      // Being a "department head" is a separate designation tracked in the departmentHeads collection
      // The projectMember role (admin/dept_head) determines project-level permissions

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DepartmentHead;
    }),

  /**
   * Remove a department head (owner/admin only)
   */
  remove: protectedProcedure
    .input(removeDepartmentHeadSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('departmentHeads').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Department head not found' });
      }

      const data = doc.data()!;

      // Check permissions
      const canRemove = await hasPermission(data.projectId, ctx.user.id, ['owner', 'admin']);

      if (!canRemove) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can remove department heads',
        });
      }

      // Remove the department head assignment
      await docRef.delete();

      // Check if user has any other department head assignments
      const remainingAssignments = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', data.userId)
        .limit(1)
        .get();

      // Note: We don't change the projectMember role when removing department head status
      // The projectMember role (admin/dept_head) remains unchanged

      return { success: true };
    }),

  /**
   * Check if current user is a department head for a specific department
   */
  isHeadOfDepartment: protectedProcedure
    .input(z.object({ projectId: z.string(), department: z.string() }))
    .query(async ({ input, ctx }) => {
      const snapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .where('department', '==', input.department)
        .where('userId', '==', ctx.user.id)
        .limit(1)
        .get();

      return !snapshot.empty;
    }),
});

