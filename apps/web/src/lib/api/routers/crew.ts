import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  crewMemberSchema,
  createCrewMemberSchema,
  updateCrewMemberSchema,
  type CrewMember,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue, type DocumentSnapshot } from 'firebase-admin/firestore';
import { syncBudgetItemsForCrew, unlinkBudgetItemsForCrew } from '../services/budgetSync';
import { getUserRole } from './projectMembers';

export const crewRouter = router({
  /**
   * List all crew members for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const crewRef = adminDb.collection('crew');
      const snapshot = await crewRef
        .where('projectId', '==', input.projectId)
        .orderBy('department', 'asc')
        .orderBy('name', 'asc')
        .get();

      // Get user's role and permissions
      const userRole = await getUserRole(input.projectId, ctx.user.id, ctx.user.email);
      
      // Get user's crew card ID
      const myCrewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .limit(1)
        .get();
      
      const myCrewCardId = myCrewSnapshot.empty ? null : myCrewSnapshot.docs[0].id;

      // Get user's department head assignments
      const deptHeadsSnapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .get();
      
      const myDepartments = deptHeadsSnapshot.docs.map(doc => doc.data().department);

      const crew = snapshot.docs.map((doc) => {
        const data = doc.data();
        const crewMember = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CrewMember;

        // Hide rate if user is crew and this is not their own card
        if (userRole === 'crew' && crewMember.id !== myCrewCardId) {
          // Remove rate information
          delete (crewMember as any).dayRate;
          delete (crewMember as any).rate;
          delete (crewMember as any).rateType;
        }
        // Hide rate if user is dept_head and this crew member is not in their department
        else if (userRole === 'dept_head' && myDepartments.length > 0) {
          if (!myDepartments.includes(crewMember.department)) {
            delete (crewMember as any).dayRate;
            delete (crewMember as any).rate;
            delete (crewMember as any).rateType;
          }
        }
        // Admin and owner can see all rates

        return crewMember;
      });

      return crew;
    }),

  /**
   * Get a single crew member by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const docRef = adminDb.collection('crew').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewMember;
    }),

  /**
   * Add a crew member to a project
   */
  create: protectedProcedure
    .input(createCrewMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const crewRef = adminDb.collection('crew');

      // Check if email matches an existing project member to auto-link
      let userId = input.userId;
      if (!userId && input.email) {
        const memberSnapshot = await adminDb
          .collection('projectMembers')
          .where('projectId', '==', input.projectId)
          .where('userEmail', '==', input.email.toLowerCase())
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (!memberSnapshot.empty) {
          userId = memberSnapshot.docs[0].data().userId;
        }
      }

      const docRef = await crewRef.add({
        ...input,
        userId: userId || undefined, // Set userId if found
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...input,
        userId: userId || undefined,
        createdBy: ctx.user.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewMember;
    }),

  /**
   * Update a crew member
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateCrewMemberSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('crew').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      await docRef.update({
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Sync linked budget items
      try {
        await syncBudgetItemsForCrew(input.id, {
          name: input.data.name,
          role: input.data.role,
          rate: input.data.rate,
          rateType: input.data.rateType,
        });
      } catch (error) {
        console.error('Error syncing budget items for crew:', error);
        // Don't fail the update if budget sync fails
      }

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewMember;
    }),

  /**
   * Remove a crew member from a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('crew').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return { success: false };
      }

      // Unlink budget items (don't delete them to preserve budget history)
      try {
        await unlinkBudgetItemsForCrew(input.id);
      } catch (error) {
        console.error('Error unlinking budget items for crew:', error);
        // Don't fail the delete if unlink fails
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Get the current user's crew card for a project
   */
  getMyCrewCard: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const snapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewMember;
    }),

  /**
   * Backfill crew cards for all existing team members without one
   */
  backfillCrewCards: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Get all active project members
      const membersSnapshot = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', input.projectId)
        .where('status', '==', 'active')
        .get();

      if (membersSnapshot.empty) {
        return { created: 0, skipped: 0, linked: 0 };
      }

      const members = membersSnapshot.docs.map((doc) => ({
        userId: doc.data().userId,
        userName: doc.data().userName,
        userEmail: doc.data().userEmail,
      }));

      // Get all crew cards for this project
      const crewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .get();

      const existingUserIds = new Set(
        crewSnapshot.docs
          .map((doc) => doc.data().userId)
          .filter((id) => id) // Only userId that exist
      );

      // Create a map of email -> crew card for matching
      const emailToCrewMap = new Map<string, DocumentSnapshot>();
      const nameToCrewMap = new Map<string, DocumentSnapshot>();
      
      crewSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          emailToCrewMap.set(data.email.toLowerCase(), doc);
        }
        if (data.name) {
          // Try matching by first name + last name or just first name
          const nameParts = data.name.toLowerCase().split(' ');
          if (nameParts.length > 0) {
            nameToCrewMap.set(nameParts[0], doc);
            if (nameParts.length > 1) {
              nameToCrewMap.set(nameParts[0] + ' ' + nameParts[1], doc);
            }
          }
        }
      });

      // Create crew cards for members without one, or link existing ones
      let created = 0;
      let linked = 0;
      const batch = adminDb.batch();

      for (const member of members) {
        if (!existingUserIds.has(member.userId)) {
          // Try to find existing crew card by email
          const emailMatch = member.userEmail ? emailToCrewMap.get(member.userEmail.toLowerCase()) : null;
          
          if (emailMatch) {
            // Link existing crew card to user
            batch.update(emailMatch.ref, {
              userId: member.userId,
              updatedAt: FieldValue.serverTimestamp(),
            });
            linked++;
          } else {
            // Try to match by name
            const nameParts = (member.userName || member.userEmail.split('@')[0]).toLowerCase().split(' ');
            let nameMatch = null;
            if (nameParts.length > 0) {
              nameMatch = nameToCrewMap.get(nameParts[0]);
              if (!nameMatch && nameParts.length > 1) {
                nameMatch = nameToCrewMap.get(nameParts[0] + ' ' + nameParts[1]);
              }
            }

            if (nameMatch && !nameMatch.data()?.userId) {
              // Link existing crew card to user
              batch.update(nameMatch.ref, {
                userId: member.userId,
                updatedAt: FieldValue.serverTimestamp(),
              });
              linked++;
            } else {
              // Create new crew card
              const crewRef = adminDb.collection('crew').doc();
              batch.set(crewRef, {
                projectId: input.projectId,
                userId: member.userId,
                name: member.userName || member.userEmail.split('@')[0],
                department: 'production',
                role: 'Crew - TBD',
                email: member.userEmail,
                createdBy: ctx.user.id,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              });
              created++;
            }
          }
        }
      }

      if (created > 0 || linked > 0) {
        await batch.commit();
      }

      return {
        created,
        linked,
        skipped: members.length - created - linked,
      };
    }),
});
