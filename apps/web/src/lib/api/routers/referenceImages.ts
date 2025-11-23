import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createReferenceImageSchema, type ReferenceImage, type Shot } from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const referenceImagesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
        'crew',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const snapshot = await adminDb
        .collection('referenceImages')
        .where('projectId', '==', input.projectId)
        .get();

      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ReferenceImage[];

      return images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),

  create: protectedProcedure
    .input(createReferenceImageSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin', 'dept_head']);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to add reference images' });
      }

      const docRef = adminDb.collection('referenceImages').doc();
      await docRef.set({
        ...input,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()!.createdAt.toDate(),
        updatedAt: doc.data()!.updatedAt.toDate(),
      } as ReferenceImage;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin', 'dept_head']);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to delete reference images' });
      }

      await adminDb.collection('referenceImages').doc(input.id).delete();
      return { success: true };
    }),

  /**
   * Migrate existing shot references to project-level reference images
   * This is a one-time migration for references that were uploaded directly to shots
   */
  migrateShotReferences: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin', 'dept_head']);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to migrate references' });
      }

      // Get all shots for this project
      const shotsSnapshot = await adminDb
        .collection('shots')
        .where('projectId', '==', input.projectId)
        .get();

      // Get all existing reference images for this project
      const existingRefsSnapshot = await adminDb
        .collection('referenceImages')
        .where('projectId', '==', input.projectId)
        .get();

      const existingRefIds = new Set(existingRefsSnapshot.docs.map(doc => doc.id));
      const existingRefUrls = new Set(existingRefsSnapshot.docs.map(doc => doc.data().url));

      // Collect all shot references that need to be migrated
      const referencesToMigrate = new Map<string, {
        url: string;
        category: string;
        shotId: string;
        originalId: string;
      }>();

      shotsSnapshot.docs.forEach(shotDoc => {
        const shotData = shotDoc.data();
        const shotReferences = shotData.shotReferences || [];
        
        shotReferences.forEach((ref: any) => {
          // Check if this reference already exists as a project-level reference
          // by checking both ID and URL (since old references might have UUIDs)
          const existsById = existingRefIds.has(ref.id);
          const existsByUrl = existingRefUrls.has(ref.url);
          
          if (!existsById && !existsByUrl) {
            // Use URL as key to avoid duplicates (same image referenced by multiple shots)
            if (!referencesToMigrate.has(ref.url)) {
              referencesToMigrate.set(ref.url, {
                url: ref.url,
                category: ref.category || 'other',
                shotId: shotDoc.id,
                originalId: ref.id,
              });
            }
          }
        });
      });

      // Create project-level reference images for missing ones
      const batch = adminDb.batch();
      const createdRefs: Array<{ id: string; url: string }> = [];
      const urlToNewId = new Map<string, string>();

      for (const [url, refData] of referencesToMigrate) {
        const docRef = adminDb.collection('referenceImages').doc();
        const newId = docRef.id;
        
        // Extract filename from URL or use a default name
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0] || 'reference-image.jpg';
        
        batch.set(docRef, {
          projectId: input.projectId,
          url: refData.url,
          name: filename,
          category: refData.category,
          tags: [],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        createdRefs.push({ id: newId, url: refData.url });
        urlToNewId.set(url, newId);
      }

      await batch.commit();

      // Update shots to use the new project-level reference IDs
      // Only update if the old ID was a UUID (not a project-level reference ID)
      const updateBatch = adminDb.batch();
      let shotsUpdated = 0;

      shotsSnapshot.docs.forEach(shotDoc => {
        const shotData = shotDoc.data();
        const shotReferences = shotData.shotReferences || [];
        let needsUpdate = false;
        
        const updatedReferences = shotReferences.map((ref: any) => {
          const newId = urlToNewId.get(ref.url);
          if (newId && ref.id !== newId) {
            // Check if old ID looks like a UUID (not a Firestore document ID)
            // Firestore IDs are 20 chars, UUIDs are 36 chars with dashes
            const isUUID = ref.id.length === 36 && ref.id.includes('-');
            if (isUUID || !existingRefIds.has(ref.id)) {
              needsUpdate = true;
              return { ...ref, id: newId };
            }
          }
          return ref;
        });

        if (needsUpdate) {
          updateBatch.update(shotDoc.ref, {
            shotReferences: updatedReferences,
            updatedAt: FieldValue.serverTimestamp(),
          });
          shotsUpdated++;
        }
      });

      if (shotsUpdated > 0) {
        await updateBatch.commit();
      }

      return {
        success: true,
        referencesCreated: createdRefs.length,
        shotsUpdated,
        message: `Migrated ${createdRefs.length} reference(s) and updated ${shotsUpdated} shot(s)`,
      };
    }),

  /**
   * Get all shots that use a specific reference image
   */
  getShotsByReference: protectedProcedure
    .input(z.object({ referenceId: z.string(), projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
        'crew',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Get the reference image to also check by URL (for backwards compatibility)
      const refDoc = await adminDb.collection('referenceImages').doc(input.referenceId).get();
      const refData = refDoc.exists ? refDoc.data() : null;
      const refUrl = refData?.url;

      // Get all shots for this project
      const shotsSnapshot = await adminDb
        .collection('shots')
        .where('projectId', '==', input.projectId)
        .get();

      // Filter shots that have this reference in their shotReferences array
      const shotsWithReference = shotsSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const shotReferences = data.shotReferences || [];
          
          // Check if this reference ID or URL is in the shot's references
          const hasReference = shotReferences.some((ref: any) => 
            ref.id === input.referenceId || (refUrl && ref.url === refUrl)
          );

          if (hasReference) {
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Shot;
          }
          return null;
        })
        .filter((shot): shot is Shot => shot !== null);

      return shotsWithReference;
    }),
});

