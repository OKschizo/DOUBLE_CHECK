import type { CrewTemplate } from '@doublecheck/schemas';

export const photoshootCrewTemplate: Omit<CrewTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Photoshoot Crew Template',
  type: 'photoshoot',
  description: 'Photoshoot production crew template - fashion, commercial, editorial, and product photography',
  isPublic: true,
  positions: [
    // Creative Team
    { department: 'production', role: 'Photographer', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'production', role: 'Assistant Photographer', required: true, quantity: 1, defaultRate: 500 },
    { department: 'production', role: 'Digital Tech', required: true, quantity: 1, defaultRate: 600 },
    { department: 'production', role: 'Photo Assistant', required: true, quantity: 1, defaultRate: 250 },
    { department: 'production', role: 'Art Director', required: false, quantity: 1, defaultRate: 800 },
    { department: 'production', role: 'Creative Director', required: false, quantity: 1, defaultRate: 1500 },
    { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
    { department: 'production', role: 'Production Assistant', required: true, quantity: 1, defaultRate: 250 },
    { department: 'production', role: 'Location Manager', required: false, quantity: 1, defaultRate: 500 },
    { department: 'production', role: 'Location Scout', required: false, quantity: 1, defaultRate: 400 },

    // Camera & Equipment (minimal - photographer handles)
    { department: 'camera', role: 'Camera Operator', required: false, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: '1st AC', required: false, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: 'DIT', required: false, quantity: 1, defaultRate: 500 },

    // Lighting & Grip
    { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Best Boy Electric', required: false, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 1, defaultRate: 450 },
    { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Grip', required: true, quantity: 1, defaultRate: 450 },

    // Sound (usually not needed for photoshoots)
    { department: 'sound', role: 'Production Sound Mixer', required: false, quantity: 1, notes: 'Only if video component', defaultRate: 600 },

    // Art Department
    { department: 'art', role: 'Production Designer', required: false, quantity: 1, defaultRate: 800 },
    { department: 'art', role: 'Set Decorator', required: false, quantity: 1, defaultRate: 600 },
    { department: 'art', role: 'Prop Master', required: false, quantity: 1, defaultRate: 500 },
    { department: 'art', role: 'Set Dresser', required: false, quantity: 1, defaultRate: 450 },

    // Styling Team
    { department: 'wardrobe', role: 'Stylist', required: true, quantity: 1, defaultRate: 800 },
    { department: 'wardrobe', role: 'Assistant Stylist', required: false, quantity: 1, defaultRate: 400 },
    { department: 'wardrobe', role: 'Wardrobe Assistant', required: false, quantity: 1, defaultRate: 250 },

    // Hair & Makeup
    { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 700 },
    { department: 'makeup_hair', role: 'Makeup Artist', required: false, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 700 },
    { department: 'makeup_hair', role: 'Hairstylist', required: false, quantity: 1, defaultRate: 600 },

    // Transportation
    { department: 'transportation', role: 'Transportation Coordinator', required: false, quantity: 1, defaultRate: 500 },
    { department: 'transportation', role: 'Driver', required: false, quantity: 1, defaultRate: 300 },

    // Catering
    { department: 'catering', role: 'Caterer', required: false, quantity: 1, defaultRate: 400 },
    { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },

    // Other
    { department: 'other', role: 'Still Photographer', required: false, quantity: 1, notes: 'BTS photographer if main photographer is different', defaultRate: 500 },
    { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'other', role: 'Retoucher', required: false, quantity: 1, notes: 'On-set or post-production', defaultRate: 600 },
    { department: 'other', role: 'Medic', required: false, quantity: 1, defaultRate: 400 },
  ],
};

