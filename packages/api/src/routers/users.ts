import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const usersRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userDoc = await adminDb.collection('users').doc(ctx.user.id).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const data = userDoc.data()!;
    return {
      id: userDoc.id,
      email: data.email,
      displayName: data.displayName,
      orgId: data.orgId,
      role: data.role,
      photoURL: data.photoURL,
      bio: data.bio,
      website: data.website,
      socials: data.socials || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).optional(),
        photoURL: z.string().url().optional().nullable(),
        bio: z.string().optional().nullable(),
        website: z.string().url().optional().nullable(),
        socials: z.object({
          twitter: z.string().optional().nullable(),
          instagram: z.string().optional().nullable(),
          linkedin: z.string().optional().nullable(),
          imdb: z.string().optional().nullable(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userRef = adminDb.collection('users').doc(ctx.user.id);
      
      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (input.displayName !== undefined) {
        updateData.displayName = input.displayName;
      }
      if (input.photoURL !== undefined) {
        updateData.photoURL = input.photoURL || null;
      }
      if (input.bio !== undefined) {
        updateData.bio = input.bio || null;
      }
      if (input.website !== undefined) {
        updateData.website = input.website || null;
      }
      if (input.socials !== undefined) {
        updateData.socials = {
          twitter: input.socials.twitter || null,
          instagram: input.socials.instagram || null,
          linkedin: input.socials.linkedin || null,
          imdb: input.socials.imdb || null,
        };
      }

      await userRef.update(updateData);

      const updatedDoc = await userRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        email: data.email,
        displayName: data.displayName,
        orgId: data.orgId,
        role: data.role,
        photoURL: data.photoURL,
        bio: data.bio,
        website: data.website,
        socials: data.socials || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }),

  /**
   * Get user's projects
   */
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    // Get all projects the user is an active member of
    const membersSnapshot = await adminDb
      .collection('projectMembers')
      .where('userId', '==', ctx.user.id)
      .where('status', '==', 'active')
      .get();

    if (membersSnapshot.empty) {
      return [];
    }

    const projectIds = membersSnapshot.docs.map(doc => doc.data().projectId);

    // Fetch those projects
    const projectsRef = adminDb.collection('projects');
    const projects = [];

    // Firestore 'in' queries are limited to 10, so batch if needed
    for (let i = 0; i < projectIds.length; i += 10) {
      const batch = projectIds.slice(i, i + 10);
      const batchSnapshot = await projectsRef.where('__name__', 'in', batch).get();
      
      for (const doc of batchSnapshot.docs) {
        const data = doc.data();
        projects.push({
          id: doc.id,
          title: data.title,
          client: data.client,
          status: data.status,
          coverImageUrl: data.coverImageUrl,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        });
      }
    }

    return projects;
  }),
});






