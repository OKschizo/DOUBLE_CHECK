/**
 * Comprehensive Nike Demo Project Rebuild Script
 * Creates a fully populated film production project with:
 * - Full crew across all departments
 * - Complete equipment package
 * - Cast with proper breakdowns
 * - Scenes with detailed information
 * - Shots with storyboard references
 * - Schedule with shooting days
 * - Budget with all categories
 * - Locations with addresses
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Nike Demo Project ID
const PROJECT_ID = 'SomJJD3bEqn2yHhXW79e';

// Helper to generate IDs
const generateId = () => db.collection('_').doc().id;

// Timestamp helper
const now = admin.firestore.Timestamp.now();

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName)
    .where('projectId', '==', PROJECT_ID)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  if (snapshot.docs.length > 0) {
    await batch.commit();
    console.log(`  Cleared ${snapshot.docs.length} docs from ${collectionName}`);
  }
}

async function rebuildNikeDemo() {
  console.log('🎬 Starting Nike Demo Project Full Rebuild...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  const collections = [
    'crew', 'cast', 'equipment', 'scenes', 'shots', 
    'locations', 'schedule_days', 'schedule_events',
    'budget_categories', 'budget_items', 'equipment_packages'
  ];
  for (const col of collections) {
    await clearCollection(col);
  }

  // ==================== LOCATIONS ====================
  console.log('\n📍 Creating locations...');
  const locations = [
    {
      id: generateId(),
      name: 'Nike World Headquarters',
      address: '1 SW Bowerman Dr, Beaverton, OR 97005',
      type: 'commercial',
      intExt: 'ext',
      description: 'Nike campus main building - exterior shots',
      contactName: 'Location Manager',
      contactPhone: '503-555-0100',
      rentalCost: 15000,
      parkingInfo: 'Crew parking in Lot B, Base camp in Lot C',
      nearestHospital: 'Providence St. Vincent Medical Center - 9205 SW Barnes Rd',
      powerAvailable: true,
      restroomsAvailable: true,
      permitRequired: true,
      permitStatus: 'approved',
    },
    {
      id: generateId(),
      name: 'Nike Innovation Center',
      address: '1 SW Bowerman Dr Building 5, Beaverton, OR 97005',
      type: 'commercial',
      intExt: 'int',
      description: 'High-tech lab interior - product reveal scenes',
      contactName: 'Facility Coordinator',
      contactPhone: '503-555-0101',
      rentalCost: 10000,
      powerAvailable: true,
      restroomsAvailable: true,
    },
    {
      id: generateId(),
      name: 'Downtown Portland Street',
      address: 'SW 5th Ave & Yamhill St, Portland, OR 97204',
      type: 'street',
      intExt: 'ext',
      description: 'Urban running sequence - night shoot',
      contactName: 'Portland Film Office',
      contactPhone: '503-555-0200',
      rentalCost: 5000,
      permitRequired: true,
      permitStatus: 'approved',
      nearestHospital: 'OHSU Hospital - 3181 SW Sam Jackson Park Rd',
    },
    {
      id: generateId(),
      name: 'Forest Park Trail',
      address: 'Wildwood Trail, Portland, OR 97210',
      type: 'outdoor',
      intExt: 'ext',
      description: 'Nature running sequence - golden hour',
      contactName: 'Parks Department',
      contactPhone: '503-555-0300',
      rentalCost: 2000,
      permitRequired: true,
      nearestHospital: 'Legacy Good Samaritan - 1015 NW 22nd Ave',
    },
    {
      id: generateId(),
      name: 'Moda Center Arena',
      address: '1 N Center Court St, Portland, OR 97227',
      type: 'commercial',
      intExt: 'int',
      description: 'Basketball court - athlete training montage',
      contactName: 'Events Manager',
      contactPhone: '503-555-0400',
      rentalCost: 25000,
      powerAvailable: true,
      restroomsAvailable: true,
    },
  ];

  for (const loc of locations) {
    await db.collection('locations').doc(loc.id).set({
      ...loc,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${locations.length} locations`);

  // ==================== CREW ====================
  console.log('\n👥 Creating crew...');
  const crew = [
    // Production
    { name: 'Sarah Mitchell', role: 'Director', department: 'production', rate: 5000, rateType: 'day', phone: '503-555-1001', email: 'sarah@production.com', isDepartmentHead: true },
    { name: 'James Chen', role: 'Executive Producer', department: 'production', rate: 4000, rateType: 'day', phone: '503-555-1002', isDepartmentHead: true },
    { name: 'Maria Rodriguez', role: 'Line Producer', department: 'production', rate: 2500, rateType: 'day', phone: '503-555-1003' },
    { name: 'David Kim', role: 'Unit Production Manager', department: 'production', rate: 2000, rateType: 'day', phone: '503-555-1004' },
    { name: 'Emily Watson', role: 'Production Coordinator', department: 'production', rate: 800, rateType: 'day', phone: '503-555-1005' },
    { name: 'Alex Turner', role: 'Production Assistant', department: 'production', rate: 250, rateType: 'day' },
    { name: 'Jordan Lee', role: 'Production Assistant', department: 'production', rate: 250, rateType: 'day' },
    
    // Assistant Directors
    { name: 'Michael Foster', role: '1st Assistant Director', department: 'direction', rate: 1500, rateType: 'day', phone: '503-555-2001', isDepartmentHead: true },
    { name: 'Lisa Park', role: '2nd Assistant Director', department: 'direction', rate: 800, rateType: 'day', phone: '503-555-2002' },
    { name: 'Kevin Brown', role: '2nd 2nd Assistant Director', department: 'direction', rate: 500, rateType: 'day' },
    { name: 'Rachel Green', role: 'Key Set PA', department: 'direction', rate: 300, rateType: 'day' },
    { name: 'Chris Martinez', role: 'Set PA', department: 'direction', rate: 250, rateType: 'day' },
    { name: 'Samantha White', role: 'Set PA', department: 'direction', rate: 250, rateType: 'day' },
    
    // Camera
    { name: 'Robert Thompson', role: 'Director of Photography', department: 'camera', rate: 3500, rateType: 'day', phone: '503-555-3001', isDepartmentHead: true },
    { name: 'Jennifer Liu', role: 'A Camera Operator', department: 'camera', rate: 1200, rateType: 'day' },
    { name: 'Marcus Johnson', role: '1st AC (Focus Puller)', department: 'camera', rate: 800, rateType: 'day' },
    { name: 'Amanda Scott', role: '2nd AC (Clapper/Loader)', department: 'camera', rate: 500, rateType: 'day' },
    { name: 'Daniel Wright', role: 'B Camera Operator', department: 'camera', rate: 1000, rateType: 'day' },
    { name: 'Nina Patel', role: 'B Cam 1st AC', department: 'camera', rate: 700, rateType: 'day' },
    { name: 'Tom Harris', role: 'DIT', department: 'camera', rate: 900, rateType: 'day' },
    { name: 'Sophie Anderson', role: 'Steadicam Operator', department: 'camera', rate: 1500, rateType: 'day' },
    
    // Lighting (Electric)
    { name: 'William Davis', role: 'Gaffer', department: 'lighting_grip', rate: 1200, rateType: 'day', phone: '503-555-4001', isDepartmentHead: true },
    { name: 'Carlos Ramirez', role: 'Best Boy Electric', department: 'lighting_grip', rate: 800, rateType: 'day' },
    { name: 'Derek Stone', role: 'Electrician', department: 'lighting_grip', rate: 500, rateType: 'day' },
    { name: 'Mike Sullivan', role: 'Electrician', department: 'lighting_grip', rate: 500, rateType: 'day' },
    { name: 'Jake Morrison', role: 'Rigging Gaffer', department: 'lighting_grip', rate: 900, rateType: 'day' },
    
    // Grip
    { name: 'Steven Clark', role: 'Key Grip', department: 'grip', rate: 1100, rateType: 'day', phone: '503-555-5001', isDepartmentHead: true },
    { name: 'Brian Foster', role: 'Best Boy Grip', department: 'grip', rate: 750, rateType: 'day' },
    { name: 'Tony Russo', role: 'Dolly Grip', department: 'grip', rate: 600, rateType: 'day' },
    { name: 'Nick Palmer', role: 'Grip', department: 'grip', rate: 450, rateType: 'day' },
    { name: 'Eric Coleman', role: 'Grip', department: 'grip', rate: 450, rateType: 'day' },
    
    // Sound
    { name: 'Patricia Wells', role: 'Production Sound Mixer', department: 'sound', rate: 1000, rateType: 'day', phone: '503-555-6001', isDepartmentHead: true },
    { name: 'Ryan Cooper', role: 'Boom Operator', department: 'sound', rate: 600, rateType: 'day' },
    { name: 'Ashley Morgan', role: 'Sound Utility', department: 'sound', rate: 400, rateType: 'day' },
    
    // Art Department
    { name: 'Victoria Lane', role: 'Production Designer', department: 'art', rate: 2000, rateType: 'day', phone: '503-555-7001', isDepartmentHead: true },
    { name: 'Gregory Hill', role: 'Art Director', department: 'art', rate: 1200, rateType: 'day' },
    { name: 'Natalie Woods', role: 'Set Decorator', department: 'art', rate: 900, rateType: 'day' },
    { name: 'Jason Reed', role: 'Set Dresser', department: 'art', rate: 500, rateType: 'day' },
    { name: 'Lauren Fisher', role: 'Props Master', department: 'art', rate: 800, rateType: 'day' },
    { name: 'Mark Stevens', role: 'Leadman', department: 'art', rate: 600, rateType: 'day' },
    
    // Wardrobe
    { name: 'Diana Cruz', role: 'Costume Designer', department: 'wardrobe', rate: 1500, rateType: 'day', phone: '503-555-8001', isDepartmentHead: true },
    { name: 'Michelle Torres', role: 'Costume Supervisor', department: 'wardrobe', rate: 800, rateType: 'day' },
    { name: 'Hannah Brooks', role: 'Key Costumer', department: 'wardrobe', rate: 500, rateType: 'day' },
    
    // Hair & Makeup
    { name: 'Olivia James', role: 'Makeup Department Head', department: 'makeup_hair', rate: 1200, rateType: 'day', phone: '503-555-9001', isDepartmentHead: true },
    { name: 'Christina Bell', role: 'Key Makeup Artist', department: 'makeup_hair', rate: 700, rateType: 'day' },
    { name: 'Rebecca Cole', role: 'Hair Department Head', department: 'makeup_hair', rate: 1100, rateType: 'day' },
    { name: 'Vanessa Price', role: 'Key Hair Stylist', department: 'makeup_hair', rate: 650, rateType: 'day' },
    
    // Locations
    { name: 'Thomas Grant', role: 'Location Manager', department: 'locations', rate: 1000, rateType: 'day', phone: '503-555-0100', isDepartmentHead: true },
    { name: 'Jessica Hayes', role: 'Assistant Location Manager', department: 'locations', rate: 600, rateType: 'day' },
    
    // Transportation
    { name: 'Robert Burns', role: 'Transportation Coordinator', department: 'transportation', rate: 900, rateType: 'day', phone: '503-555-0500', isDepartmentHead: true },
    { name: 'Frank Miller', role: 'Driver Captain', department: 'transportation', rate: 500, rateType: 'day' },
    { name: 'Tony Garcia', role: 'Driver', department: 'transportation', rate: 350, rateType: 'day' },
    
    // Catering
    { name: 'Maria Santos', role: 'Craft Services', department: 'catering', rate: 500, rateType: 'day', isDepartmentHead: true },
    
    // Script/Continuity
    { name: 'Katherine Moore', role: 'Script Supervisor', department: 'continuity', rate: 800, rateType: 'day', isDepartmentHead: true },
    
    // VFX
    { name: 'Andrew Kim', role: 'VFX Supervisor', department: 'vfx', rate: 1500, rateType: 'day', isDepartmentHead: true },
    
    // Medic
    { name: 'Dr. Sarah Connor', role: 'Set Medic', department: 'other', rate: 600, rateType: 'day' },
  ];

  const crewIds = {};
  for (const member of crew) {
    const id = generateId();
    crewIds[member.role] = id;
    await db.collection('crew').doc(id).set({
      ...member,
      id,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${crew.length} crew members`);

  // ==================== CAST ====================
  console.log('\n🎭 Creating cast...');
  const cast = [
    { actorName: 'Marcus Thompson', characterName: 'ALEX (Lead Runner)', castType: 'lead', rate: 15000, rateType: 'day', agent: 'CAA - John Smith', agentPhone: '310-555-1000', notes: 'Former track athlete, does own stunts' },
    { actorName: 'Jasmine Williams', characterName: 'MAYA (Coach)', castType: 'supporting', rate: 8000, rateType: 'day', agent: 'WME - Lisa Chen' },
    { actorName: 'David Park', characterName: 'CHRIS (Training Partner)', castType: 'supporting', rate: 5000, rateType: 'day' },
    { actorName: 'Elena Rodriguez', characterName: 'SOFIA (Sports Scientist)', castType: 'supporting', rate: 5000, rateType: 'day' },
    { actorName: 'Michael Chen', characterName: 'NIKE EXECUTIVE', castType: 'dayplayer', rate: 2500, rateType: 'day' },
    { actorName: 'Amanda Foster', characterName: 'REPORTER', castType: 'dayplayer', rate: 1500, rateType: 'day' },
    { actorName: 'Various', characterName: 'RUNNERS (BG)', castType: 'background', quantity: 20, rate: 200, rateType: 'day', notes: 'Athletic build, running experience preferred' },
    { actorName: 'Various', characterName: 'LAB TECHNICIANS (BG)', castType: 'background', quantity: 8, rate: 200, rateType: 'day', notes: 'Lab coat provided' },
    { actorName: 'Various', characterName: 'ARENA CROWD (BG)', castType: 'background', quantity: 50, rate: 150, rateType: 'day' },
  ];

  const castIds = {};
  for (const member of cast) {
    const id = generateId();
    castIds[member.characterName] = id;
    await db.collection('cast').doc(id).set({
      ...member,
      id,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${cast.length} cast members`);

  // ==================== EQUIPMENT ====================
  console.log('\n📷 Creating equipment...');
  const equipment = [
    // Camera Package
    { name: 'ARRI Alexa Mini LF', category: 'camera', quantity: 2, dailyRate: 2500, weeklyRate: 10000, rentalVendor: 'Panavision Portland' },
    { name: 'ARRI Signature Prime Set (6 lenses)', category: 'lenses', quantity: 1, dailyRate: 1500, weeklyRate: 6000, rentalVendor: 'Panavision Portland' },
    { name: 'Angenieux EZ Zoom 22-60mm', category: 'lenses', quantity: 1, dailyRate: 400, weeklyRate: 1600 },
    { name: 'Angenieux EZ Zoom 45-135mm', category: 'lenses', quantity: 1, dailyRate: 400, weeklyRate: 1600 },
    { name: 'ARRI WCU-4 Wireless Follow Focus', category: 'camera', quantity: 2, dailyRate: 250, weeklyRate: 1000 },
    { name: 'Teradek Bolt 4K 1500', category: 'wireless_video', quantity: 2, dailyRate: 350, weeklyRate: 1400 },
    { name: 'SmallHD 1703 P3X Monitor', category: 'monitors', quantity: 3, dailyRate: 150, weeklyRate: 600 },
    { name: 'OConnor 2575 Fluid Head', category: 'camera', quantity: 2, dailyRate: 200, weeklyRate: 800 },
    { name: 'Ronford-Baker Medium Duty Legs', category: 'camera', quantity: 2, dailyRate: 100, weeklyRate: 400 },
    { name: 'DJI Ronin 2 Gimbal', category: 'specialty', quantity: 1, dailyRate: 500, weeklyRate: 2000 },
    { name: 'ARRI Trinity Stabilizer', category: 'specialty', quantity: 1, dailyRate: 1200, weeklyRate: 4800, notes: 'For Steadicam operator' },
    
    // Lighting
    { name: 'ARRI SkyPanel S360-C', category: 'lighting', quantity: 4, dailyRate: 400, weeklyRate: 1600, rentalVendor: 'Cinelease Portland' },
    { name: 'ARRI SkyPanel S60-C', category: 'lighting', quantity: 8, dailyRate: 200, weeklyRate: 800 },
    { name: 'ARRI M18 HMI', category: 'lighting', quantity: 4, dailyRate: 300, weeklyRate: 1200 },
    { name: 'ARRI M40 HMI', category: 'lighting', quantity: 2, dailyRate: 450, weeklyRate: 1800 },
    { name: 'Litepanels Astra 6X Bi-Color', category: 'lighting', quantity: 6, dailyRate: 100, weeklyRate: 400 },
    { name: 'Astera Titan Tubes (8-pack)', category: 'lighting', quantity: 2, dailyRate: 400, weeklyRate: 1600 },
    { name: 'Creamsource Vortex8', category: 'lighting', quantity: 2, dailyRate: 350, weeklyRate: 1400 },
    { name: '20x20 Ultrabounce', category: 'grip', quantity: 2, dailyRate: 100, weeklyRate: 400 },
    { name: '12x12 Frame Kit', category: 'grip', quantity: 4, dailyRate: 75, weeklyRate: 300 },
    { name: '4x4 Floppy Kit', category: 'grip', quantity: 8, dailyRate: 25, weeklyRate: 100 },
    
    // Grip
    { name: 'Fisher 11 Dolly', category: 'grip', quantity: 1, dailyRate: 500, weeklyRate: 2000, rentalVendor: 'Chapman Leonard' },
    { name: 'Dana Dolly Kit', category: 'grip', quantity: 2, dailyRate: 150, weeklyRate: 600 },
    { name: 'Doorway Dolly', category: 'grip', quantity: 1, dailyRate: 100, weeklyRate: 400 },
    { name: '50ft Straight Track', category: 'grip', quantity: 40, dailyRate: 5, weeklyRate: 20, notes: 'Per foot' },
    { name: 'Condor 80ft Lift', category: 'grip', quantity: 1, dailyRate: 800, weeklyRate: 3200 },
    { name: 'JLG 45ft Scissor Lift', category: 'grip', quantity: 1, dailyRate: 400, weeklyRate: 1600 },
    { name: 'C-Stand Kit (20 stands)', category: 'grip', quantity: 1, dailyRate: 200, weeklyRate: 800 },
    { name: 'Combo Stand Kit (10 stands)', category: 'grip', quantity: 1, dailyRate: 150, weeklyRate: 600 },
    
    // Power
    { name: 'Tow Plant 750A Generator', category: 'power', quantity: 1, dailyRate: 800, weeklyRate: 3200, rentalVendor: 'Cinelease Portland' },
    { name: 'Distro Box 200A Cam-Lock', category: 'power', quantity: 2, dailyRate: 100, weeklyRate: 400 },
    { name: 'Cable Package (Banded)', category: 'power', quantity: 1, dailyRate: 200, weeklyRate: 800 },
    
    // Sound
    { name: 'Sound Devices 888 Mixer/Recorder', category: 'audio', quantity: 1, dailyRate: 400, weeklyRate: 1600, rentalVendor: 'Coffey Sound' },
    { name: 'Sennheiser MKH 50 Mic', category: 'audio', quantity: 2, dailyRate: 75, weeklyRate: 300 },
    { name: 'Sennheiser MKH 416 Mic', category: 'audio', quantity: 2, dailyRate: 50, weeklyRate: 200 },
    { name: 'Lectrosonics SMWB Transmitter', category: 'audio', quantity: 8, dailyRate: 100, weeklyRate: 400 },
    { name: 'Lectrosonics SRc Receiver', category: 'audio', quantity: 4, dailyRate: 125, weeklyRate: 500 },
    { name: 'K-Tek Boom Pole (Klassic)', category: 'audio', quantity: 2, dailyRate: 25, weeklyRate: 100 },
    { name: 'Comtek PR-216 IFB System', category: 'audio', quantity: 1, dailyRate: 150, weeklyRate: 600 },
    
    // Specialty
    { name: 'DJI Inspire 3 Drone Package', category: 'specialty', quantity: 1, dailyRate: 1500, weeklyRate: 6000, notes: 'FAA certified pilot included' },
    { name: 'Phantom Flex4K High Speed Camera', category: 'specialty', quantity: 1, dailyRate: 5000, weeklyRate: 20000, notes: 'For slow-motion running shots' },
    { name: 'RED Komodo (Crash Cam)', category: 'specialty', quantity: 2, dailyRate: 400, weeklyRate: 1600 },
    
    // Vehicles
    { name: 'Camera Truck (5-ton)', category: 'vehicles', quantity: 1, dailyRate: 600, weeklyRate: 2400 },
    { name: 'Grip/Electric Truck (5-ton)', category: 'vehicles', quantity: 1, dailyRate: 600, weeklyRate: 2400 },
    { name: 'Wardrobe/Makeup Trailer', category: 'vehicles', quantity: 1, dailyRate: 500, weeklyRate: 2000 },
    { name: 'Cast Trailer (Triple)', category: 'vehicles', quantity: 1, dailyRate: 400, weeklyRate: 1600 },
    { name: 'Production Office Trailer', category: 'vehicles', quantity: 1, dailyRate: 300, weeklyRate: 1200 },
    { name: '15 Passenger Van', category: 'vehicles', quantity: 3, dailyRate: 150, weeklyRate: 600 },
    { name: 'Insert Car (Ford F-150)', category: 'vehicles', quantity: 1, dailyRate: 500, weeklyRate: 2000, notes: 'With camera mount system' },
  ];

  for (const item of equipment) {
    const id = generateId();
    await db.collection('equipment').doc(id).set({
      ...item,
      id,
      projectId: PROJECT_ID,
      status: 'confirmed',
      procurementStatus: 'reserved',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${equipment.length} equipment items`);

  // ==================== SCENES ====================
  console.log('\n🎬 Creating scenes...');
  const scenes = [
    {
      sceneNumber: '1',
      title: 'ALEX MORNING RUN',
      description: 'Alex runs through city streets at dawn, establishing his dedication.',
      settingName: 'Downtown Portland Street',
      intExt: 'ext',
      dayNight: 'dawn',
      pageCount: '2 4/8',
      castMemberIds: [castIds['ALEX (Lead Runner)']],
      locationId: locations[2].id,
      notes: 'Golden hour shoot - call time 4:30AM',
      dramaticDay: '1',
    },
    {
      sceneNumber: '2',
      title: 'NIKE INNOVATION LAB',
      description: 'Alex arrives at Nike Innovation Center for product testing.',
      settingName: 'Nike Innovation Center',
      intExt: 'int',
      dayNight: 'day',
      pageCount: '3 2/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['SOFIA (Sports Scientist)'], castIds['NIKE EXECUTIVE']],
      locationId: locations[1].id,
      dramaticDay: '1',
    },
    {
      sceneNumber: '3',
      title: 'PRODUCT REVEAL',
      description: 'Sofia unveils the new Nike running technology to Alex.',
      settingName: 'Nike Innovation Center - Testing Room',
      intExt: 'int',
      dayNight: 'day',
      pageCount: '4 0/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['SOFIA (Sports Scientist)']],
      locationId: locations[1].id,
      notes: 'Hero product shots - coordinate with Nike marketing',
      dramaticDay: '1',
    },
    {
      sceneNumber: '4',
      title: 'TRAINING MONTAGE - TRACK',
      description: 'Alex trains with the new shoes, pushing his limits.',
      settingName: 'Nike Campus Track',
      intExt: 'ext',
      dayNight: 'day',
      pageCount: '2 0/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['MAYA (Coach)'], castIds['CHRIS (Training Partner)']],
      locationId: locations[0].id,
      notes: 'Multiple angles, drone shots',
      dramaticDay: '2',
    },
    {
      sceneNumber: '5',
      title: 'COACHING SESSION',
      description: 'Maya pushes Alex to break through his mental barriers.',
      settingName: 'Nike Campus - Sidelines',
      intExt: 'ext',
      dayNight: 'day',
      pageCount: '2 6/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['MAYA (Coach)']],
      locationId: locations[0].id,
      dramaticDay: '2',
    },
    {
      sceneNumber: '6',
      title: 'FOREST RUN',
      description: 'Alex runs through Forest Park, finding his flow.',
      settingName: 'Forest Park Trail',
      intExt: 'ext',
      dayNight: 'day',
      pageCount: '1 4/8',
      castMemberIds: [castIds['ALEX (Lead Runner)']],
      locationId: locations[3].id,
      notes: 'Steadicam following shots, golden hour',
      dramaticDay: '3',
    },
    {
      sceneNumber: '7',
      title: 'COMPETITION DAY',
      description: 'Alex competes in front of a packed arena.',
      settingName: 'Moda Center Arena',
      intExt: 'int',
      dayNight: 'day',
      pageCount: '5 0/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['MAYA (Coach)'], castIds['CHRIS (Training Partner)']],
      locationId: locations[4].id,
      notes: 'Need 50 BG for crowd, high-speed camera for finish line',
      dramaticDay: '4',
    },
    {
      sceneNumber: '8',
      title: 'VICTORY MOMENT',
      description: 'Alex crosses the finish line, achieving his dream.',
      settingName: 'Moda Center Arena - Finish Line',
      intExt: 'int',
      dayNight: 'day',
      pageCount: '1 2/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['MAYA (Coach)']],
      locationId: locations[4].id,
      notes: 'Phantom Flex4K for slow-motion finish',
      dramaticDay: '4',
    },
    {
      sceneNumber: '9',
      title: 'PRESS CONFERENCE',
      description: 'Alex speaks to the press about his journey.',
      settingName: 'Moda Center Arena - Press Room',
      intExt: 'int',
      dayNight: 'day',
      pageCount: '2 0/8',
      castMemberIds: [castIds['ALEX (Lead Runner)'], castIds['REPORTER']],
      locationId: locations[4].id,
      dramaticDay: '4',
    },
    {
      sceneNumber: '10',
      title: 'CLOSING - SUNSET RUN',
      description: 'Alex runs into the sunset, ready for the next challenge.',
      settingName: 'Nike Campus',
      intExt: 'ext',
      dayNight: 'sunset',
      pageCount: '1 0/8',
      castMemberIds: [castIds['ALEX (Lead Runner)']],
      locationId: locations[0].id,
      notes: 'Drone shot, magic hour',
      dramaticDay: '5',
    },
  ];

  const sceneIds = {};
  for (const scene of scenes) {
    const id = generateId();
    sceneIds[scene.sceneNumber] = id;
    await db.collection('scenes').doc(id).set({
      ...scene,
      id,
      projectId: PROJECT_ID,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${scenes.length} scenes`);

  // ==================== SHOTS ====================
  console.log('\n🎥 Creating shots...');
  const shots = [
    // Scene 1 shots
    { sceneId: sceneIds['1'], shotNumber: '1A', shotType: 'wide', description: 'Wide establishing shot - Portland skyline at dawn', duration: 5, notes: 'Drone shot' },
    { sceneId: sceneIds['1'], shotNumber: '1B', shotType: 'medium', description: 'Alex running - side tracking shot', duration: 8 },
    { sceneId: sceneIds['1'], shotNumber: '1C', shotType: 'close-up', description: 'Close on Alex\'s feet - Nike shoes', duration: 3, notes: 'Hero product shot' },
    { sceneId: sceneIds['1'], shotNumber: '1D', shotType: 'close-up', description: 'Alex\'s face - determination', duration: 4 },
    
    // Scene 3 shots
    { sceneId: sceneIds['3'], shotNumber: '3A', shotType: 'wide', description: 'Lab reveal - wide shot of testing room', duration: 6 },
    { sceneId: sceneIds['3'], shotNumber: '3B', shotType: 'medium', description: 'Sofia presenting the shoe', duration: 8 },
    { sceneId: sceneIds['3'], shotNumber: '3C', shotType: 'insert', description: 'Shoe beauty shot - rotating platform', duration: 5, notes: 'Marketing hero shot' },
    { sceneId: sceneIds['3'], shotNumber: '3D', shotType: 'close-up', description: 'Alex\'s reaction', duration: 4 },
    
    // Scene 7 shots
    { sceneId: sceneIds['7'], shotNumber: '7A', shotType: 'wide', description: 'Arena establishing - packed crowd', duration: 5 },
    { sceneId: sceneIds['7'], shotNumber: '7B', shotType: 'medium', description: 'Starting line - runners in position', duration: 6 },
    { sceneId: sceneIds['7'], shotNumber: '7C', shotType: 'close-up', description: 'Alex\'s feet in blocks', duration: 3 },
    { sceneId: sceneIds['7'], shotNumber: '7D', shotType: 'medium', description: 'Race start - tracking shot', duration: 10 },
    { sceneId: sceneIds['7'], shotNumber: '7E', shotType: 'wide', description: 'Race progress - overhead drone', duration: 8, notes: 'Drone clearance required' },
    
    // Scene 8 shots
    { sceneId: sceneIds['8'], shotNumber: '8A', shotType: 'medium', description: 'Final stretch - Alex pulling ahead', duration: 6, notes: 'Phantom Flex4K' },
    { sceneId: sceneIds['8'], shotNumber: '8B', shotType: 'close-up', description: 'Finish line cross - slow motion', duration: 4, notes: 'Phantom Flex4K - 1000fps' },
    { sceneId: sceneIds['8'], shotNumber: '8C', shotType: 'medium', description: 'Victory celebration', duration: 8 },
  ];

  for (const shot of shots) {
    const id = generateId();
    await db.collection('shots').doc(id).set({
      ...shot,
      id,
      projectId: PROJECT_ID,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${shots.length} shots`);

  // ==================== SCHEDULE ====================
  console.log('\n📅 Creating schedule...');
  const shootingDays = [
    {
      date: new Date('2024-03-15'),
      dayNumber: 1,
      totalDays: 5,
      callTime: '05:00',
      shootCall: '06:00',
      breakfast: '05:30',
      lunch: '12:00',
      location: 'Downtown Portland',
      locationId: locations[2].id,
      basecampLocationId: locations[0].id,
      crewParkLocationId: locations[0].id,
      nearestHospital: 'OHSU Hospital - 3181 SW Sam Jackson Park Rd',
      notes: 'Early call for golden hour. Street closure 5AM-2PM. Police escort arranged.',
    },
    {
      date: new Date('2024-03-16'),
      dayNumber: 2,
      totalDays: 5,
      callTime: '07:00',
      shootCall: '08:00',
      breakfast: '07:00',
      lunch: '13:00',
      location: 'Nike Innovation Center',
      locationId: locations[1].id,
      basecampLocationId: locations[0].id,
      nearestHospital: 'Providence St. Vincent Medical Center',
      notes: 'Interior day. Nike marketing team on set for product shots.',
    },
    {
      date: new Date('2024-03-17'),
      dayNumber: 3,
      totalDays: 5,
      callTime: '06:00',
      shootCall: '07:00',
      breakfast: '06:00',
      lunch: '12:30',
      location: 'Nike Campus & Forest Park',
      locationId: locations[0].id,
      nearestHospital: 'Providence St. Vincent Medical Center',
      notes: 'Split day: Campus morning, Forest Park afternoon for golden hour.',
    },
    {
      date: new Date('2024-03-18'),
      dayNumber: 4,
      totalDays: 5,
      callTime: '08:00',
      shootCall: '09:00',
      breakfast: '08:00',
      lunch: '13:00',
      location: 'Moda Center Arena',
      locationId: locations[4].id,
      nearestHospital: 'Legacy Emanuel Medical Center',
      notes: 'Arena day. 50 BG for crowd scenes. Phantom Flex4K for finish line.',
    },
    {
      date: new Date('2024-03-19'),
      dayNumber: 5,
      totalDays: 5,
      callTime: '14:00',
      shootCall: '15:00',
      breakfast: '14:00',
      lunch: '18:00',
      location: 'Nike Campus',
      locationId: locations[0].id,
      nearestHospital: 'Providence St. Vincent Medical Center',
      notes: 'Late call for sunset shots. Drone footage. Wrap party after.',
    },
  ];

  const dayIds = [];
  for (const day of shootingDays) {
    const id = generateId();
    dayIds.push(id);
    await db.collection('schedule_days').doc(id).set({
      ...day,
      id,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${shootingDays.length} shooting days`);

  // Schedule events
  const events = [
    // Day 1
    { shootingDayId: dayIds[0], type: 'scene', sceneId: sceneIds['1'], description: 'Scene 1 - Morning Run', time: '06:00', duration: 240, order: 1 },
    { shootingDayId: dayIds[0], type: 'break', description: 'Lunch', time: '12:00', duration: 60, order: 2 },
    
    // Day 2
    { shootingDayId: dayIds[1], type: 'scene', sceneId: sceneIds['2'], description: 'Scene 2 - Lab Arrival', time: '08:00', duration: 120, order: 1 },
    { shootingDayId: dayIds[1], type: 'scene', sceneId: sceneIds['3'], description: 'Scene 3 - Product Reveal', time: '10:30', duration: 150, order: 2 },
    { shootingDayId: dayIds[1], type: 'break', description: 'Lunch', time: '13:00', duration: 60, order: 3 },
    
    // Day 3
    { shootingDayId: dayIds[2], type: 'scene', sceneId: sceneIds['4'], description: 'Scene 4 - Training Montage', time: '07:00', duration: 150, order: 1 },
    { shootingDayId: dayIds[2], type: 'scene', sceneId: sceneIds['5'], description: 'Scene 5 - Coaching', time: '10:00', duration: 90, order: 2 },
    { shootingDayId: dayIds[2], type: 'break', description: 'Lunch', time: '12:30', duration: 60, order: 3 },
    { shootingDayId: dayIds[2], type: 'move', description: 'Company Move to Forest Park', time: '14:00', duration: 60, order: 4 },
    { shootingDayId: dayIds[2], type: 'scene', sceneId: sceneIds['6'], description: 'Scene 6 - Forest Run', time: '16:00', duration: 120, order: 5 },
    
    // Day 4
    { shootingDayId: dayIds[3], type: 'scene', sceneId: sceneIds['7'], description: 'Scene 7 - Competition', time: '09:00', duration: 240, order: 1 },
    { shootingDayId: dayIds[3], type: 'break', description: 'Lunch', time: '13:00', duration: 60, order: 2 },
    { shootingDayId: dayIds[3], type: 'scene', sceneId: sceneIds['8'], description: 'Scene 8 - Victory', time: '14:30', duration: 90, order: 3 },
    { shootingDayId: dayIds[3], type: 'scene', sceneId: sceneIds['9'], description: 'Scene 9 - Press Conference', time: '16:30', duration: 90, order: 4 },
    
    // Day 5
    { shootingDayId: dayIds[4], type: 'scene', sceneId: sceneIds['10'], description: 'Scene 10 - Sunset Run', time: '17:00', duration: 90, order: 1 },
    { shootingDayId: dayIds[4], type: 'wrap', description: 'Wrap & Strike', time: '19:00', duration: 120, order: 2 },
  ];

  for (const event of events) {
    const id = generateId();
    await db.collection('schedule_events').doc(id).set({
      ...event,
      id,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${events.length} schedule events`);

  // ==================== BUDGET ====================
  console.log('\n💰 Creating budget...');
  const budgetCategories = [
    { name: 'Above The Line', order: 0, phase: 'pre-production' },
    { name: 'Production Staff', order: 1, phase: 'production' },
    { name: 'Camera', order: 2, phase: 'production' },
    { name: 'Lighting & Grip', order: 3, phase: 'production' },
    { name: 'Sound', order: 4, phase: 'production' },
    { name: 'Art Department', order: 5, phase: 'production' },
    { name: 'Wardrobe & Makeup', order: 6, phase: 'production' },
    { name: 'Locations', order: 7, phase: 'production' },
    { name: 'Transportation', order: 8, phase: 'production' },
    { name: 'Equipment Rental', order: 9, phase: 'production' },
    { name: 'Catering', order: 10, phase: 'production' },
    { name: 'Cast/Talent', order: 11, phase: 'production' },
    { name: 'Post-Production', order: 12, phase: 'post-production' },
    { name: 'Insurance & Legal', order: 13, phase: 'pre-production' },
    { name: 'Contingency', order: 14, phase: 'other' },
  ];

  const categoryIds = {};
  for (const cat of budgetCategories) {
    const id = generateId();
    categoryIds[cat.name] = id;
    await db.collection('budget_categories').doc(id).set({
      ...cat,
      id,
      projectId: PROJECT_ID,
      createdAt: now,
      updatedAt: now,
    });
  }

  const budgetItems = [
    // Above The Line
    { categoryId: categoryIds['Above The Line'], description: 'Director - Sarah Mitchell', estimatedAmount: 25000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Above The Line'], description: 'Executive Producer - James Chen', estimatedAmount: 20000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Above The Line'], description: 'Line Producer - Maria Rodriguez', estimatedAmount: 12500, unit: 'day', quantity: 5 },
    
    // Production Staff
    { categoryId: categoryIds['Production Staff'], description: 'UPM - David Kim', estimatedAmount: 10000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Production Staff'], description: 'Production Coordinator', estimatedAmount: 4000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Production Staff'], description: '1st AD - Michael Foster', estimatedAmount: 7500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Production Staff'], description: '2nd AD - Lisa Park', estimatedAmount: 4000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Production Staff'], description: 'Production Assistants (4)', estimatedAmount: 5000, unit: 'day', quantity: 5 },
    
    // Camera
    { categoryId: categoryIds['Camera'], description: 'Director of Photography', estimatedAmount: 17500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Camera'], description: 'Camera Operators (2)', estimatedAmount: 11000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Camera'], description: 'AC Team (4)', estimatedAmount: 12500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Camera'], description: 'DIT', estimatedAmount: 4500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Camera'], description: 'Steadicam Operator', estimatedAmount: 7500, unit: 'day', quantity: 5 },
    
    // Lighting & Grip
    { categoryId: categoryIds['Lighting & Grip'], description: 'Gaffer', estimatedAmount: 6000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Lighting & Grip'], description: 'Electric Team (4)', estimatedAmount: 11500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Lighting & Grip'], description: 'Key Grip', estimatedAmount: 5500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Lighting & Grip'], description: 'Grip Team (4)', estimatedAmount: 11250, unit: 'day', quantity: 5 },
    
    // Sound
    { categoryId: categoryIds['Sound'], description: 'Sound Mixer', estimatedAmount: 5000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Sound'], description: 'Boom & Utility', estimatedAmount: 5000, unit: 'day', quantity: 5 },
    
    // Art Department
    { categoryId: categoryIds['Art Department'], description: 'Production Designer', estimatedAmount: 10000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Art Department'], description: 'Art Team', estimatedAmount: 15000, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Art Department'], description: 'Set Dressing & Props', estimatedAmount: 8000, unit: 'allowance', quantity: 1 },
    
    // Wardrobe & Makeup
    { categoryId: categoryIds['Wardrobe & Makeup'], description: 'Costume Designer', estimatedAmount: 7500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Wardrobe & Makeup'], description: 'Wardrobe Team', estimatedAmount: 6500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Wardrobe & Makeup'], description: 'Makeup/Hair Team', estimatedAmount: 11500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Wardrobe & Makeup'], description: 'Wardrobe Purchases/Rentals', estimatedAmount: 5000, unit: 'allowance', quantity: 1 },
    
    // Locations
    { categoryId: categoryIds['Locations'], description: 'Nike World HQ', estimatedAmount: 15000, unit: 'day', quantity: 3 },
    { categoryId: categoryIds['Locations'], description: 'Downtown Portland Street Closure', estimatedAmount: 5000, unit: 'day', quantity: 1 },
    { categoryId: categoryIds['Locations'], description: 'Forest Park Permit', estimatedAmount: 2000, unit: 'day', quantity: 1 },
    { categoryId: categoryIds['Locations'], description: 'Moda Center Arena', estimatedAmount: 25000, unit: 'day', quantity: 1 },
    { categoryId: categoryIds['Locations'], description: 'Location Team', estimatedAmount: 8000, unit: 'day', quantity: 5 },
    
    // Transportation
    { categoryId: categoryIds['Transportation'], description: 'Camera/G&E Trucks', estimatedAmount: 6000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Transportation'], description: 'Production Trailers', estimatedAmount: 6000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Transportation'], description: 'Passenger Vans (3)', estimatedAmount: 2250, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Transportation'], description: 'Insert Car', estimatedAmount: 2500, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Transportation'], description: 'Drivers & Transport Coord', estimatedAmount: 8750, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Transportation'], description: 'Fuel & Mileage', estimatedAmount: 3000, unit: 'allowance', quantity: 1 },
    
    // Equipment Rental
    { categoryId: categoryIds['Equipment Rental'], description: 'Camera Package (2x Alexa Mini LF)', estimatedAmount: 25000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Lens Package', estimatedAmount: 11500, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Lighting Package', estimatedAmount: 18000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Grip Package', estimatedAmount: 12000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Sound Package', estimatedAmount: 4000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Generator & Power Distro', estimatedAmount: 5000, unit: 'week', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Specialty: Drone Package', estimatedAmount: 7500, unit: 'day', quantity: 2 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Specialty: Phantom Flex4K', estimatedAmount: 10000, unit: 'day', quantity: 1 },
    { categoryId: categoryIds['Equipment Rental'], description: 'Steadicam/Trinity', estimatedAmount: 6000, unit: 'day', quantity: 3 },
    
    // Catering
    { categoryId: categoryIds['Catering'], description: 'Craft Services', estimatedAmount: 2500, unit: 'day', quantity: 5 },
    { categoryId: categoryIds['Catering'], description: 'Catered Meals (50 crew)', estimatedAmount: 3500, unit: 'day', quantity: 5 },
    
    // Cast/Talent
    { categoryId: categoryIds['Cast/Talent'], description: 'Lead - Marcus Thompson (Alex)', estimatedAmount: 75000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Supporting - Jasmine Williams (Maya)', estimatedAmount: 24000, unit: 'day', quantity: 3 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Supporting - David Park (Chris)', estimatedAmount: 15000, unit: 'day', quantity: 3 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Supporting - Elena Rodriguez (Sofia)', estimatedAmount: 10000, unit: 'day', quantity: 2 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Day Players', estimatedAmount: 4000, unit: 'day', quantity: 2 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Background (Various)', estimatedAmount: 15000, unit: 'allowance', quantity: 1 },
    { categoryId: categoryIds['Cast/Talent'], description: 'Casting Services', estimatedAmount: 5000, unit: 'flat', quantity: 1 },
    
    // Post-Production
    { categoryId: categoryIds['Post-Production'], description: 'Editor', estimatedAmount: 25000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Post-Production'], description: 'Color Grading', estimatedAmount: 15000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Post-Production'], description: 'Sound Mix & Design', estimatedAmount: 12000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Post-Production'], description: 'VFX & Motion Graphics', estimatedAmount: 30000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Post-Production'], description: 'Music & Licensing', estimatedAmount: 20000, unit: 'flat', quantity: 1 },
    
    // Insurance & Legal
    { categoryId: categoryIds['Insurance & Legal'], description: 'Production Insurance', estimatedAmount: 15000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Insurance & Legal'], description: 'Legal & Contracts', estimatedAmount: 8000, unit: 'flat', quantity: 1 },
    { categoryId: categoryIds['Insurance & Legal'], description: 'Permits & Fees', estimatedAmount: 5000, unit: 'allowance', quantity: 1 },
    
    // Contingency
    { categoryId: categoryIds['Contingency'], description: 'Production Contingency (10%)', estimatedAmount: 75000, unit: 'flat', quantity: 1 },
  ];

  for (const item of budgetItems) {
    const id = generateId();
    await db.collection('budget_items').doc(id).set({
      ...item,
      id,
      projectId: PROJECT_ID,
      status: 'estimated',
      actualAmount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Created ${budgetCategories.length} budget categories and ${budgetItems.length} budget items`);

  // Calculate total budget
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
  console.log(`  Total Estimated Budget: $${totalBudget.toLocaleString()}`);

  // ==================== UPDATE PROJECT ====================
  console.log('\n📝 Updating project metadata...');
  await db.collection('projects').doc(PROJECT_ID).set({
    id: PROJECT_ID,
    name: 'Nike "Breaking Limits" Campaign',
    description: 'A 5-day commercial shoot for Nike\'s new running shoe technology, featuring professional athletes and showcasing the innovation behind their latest product.',
    client: 'Nike, Inc.',
    productionCompany: 'Prodigium Pictures',
    totalBudget,
    shootDays: 5,
    status: 'in-production',
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-15')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-19')),
    // Mark as a template so it can be cloned
    isTemplate: true,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  console.log('\n✅ Nike Demo Project rebuild complete!');
  console.log('\n📊 Summary:');
  console.log(`   - ${locations.length} Locations`);
  console.log(`   - ${crew.length} Crew Members`);
  console.log(`   - ${cast.length} Cast Members`);
  console.log(`   - ${equipment.length} Equipment Items`);
  console.log(`   - ${scenes.length} Scenes`);
  console.log(`   - ${shots.length} Shots`);
  console.log(`   - ${shootingDays.length} Shooting Days`);
  console.log(`   - ${events.length} Schedule Events`);
  console.log(`   - ${budgetCategories.length} Budget Categories`);
  console.log(`   - ${budgetItems.length} Budget Items`);
  console.log(`   - Total Budget: $${totalBudget.toLocaleString()}`);
}

rebuildNikeDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
