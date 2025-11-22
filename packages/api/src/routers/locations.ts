import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createLocationSchema,
  updateLocationSchema,
  Location,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { router, protectedProcedure } from '../trpc';
import { hasPermission } from './projectMembers';
import { syncBudgetItemsForLocation, unlinkBudgetItemsForLocation } from '../services/budgetSync';

export const locationsRouter = router({
  // List all locations for a project
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const locationsSnapshot = await adminDb
        .collection('locations')
        .where('projectId', '==', input.projectId)
        .get();

      const locations = locationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Location;
      });

      return locations;
    }),

  // Get single location
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const locationDoc = await adminDb.collection('locations').doc(input.id).get();

      if (!locationDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
      }

      const data = locationDoc.data()!;
      const projectId = data.projectId;

      const hasAccess = await hasPermission(projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      return {
        ...data,
        id: locationDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Location;
    }),

  // Create location
  create: protectedProcedure
    .input(createLocationSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const locationRef = await adminDb.collection('locations').add({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const locationDoc = await locationRef.get();
      const data = locationDoc.data()!;

      return {
        ...data,
        id: locationDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Location;
    }),

  // Update location
  update: protectedProcedure
    .input(updateLocationSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const locationDoc = await adminDb.collection('locations').doc(id).get();

      if (!locationDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
      }

      const data = locationDoc.data()!;
      const projectId = data.projectId;

      const hasAccess = await hasPermission(projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      await adminDb.collection('locations').doc(id).update({
        ...updateData,
        updatedAt: new Date(),
      });

      // Sync linked budget items
      try {
        await syncBudgetItemsForLocation(input.id, {
          name: updateData.name,
          rentalCost: updateData.rentalCost,
        });
      } catch (error) {
        console.error('Error syncing budget items for location:', error);
        // Don't fail the update if budget sync fails
      }

      const updatedDoc = await adminDb.collection('locations').doc(id).get();
      const updatedData = updatedDoc.data()!;

      return {
        ...updatedData,
        id: updatedDoc.id,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Location;
    }),

  // Delete location
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const locationDoc = await adminDb.collection('locations').doc(input.id).get();

      if (!locationDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
      }

      const data = locationDoc.data()!;
      const projectId = data.projectId;

      const hasAccess = await hasPermission(projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Unlink budget items (don't delete them to preserve budget history)
      try {
        await unlinkBudgetItemsForLocation(input.id);
      } catch (error) {
        console.error('Error unlinking budget items for location:', error);
        // Don't fail the delete if unlink fails
      }

      await adminDb.collection('locations').doc(input.id).delete();

      return { success: true };
    }),
});

