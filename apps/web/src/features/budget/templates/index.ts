import { filmTemplate } from './filmTemplate';
import { commercialTemplate } from './commercialTemplate';
import { documentaryTemplate } from './documentaryTemplate';
import { episodicTemplate } from './episodicTemplate';
import { musicVideoTemplate } from './musicVideoTemplate';
import { photoshootTemplate } from './photoshootTemplate';
import type { BudgetTemplate } from '@doublecheck/schemas';

// Generate IDs for templates (in real implementation, these would come from database)
const generateTemplateId = (name: string) => `template_${name.toLowerCase().replace(/\s+/g, '_')}`;

export const defaultTemplates: BudgetTemplate[] = [
  {
    ...filmTemplate,
    id: generateTemplateId(filmTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...commercialTemplate,
    id: generateTemplateId(commercialTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...documentaryTemplate,
    id: generateTemplateId(documentaryTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...episodicTemplate,
    id: generateTemplateId(episodicTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...musicVideoTemplate,
    id: generateTemplateId(musicVideoTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...photoshootTemplate,
    id: generateTemplateId(photoshootTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as any;

export function getTemplateByType(type: BudgetTemplate['type']): BudgetTemplate | undefined {
  return defaultTemplates.find(t => t.type === type);
}

export function getAllTemplates(): BudgetTemplate[] {
  return defaultTemplates;
}

