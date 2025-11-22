import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createFringeRateSchema,
  updateFringeRateSchema,
  type FringeRate,
  type FringeCalculation,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const budgetFringesRouter = router({
  /**
   * Get all fringe rates for a project
   */
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

      const snapshot = await adminDb
        .collection('budgetFringes')
        .where('projectId', '==', input.projectId)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as FringeRate;
      });
    }),

  /**
   * Get fringe rate by ID
   */
  getById: protectedProcedure
    .input(z.object({ fringeId: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('budgetFringes').doc(input.fringeId).get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fringe rate not found' });
      }

      const fringe = doc.data()!;
      const hasAccess = await hasPermission(fringe.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this fringe rate' });
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FringeRate;
    }),

  /**
   * Create a fringe rate
   */
  create: protectedProcedure
    .input(createFringeRateSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage fringe rates',
        });
      }

      const docRef = await adminDb.collection('budgetFringes').add({
        ...input,
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
      } as FringeRate;
    }),

  /**
   * Update a fringe rate
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateFringeRateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetFringes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fringe rate not found' });
      }

      const fringe = doc.data()!;
      const hasAccess = await hasPermission(fringe.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage fringe rates',
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
      } as FringeRate;
    }),

  /**
   * Delete a fringe rate
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetFringes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fringe rate not found' });
      }

      const fringe = doc.data()!;
      const hasAccess = await hasPermission(fringe.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can delete fringe rates',
        });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Calculate fringes for a given base amount
   */
  calculate: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        baseAmount: z.number().min(0),
        department: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Get applicable fringe rates
      const snapshot = await adminDb
        .collection('budgetFringes')
        .where('projectId', '==', input.projectId)
        .get();

      const applicableFringes = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as FringeRate;
        })
        .filter((fringe) => {
          // Check if fringe applies to this department/role
          if (fringe.appliesToDepartments.length > 0 && input.department) {
            if (!fringe.appliesToDepartments.includes(input.department)) {
              return false;
            }
          }
          if (fringe.appliesToRoles.length > 0 && input.role) {
            if (!fringe.appliesToRoles.includes(input.role)) {
              return false;
            }
          }
          return true;
        });

      // Calculate fringes
      const fringeCalculations = applicableFringes.map((fringe) => {
        let amount = 0;
        if (fringe.isPercentage) {
          amount = (input.baseAmount * fringe.rate) / 100;
        } else {
          amount = fringe.flatAmount || 0;
        }

        return {
          fringeId: fringe.id,
          fringeName: fringe.name,
          amount,
          rate: fringe.rate,
        };
      });

      const totalFringes = fringeCalculations.reduce((sum, f) => sum + f.amount, 0);
      const totalWithFringes = input.baseAmount + totalFringes;

      return {
        baseAmount: input.baseAmount,
        fringes: fringeCalculations,
        totalFringes,
        totalWithFringes,
      } as FringeCalculation;
    }),
});

