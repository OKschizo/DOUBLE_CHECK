import type { CrewTemplate } from '@/lib/schemas';

export const filmCrewTemplate: Omit<CrewTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Feature Film Crew Template',
  type: 'film',
  description: 'Comprehensive feature film crew template with all standard positions across all departments',
  isPublic: true,
  positions: [
    // Above The Line / Production
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

    // Camera Department
    { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: 'Steadicam Operator', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'camera', role: 'Drone Operator', required: false, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: 'Camera PA', required: false, quantity: 1, defaultRate: 250 },

    // Lighting & Grip
    { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 3, defaultRate: 450 },
    { department: 'lighting_grip', role: 'Board Operator', required: false, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Best Boy Grip', required: true, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Dolly Grip', required: false, quantity: 1, defaultRate: 550 },
    { department: 'lighting_grip', role: 'Grip', required: true, quantity: 3, defaultRate: 450 },
    { department: 'lighting_grip', role: 'Swing', required: false, quantity: 1, defaultRate: 450 },

    // Sound Department
    { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 700 },
    { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 500 },
    { department: 'sound', role: 'Sound Utility', required: false, quantity: 1, defaultRate: 400 },
    { department: 'sound', role: 'Playback Operator', required: false, quantity: 1, defaultRate: 500 },

    // Art Department
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

    // Wardrobe
    { department: 'wardrobe', role: 'Costume Designer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'wardrobe', role: 'Assistant Costume Designer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'wardrobe', role: 'Costume Supervisor', required: true, quantity: 1, defaultRate: 600 },
    { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 500 },
    { department: 'wardrobe', role: 'Set Costumer', required: true, quantity: 1, defaultRate: 450 },
    { department: 'wardrobe', role: 'Costume PA', required: false, quantity: 1, defaultRate: 250 },

    // Hair & Makeup
    { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Makeup Artist', required: true, quantity: 1, defaultRate: 500 },
    { department: 'makeup_hair', role: 'SFX Makeup Artist', required: false, quantity: 1, defaultRate: 700 },
    { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Hairstylist', required: true, quantity: 1, defaultRate: 500 },

    // Transportation
    { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 500 },
    { department: 'transportation', role: 'Transportation Captain', required: false, quantity: 1, defaultRate: 450 },
    { department: 'transportation', role: 'Driver', required: true, quantity: 2, defaultRate: 350 },
    { department: 'transportation', role: 'Picture Car Coordinator', required: false, quantity: 1, defaultRate: 500 },

    // Catering
    { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 400 },
    { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },

    // Stunts (if needed)
    { department: 'stunts', role: 'Stunt Coordinator', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'stunts', role: 'Stunt Performer', required: false, quantity: 2, defaultRate: 800 },
    { department: 'stunts', role: 'Stunt Rigger', required: false, quantity: 1, defaultRate: 600 },
    { department: 'stunts', role: 'Safety Officer', required: false, quantity: 1, defaultRate: 500 },

    // VFX (if needed)
    { department: 'vfx', role: 'VFX Supervisor', required: false, quantity: 1, defaultRate: 1200 },
    { department: 'vfx', role: 'VFX Producer', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'vfx', role: 'On-Set VFX Supervisor', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'vfx', role: 'VFX PA', required: false, quantity: 1, defaultRate: 250 },

    // Other
    { department: 'other', role: 'Unit Publicist', required: false, quantity: 1, defaultRate: 500 },
    { department: 'other', role: 'Still Photographer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 400 },
    { department: 'other', role: 'Security', required: false, quantity: 1, defaultRate: 300 },
  ],
};

