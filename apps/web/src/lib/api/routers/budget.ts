import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createBudgetCategorySchema,
  updateBudgetCategorySchema,
  createBudgetItemSchema,
  updateBudgetItemSchema,
  createBudgetCommentSchema,
  updateBudgetCommentSchema,
  type BudgetCategory,
  type BudgetItem,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission, getUserRole } from './projectMembers';
import { syncSourceFromBudgetItem } from '../services/budgetSync';

/**
 * Map crew department to template category name
 */
function getCategoryNameForDepartment(department: string): string {
  const departmentMap: Record<string, string> = {
    'camera': 'Camera',
    'lighting_grip': 'Lighting & Grip',
    'sound': 'Sound',
    'art': 'Art Department',
    'wardrobe': 'Wardrobe',
    'makeup_hair': 'Hair & Makeup',
    'production': 'Production',
    'post_production': 'Post-Production',
    'transportation': 'Transportation',
    'catering': 'Catering',
    'stunts': 'Stunts',
    'vfx': 'VFX',
    'other': 'Other',
  };
  return departmentMap[department] || department.charAt(0).toUpperCase() + department.slice(1).replace('_', ' ');
}

/**
 * Map equipment category to template category name
 */
function getCategoryNameForEquipment(equipmentCategory: string): string {
  const categoryMap: Record<string, string> = {
    'camera': 'Camera',
    'lenses': 'Camera', // Lenses go in Camera category
    'lighting': 'Lighting & Grip',
    'grip': 'Lighting & Grip',
    'power': 'Lighting & Grip', // Power & Distribution goes with Lighting & Grip
    'audio': 'Sound',
    'sound': 'Sound',
    'monitors': 'Camera', // Monitors & Playback typically with Camera
    'wireless_video': 'Camera', // Wireless Video with Camera
    'specialty': 'Equipment', // Specialty Equipment gets its own or generic Equipment
    'vehicles': 'Transportation',
    'art': 'Art Department',
    'wardrobe': 'Wardrobe',
    'makeup': 'Hair & Makeup',
    'transportation': 'Transportation',
    'other': 'Equipment',
  };
  return categoryMap[equipmentCategory.toLowerCase()] || 'Equipment';
}

/**
 * Find or create a budget category matching template structure
 */
