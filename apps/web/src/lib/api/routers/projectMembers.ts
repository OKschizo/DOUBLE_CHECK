import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
  type ProjectMember,
  type ProjectRole,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to check if user has permission
async function hasPermission(
  projectId: string,
  userId: string,
  requiredRole: ProjectRole[]
): Promise<boolean> {
  const membersRef = adminDb.collection('projectMembers');
  const query = await membersRef
    .where('projectId', '==', projectId)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (query.empty) {
    return false;
  }

  const role = query.docs[0].data().role;
  return requiredRole.includes(role as ProjectRole);
}

// Helper to get user's role on project
async function getUserRole(projectId: string, userId: string, userEmail?: string): Promise<ProjectRole | null> {
  const membersRef = adminDb.collection('projectMembers');
  
  // First try to find by userId
  const query = await membersRef
    .where('projectId', '==', projectId)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!query.empty) {
    return query.docs[0].data().role as ProjectRole;
  }

  // If not found and email provided, try to find by email (for temp-user-id cases)
  if (userEmail) {
    const emailQuery = await membersRef
      .where('projectId', '==', projectId)
      .where('userEmail', '==', userEmail.toLowerCase())
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!emailQuery.empty) {
      const doc = emailQuery.docs[0];
      const data = doc.data();
      
      // Update userId to the correct one if it's a temp ID
      if (data.userId === 'temp-user-id') {
        await doc.ref.update({ userId });
      }
      
      return data.role as ProjectRole;
    }
  }

  return null;
}

