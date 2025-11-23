import { z } from 'zod';

export const scheduleEventTypeSchema = z.enum([
  'scene',
  'break',
  'move',
  'prep',
  'wrap',
  'other',
]);

export const shootingDaySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.coerce.date(),
  dayNumber: z.number().int().positive().optional(), // e.g. Day 1, Day 2
  totalDays: z.number().int().positive().optional(), // Total number of shooting days (for "Day X of Y")
  callTime: z.string().optional(), // HH:MM - Crew Call
  shootCall: z.string().optional(), // HH:MM - Shoot Call
  breakfast: z.string().optional(), // HH:MM
  lunch: z.string().optional(), // HH:MM
  location: z.string().optional(),
  // Location details (stored as location IDs)
  locationId: z.string().optional(), // Primary location
  basecampLocationId: z.string().optional(),
  crewParkLocationId: z.string().optional(),
  techTrucksLocationId: z.string().optional(),
  bgHoldingLocationId: z.string().optional(),
  bgParkingLocationId: z.string().optional(),
  nearestHospital: z.string().optional(), // Keep as text since it's not a project location
  // Key contacts (stored as crew member IDs)
  directorCrewId: z.string().optional(),
  executiveProducerCrewId: z.string().optional(),
  productionCoordinatorCrewId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const scheduleEventSchema = z.object({
  id: z.string(),
  shootingDayId: z.string(),
  projectId: z.string(),
  type: scheduleEventTypeSchema,
  time: z.string().optional(), // HH:MM
  duration: z.number().min(0).optional(), // in minutes
  description: z.string().min(1, 'Description is required'),
  sceneNumber: z.string().optional(),
  sceneId: z.string().optional(), // Link to scene when scenes module exists
  shotId: z.string().optional(), // Link to shot
  pageCount: z.string().optional(), // e.g. "1/8", "3 4/8"
  location: z.string().optional(),
  locationId: z.string().optional(), // Link to location
  castIds: z.array(z.string()).optional(), // IDs of cast members in scene
  crewIds: z.array(z.string()).optional(), // IDs of crew members required for this event
  equipmentIds: z.array(z.string()).optional(), // IDs of equipment needed for this event
  storyboardIds: z.array(z.string()).optional(), // IDs of storyboards associated with this event
  notes: z.string().optional(), // Additional notes
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createShootingDaySchema = shootingDaySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShootingDaySchema = shootingDaySchema
  .omit({
    id: true,
    projectId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const createScheduleEventSchema = scheduleEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  order: true, // Order is set by backend automatically
});

export const updateScheduleEventSchema = scheduleEventSchema
  .omit({
    id: true,
    projectId: true,
    shootingDayId: true, // Moving events between days handles via update but restricted for now
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .extend({
    shootingDayId: z.string().optional(), // Allow moving events
  });

export type ShootingDay = z.infer<typeof shootingDaySchema>;
export type ScheduleEvent = z.infer<typeof scheduleEventSchema>;
export type ScheduleEventType = z.infer<typeof scheduleEventTypeSchema>;
export type CreateShootingDayInput = z.infer<typeof createShootingDaySchema>;
export type UpdateShootingDayInput = z.infer<typeof updateShootingDaySchema>;
export type CreateScheduleEventInput = z.infer<typeof createScheduleEventSchema>;
export type UpdateScheduleEventInput = z.infer<typeof updateScheduleEventSchema>;


