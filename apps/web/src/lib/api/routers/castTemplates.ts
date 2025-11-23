import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createCastTemplateSchema,
  applyCastTemplateSchema,
  type CastTemplate,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

// Helper function to generate template IDs
const generateTemplateId = (name: string) => `cast_template_${name.toLowerCase().replace(/\s+/g, '_')}`;

// System templates - defined inline
const defaultCastTemplates: CastTemplate[] = [
  {
    id: generateTemplateId('Feature Film Cast Template'),
    name: 'Feature Film Cast Template',
    type: 'film',
    description: 'Standard feature film cast structure with lead, supporting, and featured roles',
    isPublic: true,
    roles: [
      { characterName: 'Lead Character', castType: 'lead', required: true, quantity: 1 },
      { characterName: 'Supporting Character', castType: 'supporting', required: true, quantity: 1 },
      { characterName: 'Featured Character', castType: 'featured', required: false, quantity: 1 },
      { characterName: 'Extra/Background', castType: 'extra', required: false, quantity: 10 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Commercial Cast Template'),
    name: 'Commercial Cast Template',
    type: 'commercial',
    description: 'Streamlined commercial cast template - typically 1-3 talent',
    isPublic: true,
    roles: [
      { characterName: 'Talent', castType: 'lead', required: true, quantity: 1 },
      { characterName: 'Supporting Talent', castType: 'supporting', required: false, quantity: 1 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Documentary Cast Template'),
    name: 'Documentary Cast Template',
    type: 'documentary',
    description: 'Documentary cast template - interview subjects and participants',
    isPublic: true,
    roles: [
      { characterName: 'Interview Subject', castType: 'lead', required: true, quantity: 1 },
      { characterName: 'Supporting Subject', castType: 'supporting', required: false, quantity: 3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const castTemplatesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const systemTemplates = defaultCastTemplates;

    const userTemplatesSnapshot = await adminDb
      .collection('castTemplates')
      .where('createdBy', '==', ctx.user.id)
      .get();

    const userTemplates = userTemplatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CastTemplate;
    });

    return [...systemTemplates, ...userTemplates];
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const systemTemplate = defaultCastTemplates.find((t) => t.id === input.id);
      if (systemTemplate) {
        return systemTemplate;
      }

      const docRef = adminDb.collection('castTemplates').doc(input.id);
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
      } as CastTemplate;
    }),

  create: protectedProcedure
    .input(createCastTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('castTemplates').doc();

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
      } as CastTemplate;
    }),

  applyTemplate: protectedProcedure
    .input(applyCastTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can apply cast templates',
        });
      }

      let template: CastTemplate | undefined;
      
      template = defaultCastTemplates.find((t) => t.id === input.templateId);
      
      if (!template) {
        const templateDoc = await adminDb.collection('castTemplates').doc(input.templateId).get();
        if (templateDoc.exists) {
          const data = templateDoc.data()!;
          if (data.isPublic || data.createdBy === ctx.user.id) {
            template = {
              id: templateDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as CastTemplate;
          }
        }
      }

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const existingCastSnapshot = await adminDb
        .collection('cast')
        .where('projectId', '==', input.projectId)
        .get();

      const existingCast = existingCastSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          characterName: data.characterName,
          castType: data.castType,
        };
      });

      const existingRoles = new Set(
        existingCast.map((c) => `${c.characterName}:${c.castType}`)
      );

      const castRef = adminDb.collection('cast');
      const createdRoles: string[] = [];
      const skippedRoles: string[] = [];

      for (const role of template.roles) {
        for (let i = 0; i < role.quantity; i++) {
          const roleKey = `${role.characterName}:${role.castType}`;
          
          if (input.skipExisting && existingRoles.has(roleKey)) {
            skippedRoles.push(`${role.characterName} (${role.castType})`);
            continue;
          }

          if (input.overwriteExisting && existingRoles.has(roleKey)) {
            const existing = existingCast.find(
              (c) => c.characterName === role.characterName && c.castType === role.castType
            );
            if (existing) {
              await adminDb.collection('cast').doc(existing.id).update({
                characterName: role.characterName,
                castType: role.castType,
                updatedAt: FieldValue.serverTimestamp(),
              });
              createdRoles.push(`${role.characterName} (${role.castType})`);
              continue;
            }
          }

          const docRef = await castRef.add({
            projectId: input.projectId,
            actorName: '', // Empty - user will fill in
            characterName: role.characterName,
            castType: role.castType,
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdRoles.push(`${role.characterName} (${role.castType})`);
          existingRoles.add(roleKey);
        }
      }

      return {
        success: true,
        rolesCreated: createdRoles.length,
        rolesSkipped: skippedRoles.length,
        createdRoles,
        skippedRoles,
      };
    }),
});

