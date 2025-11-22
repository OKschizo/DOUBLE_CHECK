import { router } from '../trpc';
import { projectsRouter } from './projects';
import { crewRouter } from './crew';
import { castRouter } from './cast';
import { equipmentRouter } from './equipment';
import { projectMembersRouter } from './projectMembers';
import { departmentHeadsRouter } from './departmentHeads';
import { roleRequestsRouter } from './roleRequests';
import { budgetRouter } from './budget';
import { budgetTemplatesRouter } from './budgetTemplates';
import { expensesRouter } from './expenses';
import { budgetFringesRouter } from './budgetFringes';
import { scheduleRouter } from './schedule';
import { locationsRouter } from './locations';
import { crewTemplatesRouter } from './crewTemplates';
import { castTemplatesRouter } from './castTemplates';
import { equipmentTemplatesRouter } from './equipmentTemplates';
import { locationTemplatesRouter } from './locationTemplates';
import { scenesRouter } from './scenes';
import { shotsRouter } from './shots';
import { integrationsRouter } from './integrations';
import { referenceImagesRouter } from './referenceImages';
import { usersRouter } from './users';

export const appRouter = router({
  projects: projectsRouter,
  crew: crewRouter,
  cast: castRouter,
  equipment: equipmentRouter,
  projectMembers: projectMembersRouter,
  departmentHeads: departmentHeadsRouter,
  roleRequests: roleRequestsRouter,
  budget: budgetRouter,
  budgetTemplates: budgetTemplatesRouter,
  expenses: expensesRouter,
  budgetFringes: budgetFringesRouter,
  schedule: scheduleRouter,
  locations: locationsRouter,
  crewTemplates: crewTemplatesRouter,
  castTemplates: castTemplatesRouter,
  equipmentTemplates: equipmentTemplatesRouter,
  locationTemplates: locationTemplatesRouter,
  scenes: scenesRouter,
  shots: shotsRouter,
  integrations: integrationsRouter,
  referenceImages: referenceImagesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;

