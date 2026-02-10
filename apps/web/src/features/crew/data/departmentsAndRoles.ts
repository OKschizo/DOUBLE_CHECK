// Comprehensive list of film production departments and their roles

export interface DepartmentRole {
  id: string;
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  roles: DepartmentRole[];
}

export const DEPARTMENTS_AND_ROLES: Department[] = [
  {
    id: 'production',
    name: 'Production',
    icon: '🎬',
    roles: [
      { id: 'executive-producer', name: 'Executive Producer', description: 'Overall creative and financial oversight' },
      { id: 'producer', name: 'Producer', description: 'Manages all aspects of production' },
      { id: 'line-producer', name: 'Line Producer', description: 'Manages day-to-day physical production' },
      { id: 'co-producer', name: 'Co-Producer', description: 'Assists main producer' },
      { id: 'associate-producer', name: 'Associate Producer', description: 'Supports production team' },
      { id: 'production-manager', name: 'Production Manager (UPM)', description: 'Manages budget and logistics' },
      { id: 'production-coordinator', name: 'Production Coordinator', description: 'Coordinates production activities' },
      { id: 'asst-production-coordinator', name: 'Assistant Production Coordinator', description: 'Assists coordinator' },
      { id: 'production-secretary', name: 'Production Secretary', description: 'Administrative support' },
      { id: 'production-assistant', name: 'Production Assistant (PA)', description: 'General production support' },
      { id: 'office-pa', name: 'Office PA', description: 'Office-based production assistant' },
      { id: 'set-pa', name: 'Set PA', description: 'On-set production assistant' },
      { id: 'production-accountant', name: 'Production Accountant', description: 'Manages production finances' },
      { id: 'asst-accountant', name: 'Assistant Accountant', description: 'Assists with finances' },
      { id: 'payroll-accountant', name: 'Payroll Accountant', description: 'Manages payroll' },
    ]
  },
  {
    id: 'direction',
    name: 'Direction',
    icon: '🎥',
    roles: [
      { id: 'director', name: 'Director', description: 'Creative head of production' },
      { id: 'first-ad', name: 'First Assistant Director (1st AD)', description: 'Manages set and schedule' },
      { id: 'second-ad', name: 'Second Assistant Director (2nd AD)', description: 'Manages background and logistics' },
      { id: 'second-second-ad', name: '2nd 2nd AD', description: 'Additional AD support' },
      { id: 'third-ad', name: 'Third Assistant Director', description: 'AD department support' },
      { id: 'trainee-ad', name: 'Trainee AD', description: 'AD in training' },
      { id: 'script-supervisor', name: 'Script Supervisor', description: 'Maintains continuity' },
      { id: 'dialogue-coach', name: 'Dialogue Coach', description: 'Assists with dialogue delivery' },
      { id: 'acting-coach', name: 'Acting Coach', description: 'Coaches actors on set' },
    ]
  },
  {
    id: 'camera',
    name: 'Camera',
    icon: '📷',
    roles: [
      { id: 'dp', name: 'Director of Photography (DP/DOP)', description: 'Head of camera and lighting' },
      { id: 'camera-operator', name: 'Camera Operator', description: 'Operates camera' },
      { id: 'first-ac', name: 'First Assistant Camera (1st AC)', description: 'Focus puller' },
      { id: 'second-ac', name: 'Second Assistant Camera (2nd AC)', description: 'Clapper loader' },
      { id: 'dit', name: 'Digital Imaging Technician (DIT)', description: 'Manages digital workflow' },
      { id: 'data-wrangler', name: 'Data Wrangler', description: 'Manages media files' },
      { id: 'camera-pa', name: 'Camera PA', description: 'Camera department assistant' },
      { id: 'steadicam-operator', name: 'Steadicam Operator', description: 'Operates Steadicam' },
      { id: 'drone-operator', name: 'Drone Operator/Pilot', description: 'Operates camera drones' },
      { id: 'underwater-dp', name: 'Underwater Cinematographer', description: 'Underwater camera specialist' },
      { id: 'still-photographer', name: 'Still Photographer', description: 'Unit stills photography' },
      { id: 'video-playback', name: 'Video Playback Operator', description: 'Manages playback monitors' },
    ]
  },
  {
    id: 'lighting',
    name: 'Lighting / Electric',
    icon: '💡',
    roles: [
      { id: 'gaffer', name: 'Gaffer', description: 'Chief lighting technician' },
      { id: 'best-boy-electric', name: 'Best Boy Electric', description: 'Assistant to gaffer' },
      { id: 'electrician', name: 'Electrician', description: 'Lighting setup and operation' },
      { id: 'lamp-operator', name: 'Lamp Operator', description: 'Operates lighting equipment' },
      { id: 'rigging-gaffer', name: 'Rigging Gaffer', description: 'Pre-lights sets' },
      { id: 'dimmer-operator', name: 'Dimmer Board Operator', description: 'Controls lighting levels' },
      { id: 'generator-operator', name: 'Generator Operator', description: 'Manages power supply' },
      { id: 'lighting-technician', name: 'Lighting Technician', description: 'General lighting crew' },
    ]
  },
  {
    id: 'grip',
    name: 'Grip',
    icon: '🔧',
    roles: [
      { id: 'key-grip', name: 'Key Grip', description: 'Head of grip department' },
      { id: 'best-boy-grip', name: 'Best Boy Grip', description: 'Assistant to key grip' },
      { id: 'dolly-grip', name: 'Dolly Grip', description: 'Operates camera dolly' },
      { id: 'grip', name: 'Grip', description: 'General grip crew' },
      { id: 'rigging-grip', name: 'Rigging Grip', description: 'Pre-rigs equipment' },
      { id: 'crane-operator', name: 'Crane Operator', description: 'Operates camera cranes' },
      { id: 'technocrane-operator', name: 'Technocrane Operator', description: 'Specialized crane operator' },
    ]
  },
  {
    id: 'sound',
    name: 'Sound',
    icon: '🎙️',
    roles: [
      { id: 'production-sound-mixer', name: 'Production Sound Mixer', description: 'Records production audio' },
      { id: 'boom-operator', name: 'Boom Operator', description: 'Operates boom microphone' },
      { id: 'sound-utility', name: 'Sound Utility', description: 'Sound department assistant' },
      { id: 'playback-operator', name: 'Playback Operator', description: 'Manages audio playback' },
      { id: 'sound-assistant', name: 'Sound Assistant', description: 'Assists sound mixer' },
    ]
  },
  {
    id: 'art',
    name: 'Art Department',
    icon: '🎨',
    roles: [
      { id: 'production-designer', name: 'Production Designer', description: 'Head of art department' },
      { id: 'art-director', name: 'Art Director', description: 'Manages art department' },
      { id: 'asst-art-director', name: 'Assistant Art Director', description: 'Assists art director' },
      { id: 'set-designer', name: 'Set Designer', description: 'Designs sets' },
      { id: 'set-decorator', name: 'Set Decorator', description: 'Decorates sets' },
      { id: 'leadman', name: 'Leadman', description: 'Coordinates set dressing crew' },
      { id: 'set-dresser', name: 'Set Dresser', description: 'Dresses sets' },
      { id: 'buyer', name: 'Buyer', description: 'Purchases set dressing items' },
      { id: 'prop-master', name: 'Property Master', description: 'Manages props' },
      { id: 'asst-prop-master', name: 'Assistant Property Master', description: 'Assists prop master' },
      { id: 'props-buyer', name: 'Props Buyer', description: 'Purchases props' },
      { id: 'graphic-designer', name: 'Graphic Designer', description: 'Creates on-set graphics' },
      { id: 'illustrator', name: 'Illustrator', description: 'Creates concept art' },
      { id: 'storyboard-artist', name: 'Storyboard Artist', description: 'Creates storyboards' },
      { id: 'scenic-artist', name: 'Scenic Artist', description: 'Paints sets and backdrops' },
      { id: 'greens-person', name: 'Greens Person', description: 'Manages plants and foliage' },
    ]
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🔨',
    roles: [
      { id: 'construction-coordinator', name: 'Construction Coordinator', description: 'Heads construction' },
      { id: 'construction-foreman', name: 'Construction Foreman', description: 'Supervises construction crew' },
      { id: 'carpenter', name: 'Carpenter', description: 'Builds sets' },
      { id: 'painter', name: 'Paint Foreman', description: 'Leads painting crew' },
      { id: 'scenic-painter', name: 'Scenic Painter', description: 'Paints sets' },
      { id: 'plasterer', name: 'Plasterer', description: 'Creates plaster elements' },
      { id: 'welder', name: 'Welder', description: 'Metal fabrication' },
      { id: 'sculptor', name: 'Sculptor', description: 'Creates sculptural elements' },
    ]
  },
  {
    id: 'costume',
    name: 'Costume',
    icon: '👔',
    roles: [
      { id: 'costume-designer', name: 'Costume Designer', description: 'Designs costumes' },
      { id: 'costume-supervisor', name: 'Costume Supervisor', description: 'Supervises costume department' },
      { id: 'asst-costume-designer', name: 'Assistant Costume Designer', description: 'Assists designer' },
      { id: 'key-costumer', name: 'Key Costumer', description: 'Manages on-set costumes' },
      { id: 'set-costumer', name: 'Set Costumer', description: 'Handles costumes on set' },
      { id: 'costume-buyer', name: 'Costume Buyer', description: 'Purchases costumes' },
      { id: 'costume-maker', name: 'Costume Maker/Tailor', description: 'Creates costumes' },
      { id: 'wardrobe-assistant', name: 'Wardrobe Assistant', description: 'Assists wardrobe dept' },
      { id: 'textile-artist', name: 'Textile Artist', description: 'Specialty fabric work' },
    ]
  },
  {
    id: 'hair-makeup',
    name: 'Hair & Makeup',
    icon: '💄',
    roles: [
      { id: 'makeup-dept-head', name: 'Makeup Department Head', description: 'Leads makeup department' },
      { id: 'key-makeup', name: 'Key Makeup Artist', description: 'Lead makeup artist' },
      { id: 'makeup-artist', name: 'Makeup Artist', description: 'Applies makeup' },
      { id: 'asst-makeup', name: 'Assistant Makeup Artist', description: 'Assists makeup team' },
      { id: 'sfx-makeup', name: 'Special Effects Makeup Artist', description: 'Prosthetics and effects' },
      { id: 'hair-dept-head', name: 'Hair Department Head', description: 'Leads hair department' },
      { id: 'key-hair', name: 'Key Hair Stylist', description: 'Lead hair stylist' },
      { id: 'hair-stylist', name: 'Hair Stylist', description: 'Styles hair' },
      { id: 'asst-hair', name: 'Assistant Hair Stylist', description: 'Assists hair team' },
      { id: 'wig-maker', name: 'Wig Maker', description: 'Creates wigs' },
      { id: 'body-makeup', name: 'Body Makeup Artist', description: 'Full body makeup' },
    ]
  },
  {
    id: 'locations',
    name: 'Locations',
    icon: '📍',
    roles: [
      { id: 'location-manager', name: 'Location Manager', description: 'Heads location department' },
      { id: 'asst-location-manager', name: 'Assistant Location Manager', description: 'Assists location manager' },
      { id: 'location-scout', name: 'Location Scout', description: 'Finds locations' },
      { id: 'location-coordinator', name: 'Location Coordinator', description: 'Coordinates location logistics' },
      { id: 'location-pa', name: 'Location PA', description: 'Location department assistant' },
      { id: 'security', name: 'Security', description: 'Set security' },
      { id: 'fire-safety', name: 'Fire Safety Officer', description: 'Fire safety on set' },
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚛',
    roles: [
      { id: 'transportation-coordinator', name: 'Transportation Coordinator', description: 'Heads transport' },
      { id: 'transportation-captain', name: 'Transportation Captain', description: 'Supervises drivers' },
      { id: 'driver', name: 'Driver', description: 'Production vehicle driver' },
      { id: 'picture-car-coordinator', name: 'Picture Car Coordinator', description: 'Manages on-camera vehicles' },
      { id: 'honeywagon-driver', name: 'Honeywagon Driver', description: 'Trailer driver' },
      { id: 'van-driver', name: 'Van Driver', description: 'Passenger transport' },
      { id: 'truck-driver', name: 'Truck Driver', description: 'Equipment transport' },
    ]
  },
  {
    id: 'catering',
    name: 'Catering / Craft Services',
    icon: '🍽️',
    roles: [
      { id: 'catering-manager', name: 'Catering Manager', description: 'Heads catering' },
      { id: 'head-chef', name: 'Head Chef', description: 'Leads kitchen' },
      { id: 'sous-chef', name: 'Sous Chef', description: 'Assists head chef' },
      { id: 'catering-assistant', name: 'Catering Assistant', description: 'Kitchen support' },
      { id: 'craft-services', name: 'Craft Services', description: 'Manages craft table' },
      { id: 'asst-craft-services', name: 'Assistant Craft Services', description: 'Assists craft services' },
    ]
  },
  {
    id: 'sfx',
    name: 'Special Effects',
    icon: '💥',
    roles: [
      { id: 'sfx-supervisor', name: 'Special Effects Supervisor', description: 'Heads SFX department' },
      { id: 'sfx-coordinator', name: 'SFX Coordinator', description: 'Coordinates SFX' },
      { id: 'sfx-technician', name: 'SFX Technician', description: 'Executes practical effects' },
      { id: 'pyrotechnician', name: 'Pyrotechnician', description: 'Fire and explosions' },
      { id: 'mechanical-effects', name: 'Mechanical Effects', description: 'Mechanical gags' },
      { id: 'atmospherics', name: 'Atmospherics Technician', description: 'Smoke, fog, rain' },
      { id: 'snow-rain', name: 'Snow/Rain Technician', description: 'Weather effects' },
    ]
  },
  {
    id: 'stunts',
    name: 'Stunts',
    icon: '🤸',
    roles: [
      { id: 'stunt-coordinator', name: 'Stunt Coordinator', description: 'Heads stunt department' },
      { id: 'stunt-double', name: 'Stunt Double', description: 'Doubles for actors' },
      { id: 'stunt-performer', name: 'Stunt Performer', description: 'Performs stunts' },
      { id: 'stunt-rigger', name: 'Stunt Rigger', description: 'Sets up stunt rigging' },
      { id: 'fight-choreographer', name: 'Fight Choreographer', description: 'Choreographs fight scenes' },
      { id: 'precision-driver', name: 'Precision Driver', description: 'Car stunt specialist' },
    ]
  },
  {
    id: 'vfx',
    name: 'Visual Effects',
    icon: '✨',
    roles: [
      { id: 'vfx-supervisor', name: 'VFX Supervisor', description: 'On-set VFX supervision' },
      { id: 'vfx-producer', name: 'VFX Producer', description: 'Manages VFX production' },
      { id: 'vfx-coordinator', name: 'VFX Coordinator', description: 'Coordinates VFX' },
      { id: 'on-set-vfx', name: 'On-Set VFX Supervisor', description: 'VFX reference on set' },
      { id: 'data-capture', name: 'Data Capture Technician', description: 'HDRI, photogrammetry' },
      { id: 'motion-capture', name: 'Motion Capture Technician', description: 'Mocap specialist' },
    ]
  },
  {
    id: 'post-production',
    name: 'Post-Production',
    icon: '🖥️',
    roles: [
      { id: 'post-supervisor', name: 'Post-Production Supervisor', description: 'Manages post workflow' },
      { id: 'post-coordinator', name: 'Post-Production Coordinator', description: 'Coordinates post' },
      { id: 'editor', name: 'Editor', description: 'Picture editing' },
      { id: 'asst-editor', name: 'Assistant Editor', description: 'Assists editor' },
      { id: 'colorist', name: 'Colorist', description: 'Color grading' },
      { id: 'online-editor', name: 'Online Editor', description: 'Final conform' },
      { id: 'sound-designer', name: 'Sound Designer', description: 'Creates sound design' },
      { id: 'sound-editor', name: 'Sound Editor', description: 'Edits audio' },
      { id: 'dialogue-editor', name: 'Dialogue Editor', description: 'Edits dialogue' },
      { id: 'foley-artist', name: 'Foley Artist', description: 'Creates foley sounds' },
      { id: 'rerecording-mixer', name: 'Re-recording Mixer', description: 'Final audio mix' },
      { id: 'music-supervisor', name: 'Music Supervisor', description: 'Manages music' },
      { id: 'composer', name: 'Composer', description: 'Creates score' },
    ]
  },
  {
    id: 'extras',
    name: 'Background / Extras',
    icon: '👥',
    roles: [
      { id: 'extras-casting', name: 'Extras Casting Director', description: 'Casts background' },
      { id: 'extras-coordinator', name: 'Extras Coordinator', description: 'Manages extras on set' },
      { id: 'extras-wrangler', name: 'Extras Wrangler', description: 'Directs background action' },
      { id: 'stand-in', name: 'Stand-In', description: 'Stands in for lighting' },
      { id: 'photo-double', name: 'Photo Double', description: 'Body double' },
    ]
  },
  {
    id: 'publicity',
    name: 'Publicity / Marketing',
    icon: '📢',
    roles: [
      { id: 'unit-publicist', name: 'Unit Publicist', description: 'Handles press on set' },
      { id: 'epk-producer', name: 'EPK Producer', description: 'Creates electronic press kit' },
      { id: 'bts-videographer', name: 'Behind-the-Scenes Videographer', description: 'Documents production' },
      { id: 'social-media-manager', name: 'Social Media Manager', description: 'Manages social presence' },
    ]
  },
  {
    id: 'medical',
    name: 'Medical / Safety',
    icon: '🏥',
    roles: [
      { id: 'set-medic', name: 'Set Medic', description: 'On-set medical support' },
      { id: 'nurse', name: 'Nurse', description: 'Medical support' },
      { id: 'safety-officer', name: 'Safety Officer', description: 'Set safety' },
      { id: 'covid-coordinator', name: 'Health & Safety Coordinator', description: 'Health protocols' },
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: '🐕',
    roles: [
      { id: 'animal-coordinator', name: 'Animal Coordinator', description: 'Manages animal work' },
      { id: 'animal-trainer', name: 'Animal Trainer', description: 'Trains/handles animals' },
      { id: 'animal-wrangler', name: 'Animal Wrangler', description: 'Wrangles animals on set' },
      { id: 'veterinarian', name: 'Veterinarian', description: 'Animal medical care' },
    ]
  },
];

// Helper function to get all departments as flat list
export const getAllDepartments = (): string[] => {
  return DEPARTMENTS_AND_ROLES.map(d => d.name);
};

// Helper function to get roles for a department
export const getRolesForDepartment = (departmentName: string): DepartmentRole[] => {
  const dept = DEPARTMENTS_AND_ROLES.find(d => d.name === departmentName);
  return dept?.roles || [];
};

// Helper function to get all roles as flat list
export const getAllRoles = (): { department: string; role: DepartmentRole }[] => {
  const result: { department: string; role: DepartmentRole }[] = [];
  DEPARTMENTS_AND_ROLES.forEach(dept => {
    dept.roles.forEach(role => {
      result.push({ department: dept.name, role });
    });
  });
  return result;
};

// Get department icon
export const getDepartmentIcon = (departmentName: string): string => {
  const dept = DEPARTMENTS_AND_ROLES.find(d => d.name === departmentName);
  return dept?.icon || '📋';
};
