import type { CrewTemplate } from '@/lib/schemas';

export const documentaryCrewTemplate: Omit<CrewTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Documentary Production Crew Template',
  type: 'documentary',
  description: 'Streamlined documentary crew template - smaller, mobile crew for run-and-gun production',
  isPublic: true,
  positions: [
    // Production
    { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 1000 },
    { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'production', role: 'Co-Producer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'production', role: 'Executive Producer', required: false, quantity: 1, defaultRate: 1200 },
    { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 600 },
    { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
    { department: 'production', role: 'Field Producer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'production', role: 'Associate Producer', required: false, quantity: 1, defaultRate: 400 },
    { department: 'production', role: 'Production Assistant', required: true, quantity: 1, defaultRate: 250 },
    { department: 'production', role: 'Location Manager', required: false, quantity: 1, defaultRate: 500 },
    { department: 'production', role: 'Location Scout', required: false, quantity: 1, defaultRate: 400 },

    // Camera Department (often smaller/more flexible)
    { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: '2nd AC (Clapper Loader)', required: false, quantity: 1, defaultRate: 400 },
    { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: false, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: 'B-Camera Operator', required: false, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: 'B-Camera 1st AC', required: false, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: 'Drone Operator', required: false, quantity: 1, defaultRate: 600 },

    // Lighting & Grip (minimal for doc)
    { department: 'lighting_grip', role: 'Gaffer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Electrician', required: false, quantity: 1, defaultRate: 400 },
    { department: 'lighting_grip', role: 'Key Grip', required: false, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Grip', required: false, quantity: 1, defaultRate: 400 },

    // Sound Department (critical for doc)
    { department: 'sound', role: 'Production Sound Mixer', required: true, quantity: 1, defaultRate: 600 },
    { department: 'sound', role: 'Boom Operator', required: true, quantity: 1, defaultRate: 400 },
    { department: 'sound', role: 'Sound Utility', required: false, quantity: 1, defaultRate: 300 },

    // Art Department (minimal)
    { department: 'art', role: 'Production Designer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'art', role: 'Set Decorator', required: false, quantity: 1, defaultRate: 500 },
    { department: 'art', role: 'Prop Master', required: false, quantity: 1, defaultRate: 400 },

    // Wardrobe (minimal)
    { department: 'wardrobe', role: 'Costume Designer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'wardrobe', role: 'Key Costumer', required: false, quantity: 1, defaultRate: 400 },

    // Hair & Makeup (minimal)
    { department: 'makeup_hair', role: 'Key Makeup Artist', required: false, quantity: 1, defaultRate: 500 },
    { department: 'makeup_hair', role: 'Key Hairstylist', required: false, quantity: 1, defaultRate: 500 },

    // Transportation
    { department: 'transportation', role: 'Transportation Coordinator', required: false, quantity: 1, defaultRate: 400 },
    { department: 'transportation', role: 'Driver', required: false, quantity: 1, defaultRate: 300 },

    // Catering
    { department: 'catering', role: 'Caterer', required: false, quantity: 1, defaultRate: 400 },
    { department: 'catering', role: 'Craft Service', required: false, quantity: 1, defaultRate: 300 },

    // Other
    { department: 'other', role: 'Still Photographer', required: false, quantity: 1, defaultRate: 500 },
    { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 400 },
    { department: 'other', role: 'Fixer', required: false, quantity: 1, notes: 'Local production assistant/coordinator for location', defaultRate: 300 },
    { department: 'other', role: 'Translator', required: false, quantity: 1, defaultRate: 300 },
  ],
};