export const projectMembersRouter = router({
  /**
   * List all members of a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this project
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const membersRef = adminDb.collection('projectMembers');
      const snapshot = await membersRef
        .where('projectId', '==', input.projectId)
        .orderBy('invitedAt', 'desc')
        .get();

      const members = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          invitedAt: data.invitedAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
        } as ProjectMember;
      });

      return members;
    }),

  /**
   * Get user's role on a project
   */
  getMyRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      return getUserRole(input.projectId, ctx.user.id, ctx.user.email);
    }),

  /**
   * Get all pending invites for the current user (by email)
   */
  getPendingInvites: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user.email) {
        return [];
      }

      const membersSnapshot = await adminDb
        .collection('projectMembers')
        .where('userEmail', '==', ctx.user.email.toLowerCase())
        .where('status', '==', 'pending')
        .get();

      if (membersSnapshot.empty) {
        return [];
      }

      // Fetch project details for each invite
      const invites = await Promise.all(
        membersSnapshot.docs.map(async (doc) => {
          const memberData = doc.data();
          const projectDoc = await adminDb.collection('projects').doc(memberData.projectId).get();
          const projectData = projectDoc.data();

          return {
            id: doc.id,
            projectId: memberData.projectId,
            projectTitle: projectData?.title || 'Unknown Project',
            role: memberData.role,
            invitedBy: memberData.invitedBy,
            invitedAt: memberData.invitedAt?.toDate() || new Date(),
          };
        })
      );

      return invites;
    }),

  /**
   * Add a member to a project (invite)
   */
  addMember: protectedProcedure
    .input(addProjectMemberSchema)
    .mutation(async ({ input, ctx }) => {
      // Only owner and admin can add members
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can add members',
        });
      }

      const membersRef = adminDb.collection('projectMembers');
      const docRef = await membersRef.add({
        projectId: input.projectId,
        userId: 'temp-user-id', // Would be looked up from email
        userEmail: input.userEmail,
        userName: input.userEmail.split('@')[0], // Placeholder
        role: input.role,
        invitedBy: ctx.user.id,
        invitedAt: FieldValue.serverTimestamp(),
        status: 'pending',
      });

      // Send invitation email
      try {
        const { emailService } = await import('../services/emailService');

        // Get project name
        const projectDoc = await adminDb.collection('projects').doc(input.projectId).get();
        const projectName = projectDoc.data()?.title || 'Your Project';

        await emailService.sendInvitation({
          toEmail: input.userEmail,
          toName: input.userEmail.split('@')[0],
          inviterName: ctx.user.displayName,
          projectName: projectName,
          role: input.role,
          inviteLink: `${process.env.APP_URL || 'http://localhost:3000'}/invite/${docRef.id}`,
        });
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        // Don't fail the whole operation if email fails
      }

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        invitedAt: data.invitedAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
      } as ProjectMember;
    }),

  /**
   * Update a member's role
   */
  updateRole: protectedProcedure
    .input(updateProjectMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projectMembers').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      const member = doc.data()!;

      // Only owner and admin can update roles
      const hasAccess = await hasPermission(member.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can update roles',
        });
      }

      // Cannot change owner role
      if (member.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change owner role' });
      }

      await docRef.update({ role: input.role });

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        invitedAt: data.invitedAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
      } as ProjectMember;
    }),

  /**
   * Remove a member from a project
   */
  removeMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projectMembers').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      const member = doc.data()!;

      // Only owner and admin can remove members
      const hasAccess = await hasPermission(member.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can remove members',
        });
      }

      // Can't remove owner
      if (member.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove project owner' });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Accept an invitation (when user clicks link in email)
   */
  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projectMembers').doc(input.inviteId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      const member = doc.data()!;

      if (member.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation already processed' });
      }

      // Check if invitation expired (7 days)
      const invitedAt = member.invitedAt?.toDate() || new Date();
      const expiresAt = new Date(invitedAt);
      expiresAt.setDate(expiresAt.getDate() + 7);
      if (new Date() > expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation expired' });
      }

      // Update member with actual user info and activate
      await docRef.update({
        userId: ctx.user.id,
        userName: ctx.user.displayName,
        userEmail: ctx.user.email,
        status: 'active',
        acceptedAt: FieldValue.serverTimestamp(),
      });

      // Link existing crew card or create new one
      try {
        const crewRef = adminDb.collection('crew');
        const userEmail = ctx.user.email?.toLowerCase();
        
        if (userEmail) {
          // First, try to find existing crew card by email
          const existingCrewSnapshot = await crewRef
            .where('projectId', '==', member.projectId)
            .where('email', '==', userEmail)
            .limit(1)
            .get();

          if (!existingCrewSnapshot.empty) {
            // Link existing crew card to user
            const existingCrewDoc = existingCrewSnapshot.docs[0];
            await existingCrewDoc.ref.update({
              userId: ctx.user.id,
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            // No existing crew card found, create a new one
            await crewRef.add({
              projectId: member.projectId,
              userId: ctx.user.id,
              name: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'Team Member',
              department: 'production', // Default department
              role: 'Crew - TBD', // Default role to be updated by user
              email: ctx.user.email,
              createdBy: ctx.user.id,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to link/create crew card:', error);
        // Don't fail the whole operation if crew card creation fails
      }

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        invitedAt: data.invitedAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate() || new Date(),
      } as ProjectMember;
    }),

  /**
   * Manually activate a pending member (admin action)
   */
  activateMember: protectedProcedure
    .input(z.object({ memberId: z.string(), projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if requester is admin/owner
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners and admins can activate members' });
      }

      const docRef = adminDb.collection('projectMembers').doc(input.memberId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      const member = doc.data()!;

      if (member.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Member is not pending' });
      }

      // Activate the member
      await docRef.update({
        status: 'active',
        acceptedAt: FieldValue.serverTimestamp(),
      });

      // Link existing crew card or create new one for the activated member if they have a userId
      if (member.userId && member.userEmail) {
        try {
          const crewRef = adminDb.collection('crew');
          const userEmail = member.userEmail.toLowerCase();
          
          // First, try to find existing crew card by email
          const existingCrewSnapshot = await crewRef
            .where('projectId', '==', member.projectId)
            .where('email', '==', userEmail)
            .limit(1)
            .get();

          if (!existingCrewSnapshot.empty) {
            // Link existing crew card to user
            const existingCrewDoc = existingCrewSnapshot.docs[0];
            await existingCrewDoc.ref.update({
              userId: member.userId,
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            // No existing crew card found, create a new one
            await crewRef.add({
              projectId: member.projectId,
              userId: member.userId,
              name: member.userName || member.userEmail.split('@')[0],
              department: 'production',
              role: 'Crew - TBD',
              email: member.userEmail,
              createdBy: ctx.user.id,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Failed to link/create crew card:', error);
        }
      }

      return { success: true };
    }),

  /**
   * Activate all pending members for a project
   */
  activateAllPending: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if requester is admin/owner
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners and admins can activate members' });
      }

      // Get all pending members for this project
      const membersRef = adminDb.collection('projectMembers');
      const pendingSnapshot = await membersRef
        .where('projectId', '==', input.projectId)
        .where('status', '==', 'pending')
        .get();

      if (pendingSnapshot.empty) {
        return { activated: 0, skipped: 0 };
      }

      const crewRef = adminDb.collection('crew');
      let activated = 0;
      let skipped = 0;

      // Process each pending member
      for (const doc of pendingSnapshot.docs) {
        const member = doc.data();
        
        try {
          // Activate the member
          await doc.ref.update({
            status: 'active',
            acceptedAt: FieldValue.serverTimestamp(),
          });

          // Link existing crew card or create new one for the activated member if they have a userId
          if (member.userId && member.userEmail) {
            try {
              const userEmail = member.userEmail.toLowerCase();
              
              // First, try to find existing crew card by email
              const existingCrewSnapshot = await crewRef
                .where('projectId', '==', member.projectId)
                .where('email', '==', userEmail)
                .limit(1)
                .get();

              if (!existingCrewSnapshot.empty) {
                // Link existing crew card to user
                const existingCrewDoc = existingCrewSnapshot.docs[0];
                await existingCrewDoc.ref.update({
                  userId: member.userId,
                  updatedAt: FieldValue.serverTimestamp(),
                });
              } else {
                // No existing crew card found, create a new one
                await crewRef.add({
                  projectId: member.projectId,
                  userId: member.userId,
                  name: member.userName || member.userEmail.split('@')[0],
                  department: 'production',
                  role: 'Crew - TBD',
                  email: member.userEmail,
                  createdBy: ctx.user.id,
                  createdAt: FieldValue.serverTimestamp(),
                  updatedAt: FieldValue.serverTimestamp(),
                });
              }
            } catch (error) {
              console.error(`Failed to link/create crew card for ${member.userEmail}:`, error);
              // Continue even if crew card creation fails
            }
          }

          activated++;
        } catch (error) {
          console.error(`Failed to activate member ${doc.id}:`, error);
          skipped++;
        }
      }

      return { activated, skipped };
    }),

  /**
   * Migrate legacy roles (editor/viewer) to new system
   */
  migrateLegacyRoles: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check permissions - only owner and admin can migrate
      const canMigrate = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      
      if (!canMigrate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can migrate roles',
        });
      }

      const membersRef = adminDb.collection('projectMembers');
      const snapshot = await membersRef.where('projectId', '==', input.projectId).get();

      let migratedCount = 0;
      const batch = adminDb.batch();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const currentRole = data.role;

        // Migrate editor and viewer to dept_head (regular crew)
        if (currentRole === 'editor' || currentRole === 'viewer') {
          batch.update(doc.ref, { role: 'dept_head' });
          migratedCount++;
        }
      });

      if (migratedCount > 0) {
        await batch.commit();
      }

      return { migratedCount };
    }),

  /**
   * Invite team members from crew cards that don't have user accounts
   */
  inviteFromCrewCards: protectedProcedure
    .input(z.object({ 
      projectId: z.string(),
      crewMemberIds: z.array(z.string()).optional(), // If provided, only invite these specific crew members
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permissions - only owner and admin can invite
      const canInvite = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!canInvite) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can invite team members',
        });
      }

      // Get all crew members for this project
      const crewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .get();

      // Get all existing project members (by email) to avoid duplicates
      const membersSnapshot = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', input.projectId)
        .get();

      const existingEmails = new Set(
        membersSnapshot.docs.map((doc) => doc.data().userEmail?.toLowerCase()).filter(Boolean)
      );

      // Filter crew members that:
      // 1. Don't have a userId (not linked to a user account)
      // 2. Have an email address
      // 3. Are in the provided list (if provided)
      // 4. Don't already have a team member invitation/account
      const crewToInvite = crewSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const hasEmail = data.email && data.email.trim();
        const noUserId = !data.userId;
        const notAlreadyMember = !existingEmails.has(data.email?.toLowerCase());
        const inList = !input.crewMemberIds || input.crewMemberIds.includes(doc.id);
        
        return hasEmail && noUserId && notAlreadyMember && inList;
      });

      if (crewToInvite.length === 0) {
        return { invited: 0, skipped: 0 };
      }

      // Get project name for email
      const projectDoc = await adminDb.collection('projects').doc(input.projectId).get();
      const projectName = projectDoc.data()?.title || 'Your Project';

      // Import email service
      const { emailService } = await import('../services/emailService');

      let invited = 0;
      let skipped = 0;

      // Create invitations for each crew member
      for (const crewDoc of crewToInvite) {
        const crewData = crewDoc.data();
        const email = crewData.email.toLowerCase().trim();

        try {
          // Create project member invitation
          const memberRef = await adminDb.collection('projectMembers').add({
            projectId: input.projectId,
            userId: 'temp-user-id',
            userEmail: email,
            userName: crewData.name || email.split('@')[0],
            role: 'crew',
            invitedBy: ctx.user.id,
            invitedAt: FieldValue.serverTimestamp(),
            status: 'pending',
          });

          // Send invitation email
          try {
            await emailService.sendInvitation({
              toEmail: email,
              toName: crewData.name || email.split('@')[0],
              inviterName: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'A team member',
              projectName: projectName,
              role: 'crew',
              inviteLink: `${process.env.APP_URL || 'http://localhost:3000'}/invite/${memberRef.id}`,
            });
            invited++;
          } catch (emailError) {
            console.error(`Failed to send invitation email to ${email}:`, emailError);
            // Still count as invited since the member record was created
            invited++;
          }
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          skipped++;
        }
      }

      return { invited, skipped };
    }),
});

// Export helper functions for use in other routers
export { hasPermission, getUserRole };
