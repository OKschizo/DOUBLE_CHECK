import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  createCheckoutSchema,
  returnEquipmentSchema,
  createPackageSchema,
  updatePackageSchema,
  Equipment,
  CheckoutHistory,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { router, protectedProcedure } from '../trpc';
import { syncBudgetItemsForEquipment, unlinkBudgetItemsForEquipment } from '../services/budgetSync';
import { getUserRole } from './projectMembers';

export const equipmentRouter = router({
  // List all equipment for a project
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { projectId } = input;

      // Verify user has access to this project
      const projectDoc = await adminDb.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Get user's role and permissions
      const userRole = await getUserRole(projectId, ctx.user.id, ctx.user.email);
      
      // Get user's crew card ID
      const myCrewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', projectId)
        .where('userId', '==', ctx.user.id)
        .limit(1)
        .get();
      
      const myCrewCardId = myCrewSnapshot.empty ? null : myCrewSnapshot.docs[0].id;

      // Get user's department head assignments
      const deptHeadsSnapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', projectId)
        .where('userId', '==', ctx.user.id)
        .get();
      
      const myDepartments = deptHeadsSnapshot.docs.map(doc => doc.data().department);

      const equipmentSnapshot = await adminDb
        .collection('equipment')
        .where('projectId', '==', projectId)
        .get();

      const equipment = equipmentSnapshot.docs.map((doc) => {
        const data = doc.data();
        const equipmentItem = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Equipment;

        // Check if user is assigned to this equipment
        const assignedTo = (data.assignedTo || []) as string[];
        const isAssignedToMe = myCrewCardId && assignedTo.includes(myCrewCardId);

        // Hide rate if user is crew and not assigned to this equipment
        if (userRole === 'crew' && !isAssignedToMe) {
          delete (equipmentItem as any).dailyRate;
          delete (equipmentItem as any).rate;
        }
        // Hide rate if user is dept_head and equipment is not in their department
        else if (userRole === 'dept_head' && myDepartments.length > 0) {
          const equipmentCategory = data.category as string;
          // Map equipment categories to departments (simplified - may need adjustment)
          const isInMyDepartment = myDepartments.some(dept => {
            if (dept === 'camera' && equipmentCategory === 'Camera') return true;
            if (dept === 'lighting_grip' && (equipmentCategory === 'Lighting' || equipmentCategory === 'Grip')) return true;
            if (dept === 'sound' && equipmentCategory === 'Sound') return true;
            if (dept === 'art' && equipmentCategory === 'Art') return true;
            // Add more mappings as needed
            return false;
          });
          
          if (!isInMyDepartment) {
            delete (equipmentItem as any).dailyRate;
            delete (equipmentItem as any).rate;
          }
        }
        // Admin and owner can see all rates

        return equipmentItem;
      });

      return equipment;
    }),

  // Get single equipment item
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const equipmentDoc = await adminDb.collection('equipment').doc(input.id).get();

      if (!equipmentDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      const data = equipmentDoc.data()!;
      return {
        ...data,
        id: equipmentDoc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Equipment;
    }),

  // Create equipment
  create: protectedProcedure
    .input(createEquipmentSchema)
    .mutation(async ({ input, ctx }) => {
      const equipmentRef = adminDb.collection('equipment').doc();

      const now = new Date();
      const equipmentData = {
        ...input,
        quantityAvailable: input.quantity, // Initially all units are available
        createdAt: now,
        updatedAt: now,
      };

      await equipmentRef.set(equipmentData);

      return {
        ...equipmentData,
        id: equipmentRef.id,
      } as Equipment;
    }),

  // Update equipment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateEquipmentSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { id, data } = input;
      const equipmentRef = adminDb.collection('equipment').doc(id);

      const equipmentDoc = await equipmentRef.get();
      if (!equipmentDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await equipmentRef.update(updateData);

      // Sync linked budget items
      try {
        await syncBudgetItemsForEquipment(input.id, {
          name: input.data.name,
          dailyRate: input.data.dailyRate,
          weeklyRate: input.data.weeklyRate,
        });
      } catch (error) {
        console.error('Error syncing budget items for equipment:', error);
        // Don't fail the update if budget sync fails
      }

      const updated = await equipmentRef.get();
      const updatedData = updated.data()!;

      return {
        ...updatedData,
        id: updated.id,
        createdAt: updatedData.createdAt?.toDate(),
        updatedAt: updatedData.updatedAt?.toDate(),
      } as Equipment;
    }),

  // Delete equipment
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const equipmentRef = adminDb.collection('equipment').doc(input.id);

      const equipmentDoc = await equipmentRef.get();
      if (!equipmentDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      // Unlink budget items (don't delete them to preserve budget history)
      try {
        await unlinkBudgetItemsForEquipment(input.id);
      } catch (error) {
        console.error('Error unlinking budget items for equipment:', error);
        // Don't fail the delete if unlink fails
      }

      await equipmentRef.delete();

      return { success: true };
    }),

  // Checkout equipment
  checkout: protectedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ input, ctx }) => {
      const { equipmentId, quantity } = input;

      // Get equipment to verify availability
      const equipmentRef = adminDb.collection('equipment').doc(equipmentId);
      const equipmentDoc = await equipmentRef.get();

      if (!equipmentDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      const equipment = equipmentDoc.data()!;

      // Check if enough quantity is available
      if (equipment.quantityAvailable < quantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Only ${equipment.quantityAvailable} units available`,
        });
      }

      // Create checkout record
      const checkoutRef = adminDb.collection('checkoutHistory').doc();
      const now = new Date();

      const checkoutData = {
        ...input,
        status: 'checked_out',
        createdAt: now,
        updatedAt: now,
      };

      await checkoutRef.set(checkoutData);

      // Update equipment availability and assignedTo
      const newAssignedTo = [...(equipment.assignedTo || [])];
      if (!newAssignedTo.includes(input.userId)) {
        newAssignedTo.push(input.userId);
      }

      await equipmentRef.update({
        quantityAvailable: equipment.quantityAvailable - quantity,
        assignedTo: newAssignedTo,
        status: equipment.quantityAvailable - quantity === 0 ? 'checked_out' : equipment.status,
        updatedAt: now,
      });

      return {
        ...checkoutData,
        id: checkoutRef.id,
      } as CheckoutHistory;
    }),

  // Return equipment
  returnEquipment: protectedProcedure
    .input(returnEquipmentSchema)
    .mutation(async ({ input }) => {
      const { checkoutId, returnDate, notes } = input;

      const checkoutRef = adminDb.collection('checkoutHistory').doc(checkoutId);
      const checkoutDoc = await checkoutRef.get();

      if (!checkoutDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Checkout record not found' });
      }

      const checkout = checkoutDoc.data()!;
      const now = new Date();

      // Update checkout record
      await checkoutRef.update({
        status: 'returned',
        returnDate: returnDate || now,
        notes: notes || checkout.notes,
        updatedAt: now,
      });

      // Update equipment availability
      const equipmentRef = adminDb.collection('equipment').doc(checkout.equipmentId);
      const equipmentDoc = await equipmentRef.get();

      if (equipmentDoc.exists) {
        const equipment = equipmentDoc.data()!;
        const newQuantityAvailable = equipment.quantityAvailable + checkout.quantity;

        // Check if user has any other active checkouts for this equipment
        const activeCheckouts = await adminDb
          .collection('checkoutHistory')
          .where('equipmentId', '==', checkout.equipmentId)
          .where('userId', '==', checkout.userId)
          .where('status', '==', 'checked_out')
          .get();

        const stillAssigned = activeCheckouts.size > 0;

        // Remove user from assignedTo if they have no active checkouts
        let newAssignedTo = equipment.assignedTo || [];
        if (!stillAssigned) {
          newAssignedTo = newAssignedTo.filter((id: string) => id !== checkout.userId);
        }

        await equipmentRef.update({
          quantityAvailable: newQuantityAvailable,
          assignedTo: newAssignedTo,
          status: newQuantityAvailable === equipment.quantity ? 'available' : equipment.status,
          updatedAt: now,
        });
      }

      return { success: true };
    }),

  // Get checkout history for equipment
  getCheckoutHistory: protectedProcedure
    .input(z.object({ equipmentId: z.string() }))
    .query(async ({ input }) => {
      const historySnapshot = await adminDb
        .collection('checkoutHistory')
        .where('equipmentId', '==', input.equipmentId)
        .get();

      const history = historySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          checkoutDate: data.checkoutDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
          returnDate: data.returnDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as CheckoutHistory;
      });

      return history;
    }),

  // Get all active checkouts for a project
  getActiveCheckouts: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const checkoutsSnapshot = await adminDb
        .collection('checkoutHistory')
        .where('projectId', '==', input.projectId)
        .where('status', '==', 'checked_out')
        .get();

      const checkouts = checkoutsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          checkoutDate: data.checkoutDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
          returnDate: data.returnDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as CheckoutHistory;
      });

      return checkouts;
    }),

  // Package Management
  createPackage: protectedProcedure
    .input(createPackageSchema)
    .mutation(async ({ input }) => {
      const packageRef = adminDb.collection('equipmentPackages').doc();

      const now = new Date();
      const packageData = {
        ...input,
        createdAt: now,
        updatedAt: now,
      };

      await packageRef.set(packageData);

      // Update equipment items to reference this package
      const batch = adminDb.batch();
      for (const equipmentId of input.equipmentIds) {
        const equipmentRef = adminDb.collection('equipment').doc(equipmentId);
        batch.update(equipmentRef, { packageId: packageRef.id, updatedAt: now });
      }
      await batch.commit();

      return {
        ...packageData,
        id: packageRef.id,
      };
    }),

  listPackages: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const packagesSnapshot = await adminDb
        .collection('equipmentPackages')
        .where('projectId', '==', input.projectId)
        .get();

      const packages = packagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });

      return packages;
    }),

  deletePackage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const packageRef = adminDb.collection('equipmentPackages').doc(input.id);
      const packageDoc = await packageRef.get();

      if (!packageDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
      }

      const packageData = packageDoc.data()!;

      // Remove packageId from all equipment in this package
      const batch = adminDb.batch();
      const now = new Date();
      for (const equipmentId of packageData.equipmentIds || []) {
        const equipmentRef = adminDb.collection('equipment').doc(equipmentId);
        batch.update(equipmentRef, { packageId: null, updatedAt: now });
      }
      await batch.commit();

      // Delete package
      await packageRef.delete();

      return { success: true };
    }),
});

