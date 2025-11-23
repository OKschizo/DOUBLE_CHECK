import type { CrewTemplate } from '@/lib/schemas';

export const musicVideoCrewTemplate: Omit<CrewTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Music Video Crew Template',
  type: 'music_video',
  description: 'Music video production crew template - creative, fast-paced, often single-day shoots',
  isPublic: true,
  positions: [
    // Production
    { department: 'production', role: 'Director', required: true, quantity: 1, defaultRate: 1500 },
    { department: 'production', role: 'Producer', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'production', role: 'Executive Producer', required: false, quantity: 1, defaultRate: 1500 },
    { department: 'production', role: 'Line Producer', required: true, quantity: 1, defaultRate: 1000 },
    { department: 'production', role: 'Production Manager', required: true, quantity: 1, defaultRate: 800 },
    { department: 'production', role: 'Production Coordinator', required: true, quantity: 1, defaultRate: 400 },
    { department: 'production', role: '1st AD', required: true, quantity: 1, defaultRate: 800 },
    { department: 'production', role: '2nd AD', required: true, quantity: 1, defaultRate: 600 },
    { department: 'production', role: 'Production Assistant', required: true, quantity: 2, defaultRate: 250 },
    { department: 'production', role: 'Set PA', required: true, quantity: 1, defaultRate: 250 },
    { department: 'production', role: 'Location Manager', required: true, quantity: 1, defaultRate: 600 },
    { department: 'production', role: 'Location Scout', required: false, quantity: 1, defaultRate: 400 },

    // Camera Department
    { department: 'camera', role: 'Director of Photography', required: true, quantity: 1, defaultRate: 1200 },
    { department: 'camera', role: 'Camera Operator', required: true, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: '1st AC (Focus Puller)', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: '2nd AC (Clapper Loader)', required: true, quantity: 1, defaultRate: 500 },
    { department: 'camera', role: 'DIT (Digital Imaging Technician)', required: true, quantity: 1, defaultRate: 600 },
    { department: 'camera', role: 'Steadicam Operator', required: false, quantity: 1, defaultRate: 1000 },
    { department: 'camera', role: 'Drone Operator', required: false, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: 'B-Camera Operator', required: false, quantity: 1, defaultRate: 800 },
    { department: 'camera', role: 'B-Camera 1st AC', required: false, quantity: 1, defaultRate: 600 },

    // Lighting & Grip
    { department: 'lighting_grip', role: 'Gaffer', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Best Boy Electric', required: true, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Electrician', required: true, quantity: 2, defaultRate: 450 },
    { department: 'lighting_grip', role: 'Key Grip', required: true, quantity: 1, defaultRate: 600 },
    { department: 'lighting_grip', role: 'Best Boy Grip', required: false, quantity: 1, defaultRate: 500 },
    { department: 'lighting_grip', role: 'Grip', required: true, quantity: 2, defaultRate: 450 },

    // Sound Department (often minimal for music videos)
    { department: 'sound', role: 'Production Sound Mixer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'sound', role: 'Boom Operator', required: false, quantity: 1, defaultRate: 400 },
    { department: 'sound', role: 'Playback Operator', required: true, quantity: 1, notes: 'Critical for music video - plays track for performance', defaultRate: 500 },

    // Art Department
    { department: 'art', role: 'Production Designer', required: true, quantity: 1, defaultRate: 800 },
    { department: 'art', role: 'Art Director', required: false, quantity: 1, defaultRate: 600 },
    { department: 'art', role: 'Set Decorator', required: true, quantity: 1, defaultRate: 600 },
    { department: 'art', role: 'Lead Person', required: false, quantity: 1, defaultRate: 500 },
    { department: 'art', role: 'Set Dresser', required: true, quantity: 1, defaultRate: 450 },
    { department: 'art', role: 'Prop Master', required: true, quantity: 1, defaultRate: 500 },
    { department: 'art', role: 'Assistant Prop Master', required: false, quantity: 1, defaultRate: 350 },

    // Wardrobe
    { department: 'wardrobe', role: 'Costume Designer', required: true, quantity: 1, defaultRate: 700 },
    { department: 'wardrobe', role: 'Costume Supervisor', required: false, quantity: 1, defaultRate: 500 },
    { department: 'wardrobe', role: 'Key Costumer', required: true, quantity: 1, defaultRate: 500 },
    { department: 'wardrobe', role: 'Set Costumer', required: false, quantity: 1, defaultRate: 400 },

    // Hair & Makeup
    { department: 'makeup_hair', role: 'Key Makeup Artist', required: true, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Makeup Artist', required: false, quantity: 1, defaultRate: 500 },
    { department: 'makeup_hair', role: 'Key Hairstylist', required: true, quantity: 1, defaultRate: 600 },
    { department: 'makeup_hair', role: 'Hairstylist', required: false, quantity: 1, defaultRate: 500 },

    // Transportation
    { department: 'transportation', role: 'Transportation Coordinator', required: true, quantity: 1, defaultRate: 500 },
    { department: 'transportation', role: 'Driver', required: true, quantity: 1, defaultRate: 350 },

    // Catering
    { department: 'catering', role: 'Caterer', required: true, quantity: 1, defaultRate: 400 },
    { department: 'catering', role: 'Craft Service', required: true, quantity: 1, defaultRate: 350 },

    // Stunts (common in music videos)
    { department: 'stunts', role: 'Stunt Coordinator', required: false, quantity: 1, defaultRate: 800 },
    { department: 'stunts', role: 'Stunt Performer', required: false, quantity: 2, defaultRate: 600 },

    // Other
    { department: 'other', role: 'Still Photographer', required: true, quantity: 1, defaultRate: 500 },
    { department: 'other', role: 'BTS Videographer', required: false, quantity: 1, defaultRate: 400 },
    { department: 'other', role: 'Medic', required: true, quantity: 1, defaultRate: 400 },
    { department: 'other', role: 'Choreographer', required: false, quantity: 1, defaultRate: 600 },
    { department: 'other', role: 'Dance Captain', required: false, quantity: 1, defaultRate: 400 },
  ],
};

