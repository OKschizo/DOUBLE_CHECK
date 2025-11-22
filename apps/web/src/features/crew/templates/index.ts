import { filmCrewTemplate } from './filmCrewTemplate';
import { commercialCrewTemplate } from './commercialCrewTemplate';
import { documentaryCrewTemplate } from './documentaryCrewTemplate';
import { episodicCrewTemplate } from './episodicCrewTemplate';
import { musicVideoCrewTemplate } from './musicVideoCrewTemplate';
import { photoshootCrewTemplate } from './photoshootCrewTemplate';
import type { CrewTemplate } from '@doublecheck/schemas';

// Generate IDs for templates
const generateTemplateId = (name: string) => `crew_template_${name.toLowerCase().replace(/\s+/g, '_')}`;

export const defaultCrewTemplates: CrewTemplate[] = [
  {
    ...filmCrewTemplate,
    id: generateTemplateId(filmCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...commercialCrewTemplate,
    id: generateTemplateId(commercialCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...documentaryCrewTemplate,
    id: generateTemplateId(documentaryCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...episodicCrewTemplate,
    id: generateTemplateId(episodicCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...musicVideoCrewTemplate,
    id: generateTemplateId(musicVideoCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    ...photoshootCrewTemplate,
    id: generateTemplateId(photoshootCrewTemplate.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getCrewTemplateByType(type: CrewTemplate['type']): CrewTemplate | undefined {
  return defaultCrewTemplates.find(t => t.type === type);
}

export function getAllCrewTemplates(): CrewTemplate[] {
  return defaultCrewTemplates;
}

