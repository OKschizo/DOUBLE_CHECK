import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createEquipmentTemplateSchema,
  applyEquipmentTemplateSchema,
  type EquipmentTemplate,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

const generateTemplateId = (name: string) => `equipment_template_${name.toLowerCase().replace(/\s+/g, '_')}`;

const defaultEquipmentTemplates: EquipmentTemplate[] = [
  {
    id: generateTemplateId('Feature Film Equipment Template'),
    name: 'Feature Film Equipment Template',
    type: 'film',
    description: 'Comprehensive feature film equipment template with all standard gear',
    isPublic: true,
    items: [
      { name: 'RED Camera', category: 'camera', quantity: 1, required: true, source: 'rental' },
      { name: 'Prime Lens Set', category: 'lenses', quantity: 1, required: true, source: 'rental' },
      { name: 'Zoom Lens', category: 'lenses', quantity: 1, required: true, source: 'rental' },
      { name: 'LED Panel Kit', category: 'lighting', quantity: 1, required: true, source: 'rental' },
      { name: 'Tungsten Kit', category: 'lighting', quantity: 1, required: false, source: 'rental' },
      { name: 'Boom Mic', category: 'audio', quantity: 1, required: true, source: 'rental' },
      { name: 'Wireless Lavalier', category: 'audio', quantity: 2, required: true, source: 'rental' },
      { name: 'C-Stand', category: 'grip', quantity: 6, required: true, source: 'rental' },
      { name: 'Sandbag', category: 'grip', quantity: 12, required: true, source: 'rental' },
      { name: 'Generator', category: 'power', quantity: 1, required: true, source: 'rental' },
      { name: 'Monitor', category: 'monitors', quantity: 2, required: true, source: 'rental' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Commercial Equipment Template'),
    name: 'Commercial Equipment Template',
    type: 'commercial',
    description: 'Streamlined commercial equipment template',
    isPublic: true,
    items: [
      { name: 'Cinema Camera', category: 'camera', quantity: 1, required: true, source: 'rental' },
      { name: 'Lens Set', category: 'lenses', quantity: 1, required: true, source: 'rental' },
      { name: 'LED Lighting Kit', category: 'lighting', quantity: 1, required: true, source: 'rental' },
      { name: 'Audio Kit', category: 'audio', quantity: 1, required: true, source: 'rental' },
      { name: 'Basic Grip Package', category: 'grip', quantity: 1, required: true, source: 'rental' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Documentary Equipment Template'),
    name: 'Documentary Equipment Template',
    type: 'documentary',
    description: 'Lightweight, mobile documentary equipment template',
    isPublic: true,
    items: [
      { name: 'DSLR/Mirrorless Camera', category: 'camera', quantity: 1, required: true, source: 'owned' },
      { name: 'Zoom Lens', category: 'lenses', quantity: 1, required: true, source: 'owned' },
      { name: 'LED Light', category: 'lighting', quantity: 1, required: false, source: 'owned' },
      { name: 'Shotgun Mic', category: 'audio', quantity: 1, required: true, source: 'owned' },
      { name: 'Wireless Lavalier', category: 'audio', quantity: 1, required: true, source: 'owned' },
      { name: 'Tripod', category: 'grip', quantity: 1, required: true, source: 'owned' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const equipmentTemplatesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const systemTemplates = defaultEquipmentTemplates;

    const userTemplatesSnapshot = await adminDb
      .collection('equipmentTemplates')
      .where('createdBy', '==', ctx.user.id)
      .get();

    const userTemplates = userTemplatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EquipmentTemplate;
    });

    return [...systemTemplates, ...userTemplates];
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const systemTemplate = defaultEquipmentTemplates.find((t) => t.id === input.id);
      if (systemTemplate) {
        return systemTemplate;
      }

      const docRef = adminDb.collection('equipmentTemplates').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const data = doc.data()!;
      
      if (!data.isPublic && data.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this template' });
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EquipmentTemplate;
    }),

  create: protectedProcedure
    .input(createEquipmentTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('equipmentTemplates').doc();

      await docRef.set({
        ...input,
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...input,
        createdBy: ctx.user.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EquipmentTemplate;
    }),

  applyTemplate: protectedProcedure
    .input(applyEquipmentTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can apply equipment templates',
        });
      }

      let template: EquipmentTemplate | undefined;
      
      template = defaultEquipmentTemplates.find((t) => t.id === input.templateId);
      
      if (!template) {
        const templateDoc = await adminDb.collection('equipmentTemplates').doc(input.templateId).get();
        if (templateDoc.exists) {
          const data = templateDoc.data()!;
          if (data.isPublic || data.createdBy === ctx.user.id) {
            template = {
              id: templateDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as EquipmentTemplate;
          }
        }
      }

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const existingEquipmentSnapshot = await adminDb
        .collection('equipment')
        .where('projectId', '==', input.projectId)
        .get();

      const existingEquipment = existingEquipmentSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
        };
      });

      const existingItems = new Set(
        existingEquipment.map((e) => `${e.name}:${e.category}`)
      );

      const equipmentRef = adminDb.collection('equipment');
      const createdItems: string[] = [];
      const skippedItems: string[] = [];

      for (const item of template.items) {
        for (let i = 0; i < item.quantity; i++) {
          const itemKey = `${item.name}:${item.category}`;
          
          if (input.skipExisting && existingItems.has(itemKey)) {
            skippedItems.push(`${item.name} (${item.category})`);
            continue;
          }

          if (input.overwriteExisting && existingItems.has(itemKey)) {
            const existing = existingEquipment.find(
              (e) => e.name === item.name && e.category === item.category
            );
            if (existing) {
              await adminDb.collection('equipment').doc(existing.id).update({
                name: item.name,
                category: item.category,
                source: item.source,
                updatedAt: FieldValue.serverTimestamp(),
              });
              createdItems.push(`${item.name} (${item.category})`);
              continue;
            }
          }

          const docRef = await equipmentRef.add({
            projectId: input.projectId,
            name: item.name,
            category: item.category,
            quantity: 1,
            quantityAvailable: 1,
            status: 'available',
            source: item.source,
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdItems.push(`${item.name} (${item.category})`);
          existingItems.add(itemKey);
        }
      }

      return {
        success: true,
        itemsCreated: createdItems.length,
        itemsSkipped: skippedItems.length,
        createdItems,
        skippedItems,
      };
    }),
});

