import type { CrewTemplate } from '@doublecheck/schemas';

export const commercialCrewTemplate: Omit<CrewTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Commercial Production Crew Template',
  type: 'commercial',
  description: 'Standard commercial/agency production crew template - streamlined for shorter shoots',
  isPublic: true,
  positions: [
    // Agency/Client Side
    { department: 'production', role: 'Executive Producer', required: false, quantity: 1, defaultRate: 2000 },
    { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 1800 },
    { department: 'production', role: 'Creative Director', required: false, quantity: 1, defaultRate: 2500 },
    { department: 'production', role: 'Art Director', required: false, quantity: 1, defaultRate: 1500 },
    { department: 'production', role: 'Copywriter', required: false, quantity: 1, defaultRate: 1200 },
    { department: 'production', role: 'Account Executive', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'production', role: 'Agency PA', required: false, quantity: 1, defaultRate: 300 },

    // Production Company
    { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 2500 },
    { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 900 },
    { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 500 },
    { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 900 },
    { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 700 },
    { department: 'production', role: 'Script Supervisor', required: false, quantity: 1, defaultRate: 700 },
    { department: 'production', role: 'Production Assistant', required: true, quantity: 2, defaultRate: 300 },
    { department: 'production', role: 'Set PA', required: true, quantity: 1, defaultRate: 300 },
    { department: 'production', role: 'Office PA', required: false, quantity: 1, defaultRate: 300 },
    { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 700 },
    { department: 'production', role: 'Location Scout', required: false, quantity: 1, defaultRate: 500 },

    // Camera Department
    { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1500 },
    { department: 'camera', role: 'Camera Operator', required: false, quantity: 1, defaultRate: 900 },
    { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 700 },
    { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 700 },
    { department: 'camera', role: 'Steadicam Operator', required: false, quantity: 1, defaultRate: 1200 },
    { department: 'camera', role: 'Drone Operator', required: false, quantity: 1, defaultRate: 1000 },

    // Lighting & Grip
    { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 700 },
    { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 2, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 700 },
    { department: 'lighting_grip', role: 'Best Boy Grip', required: false, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Grip', required: true, quantity: 2, defaultRate: 500 },

    // Sound Department
    { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 600 },
    { department: 'sound', role: 'Playback Operator', required: false, quantity: 1, defaultRate: 600 },

    // Art Department
    { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'art', role: 'Art Director', required: false, quantity: 1, defaultRate: 900 },
    { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 800 },
    { department: 'art', role: 'Lead Person', required: false, quantity: 1, defaultRate: 600 },
    { department: 'art', role: 'Set Dresser', required: true, quantity: 1, defaultRate: 550 },
    { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 700 },
    { department: 'art', role: 'Assistant Prop Master', required: false, quantity: 1, defaultRate: 500 },

    // Wardrobe
    { department: 'wardrobe', role: 'Costume Designer', required: false, quantity: 1, defaultRate: 900 },
    { department: 'wardrobe', role: 'Costume Supervisor', required: false, quantity: 1, defaultRate: 700 },
    { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 600 },
    { department: 'wardrobe', role: 'Set Costumer', required: false, quantity: 1, defaultRate: 550 },

    // Hair & Makeup
    { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 700 },
    { department: 'makeup_hair', role: 'Makeup Artist', required: false, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 700 },
    { department: 'makeup_hair', role: 'Hairstylist', required: false, quantity: 1, defaultRate: 600 },

    // Transportation
    { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 600 },
    { department: 'transportation', role: 'Driver', required: true, quantity: 1, defaultRate: 400 },

    // Catering
    { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 500 },
    { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 400 },

    // Other
    { department: 'other', role: 'Still Photographer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 500 },
  ],
};

