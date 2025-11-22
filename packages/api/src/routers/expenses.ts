import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseImportRowSchema,
  type Expense,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

export const expensesRouter = router({
  /**
   * Get all expenses for a project
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

      // Query expenses - if orderBy fails (no index), fall back to simple query
      let snapshot;
      try {
        snapshot = await adminDb
          .collection('expenses')
          .where('projectId', '==', input.projectId)
          .orderBy('transactionDate', 'desc')
          .get();
      } catch (error: any) {
        // If orderBy fails, try without it
        snapshot = await adminDb
          .collection('expenses')
          .where('projectId', '==', input.projectId)
          .get();
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId: data.projectId,
          budgetItemId: data.budgetItemId,
          description: data.description,
          amount: data.amount || 0,
          category: data.category || 'other',
          status: data.status || 'pending',
          transactionDate: data.transactionDate?.toDate() || new Date(),
          vendor: data.vendor,
          vendorId: data.vendorId,
          receiptUrl: data.receiptUrl,
          receiptFileName: data.receiptFileName,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate?.toDate(),
          checkNumber: data.checkNumber,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          rejectedReason: data.rejectedReason,
          notes: data.notes,
          tags: data.tags || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense;
      });
    }),

  /**
   * Get expenses for a specific budget item
   */
  listByBudgetItem: protectedProcedure
    .input(z.object({ budgetItemId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Query expenses - if orderBy fails (no index), fall back to simple query
      let snapshot;
      try {
        snapshot = await adminDb
          .collection('expenses')
          .where('budgetItemId', '==', input.budgetItemId)
          .orderBy('transactionDate', 'desc')
          .get();
      } catch (error: any) {
        // If orderBy fails, try without it
        snapshot = await adminDb
          .collection('expenses')
          .where('budgetItemId', '==', input.budgetItemId)
          .get();
      }

      // Check access via first expense's project
      if (!snapshot.empty) {
        const firstExpense = snapshot.docs[0].data();
        const hasAccess = await hasPermission(firstExpense.projectId, ctx.user.id, [
          'owner',
          'admin',
          'dept_head',
        ]);

        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
        }
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId: data.projectId,
          budgetItemId: data.budgetItemId,
          description: data.description,
          amount: data.amount || 0,
          category: data.category || 'other',
          status: data.status || 'pending',
          transactionDate: data.transactionDate?.toDate() || new Date(),
          vendor: data.vendor,
          vendorId: data.vendorId,
          receiptUrl: data.receiptUrl,
          receiptFileName: data.receiptFileName,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate?.toDate(),
          checkNumber: data.checkNumber,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          rejectedReason: data.rejectedReason,
          notes: data.notes,
          tags: data.tags || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense;
      });
    }),

  /**
   * Get expense by ID
   */
  getById: protectedProcedure
    .input(z.object({ expenseId: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('expenses').doc(input.expenseId).get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' });
      }

      const expense = doc.data()!;
      const hasAccess = await hasPermission(expense.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this expense' });
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        transactionDate: data.transactionDate?.toDate() || new Date(),
        paymentDate: data.paymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Expense;
    }),

  /**
   * Create an expense
   */
  create: protectedProcedure
    .input(createExpenseSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create expenses',
        });
      }

      const expenseData: any = {
        ...input,
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Handle transactionDate
      if (input.transactionDate) {
        expenseData.transactionDate = input.transactionDate instanceof Date 
          ? input.transactionDate 
          : new Date(input.transactionDate);
      } else {
        expenseData.transactionDate = FieldValue.serverTimestamp();
      }

      const docRef = await adminDb.collection('expenses').add(expenseData);

      // Update budget item actual amount if linked
      if (input.budgetItemId) {
        const budgetItemRef = adminDb.collection('budgetItems').doc(input.budgetItemId);
        const budgetItemDoc = await budgetItemRef.get();
        if (budgetItemDoc.exists) {
          const currentActual = budgetItemDoc.data()?.actualAmount || 0;
          await budgetItemRef.update({
            actualAmount: currentActual + input.amount,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        transactionDate: data.transactionDate?.toDate() || new Date(),
        paymentDate: data.paymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Expense;
    }),

  /**
   * Update an expense
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateExpenseSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('expenses').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' });
      }

      const expense = doc.data()!;
      const hasAccess = await hasPermission(expense.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can update expenses',
        });
      }

      // Handle amount changes - update budget item if linked
      const oldAmount = expense.amount;
      const newAmount = input.data.amount;
      if (newAmount !== undefined && newAmount !== oldAmount && expense.budgetItemId) {
        const budgetItemRef = adminDb.collection('budgetItems').doc(expense.budgetItemId);
        const budgetItemDoc = await budgetItemRef.get();
        if (budgetItemDoc.exists) {
          const currentActual = budgetItemDoc.data()?.actualAmount || 0;
          await budgetItemRef.update({
            actualAmount: currentActual - oldAmount + newAmount,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      const updateData: any = { ...input.data };
      if (updateData.transactionDate) {
        updateData.transactionDate = updateData.transactionDate instanceof Date 
          ? updateData.transactionDate 
          : new Date(updateData.transactionDate);
      }
      if (updateData.paymentDate) {
        updateData.paymentDate = updateData.paymentDate instanceof Date 
          ? updateData.paymentDate 
          : new Date(updateData.paymentDate);
      }
      if (updateData.approvedBy) {
        updateData.approvedAt = FieldValue.serverTimestamp();
      }
      updateData.updatedAt = FieldValue.serverTimestamp();

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        transactionDate: data.transactionDate?.toDate() || new Date(),
        paymentDate: data.paymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Expense;
    }),

  /**
   * Delete an expense
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('expenses').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' });
      }

      const expense = doc.data()!;
      const hasAccess = await hasPermission(expense.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can delete expenses',
        });
      }

      // Update budget item actual amount if linked
      if (expense.budgetItemId) {
        const budgetItemRef = adminDb.collection('budgetItems').doc(expense.budgetItemId);
        const budgetItemDoc = await budgetItemRef.get();
        if (budgetItemDoc.exists) {
          const currentActual = budgetItemDoc.data()?.actualAmount || 0;
          await budgetItemRef.update({
            actualAmount: Math.max(0, currentActual - expense.amount),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Import expenses from CSV/Excel data
   */
  import: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        expenses: z.array(expenseImportRowSchema),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can import expenses',
        });
      }

      const expensesRef = adminDb.collection('expenses');
      const createdExpenses: string[] = [];

      for (const row of input.expenses) {
        // Try to match budget item by description
        let budgetItemId: string | undefined;
        if (row.budgetItem) {
          const budgetItemsSnapshot = await adminDb
            .collection('budgetItems')
            .where('projectId', '==', input.projectId)
            .where('description', '==', row.budgetItem)
            .limit(1)
            .get();

          if (!budgetItemsSnapshot.empty) {
            budgetItemId = budgetItemsSnapshot.docs[0].id;
          }
        }

        const expenseRef = await expensesRef.add({
          projectId: input.projectId,
          budgetItemId,
          description: row.description,
          amount: row.amount,
          category: row.category || 'other',
          status: 'pending',
          vendor: row.vendor,
          transactionDate: new Date(row.date),
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        createdExpenses.push(expenseRef.id);

        // Update budget item if linked
        if (budgetItemId) {
          const budgetItemRef = adminDb.collection('budgetItems').doc(budgetItemId);
          const budgetItemDoc = await budgetItemRef.get();
          if (budgetItemDoc.exists) {
            const currentActual = budgetItemDoc.data()?.actualAmount || 0;
            await budgetItemRef.update({
              actualAmount: currentActual + row.amount,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      return {
        success: true,
        expensesCreated: createdExpenses.length,
        expenseIds: createdExpenses,
      };
    }),
});

