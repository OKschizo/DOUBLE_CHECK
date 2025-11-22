import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createSceneSchema,
  updateSceneSchema,
  type Scene,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';
import { syncSceneToSchedule } from '../services/sceneScheduleSync';

export const scenesRouter = router({
  /**
   * List all scenes for a project, ordered by scene number
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
          'owner',
          'admin',
          'dept_head',
        ]);

        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
        }

        const snapshot = await adminDb
          .collection('scenes')
          .where('projectId', '==', input.projectId)
          .orderBy('sceneNumber', 'asc')
          .get();

        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            scheduledDate: data.scheduledDate?.toDate() || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Scene;
        });
      } catch (error: any) {
        console.error('Error fetching scenes:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch scenes',
        });
      }
    }),

  /**
   * Get a single scene by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('scenes').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const data = doc.data()!;
      
      // Check access
      const hasAccess = await hasPermission(data.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this scene' });
      }

      return {
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Scene;
    }),

  /**
   * Create a new scene
   */
  create: protectedProcedure
    .input(createSceneSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create scenes',
        });
      }

      // Validate that location exists if provided
      if (input.locationId) {
        const locationDoc = await adminDb.collection('locations').doc(input.locationId).get();
        if (!locationDoc.exists) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Location not found' });
        }
        const locationData = locationDoc.data()!;
        if (locationData.projectId !== input.projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Location does not belong to this project' });
        }
      }

      const docRef = adminDb.collection('scenes').doc();

      const sceneData = {
        ...input,
        castIds: input.castIds || [],
        crewIds: input.crewIds || [],
        equipmentIds: input.equipmentIds || [],
        storyboardIds: input.storyboardIds || [],
        locationIds: input.locationIds || [],
        locationNames: input.locationNames || [],
        shootingDayIds: input.shootingDayIds || [],
        scheduledDates: input.scheduledDates || [],
        stuntsRequired: input.stuntsRequired || false,
        status: input.status || 'not-shot',
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(sceneData);

      const created = await docRef.get();
      const data = created.data()!;

      // Sync to schedule if shootingDayIds are provided
      const shootingDayIds = input.shootingDayIds || (input.shootingDayId ? [input.shootingDayId] : []);
      if (shootingDayIds.length > 0) {
        try {
          await syncSceneToSchedule(docRef.id, shootingDayIds);
        } catch (error) {
          console.error('Error syncing scene to schedule:', error);
          // Don't fail the create if sync fails
        }
      }

      return {
        id: docRef.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Scene;
    }),

  /**
   * Update a scene
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateSceneSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('scenes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = doc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can update scenes',
        });
      }

      // Validate location if being updated
      if (input.data.locationId) {
        const locationDoc = await adminDb.collection('locations').doc(input.data.locationId).get();
        if (!locationDoc.exists) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Location not found' });
        }
        const locationData = locationDoc.data()!;
        if (locationData.projectId !== sceneData.projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Location does not belong to this project' });
        }
      }

      const updateData: any = {
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Track if shootingDayIds changed
      const oldShootingDayIds = sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []);
      const newShootingDayIds = input.data.shootingDayIds || (input.data.shootingDayId ? [input.data.shootingDayId] : []);
      const shootingDayIdsChanged = JSON.stringify(oldShootingDayIds.sort()) !== JSON.stringify(newShootingDayIds.sort());

      await docRef.update(updateData);

      // Sync to schedule if shootingDayIds changed
      if (shootingDayIdsChanged && newShootingDayIds.length > 0) {
        try {
          await syncSceneToSchedule(input.id, newShootingDayIds);
        } catch (error) {
          console.error('Error syncing scene to schedule:', error);
          // Don't fail the update if sync fails
        }
      } else if (shootingDayIdsChanged && newShootingDayIds.length === 0) {
        // Remove all schedule events for shots in this scene if shootingDayIds were cleared
        try {
          // Get all shots for this scene
          const shotsSnapshot = await adminDb
            .collection('shots')
            .where('sceneId', '==', input.id)
            .get();
          
          // Remove events for all shots in this scene
          const batch = adminDb.batch();
          for (const shotDoc of shotsSnapshot.docs) {
            const eventsSnapshot = await adminDb
              .collection('scheduleEvents')
              .where('projectId', '==', sceneData.projectId)
              .where('shotId', '==', shotDoc.id)
              .get();
            
            eventsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          }
          
          // Also remove any old scene-level events
          const sceneEventsSnapshot = await adminDb
            .collection('scheduleEvents')
            .where('projectId', '==', sceneData.projectId)
            .where('sceneId', '==', input.id)
            .get();
          
          sceneEventsSnapshot.docs.forEach(doc => {
            const eventData = doc.data();
            if (!eventData.shotId) {
              batch.delete(doc.ref);
            }
          });
          
          await batch.commit();
        } catch (error) {
          console.error('Error removing scene from schedule:', error);
        }
      }

      const updated = await docRef.get();
      const data = updated.data()!;

      return {
        id: docRef.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Scene;
    }),

  /**
   * Delete a scene
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('scenes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = doc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can delete scenes',
        });
      }

      // Delete all shots for this scene
      const shotsSnapshot = await adminDb
        .collection('shots')
        .where('sceneId', '==', input.id)
        .get();

      const batch = adminDb.batch();
      shotsSnapshot.docs.forEach((shotDoc) => {
        batch.delete(shotDoc.ref);
      });

      // Unlink from schedule events
      const eventsSnapshot = await adminDb
        .collection('scheduleEvents')
        .where('projectId', '==', sceneData.projectId)
        .where('sceneId', '==', input.id)
        .get();

      eventsSnapshot.docs.forEach((eventDoc) => {
        batch.update(eventDoc.ref, {
          sceneId: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      // Delete the scene
      batch.delete(docRef);

      await batch.commit();

      return { success: true };
    }),

  /**
   * Get all shots for a scene
   */
  getShotsByScene: protectedProcedure
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
        };
      });
    }),

  /**
   * Link a scene to a schedule event
   */
  linkToSchedule: protectedProcedure
    .input(
      z.object({
        sceneId: z.string(),
        scheduleEventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();

      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can link scenes to schedule',
        });
      }

      const eventDoc = await adminDb.collection('scheduleEvents').doc(input.scheduleEventId).get();

      if (!eventDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule event not found' });
      }

      const eventData = eventDoc.data()!;
      if (eventData.projectId !== sceneData.projectId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Scene and event must belong to the same project' });
      }

      const batch = adminDb.batch();

      // Update scene
      batch.update(adminDb.collection('scenes').doc(input.sceneId), {
        shootingDayId: eventData.shootingDayId,
        scheduledDate: eventData.shootingDayId ? undefined : new Date(), // Will be set from shooting day
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update schedule event
      batch.update(adminDb.collection('scheduleEvents').doc(input.scheduleEventId), {
        sceneId: input.sceneId,
        sceneNumber: sceneData.sceneNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return { success: true };
    }),

  /**
   * Sync scene to schedule (adds events for all shots in scene)
   */
  syncToSchedule: protectedProcedure
    .input(z.object({ sceneId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();

      if (!sceneDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
      }

      const sceneData = sceneDoc.data()!;
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can sync scenes to schedule',
        });
      }

      const shootingDayIds = sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []);
      
      if (shootingDayIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Scene has no shooting days assigned',
        });
      }

      try {
        await syncSceneToSchedule(input.sceneId, shootingDayIds);
        return { success: true, message: 'Scene synced to schedule successfully' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to sync scene to schedule',
        });
      }
    }),

  /**
   * Sync all scenes to schedule
   */
  syncAllToSchedule: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can sync scenes to schedule',
        });
      }

      // Get all scenes for the project
      const scenesSnapshot = await adminDb
        .collection('scenes')
        .where('projectId', '==', input.projectId)
        .get();

      let syncedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const sceneDoc of scenesSnapshot.docs) {
        const sceneData = sceneDoc.data();
        const shootingDayIds = sceneData.shootingDayIds || (sceneData.shootingDayId ? [sceneData.shootingDayId] : []);
        
        if (shootingDayIds.length > 0) {
          try {
            await syncSceneToSchedule(sceneDoc.id, shootingDayIds);
            syncedCount++;
          } catch (error: any) {
            errors.push(`Scene ${sceneData.sceneNumber}: ${error.message}`);
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      return {
        success: true,
        syncedCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synced ${syncedCount} scene(s) to schedule${skippedCount > 0 ? `, skipped ${skippedCount} scene(s) without shooting days` : ''}`,
      };
    }),

  /**
   * Check for scheduling conflicts (crew/cast/equipment double-booking)
   */
  getScheduleConflicts: protectedProcedure
    .input(
      z.object({
        sceneId: z.string(),
        scheduledDate: z.coerce.date().optional(),
        shootingDayId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // For new scenes, we need to get scene data from a temporary object or skip
      let sceneData: any = null;
      if (input.sceneId !== 'new') {
        const sceneDoc = await adminDb.collection('scenes').doc(input.sceneId).get();
        if (!sceneDoc.exists) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Scene not found' });
        }
        sceneData = sceneDoc.data()!;
      } else {
        // For new scenes, return empty conflicts
        return {
          crew: [],
          cast: [],
          equipment: [],
          location: false,
        };
      }
      const hasAccess = await hasPermission(sceneData.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this scene' });
      }

      const conflicts: {
        crew: string[];
        cast: string[];
        equipment: string[];
        location: boolean;
      } = {
        crew: [],
        cast: [],
        equipment: [],
        location: false,
      };

      if (!input.scheduledDate && !input.shootingDayId) {
        return conflicts;
      }

      // Get all scenes scheduled for the same date/day
      const projectId = sceneData.projectId;
      let otherScenesQuery = adminDb
        .collection('scenes')
        .where('projectId', '==', projectId);

      if (input.shootingDayId) {
        otherScenesQuery = otherScenesQuery.where('shootingDayId', '==', input.shootingDayId);
      }

      const otherScenesSnapshot = await otherScenesQuery.get();
      
      // Filter out the current scene (Firestore doesn't support != operator)
      const otherScenes = otherScenesSnapshot.docs.filter((doc) => doc.id !== input.sceneId);

      // Check for conflicts
      const sceneCrewIds = sceneData.crewIds || [];
      const sceneCastIds = sceneData.castIds || [];
      const sceneEquipmentIds = sceneData.equipmentIds || [];
      const sceneLocationId = sceneData.locationId;

      otherScenes.forEach((otherSceneDoc) => {
        const otherSceneData = otherSceneDoc.data();

        // Check crew conflicts
        const otherCrewIds = otherSceneData.crewIds || [];
        sceneCrewIds.forEach((crewId: string) => {
          if (otherCrewIds.includes(crewId) && !conflicts.crew.includes(crewId)) {
            conflicts.crew.push(crewId);
          }
        });

        // Check cast conflicts
        const otherCastIds = otherSceneData.castIds || [];
        sceneCastIds.forEach((castId: string) => {
          if (otherCastIds.includes(castId) && !conflicts.cast.includes(castId)) {
            conflicts.cast.push(castId);
          }
        });

        // Check equipment conflicts
        const otherEquipmentIds = otherSceneData.equipmentIds || [];
        sceneEquipmentIds.forEach((equipmentId: string) => {
          if (otherEquipmentIds.includes(equipmentId) && !conflicts.equipment.includes(equipmentId)) {
            conflicts.equipment.push(equipmentId);
          }
        });

        // Check location conflict
        if (sceneLocationId && otherSceneData.locationId === sceneLocationId) {
          conflicts.location = true;
        }
      });

      return conflicts;
    }),

  /**
   * Bulk create scenes from script breakdown
   */
  bulkCreate: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        scenes: z.array(createSceneSchema.omit({ projectId: true, createdBy: true })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can bulk create scenes',
        });
      }

      const batch = adminDb.batch();
      const createdIds: string[] = [];

      for (const sceneInput of input.scenes) {
        const docRef = adminDb.collection('scenes').doc();
        createdIds.push(docRef.id);

        const sceneData = {
          ...sceneInput,
          projectId: input.projectId,
          castIds: sceneInput.castIds || [],
          crewIds: sceneInput.crewIds || [],
          equipmentIds: sceneInput.equipmentIds || [],
          storyboardIds: sceneInput.storyboardIds || [],
          stuntsRequired: sceneInput.stuntsRequired || false,
          status: sceneInput.status || 'not-shot',
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        batch.set(docRef, sceneData);
      }

      await batch.commit();

      return {
        success: true,
        scenesCreated: createdIds.length,
        sceneIds: createdIds,
      };
    }),
});

