import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createCrewTemplateSchema,
  applyCrewTemplateSchema,
  type CrewTemplate,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

// Helper function to generate template IDs
const generateTemplateId = (name: string) => `crew_template_${name.toLowerCase().replace(/\s+/g, '_')}`;

// System templates - defined inline (in production, these would be stored in database)
const defaultCrewTemplates: CrewTemplate[] = [
  {
    id: generateTemplateId('Feature Film Crew Template'),
    name: 'Feature Film Crew Template',
    type: 'film',
    description: 'Comprehensive feature film crew template with all standard positions across all departments',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'production', role: 'Executive Producer', required: false, quantity: 1, defaultRate: 1500 },
      { department: 'production', role: 'Co-Producer', required: false, quantity: 1, defaultRate: 1000 },
      { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 800 },
      { department: 'production', role: 'Production Supervisor', required: false, quantity: 1, defaultRate: 700 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Assistant Production Coordinator', required: false, quantity: 1, defaultRate: 300 },
      { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 800 },
      { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: '2nd 2nd AD', required: false, quantity: 1, defaultRate: 500 },
      { department: 'production', role: 'Script Supervisor', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 3, defaultRate: 250 },
      { department: 'production', role: 'Set PA', required: true, quantity: 2, defaultRate: 250 },
      { department: 'production', role: 'Office PA', required: true, quantity: 2, defaultRate: 250 },
      { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: 'Assistant Location Manager', required: false, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Location Scout', required: false, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Location PA', required: false, quantity: 1, defaultRate: 250 },
      { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 800 },
      { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 500 },
      { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: 'Steadicam Operator', required: false, quantity: 1, defaultRate: 1000 },
      { department: 'camera', role: 'Drone Operator', required: false, quantity: 1, defaultRate: 800 },
      { department: 'camera', role: 'Camera PA', required: false, quantity: 1, defaultRate: 250 },
      { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 3, defaultRate: 450 },
      { department: 'lighting_grip', role: 'Board Operator', required: false, quantity: 1, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Best Boy Grip', required: true, quantity: 1, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Dolly Grip', required: false, quantity: 1, defaultRate: 550 },
      { department: 'lighting_grip', role: 'Grip', required: true, quantity: 3, defaultRate: 450 },
      { department: 'lighting_grip', role: 'Swing', required: false, quantity: 1, defaultRate: 450 },
      { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 700 },
      { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 500 },
      { department: 'sound', role: 'Sound Utility', required: false, quantity: 1, defaultRate: 400 },
      { department: 'sound', role: 'Playback Operator', required: false, quantity: 1, defaultRate: 500 },
      { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'art', role: 'Art Director', required: true, quantity: 1, defaultRate: 800 },
      { department: 'art', role: 'Assistant Art Director', required: false, quantity: 1, defaultRate: 500 },
      { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 700 },
      { department: 'art', role: 'Lead Person', required: true, quantity: 1, defaultRate: 550 },
      { department: 'art', role: 'Set Dresser', required: true, quantity: 2, defaultRate: 500 },
      { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 600 },
      { department: 'art', role: 'Assistant Prop Master', required: false, quantity: 1, defaultRate: 400 },
      { department: 'art', role: 'Prop Builder', required: false, quantity: 1, defaultRate: 450 },
      { department: 'art', role: 'Scenic Artist', required: false, quantity: 1, defaultRate: 500 },
      { department: 'art', role: 'Construction Coordinator', required: false, quantity: 1, defaultRate: 600 },
      { department: 'art', role: 'Carpenter', required: false, quantity: 2, defaultRate: 450 },
      { department: 'art', role: 'Painter', required: false, quantity: 2, defaultRate: 450 },
      { department: 'wardrobe', role: 'Costume Designer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'wardrobe', role: 'Assistant Costume Designer', required: false, quantity: 1, defaultRate: 500 },
      { department: 'wardrobe', role: 'Costume Supervisor', required: true, quantity: 1, defaultRate: 600 },
      { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 500 },
      { department: 'wardrobe', role: 'Set Costumer', required: true, quantity: 1, defaultRate: 450 },
      { department: 'wardrobe', role: 'Costume PA', required: false, quantity: 1, defaultRate: 250 },
      { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 600 },
      { department: 'makeup_hair', role: 'Makeup Artist', required: true, quantity: 1, defaultRate: 500 },
      { department: 'makeup_hair', role: 'SFX Makeup Artist', required: false, quantity: 1, defaultRate: 700 },
      { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 600 },
      { department: 'makeup_hair', role: 'Hairstylist', required: true, quantity: 1, defaultRate: 500 },
      { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 500 },
      { department: 'transportation', role: 'Transportation Captain', required: false, quantity: 1, defaultRate: 450 },
      { department: 'transportation', role: 'Driver', required: true, quantity: 2, defaultRate: 350 },
      { department: 'transportation', role: 'Picture Car Coordinator', required: false, quantity: 1, defaultRate: 500 },
      { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 400 },
      { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },
      { department: 'stunts', role: 'Stunt Coordinator', required: false, quantity: 1, defaultRate: 1000 },
      { department: 'stunts', role: 'Stunt Performer', required: false, quantity: 2, defaultRate: 800 },
      { department: 'stunts', role: 'Stunt Rigger', required: false, quantity: 1, defaultRate: 600 },
      { department: 'stunts', role: 'Safety Officer', required: false, quantity: 1, defaultRate: 500 },
      { department: 'vfx', role: 'VFX Supervisor', required: false, quantity: 1, defaultRate: 1200 },
      { department: 'vfx', role: 'VFX Producer', required: false, quantity: 1, defaultRate: 1000 },
      { department: 'vfx', role: 'On-Set VFX Supervisor', required: false, quantity: 1, defaultRate: 1000 },
      { department: 'vfx', role: 'VFX PA', required: false, quantity: 1, defaultRate: 250 },
      { department: 'other', role: 'Unit Publicist', required: false, quantity: 1, defaultRate: 500 },
      { department: 'other', role: 'Still Photographer', required: false, quantity: 1, defaultRate: 600 },
      { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 500 },
      { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 400 },
      { department: 'other', role: 'Security', required: false, quantity: 1, defaultRate: 300 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Commercial Production Crew Template'),
    name: 'Commercial Production Crew Template',
    type: 'commercial',
    description: 'Standard commercial/agency production crew template - streamlined for shorter shoots',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 2500 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 1800 },
      { department: 'production', role: 'Executive Producer', required: false, quantity: 1, defaultRate: 2000 },
      { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 900 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 500 },
      { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 900 },
      { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 700 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 2, defaultRate: 300 },
      { department: 'production', role: 'Set PA', required: true, quantity: 1, defaultRate: 300 },
      { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 700 },
      { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'camera', role: 'Camera Operator', required: false, quantity: 1, defaultRate: 900 },
      { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 700 },
      { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 2, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Grip', required: true, quantity: 2, defaultRate: 500 },
      { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 800 },
      { department: 'art', role: 'Set Dresser', required: true, quantity: 1, defaultRate: 550 },
      { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 700 },
      { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'transportation', role: 'Driver', required: true, quantity: 1, defaultRate: 400 },
      { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 500 },
      { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 400 },
      { department: 'other', role: 'Still Photographer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 500 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Documentary Production Crew Template'),
    name: 'Documentary Production Crew Template',
    type: 'documentary',
    description: 'Streamlined documentary crew template - smaller, mobile crew for run-and-gun production',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 1, defaultRate: 250 },
      { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 800 },
      { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 500 },
      { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 400 },
      { department: 'other', role: 'Fixer', required: false, quantity: 1, notes: 'Local production assistant/coordinator for location', defaultRate: 300 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Episodic/Series Crew Template'),
    name: 'Episodic/Series Crew Template',
    type: 'episodic',
    description: 'Comprehensive episodic television/series crew template - similar to film but optimized for multi-episode production',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Showrunner', required: true, quantity: 1, defaultRate: 3000 },
      { department: 'production', role: 'Executive Producer', required: true, quantity: 1, defaultRate: 2500 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 2000 },
      { department: 'production', role: 'Director', required: true, quantity: 1, notes: 'Per episode', defaultRate: 2000 },
      { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 700 },
      { department: 'production', role: 'Script Supervisor', required: true, quantity: 1, defaultRate: 700 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 3, defaultRate: 250 },
      { department: 'production', role: 'Set PA', required: true, quantity: 2, defaultRate: 250 },
      { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 800 },
      { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 700 },
      { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 3, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 700 },
      { department: 'lighting_grip', role: 'Best Boy Grip', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Grip', required: true, quantity: 3, defaultRate: 500 },
      { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'art', role: 'Art Director', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 800 },
      { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 700 },
      { department: 'wardrobe', role: 'Costume Designer', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'wardrobe', role: 'Costume Supervisor', required: true, quantity: 1, defaultRate: 800 },
      { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 700 },
      { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 500 },
      { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 500 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Music Video Crew Template'),
    name: 'Music Video Crew Template',
    type: 'music_video',
    description: 'Music video production crew template - creative, fast-paced, often single-day shoots',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 1500 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
      { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 2, defaultRate: 250 },
      { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 500 },
      { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1000 },
      { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 500 },
      { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 400 },
      { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 500 },
      { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 2, defaultRate: 400 },
      { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Grip', required: true, quantity: 2, defaultRate: 400 },
      { department: 'sound', role: 'Playback Operator', required: true, quantity: 1, notes: 'Critical for music video - plays track for performance', defaultRate: 500 },
      { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 600 },
      { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 500 },
      { department: 'wardrobe', role: 'Costume Designer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 500 },
      { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 600 },
      { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 600 },
      { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 500 },
      { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 400 },
      { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },
      { department: 'other', role: 'Still Photographer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 400 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateTemplateId('Photoshoot Crew Template'),
    name: 'Photoshoot Crew Template',
    type: 'photoshoot',
    description: 'Photoshoot production crew template - fashion, commercial, editorial, and product photography',
    isPublic: true,
    positions: [
      { department: 'production', role: 'Photographer', required: true, quantity: 1, defaultRate: 1200 },
      { department: 'production', role: 'Assistant Photographer', required: true, quantity: 1, defaultRate: 500 },
      { department: 'production', role: 'Digital Tech', required: true, quantity: 1, defaultRate: 600 },
      { department: 'production', role: 'Photo Assistant', required: true, quantity: 1, defaultRate: 250 },
      { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 800 },
      { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
      { department: 'production', role: 'Production Assistant', required: true, quantity: 1, defaultRate: 250 },
      { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 1, defaultRate: 450 },
      { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
      { department: 'lighting_grip', role: 'Grip', required: true, quantity: 1, defaultRate: 450 },
      { department: 'wardrobe', role: 'Stylist', required: true, quantity: 1, defaultRate: 800 },
      { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 700 },
      { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const crewTemplatesRouter = router({
  /**
   * Get all available crew templates (system + user templates)
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Get system templates
    const systemTemplates = defaultCrewTemplates;

    // Get user-created templates
    const userTemplatesSnapshot = await adminDb
      .collection('crewTemplates')
      .where('createdBy', '==', ctx.user.id)
      .get();

    const userTemplates = userTemplatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewTemplate;
    });

    return [...systemTemplates, ...userTemplates];
  }),

  /**
   * Get a single crew template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check system templates first
      const systemTemplate = defaultCrewTemplates.find((t) => t.id === input.id);
      if (systemTemplate) {
        return systemTemplate;
      }

      // Check user templates
      const docRef = adminDb.collection('crewTemplates').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const data = doc.data()!;
      
      // Only return if it's public or created by the user
      if (!data.isPublic && data.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this template' });
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CrewTemplate;
    }),

  /**
   * Create a custom crew template
   */
  create: protectedProcedure
    .input(createCrewTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('crewTemplates').doc();

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
      } as CrewTemplate;
    }),

  /**
   * Apply a crew template to a project
   */
  applyTemplate: protectedProcedure
    .input(applyCrewTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check access
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can apply crew templates',
        });
      }

      // Get template
      let template: CrewTemplate | undefined;
      
      // Check system templates first
      template = defaultCrewTemplates.find((t) => t.id === input.templateId);
      
      // If not found, check user templates
      if (!template) {
        const templateDoc = await adminDb.collection('crewTemplates').doc(input.templateId).get();
        if (templateDoc.exists) {
          const data = templateDoc.data()!;
          if (data.isPublic || data.createdBy === ctx.user.id) {
            template = {
              id: templateDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as CrewTemplate;
          }
        }
      }

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      // Get existing crew members to check for duplicates
      const existingCrewSnapshot = await adminDb
        .collection('crew')
        .where('projectId', '==', input.projectId)
        .get();

      const existingCrew = existingCrewSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          department: data.department,
          role: data.role,
        };
      });

      // Create a set of existing department+role combinations
      const existingPositions = new Set(
        existingCrew.map((c) => `${c.department}:${c.role}`)
      );

      const crewRef = adminDb.collection('crew');
      const createdPositions: string[] = [];
      const skippedPositions: string[] = [];

      // Create crew members for each position in template
      for (const position of template.positions) {
        // Create multiple crew members if quantity > 1
        for (let i = 0; i < position.quantity; i++) {
          const positionKey = `${position.department}:${position.role}`;
          
          // Check if we should skip existing positions
          if (input.skipExisting && existingPositions.has(positionKey)) {
            skippedPositions.push(`${position.role} (${position.department})`);
            continue;
          }

          // Check if we should overwrite
          if (input.overwriteExisting && existingPositions.has(positionKey)) {
            // Find and update existing crew member
            const existing = existingCrew.find(
              (c) => c.department === position.department && c.role === position.role
            );
            if (existing) {
              await adminDb.collection('crew').doc(existing.id).update({
                department: position.department,
                role: position.role,
                updatedAt: FieldValue.serverTimestamp(),
              });
              createdPositions.push(`${position.role} (${position.department})`);
              continue;
            }
          }

          // Create new crew member
          const docRef = await crewRef.add({
            projectId: input.projectId,
            department: position.department,
            role: position.role,
            name: '', // Empty name - user will fill in
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          createdPositions.push(`${position.role} (${position.department})`);
          existingPositions.add(positionKey); // Add to set to prevent duplicates in same batch
        }
      }

      return {
        success: true,
        positionsCreated: createdPositions.length,
        positionsSkipped: skippedPositions.length,
        createdPositions,
        skippedPositions,
      };
    }),
});

