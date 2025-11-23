import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createShotSchema,
  updateShotSchema,
  type Shot,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const shotsRouter = router({
  /**
   * List all shots for a scene
   */
  listByScene: protectedProcedure
    .input(z.object({ sceneId: z.string() }))
    .query(async ({ input, ctx }) => {
      const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();

      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
        'crew',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this scene' });
      }

      const snapshot = await adminDb
        .collection('shots')
        .where('sceneId', '==', input.sceneId)
        .orderBy('shotNumber', 'asc')
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Shot;
      });
    }),

  /**
   * List all shots for a project
   */
  listByProject: protectedProcedure
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
        .collection('shots')
        .where('projectId', '==', input.projectId)
        .get();

      const shots = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Shot;
      });

      // Sort in memory to avoid composite index requirement
      return shots.sort((a, b) => {
        // Use sortOrder if available
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        // Fallback to shotNumber
        return a.shotNumber.localeCompare(b.shotNumber, undefined, { numeric: true });
      });
    }),

  /**
   * Get a single shot by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('shots').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }

      const data = doc.data()!;
      
      // Check access via scene
      const sceneDoc = await adminDb.collection('scenes').doc(data.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this shot' });
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Shot;
    }),

  /**
   * Create a new shot
   */
  create: protectedProcedure
    .input(createShotSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate scene exists
      const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();

      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create shots',
        });
      }

      const docRef = adminDb.collection('shots').doc();

      // Inherit from scene if shot fields are empty
      const sceneLocationIds = sceneData.locationIds || (sceneData.locationId ? [sceneData.locationId] : []);
      const sceneLocationNames = sceneData.locationNames || (sceneData.locationName ? [sceneData.locationName] : []);
      const sceneShootingDayIds = sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []);

      const shotData = {
        ...input,
        projectId: sceneData.projectId,
        castIds: input.castIds && input.castIds.length > 0 ? input.castIds : (sceneData.castIds || []),
        crewIds: input.crewIds && input.crewIds.length > 0 ? input.crewIds : (sceneData.crewIds || []),
        equipmentIds: input.equipmentIds || [],
        locationIds: input.locationIds && input.locationIds.length > 0 ? input.locationIds : sceneLocationIds,
        locationNames: input.locationNames && input.locationNames.length > 0 ? input.locationNames : sceneLocationNames,
        shootingDayIds: input.shootingDayIds && input.shootingDayIds.length > 0 ? input.shootingDayIds : sceneShootingDayIds,
        imageUrl: input.imageUrl || sceneData.imageUrl || undefined,
        takeNumbers: input.takeNumbers || [],
        shotType: input.shotType || 'master',
        status: input.status || 'not-shot',
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(shotData);

      const created = await docRef.get();
      const data = created.data()!;

      // Sync to schedule if shootingDayIds are provided
      const shootingDayIds = data.shootingDayIds || [];
      if (shootingDayIds.length > 0) {
        try {
          const { syncShotToSchedule } = await import('../services/sceneScheduleSync');
          await syncShotToSchedule(docRef.id, shootingDayIds);
        } catch (error) {
          console.error('Error syncing shot to schedule:', error);
          // Don't fail the create if sync fails
        }
      }

      return {
        id: docRef.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Shot;
    }),

  /**
   * Update a shot
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateShotSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('shots').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }

      const shotData = doc.data()!;
      
      // Check access via scene
      const sceneDoc = await adminDb.collection('scenes').doc(shotData.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can update shots',
        });
      }

      const updateData: any = {
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Track if shootingDayIds changed
      const oldShootingDayIds = shotData.shootingDayIds || [];
      const newShootingDayIds = input.data.shootingDayIds || [];
      const shootingDayIdsChanged = JSON.stringify(oldShootingDayIds.sort()) !== JSON.stringify(newShootingDayIds.sort());

      await docRef.update(updateData);

      // Sync to schedule if shootingDayIds changed
      if (shootingDayIdsChanged && newShootingDayIds.length > 0) {
        try {
          const { syncShotToSchedule } = await import('../services/sceneScheduleSync');
          await syncShotToSchedule(input.id, newShootingDayIds);
        } catch (error) {
          console.error('Error syncing shot to schedule:', error);
          // Don't fail the update if sync fails
        }
      } else if (shootingDayIdsChanged && newShootingDayIds.length === 0) {
        // Remove all schedule events for this shot if shootingDayIds were cleared
        try {
          const eventsSnapshot = await adminDb
            .collection('scheduleEvents')
            .where('projectId', '==', sceneData.projectId)
            .where('shotId', '==', input.id)
            .get();
          
          const batch = adminDb.batch();
          eventsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        } catch (error) {
          console.error('Error removing shot from schedule:', error);
        }
      }

      const updated = await docRef.get();
      const data = updated.data()!;

      return {
        id: docRef.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Shot;
    }),

  /**
   * Delete a shot
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('shots').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }

      const shotData = doc.data()!;
      
      // Check access via scene
      const sceneDoc = await adminDb.collection('scenes').doc(shotData.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can delete shots',
        });
      }

      await docRef.delete();

      return { success: true };
    }),

  /**
   * Bulk create shots for a scene
   */
  bulkCreate: protectedProcedure
    .input(
      z.object({
        sceneId: z.string(),
        shots: z.array(createShotSchema.omit({ sceneId: true, projectId: true, createdBy: true })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate scene exists
      const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();

      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can bulk create shots',
        });
      }

      const batch = adminDb.batch();
      const createdIds: string[] = [];

      for (const shotInput of input.shots) {
        const docRef = adminDb.collection('shots').doc();
        createdIds.push(docRef.id);

        // Inherit from scene if shot fields are empty
        const sceneLocationIds = sceneData.locationIds || (sceneData.locationId ? [sceneData.locationId] : []);
        const sceneLocationNames = sceneData.locationNames || (sceneData.locationName ? [sceneData.locationName] : []);
        const sceneShootingDayIds = sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []);

        const shotData = {
          ...shotInput,
          sceneId: input.sceneId,
          projectId: sceneData.projectId,
          castIds: shotInput.castIds && shotInput.castIds.length > 0 ? shotInput.castIds : (sceneData.castIds || []),
          crewIds: shotInput.crewIds && shotInput.crewIds.length > 0 ? shotInput.crewIds : (sceneData.crewIds || []),
          equipmentIds: shotInput.equipmentIds || [],
          locationIds: shotInput.locationIds && shotInput.locationIds.length > 0 ? shotInput.locationIds : sceneLocationIds,
          locationNames: shotInput.locationNames && shotInput.locationNames.length > 0 ? shotInput.locationNames : sceneLocationNames,
          shootingDayIds: shotInput.shootingDayIds && shotInput.shootingDayIds.length > 0 ? shotInput.shootingDayIds : sceneShootingDayIds,
          imageUrl: shotInput.imageUrl || sceneData.imageUrl || undefined,
          takeNumbers: shotInput.takeNumbers || [],
          shotType: shotInput.shotType || 'master',
          status: shotInput.status || 'not-shot',
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        batch.set(docRef, shotData);
      }

      await batch.commit();

      return {
        success: true,
        shotsCreated: createdIds.length,
        shotIds: createdIds,
      };
    }),

  /**
   * Sync shot to schedule
   */
  syncToSchedule: protectedProcedure
    .input(z.object({ shotId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const shotDoc = await adminDb.collection('shots').doc(input.shotId).get();

      if (!shotDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }

      const shotData = shotDoc.data()!;
      
      // Check access via scene
      const sceneDoc = await adminDb.collection('scenes').doc(shotData.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can sync shots to schedule',
        });
      }

      // Get shootingDayIds from shot or inherit from scene
      const shotShootingDayIds = shotData.shootingDayIds && shotData.shootingDayIds.length > 0
        ? shotData.shootingDayIds
        : (sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []));
      
      if (shotShootingDayIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Shot and scene have no shooting days assigned',
        });
      }

      try {
        const { syncShotToSchedule } = await import('../services/sceneScheduleSync');
        await syncShotToSchedule(input.shotId, shotShootingDayIds);
        return { success: true, message: 'Shot synced to schedule successfully' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to sync shot to schedule',
        });
      }
    }),

  /**
   * Mark best take for a shot
   */
  markBestTake: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        takeNumber: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('shots').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }

      const shotData = doc.data()!;
      
      // Check access via scene
      const sceneDoc = await adminDb.collection('scenes').doc(shotData.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can mark best take',
        });
      }

      // Ensure take number is in the list
      const takeNumbers = shotData.takeNumbers || [];
      if (!takeNumbers.includes(input.takeNumber)) {
        takeNumbers.push(input.takeNumber);
      }

      await docRef.update({
        bestTake: input.takeNumber,
        takeNumbers,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      const data = updated.data()!;

      return {
        id: docRef.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Shot;
    }),

  /**
   * Update shot order
   */
  updateOrder: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            sortOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.updates.length === 0) return { success: true };

      const batch = adminDb.batch();
      
      // Get first shot to check permissions
      const firstShot = await adminDb.collection('shots').doc(input.updates[0].id).get();
      if (!firstShot.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shot not found' });
      }
      
      const shotData = firstShot.data()!;
      const sceneDoc = await adminDb.collection('scenes').doc(shotData.sceneId).get();
      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }
      
      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin', 'dept_head']);
      
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to update shot order' });
      }

      for (const update of input.updates) {
        const docRef = adminDb.collection('shots').doc(update.id);
        batch.update(docRef, { 
          sortOrder: update.sortOrder,
          updatedAt: FieldValue.serverTimestamp() 
        });
      }

      await batch.commit();
      return { success: true };
    }),
});

