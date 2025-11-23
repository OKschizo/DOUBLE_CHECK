import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createLocationTemplateSchema,
  applyLocationTemplateSchema,
  type LocationTemplate,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

const generateTemplateId = (name: string) => `location_template_${name.toLowerCase().replace(/\s+/g, '_')}`;

const defaultLocationTemplates: LocationTemplate[] = [
  {
    id: generateTemplateId('Feature Film Locations Template'),
    name: 'Feature Film Locations Template',
    type: 'film',
    description: 'Standard feature film location types',
    isPublic: true,
    locations: [
      { name: 'Main Location', type: 'interior', required: true, quantity: 1 },
      { name: 'Exterior Location', type: 'exterior', required: true, quantity: 1 },
      { name: 'Studio Stage', type: 'studio', required: false, quantity: 1 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Commercial Locations Template'),
    name: 'Commercial Locations Template',
    type: 'commercial',
    description: 'Commercial production location types',
    isPublic: true,
    locations: [
      { name: 'Primary Location', type: 'interior', required: true, quantity: 1 },
      { name: 'B-Roll Location', type: 'exterior', required: false, quantity: 1 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Documentary Locations Template'),
    name: 'Documentary Locations Template',
    type: 'documentary',
    description: 'Documentary location types',
    isPublic: true,
    locations: [
      { name: 'Interview Location', type: 'interior', required: true, quantity: 1 },
      { name: 'B-Roll Location', type: 'exterior', required: false, quantity: 3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const locationTemplatesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const systemTemplates = defaultLocationTemplates;

    const userTemplatesSnapshot = await adminDb
      .collection('locationTemplates')
      .where('createdBy', '==', ctx.user.id)
      .get();

    const userTemplates = userTemplatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as LocationTemplate;
    });

    return [...systemTemplates, ...userTemplates];
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const systemTemplate = defaultLocationTemplates.find((t) => t.id === input.id);
      if (systemTemplate) {
        return systemTemplate;
      }

      const docRef = adminDb.collection('locationTemplates').doc(input.id);
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
      } as LocationTemplate;
    }),

  create: protectedProcedure
    .input(createLocationTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('locationTemplates').doc();

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
      } as LocationTemplate;
    }),

  applyTemplate: protectedProcedure
    .input(applyLocationTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can apply location templates',
        });
      }

      let template: LocationTemplate | undefined;
      
      template = defaultLocationTemplates.find((t) => t.id === input.templateId);
      
      if (!template) {
        const templateDoc = await adminDb.collection('locationTemplates').doc(input.templateId).get();
        if (templateDoc.exists) {
          const data = templateDoc.data()!;
          if (data.isPublic || data.createdBy === ctx.user.id) {
            template = {
              id: templateDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LocationTemplate;
          }
        }
      }

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const existingLocationsSnapshot = await adminDb
        .collection('locations')
        .where('projectId', '==', input.projectId)
        .get();

      const existingLocations = existingLocationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
        };
      });

      const existingLocationNames = new Set(
        existingLocations.map((l) => l.name)
      );

      const locationsRef = adminDb.collection('locations');
      const createdLocations: string[] = [];
      const skippedLocations: string[] = [];

      for (const location of template.locations) {
        for (let i = 0; i < location.quantity; i++) {
          const locationName = location.quantity > 1 
            ? `${location.name} ${i + 1}` 
            : location.name;
          
          if (input.skipExisting && existingLocationNames.has(locationName)) {
            skippedLocations.push(locationName);
            continue;
          }

          if (input.overwriteExisting && existingLocationNames.has(locationName)) {
            const existing = existingLocations.find((l) => l.name === locationName);
            if (existing) {
              await adminDb.collection('locations').doc(existing.id).update({
                name: locationName,
                type: location.type,
                updatedAt: FieldValue.serverTimestamp(),
              });
              createdLocations.push(locationName);
              continue;
            }
          }

          const docRef = await locationsRef.add({
            projectId: input.projectId,
            name: locationName,
            address: '',
            type: location.type,
            status: 'scouted',
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdLocations.push(locationName);
          existingLocationNames.add(locationName);
        }
      }

      return {
        success: true,
        locationsCreated: createdLocations.length,
        locationsSkipped: skippedLocations.length,
        createdLocations,
        skippedLocations,
      };
    }),
});

