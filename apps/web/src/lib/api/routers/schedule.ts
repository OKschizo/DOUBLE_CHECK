import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createShootingDaySchema,
  updateShootingDaySchema,
  createScheduleEventSchema,
  updateScheduleEventSchema,
  type ShootingDay,
  type ScheduleEvent,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const scheduleRouter = router({
  /**
   * Get schedule (days and events) for a project
   */
  getSchedule: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Check access
        const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
          'owner',
          'admin',
          'dept_head',
        ]);

        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
        }

        // Fetch days
        const daysSnapshot = await adminDb
          .collection('shootingDays')
          .where('projectId', '==', input.projectId)
          .orderBy('date', 'asc')
          .get();

        const days = daysSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ShootingDay;
        });

        // Fetch events
        const eventsSnapshot = await adminDb
          .collection('scheduleEvents')
          .where('projectId', '==', input.projectId)
          .orderBy('order', 'asc')
          .get();

        const events = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ScheduleEvent;
        });

        return {
          days,
          events,
        };
      } catch (error: any) {
        console.error('Error fetching schedule:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch schedule',
        });
      }
    }),

  /**
   * Create a shooting day
   */
  createDay: protectedProcedure
    .input(createShootingDaySchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      const daysRef = adminDb.collection('shootingDays');
      const docRef = await daysRef.add({
        ...input,
        date: Timestamp.fromDate(input.date),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ShootingDay;
    }),

  /**
   * Update a shooting day
   */
  updateDay: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateShootingDaySchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('shootingDays').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Day not found' });
      }

      const day = doc.data()!;
      const hasAccess = await hasPermission(day.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      const updateData: any = {
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (input.data.date) {
        updateData.date = Timestamp.fromDate(input.data.date);
      }

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ShootingDay;
    }),

  /**
   * Delete a shooting day
   */
  deleteDay: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('shootingDays').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Day not found' });
      }

      const day = doc.data()!;
      const hasAccess = await hasPermission(day.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      // Delete all events for this day
      const eventsSnapshot = await adminDb
        .collection('scheduleEvents')
        .where('shootingDayId', '==', input.id)
        .get();

      const batch = adminDb.batch();
      eventsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      batch.delete(docRef);
      await batch.commit();

      return { success: true };
    }),

  /**
   * Create a schedule event
   */
  createEvent: protectedProcedure
    .input(createScheduleEventSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      // Get max order for the day
      // Try to query with orderBy, but fallback to fetching all and sorting in memory if index doesn't exist
      const eventsRef = adminDb.collection('scheduleEvents');
      let order = 0;
      
      try {
        const snapshot = await eventsRef
          .where('shootingDayId', '==', input.shootingDayId)
          .orderBy('order', 'desc')
          .limit(1)
          .get();

        if (!snapshot.empty) {
          order = snapshot.docs[0].data().order + 1;
        }
      } catch (error: any) {
        // If index doesn't exist, fetch all events for the day and sort in memory
        if (error.code === 'FAILED_PRECONDITION' || error.message?.includes('index')) {
          const snapshot = await eventsRef
            .where('shootingDayId', '==', input.shootingDayId)
            .get();
          
          if (!snapshot.empty) {
            const orders = snapshot.docs.map(doc => doc.data().order || 0);
            order = Math.max(...orders, 0) + 1;
          }
        } else {
          throw error;
        }
      }

      const docRef = await eventsRef.add({
        ...input,
        order,
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
      } as ScheduleEvent;
    }),

  /**
   * Update a schedule event
   */
  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateScheduleEventSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('scheduleEvents').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      const event = doc.data()!;
      const hasAccess = await hasPermission(event.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      await docRef.update({
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ScheduleEvent;
    }),

  /**
   * Delete a schedule event
   */
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('scheduleEvents').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      const event = doc.data()!;
      const hasAccess = await hasPermission(event.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage schedule',
        });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Generate call sheet data for a shooting day
   */
  getCallSheet: protectedProcedure
    .input(z.object({ shootingDayId: z.string(), projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Check access
        const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
          'owner',
          'admin',
          'dept_head',
        ]);

        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
        }

        // Get shooting day
        const dayDoc = await adminDb.collection('shootingDays').doc(input.shootingDayId).get();
        if (!dayDoc.exists) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Shooting day not found' });
        }

      const dayData = dayDoc.data()!;
      const shootingDay = {
        id: dayDoc.id,
        ...dayData,
        date: dayData.date?.toDate() || new Date(),
        createdAt: dayData.createdAt?.toDate() || new Date(),
        updatedAt: dayData.updatedAt?.toDate() || new Date(),
      } as ShootingDay;

      // Get all events for this day
      // Try to query with orderBy, but fallback to fetching all and sorting in memory if index doesn't exist
      let eventsSnapshot;
      try {
        eventsSnapshot = await adminDb
          .collection('scheduleEvents')
          .where('shootingDayId', '==', input.shootingDayId)
          .orderBy('order', 'asc')
          .get();
      } catch (error: any) {
        // If index doesn't exist, fetch all events for the day and sort in memory
        if (error.code === 'FAILED_PRECONDITION' || error.message?.includes('index')) {
          eventsSnapshot = await adminDb
            .collection('scheduleEvents')
            .where('shootingDayId', '==', input.shootingDayId)
            .get();
        } else {
          throw error;
        }
      }

      const events = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ScheduleEvent;
      });

      // Sort in memory if we didn't use orderBy
      if (events.length > 0 && events[0].order !== undefined) {
        events.sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      // Collect unique IDs
      const sceneIds = new Set<string>();
      const shotIds = new Set<string>();
      const castIds = new Set<string>();
      const crewIds = new Set<string>();
      const equipmentIds = new Set<string>();
      const locationIds = new Set<string>();

      // Add location IDs from shooting day
      if (shootingDay.locationId) locationIds.add(shootingDay.locationId);
      if (shootingDay.basecampLocationId) locationIds.add(shootingDay.basecampLocationId);
      if (shootingDay.crewParkLocationId) locationIds.add(shootingDay.crewParkLocationId);
      if (shootingDay.techTrucksLocationId) locationIds.add(shootingDay.techTrucksLocationId);
      if (shootingDay.bgHoldingLocationId) locationIds.add(shootingDay.bgHoldingLocationId);
      if (shootingDay.bgParkingLocationId) locationIds.add(shootingDay.bgParkingLocationId);

      // Add crew IDs from shooting day (key contacts)
      if (shootingDay.directorCrewId) crewIds.add(shootingDay.directorCrewId);
      if (shootingDay.executiveProducerCrewId) crewIds.add(shootingDay.executiveProducerCrewId);
      if (shootingDay.productionCoordinatorCrewId) crewIds.add(shootingDay.productionCoordinatorCrewId);

      events.forEach((event) => {
        if (event.sceneId) sceneIds.add(event.sceneId);
        if (event.shotId) shotIds.add(event.shotId);
        if (event.locationId) locationIds.add(event.locationId);
        // Collect cast IDs from events
        if (event.castIds && Array.isArray(event.castIds)) {
          event.castIds.forEach((id: string) => {
            if (id) castIds.add(id);
          });
        }
        // Collect crew IDs from events
        if (event.crewIds && Array.isArray(event.crewIds)) {
          event.crewIds.forEach((id: string) => {
            if (id) crewIds.add(id);
          });
        }
        // Collect equipment IDs from events
        if (event.equipmentIds && Array.isArray(event.equipmentIds)) {
          event.equipmentIds.forEach((id: string) => {
            if (id) equipmentIds.add(id);
          });
        }
      });

      // Also collect cast/crew/equipment from scenes
      if (sceneIds.size > 0) {
        const scenesSnapshot = await adminDb.collection('scenes')
          .where('projectId', '==', input.projectId)
          .get();
        
        scenesSnapshot.docs.forEach((doc) => {
          const sceneData = doc.data();
          if (sceneIds.has(doc.id)) {
            // Add cast/crew/equipment from scenes
            if (sceneData.castIds && Array.isArray(sceneData.castIds)) {
              sceneData.castIds.forEach((id: string) => {
                if (id) castIds.add(id);
              });
            }
            if (sceneData.crewIds && Array.isArray(sceneData.crewIds)) {
              sceneData.crewIds.forEach((id: string) => {
                if (id) crewIds.add(id);
              });
            }
            if (sceneData.equipmentIds && Array.isArray(sceneData.equipmentIds)) {
              sceneData.equipmentIds.forEach((id: string) => {
                if (id) equipmentIds.add(id);
              });
            }
            if (sceneData.locationId) locationIds.add(sceneData.locationId);
          }
        });
      }

      // Fetch related data
      const [scenes, shots, cast, crew, equipment, locations] = await Promise.all([
        sceneIds.size > 0
          ? Promise.all(
              Array.from(sceneIds).map((id) => adminDb.collection('scenes').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data()?.createdAt?.toDate() || new Date(),
                  updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
                }))
            )
          : Promise.resolve([]),
        shotIds.size > 0
          ? Promise.all(
              Array.from(shotIds).map((id) => adminDb.collection('shots').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data()?.createdAt?.toDate() || new Date(),
                  updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
                }))
            )
          : Promise.resolve([]),
        castIds.size > 0
          ? Promise.all(
              Array.from(castIds).map((id) => adminDb.collection('cast').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({ id: doc.id, ...doc.data() }))
            )
          : Promise.resolve([]),
        crewIds.size > 0
          ? Promise.all(
              Array.from(crewIds).map((id) => adminDb.collection('crew').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({ id: doc.id, ...doc.data() }))
            )
          : Promise.resolve([]),
        equipmentIds.size > 0
          ? Promise.all(
              Array.from(equipmentIds).map((id) => adminDb.collection('equipment').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({ id: doc.id, ...doc.data() }))
            )
          : Promise.resolve([]),
        locationIds.size > 0
          ? Promise.all(
              Array.from(locationIds).map((id) => adminDb.collection('locations').doc(id).get())
            ).then((docs) =>
              docs
                .filter((doc) => doc.exists)
                .map((doc) => ({ id: doc.id, ...doc.data() }))
            )
          : Promise.resolve([]),
      ]);

        return {
          shootingDay,
          events,
          scenes,
          shots,
          cast,
          crew,
          equipment,
          locations,
        };
      } catch (error: any) {
        console.error('Error generating call sheet:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to generate call sheet',
        });
      }
    }),
});