async function findOrCreateCategoryForTemplate(
  projectId: string,
  categoryName: string,
  department: string,
  phase?: string
): Promise<string> {
  const categoriesRef = adminDb.collection('budgetCategories');
  
  // First, try to find existing category by name (template-aligned)
  const existingByName = await categoriesRef
    .where('projectId', '==', projectId)
    .where('name', '==', categoryName)
    .limit(1)
    .get();

  if (!existingByName.empty) {
    return existingByName.docs[0].id;
  }

  // If not found by name, try to find by department
  const existingByDept = await categoriesRef
    .where('projectId', '==', projectId)
    .where('department', '==', department)
    .limit(1)
    .get();

  if (!existingByDept.empty) {
    // Update the existing category name to match template
    const existingCategory = existingByDept.docs[0];
    await existingCategory.ref.update({
      name: categoryName,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return existingCategory.id;
  }

  // Create new category with template-aligned name
  const maxOrderSnapshot = await categoriesRef
    .where('projectId', '==', projectId)
    .orderBy('order', 'desc')
    .limit(1)
    .get();

  const order = maxOrderSnapshot.empty ? 0 : (maxOrderSnapshot.docs[0].data().order || 0) + 1;

  const newCategoryRef = await categoriesRef.add({
    projectId,
    name: categoryName,
    order,
    department,
    phase: phase || 'production',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return newCategoryRef.id;
}

export const budgetRouter = router({
  /**
   * Get budget summary and details for a project
   */
  getBudget: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check basic access - crew members can also access budget (but filtered)
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
        'crew',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Get user's role
      const userRole = await getUserRole(input.projectId, ctx.user.id, ctx.user.email);
      
      // Get user's crew card to check their department and ID
      const crewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .limit(1)
        .get();
      
      const myCrewCard = crewSnapshot.empty ? null : {
        id: crewSnapshot.docs[0].id,
        department: crewSnapshot.docs[0].data().department,
      };

      // Get user's assigned equipment IDs
      const assignedEquipmentIds = new Set<string>();
      if (myCrewCard) {
        const equipmentSnapshot = await adminDb
          .collection('equipment')
          .where('projectId', '==', input.projectId)
          .where('assignedTo', 'array-contains', myCrewCard.id)
          .get();
        
        equipmentSnapshot.docs.forEach(doc => assignedEquipmentIds.add(doc.id));
      }

      // Get department heads for this user
      const deptHeadsSnapshot = await adminDb
        .collection('departmentHeads')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .get();
      
      const myDepartments = deptHeadsSnapshot.docs.map(doc => doc.data().department);

      // Fetch categories - handle case where orderBy might fail
      let categoriesSnapshot;
      try {
        categoriesSnapshot = await adminDb
          .collection('budgetCategories')
          .where('projectId', '==', input.projectId)
          .orderBy('order', 'asc')
          .get();
      } catch (error: any) {
        // If orderBy fails (likely missing index), fetch without it and sort in memory
        console.warn('Budget categories orderBy failed, fetching without orderBy:', error.message);
        try {
          categoriesSnapshot = await adminDb
            .collection('budgetCategories')
            .where('projectId', '==', input.projectId)
            .get();
        } catch (fallbackError: any) {
          console.error('Failed to fetch budget categories:', fallbackError.message);
          // Return empty array if both queries fail
          categoriesSnapshot = { docs: [] } as any;
        }
      }

      const categories = categoriesSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        if (!data) {
          return null;
        }
        return {
          id: doc.id,
          projectId: data.projectId,
          name: data.name,
          order: data.order ?? 999, // Default to high number if missing
          department: data.department,
          phase: data.phase,
          isSubtotal: data.isSubtotal || false,
          parentCategoryId: data.parentCategoryId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetCategory;
      }).filter((cat: any): cat is BudgetCategory => cat !== null)
        .sort((a: any, b: any) => {
          // Sort by order first, then by name if order is the same
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return a.name.localeCompare(b.name);
        });

      // Fetch items
      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', input.projectId)
        .get();

      const allItems = itemsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          categoryId: data.categoryId,
          projectId: data.projectId,
          description: data.description,
          estimatedAmount: data.estimatedAmount || 0,
          actualAmount: data.actualAmount || 0,
          status: data.status || 'estimated',
          notes: data.notes,
          linkedCrewMemberId: data.linkedCrewMemberId,
          linkedEquipmentId: data.linkedEquipmentId,
          linkedLocationId: data.linkedLocationId,
          linkedCastMemberId: data.linkedCastMemberId,
          linkedScheduleEventId: data.linkedScheduleEventId,
          unit: data.unit,
          quantity: data.quantity || 1,
          unitRate: data.unitRate,
          vendor: data.vendor,
          accountCode: data.accountCode,
          phase: data.phase,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetItem;
      });

      // Filter items based on user role
      let filteredItems = allItems;
      
      if (userRole === 'owner' || userRole === 'admin') {
        // Owners and admins see all items
        filteredItems = allItems;
      } else if (userRole === 'dept_head' && myDepartments.length > 0) {
        // Department heads see items in their departments
        // Get crew members in their departments to find linked items
        const deptCrewSnapshot = await adminDb
          .collection('crew')
          .where('projectId', '==', input.projectId)
          .where('department', 'in', myDepartments)
          .get();
        
        const deptCrewIds = new Set(deptCrewSnapshot.docs.map(doc => doc.id));
        
        // Get equipment in their departments
        const deptEquipmentSnapshot = await adminDb
          .collection('equipment')
          .where('projectId', '==', input.projectId)
          .get();
        
        const deptEquipmentIds = new Set(
          deptEquipmentSnapshot.docs
            .filter(doc => {
              const cat = doc.data().category;
              // Map equipment categories to departments (simplified - may need adjustment)
              return myDepartments.some(dept => {
                if (dept === 'camera' && cat === 'Camera') return true;
                if (dept === 'lighting_grip' && (cat === 'Lighting' || cat === 'Grip')) return true;
                if (dept === 'sound' && cat === 'Sound') return true;
                if (dept === 'art' && cat === 'Art') return true;
                // Add more mappings as needed
                return false;
              });
            })
            .map(doc => doc.id)
        );

        filteredItems = allItems.filter(item => {
          // Include if category is in their department
          const category = categories.find((c: any) => c.id === item.categoryId);
          if (category?.department && myDepartments.includes(category.department)) {
            return true;
          }
          
          // Include if linked to crew in their department
          if (item.linkedCrewMemberId && deptCrewIds.has(item.linkedCrewMemberId)) {
            return true;
          }
          
          // Include if linked to equipment in their department
          if (item.linkedEquipmentId && deptEquipmentIds.has(item.linkedEquipmentId)) {
            return true;
          }
          
          return false;
        });
      } else if (userRole === 'crew' && myCrewCard) {
        // Crew members see only items linked to them or equipment they're assigned to
        filteredItems = allItems.filter(item => {
          // Include if linked to their crew card
          if (item.linkedCrewMemberId === myCrewCard.id) {
            return true;
          }
          
          // Include if linked to equipment they're assigned to
          if (item.linkedEquipmentId && assignedEquipmentIds.has(item.linkedEquipmentId)) {
            return true;
          }
          
          return false;
        });
      } else {
        // No access or unknown role - return empty
        filteredItems = [];
      }

      // Filter categories to only include those that have visible items
      const visibleCategoryIds = new Set(filteredItems.map(item => item.categoryId));
      const filteredCategories = categories.filter((cat: any) => 
        visibleCategoryIds.has(cat.id) || cat.isSubtotal
      );

      return {
        categories: filteredCategories,
        items: filteredItems,
      };
    }),

  /**
   * Create a budget category
   */
  createCategory: protectedProcedure
    .input(createBudgetCategorySchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
        });
      }

      // Get max order
      const categoriesRef = adminDb.collection('budgetCategories');
      const snapshot = await categoriesRef
        .where('projectId', '==', input.projectId)
        .orderBy('order', 'desc')
        .limit(1)
        .get();

      let order = 0;
      if (!snapshot.empty) {
        order = snapshot.docs[0].data().order + 1;
      }

      const docRef = await categoriesRef.add({
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
      } as BudgetCategory;
    }),

  /**
   * Update a budget category
   */
  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateBudgetCategorySchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetCategories').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      const category = doc.data()!;
      const hasAccess = await hasPermission(category.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
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
      } as BudgetCategory;
    }),

  /**
   * Delete a budget category
   */
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetCategories').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      const category = doc.data()!;
      const hasAccess = await hasPermission(category.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
        });
      }

      // Check if category has items
      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('categoryId', '==', input.id)
        .limit(1)
        .get();

      if (!itemsSnapshot.empty) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete category with items. Please remove or move items first.',
        });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Create a budget item
   */
  createItem: protectedProcedure
    .input(createBudgetItemSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
        });
      }

      const itemsRef = adminDb.collection('budgetItems');
      const docRef = await itemsRef.add({
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
      } as BudgetItem;
    }),

  /**
   * Update a budget item
   */
  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateBudgetItemSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetItems').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      const item = doc.data()!;
      const hasAccess = await hasPermission(item.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
        });
      }

      await docRef.update({
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Optionally sync rates back to source entity (only if unitRate changed)
      if (input.data.unitRate !== undefined) {
        try {
          const updatedDoc = await docRef.get();
          const updatedData = updatedDoc.data()!;
          await syncSourceFromBudgetItem({
            linkedCrewMemberId: updatedData.linkedCrewMemberId,
            linkedCastMemberId: updatedData.linkedCastMemberId,
            linkedEquipmentId: updatedData.linkedEquipmentId,
            linkedLocationId: updatedData.linkedLocationId,
            unitRate: input.data.unitRate,
          });
        } catch (error) {
          console.error('Error syncing source from budget item:', error);
          // Don't fail the update if reverse sync fails
        }
      }

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BudgetItem;
    }),

  /**
   * Delete a budget item
   */
  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetItems').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      const item = doc.data()!;
      const hasAccess = await hasPermission(item.projectId, ctx.user.id, ['owner', 'admin']);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can manage budget',
        });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Get budget comments
   */
  getComments: protectedProcedure
    .input(z.object({ projectId: z.string(), budgetItemId: z.string().optional(), budgetCategoryId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      let query = adminDb.collection('budgetComments').where('projectId', '==', input.projectId);
      
      if (input.budgetItemId) {
        query = query.where('budgetItemId', '==', input.budgetItemId);
      } else if (input.budgetCategoryId) {
        query = query.where('budgetCategoryId', '==', input.budgetCategoryId);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();

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
   * Create a budget comment
   */
  createComment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        budgetItemId: z.string().optional(),
        budgetCategoryId: z.string().optional(),
        content: z.string().min(1),
        mentions: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      // Get user info
      const userDoc = await adminDb.collection('users').doc(ctx.user.id).get();
      const userData = userDoc.data();

      const docRef = await adminDb.collection('budgetComments').add({
        ...input,
        userId: ctx.user.id,
        userName: userData?.name || userData?.email || 'Unknown',
        userEmail: userData?.email,
        resolved: false,
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
      };
    }),

  /**
   * Update a budget comment
   */
  updateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        resolved: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetComments').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
      }

      const comment = doc.data()!;
      
      // Only comment author or project admin can update
      const hasAccess = await hasPermission(comment.projectId, ctx.user.id, ['owner', 'admin']);
      const isAuthor = comment.userId === ctx.user.id;

      if (!hasAccess && !isAuthor) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot update this comment' });
      }

      await docRef.update({
        ...input,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }),

  /**
   * Delete a budget comment
   */
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('budgetComments').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
      }

      const comment = doc.data()!;
      
      // Only comment author or project admin can delete
      const hasAccess = await hasPermission(comment.projectId, ctx.user.id, ['owner', 'admin']);
      const isAuthor = comment.userId === ctx.user.id;

      if (!hasAccess && !isAuthor) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete this comment' });
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Create budget items from crew members
   */
  createFromCrew: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        crewMemberIds: z.array(z.string()),
        categoryId: z.string().optional(), // Optional: create items in specific category
        phase: z.enum(['pre-production', 'production', 'post-production', 'wrap', 'other']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create budget items',
        });
      }

      // Get crew members
      const crewMembers = await Promise.all(
        input.crewMemberIds.map(async (id) => {
          const doc = await adminDb.collection('crew').doc(id).get();
          if (!doc.exists) return null;
          const data = doc.data()!;
          return { id: doc.id, ...data } as any;
        })
      );

      const validCrewMembers = crewMembers.filter(Boolean);
      if (validCrewMembers.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid crew members found' });
      }

      // Get or create category for crew department
      const categoriesRef = adminDb.collection('budgetCategories');
      const itemsRef = adminDb.collection('budgetItems');
      const createdItems: string[] = [];

      // Group by department
      const byDepartment = validCrewMembers.reduce((acc, member) => {
        const dept = member.department || 'other';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(member);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [department, members] of Object.entries(byDepartment)) {
        // Find or create category using template-aligned names
        let categoryId = input.categoryId;
        if (!categoryId) {
          const categoryName = getCategoryNameForDepartment(department);
          categoryId = await findOrCreateCategoryForTemplate(
            input.projectId,
            categoryName,
            department,
            input.phase
          );
        }

        // Create budget items for each crew member
        for (const member of members) {
          const rate = member.rate || 0;
          const days = member.days || 1; // Default to 1 day if not specified
          const estimatedAmount = rate * days;

          const itemRef = await itemsRef.add({
            projectId: input.projectId,
            categoryId: categoryId!,
            description: `${member.name} - ${member.role}`,
            estimatedAmount,
            actualAmount: 0,
            status: 'estimated',
            unit: 'days',
            quantity: days,
            unitRate: rate,
            linkedCrewMemberId: member.id,
            department,
            phase: input.phase,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdItems.push(itemRef.id);
        }
      }

      return {
        success: true,
        itemsCreated: createdItems.length,
        itemIds: createdItems,
      };
    }),

  /**
   * Create budget items from equipment
   */
  createFromEquipment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        equipmentIds: z.array(z.string()),
        categoryId: z.string().optional(),
        phase: z.enum(['pre-production', 'production', 'post-production', 'wrap', 'other']).optional(),
        rentalDays: z.number().optional(), // Default rental period
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create budget items',
        });
      }

      // Get equipment
      const equipment = await Promise.all(
        input.equipmentIds.map(async (id) => {
          const doc = await adminDb.collection('equipment').doc(id).get();
          if (!doc.exists) return null;
          const data = doc.data()!;
          return { id: doc.id, ...data } as any;
        })
      );

      const validEquipment = equipment.filter(Boolean);
      if (validEquipment.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid equipment found' });
      }

      const categoriesRef = adminDb.collection('budgetCategories');
      const itemsRef = adminDb.collection('budgetItems');
      const createdItems: string[] = [];

      // Group by category
      const byCategory = validEquipment.reduce((acc, item) => {
        const cat = item.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [equipmentCategory, items] of Object.entries(byCategory)) {
        let categoryId = input.categoryId;
        if (!categoryId) {
          // Map equipment category to template category name
          const categoryName = getCategoryNameForEquipment(equipmentCategory);
          // For equipment, we need to determine the department
          // Equipment categories map to departments (camera equipment -> camera department)
          const departmentMap: Record<string, string> = {
            'camera': 'camera',
            'lenses': 'camera',
            'lighting': 'lighting_grip',
            'grip': 'lighting_grip',
            'power': 'lighting_grip',
            'audio': 'sound',
            'sound': 'sound',
            'monitors': 'camera',
            'wireless_video': 'camera',
            'specialty': 'other',
            'vehicles': 'transportation',
            'art': 'art',
            'wardrobe': 'wardrobe',
            'makeup': 'makeup_hair',
            'transportation': 'transportation',
            'other': 'other',
          };
          const department = departmentMap[equipmentCategory.toLowerCase()] || 'other';
          
          categoryId = await findOrCreateCategoryForTemplate(
            input.projectId,
            categoryName,
            department,
            input.phase
          );
        }

        for (const item of items) {
          const dailyRate = item.dailyRate || 0;
          const weeklyRate = item.weeklyRate || 0;
          const days = input.rentalDays || 1;
          const estimatedAmount = dailyRate > 0 ? dailyRate * days : weeklyRate * Math.ceil(days / 7);

          const itemRef = await itemsRef.add({
            projectId: input.projectId,
            categoryId: categoryId!,
            description: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
            estimatedAmount,
            actualAmount: 0,
            status: 'estimated',
            unit: 'days',
            quantity: days,
            unitRate: dailyRate || weeklyRate / 7,
            linkedEquipmentId: item.id,
            vendor: item.rentalVendor,
            phase: input.phase,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdItems.push(itemRef.id);
        }
      }

      return {
        success: true,
        itemsCreated: createdItems.length,
        itemIds: createdItems,
      };
    }),

  /**
   * Create budget items from locations
   */
  createFromLocations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        locationIds: z.array(z.string()),
        categoryId: z.string().optional(),
        phase: z.enum(['pre-production', 'production', 'post-production', 'wrap', 'other']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create budget items',
        });
      }

      // Get locations
      const locations = await Promise.all(
        input.locationIds.map(async (id) => {
          const doc = await adminDb.collection('locations').doc(id).get();
          if (!doc.exists) return null;
          const data = doc.data()!;
          return { id: doc.id, ...data } as any;
        })
      );

      const validLocations = locations.filter(Boolean);
      if (validLocations.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid locations found' });
      }

      const categoriesRef = adminDb.collection('budgetCategories');
      const itemsRef = adminDb.collection('budgetItems');
      
      // Find or create Locations category (template-aligned)
      let categoryId = input.categoryId;
      if (!categoryId) {
        categoryId = await findOrCreateCategoryForTemplate(
          input.projectId,
          'Locations',
          'production',
          input.phase
        );
      }

      const createdItems: string[] = [];

      for (const location of validLocations) {
        const rentalCost = location.rentalCost || 0;

        const itemRef = await itemsRef.add({
          projectId: input.projectId,
          categoryId: categoryId!,
          description: location.name,
          estimatedAmount: rentalCost,
          actualAmount: 0,
          status: 'estimated',
          linkedLocationId: location.id,
          vendor: location.contactName || location.contactEmail,
          phase: input.phase,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        createdItems.push(itemRef.id);
      }

      return {
        success: true,
        itemsCreated: createdItems.length,
        itemIds: createdItems,
      };
    }),

  /**
   * Create budget items from cast members
   */
  createFromCast: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        castMemberIds: z.array(z.string()),
        categoryId: z.string().optional(),
        phase: z.enum(['pre-production', 'production', 'post-production', 'wrap', 'other']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create budget items',
        });
      }

      // Get cast members
      const castMembers = await Promise.all(
        input.castMemberIds.map(async (id) => {
          const doc = await adminDb.collection('cast').doc(id).get();
          if (!doc.exists) return null;
          const data = doc.data()!;
          return { id: doc.id, ...data } as any;
        })
      );

      const validCastMembers = castMembers.filter(Boolean);
      if (validCastMembers.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid cast members found' });
      }

      const categoriesRef = adminDb.collection('budgetCategories');
      const itemsRef = adminDb.collection('budgetItems');
      
      // Find or create Cast/Talent category
      // Try "Above The Line" first (common in templates), then "Cast/Talent"
      let categoryId = input.categoryId;
      if (!categoryId) {
        // First try to find "Above The Line" category (common template category for cast)
        const aboveTheLine = await categoriesRef
          .where('projectId', '==', input.projectId)
          .where('name', '==', 'Above The Line')
          .limit(1)
          .get();

        if (!aboveTheLine.empty) {
          categoryId = aboveTheLine.docs[0].id;
        } else {
          // Fall back to Cast/Talent category
          categoryId = await findOrCreateCategoryForTemplate(
            input.projectId,
            'Cast/Talent',
            'production',
            input.phase || 'pre-production'
          );
        }
      }

      const createdItems: string[] = [];

      for (const castMember of validCastMembers) {
        const rate = castMember.rate || 0;

        const itemRef = await itemsRef.add({
          projectId: input.projectId,
          categoryId: categoryId!,
          description: `${castMember.actorName} as ${castMember.characterName}`,
          estimatedAmount: rate,
          actualAmount: 0,
          status: 'estimated',
          linkedCastMemberId: castMember.id,
          vendor: castMember.agent,
          phase: input.phase,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        createdItems.push(itemRef.id);
      }

      return {
        success: true,
        itemsCreated: createdItems.length,
        itemIds: createdItems,
      };
    }),

  /**
   * Get budget items linked to a crew member
   */
  getItemsByCrewMember: protectedProcedure
    .input(z.object({ projectId: z.string(), crewMemberId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', input.projectId)
        .where('linkedCrewMemberId', '==', input.crewMemberId)
        .get();

      return itemsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetItem;
      });
    }),

  /**
   * Get budget items linked to equipment
   */
  getItemsByEquipment: protectedProcedure
    .input(z.object({ projectId: z.string(), equipmentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', input.projectId)
        .where('linkedEquipmentId', '==', input.equipmentId)
        .get();

      return itemsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetItem;
      });
    }),

  /**
   * Get budget items linked to a location
   */
  getItemsByLocation: protectedProcedure
    .input(z.object({ projectId: z.string(), locationId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', input.projectId)
        .where('linkedLocationId', '==', input.locationId)
        .get();

      return itemsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetItem;
      });
    }),

  /**
   * Get budget items linked to a cast member
   */
  getItemsByCastMember: protectedProcedure
    .input(z.object({ projectId: z.string(), castMemberId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, [
        'owner',
        'admin',
        'dept_head',
      ]);

      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
      }

      const itemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', input.projectId)
        .where('linkedCastMemberId', '==', input.castMemberId)
        .get();

      return itemsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetItem;
      });
    }),
});


