#!/usr/bin/env node

/**
 * Complete rebuild of Nike demo project
 * Removes duplicates and creates a Hollywood-quality reference project
 */

const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'doublecheck-9f8c1'
  });
}

const db = admin.firestore();
const DEMO_PROJECT_ID = 'demo-nike-project';

async function rebuildNikeDemo() {
  console.log('🎬 REBUILDING NIKE DEMO - Complete Production-Quality Project\n');
  console.log('Step 1: Cleaning up old data...\n');

  try {
    // Delete all old data for demo project
    const collections = ['crew', 'cast', 'equipment', 'locations', 'scenes', 'shots', 
                        'budgetCategories', 'shootingDays', 'scheduleEvents', 
                        'project_members', 'department_heads', 'role_requests'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('projectId', '==', DEMO_PROJECT_ID)
        .get();
      
      console.log(`Deleting ${snapshot.size} old ${collectionName}...`);
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    console.log('\n✅ Cleanup complete!\n');
    console.log('Step 1.5: Creating Nike demo project document...\n');

    // CREATE THE PROJECT ITSELF
    await db.collection('projects').doc(DEMO_PROJECT_ID).set({
      id: DEMO_PROJECT_ID,
      orgId: 'demo-public',
      title: 'Nike Commercial - "Just Do It" Campaign',
      client: 'Nike Inc.',
      description: 'High-energy commercial featuring athletes. This is a demo project showcasing all DOUBLEcheck features.',
      status: 'production',
      projectType: 'commercial',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-03')),
      budget: 250000,
      isPublic: true,
      isTemplate: true,
      coverImageUrl: 'https://placehold.co/800x400/000000/FFFFFF?text=Nike+Commercial',
      customCastTypes: [],
      customCrewDepartments: [],
      customRolesByDepartment: {},
      customEquipmentCategories: [],
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Created Nike demo project document\n');
    console.log('Step 2: Creating production-quality crew (21 members)...\n');

    // CREW - Properly organized by department with complete details
    const crew = [
      // Production Department
      { name: 'Sarah Johnson', role: 'Director', department: 'Production', email: 'sarah.johnson@production.com', phone: '(503) 555-0101', rate: 2500, status: 'confirmed' },
      { name: 'Morgan Davis', role: 'Producer', department: 'Production', email: 'morgan.davis@production.com', phone: '(503) 555-0102', rate: 2000, status: 'confirmed' },
      { name: 'Chris Anderson', role: '1st AD', department: 'Production', email: 'chris.anderson@production.com', phone: '(503) 555-0103', rate: 1200, status: 'confirmed' },
      { name: 'Jordan Martinez', role: 'Production Coordinator', department: 'Production', email: 'jordan.martinez@production.com', rate: 800, status: 'confirmed' },
      { name: 'Taylor Kim', role: 'PA', department: 'Production', email: 'taylor.kim@production.com', rate: 300, status: 'confirmed' },
      
      // Camera Department
      { name: 'Alex Rivera', role: 'Director of Photography', department: 'Camera', email: 'alex.rivera@camera.com', phone: '(310) 555-0201', rate: 2000, status: 'confirmed' },
      { name: 'Jamie Lee', role: '1st AC', department: 'Camera', email: 'jamie.lee@camera.com', rate: 700, status: 'confirmed' },
      { name: 'Casey Wong', role: '2nd AC', department: 'Camera', email: 'casey.wong@camera.com', rate: 600, status: 'confirmed' },
      { name: 'Sam Chen', role: 'DIT', department: 'Camera', email: 'sam.chen@camera.com', rate: 650, status: 'confirmed' },
      
      // Lighting Department
      { name: 'Chris Martinez', role: 'Gaffer', department: 'Lighting', email: 'chris.martinez@lighting.com', phone: '(310) 555-0301', rate: 900, status: 'confirmed' },
      { name: 'Riley Johnson', role: 'Best Boy Electric', department: 'Lighting', email: 'riley.johnson@lighting.com', rate: 650, status: 'confirmed' },
      { name: 'Pat Thompson', role: 'Electric', department: 'Lighting', email: 'pat.thompson@lighting.com', rate: 500, status: 'confirmed' },
      
      // Grip Department
      { name: 'Taylor Swift', role: 'Key Grip', department: 'Grip', email: 'taylor.swift@grip.com', phone: '(310) 555-0401', rate: 900, status: 'confirmed' },
      { name: 'Morgan Lee', role: 'Best Boy Grip', department: 'Grip', email: 'morgan.lee@grip.com', rate: 650, status: 'confirmed' },
      { name: 'Alex Kim', role: 'Grip', department: 'Grip', email: 'alex.kim@grip.com', rate: 500, status: 'confirmed' },
      
      // Sound Department
      { name: 'Jordan Kim', role: 'Sound Mixer', department: 'Sound', email: 'jordan.kim@sound.com', phone: '(310) 555-0501', rate: 1000, status: 'confirmed' },
      { name: 'Drew Anderson', role: 'Boom Operator', department: 'Sound', email: 'drew.anderson@sound.com', rate: 700, status: 'confirmed' },
      
      // Art Department
      { name: 'Skyler Brown', role: 'Art Director', department: 'Art', email: 'skyler.brown@art.com', rate: 1200, status: 'confirmed' },
      { name: 'River Garcia', role: 'Props', department: 'Art', email: 'river.garcia@art.com', rate: 600, status: 'confirmed' },
      
      // Hair & Makeup
      { name: 'Cameron White', role: 'Key Hair/Makeup', department: 'Hair & Makeup', email: 'cameron.white@makeup.com', rate: 800, status: 'confirmed' },
      { name: 'Dakota Martinez', role: 'Makeup Assistant', department: 'Hair & Makeup', email: 'dakota.martinez@makeup.com', rate: 500, status: 'confirmed' },
    ];

    for (const member of crew) {
      await db.collection('crew').add({
        ...member,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${crew.length} crew members (no duplicates)\n`);
    
    console.log('Step 3: Creating cast with complete details (7 members)...\n');

    // CAST - With complete information
    const cast = [
      { 
        actorName: 'LeBron James', 
        characterName: 'Himself', 
        castType: 'lead',
        rate: 50000,
        agent: 'Maverick Carter Management',
        email: 'booking@maverickmanagement.com',
        phone: '(310) 555-1001',
      },
      { 
        actorName: 'Serena Williams', 
        characterName: 'Herself', 
        castType: 'supporting',
        rate: 40000,
        agent: 'IMG',
        email: 'talent@img.com',
        phone: '(212) 555-1002',
      },
      { 
        actorName: 'Cristiano Ronaldo', 
        characterName: 'Himself', 
        castType: 'supporting',
        rate: 45000,
        agent: 'Gestifute',
        email: 'bookings@gestifute.com',
        phone: '+351 555 1003',
      },
      { 
        actorName: 'Marcus Thompson', 
        characterName: 'Young Athlete 1', 
        castType: 'featured',
        rate: 2000,
        email: 'marcus.thompson@sag.com',
      },
      { 
        actorName: 'Elena Rodriguez', 
        characterName: 'Young Athlete 2', 
        castType: 'featured',
        rate: 2000,
        email: 'elena.rodriguez@sag.com',
      },
      { 
        actorName: 'Basketball Players', 
        characterName: 'Court Players', 
        castType: 'extra',
        rate: 800,
        email: 'extras@centralcasting.com',
      },
      { 
        actorName: 'Beach Runners', 
        characterName: 'Beach Athletes', 
        castType: 'extra',
        rate: 600,
        email: 'extras@centralcasting.com',
      },
    ];

    for (const member of cast) {
      await db.collection('cast').add({
        ...member,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${cast.length} cast members with complete details\n`);

    console.log('Step 4: Creating equipment with technical specs (30 items)...\n');

    // EQUIPMENT - Organized by department with rental rates
    const equipment = [
      // Camera Package
      { name: 'RED Komodo 6K', category: 'Camera', quantity: 2, dailyRate: 800, weeklyRate: 4000, description: 'Main camera body - 6K sensor' },
      { name: 'ARRI Signature Prime Set', category: 'Lenses', quantity: 1, dailyRate: 2000, weeklyRate: 10000, description: '18, 25, 35, 50, 75, 125mm' },
      { name: 'Zoom Lens 24-70mm f/2.8', category: 'Lenses', quantity: 1, dailyRate: 200, weeklyRate: 1000 },
      { name: 'Matte Box & Filters', category: 'Camera', quantity: 2, dailyRate: 150, weeklyRate: 750 },
      { name: 'Follow Focus System', category: 'Camera', quantity: 2, dailyRate: 100, weeklyRate: 500 },
      { name: 'Wireless Video TX', category: 'Camera', quantity: 2, dailyRate: 200, weeklyRate: 1000, description: 'Teradek Bolt' },
      { name: '4TB SSD Media Cards', category: 'Camera', quantity: 10, dailyRate: 50, weeklyRate: 250 },
      { name: 'Camera Cage & Accessories', category: 'Camera', quantity: 2, dailyRate: 75, weeklyRate: 375 },
      { name: 'Tripod Sachtler Video 25', category: 'Camera', quantity: 2, dailyRate: 100, weeklyRate: 500 },
      { name: 'Steadicam with Vest', category: 'Camera', quantity: 1, dailyRate: 800, weeklyRate: 4000, description: 'Includes operator' },
      
      // Lighting
      { name: 'ARRI SkyPanel S60-C', category: 'Lighting', quantity: 4, dailyRate: 400, weeklyRate: 2000 },
      { name: 'Aputure 600D', category: 'Lighting', quantity: 2, dailyRate: 250, weeklyRate: 1250 },
      { name: 'ARRI M18 HMI', category: 'Lighting', quantity: 1, dailyRate: 350, weeklyRate: 1750 },
      { name: 'LED Panel Kit 4x1', category: 'Lighting', quantity: 1, dailyRate: 200, weeklyRate: 1000, description: 'Litepanels' },
      { name: 'Practical Bulbs & Dimmers', category: 'Lighting', quantity: 1, dailyRate: 100, weeklyRate: 500 },
      { name: 'Light Stands', category: 'Lighting', quantity: 12, dailyRate: 20, weeklyRate: 100 },
      { name: 'Flags, Silks, Diffusion', category: 'Lighting', quantity: 1, dailyRate: 150, weeklyRate: 750, description: 'Complete kit' },
      { name: 'Power Distribution', category: 'Lighting', quantity: 1, dailyRate: 100, weeklyRate: 500, description: 'Distro boxes, cables' },
      
      // Grip
      { name: 'C-Stands', category: 'Grip', quantity: 12, dailyRate: 15, weeklyRate: 75 },
      { name: '8x8 Frame', category: 'Grip', quantity: 4, dailyRate: 60, weeklyRate: 300 },
      { name: '12x12 Frame', category: 'Grip', quantity: 2, dailyRate: 80, weeklyRate: 400 },
      { name: 'Apple Boxes Full Set', category: 'Grip', quantity: 1, dailyRate: 40, weeklyRate: 200 },
      { name: 'Sandbags', category: 'Grip', quantity: 20, dailyRate: 5, weeklyRate: 25 },
      { name: 'Carts & Dollies', category: 'Grip', quantity: 1, dailyRate: 150, weeklyRate: 750 },
      
      // Sound
      { name: 'Sound Devices 833 Mixer', category: 'Sound', quantity: 1, dailyRate: 400, weeklyRate: 2000 },
      { name: 'Boom Mic Sennheiser MKH 416', category: 'Sound', quantity: 1, dailyRate: 100, weeklyRate: 500 },
      { name: 'Wireless Lavs Lectrosonics 4ch', category: 'Sound', quantity: 1, dailyRate: 300, weeklyRate: 1500 },
      { name: 'Boom Pole & Accessories', category: 'Sound', quantity: 1, dailyRate: 50, weeklyRate: 250 },
      
      // Specialty
      { name: 'DJI Drone with Operator', category: 'Camera', quantity: 1, dailyRate: 1500, weeklyRate: 7500, description: 'Inspire 3, licensed pilot' },
      { name: 'Technocrane 30ft', category: 'Grip', quantity: 1, dailyRate: 3000, weeklyRate: 15000, description: 'With operator' },
    ];

    for (const item of equipment) {
      await db.collection('equipment').add({
        ...item,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${equipment.length} equipment items with rental rates\n`);

    console.log('Step 5: Creating detailed locations (3)...\n');

    // LOCATIONS - Complete with permits, contacts, scout info
    const locations = [
      {
        name: 'Nike World Headquarters',
        address: '1 Bowerman Dr, Beaverton, OR 97005',
        type: 'indoor',
        description: 'Modern corporate campus - Innovation Kitchen, athlete training facilities, product studio',
        rentalCost: 5000,
        contactName: 'Nike Production Liaison',
        contactPhone: '(503) 555-9000',
        contactEmail: 'production@nike.com',
        parking: '50 spaces available',
        power: '220V available on site',
        permits: 'Nike internal approval required',
        insurance: '$2M liability required',
      },
      {
        name: 'Downtown LA Street Basketball Court',
        address: '123 Spring St, Los Angeles, CA 90012',
        type: 'outdoor',
        description: 'Urban street court with graffiti backdrop, chain-link fence, city skyline views',
        rentalCost: 2000,
        contactName: 'LA Film Office',
        contactPhone: '(213) 555-4000',
        contactEmail: 'permits@filmla.com',
        permits: 'City of LA film permit #2026-0234',
        parking: 'Street parking + basecamp 2 blocks',
        power: 'Generator required',
        restrictions: 'Street closure 6am-6pm',
      },
      {
        name: 'Venice Beach Boardwalk',
        address: 'Venice Beach, CA 90291',
        type: 'outdoor',
        description: 'Iconic California beach - boardwalk, muscle beach, sunrise over ocean',
        rentalCost: 1500,
        contactName: 'Venice Beach Recreation',
        contactPhone: '(310) 555-6000',
        contactEmail: 'permits@venicebeach.com',
        permits: 'LA County Parks permit required',
        parking: 'Lot C - $500',
        restrictions: 'Best 5:30-8:00 AM, no drones without permit',
        permitRequired: true,
      },
    ];

    const locationIds = {};
    for (const location of locations) {
      const docRef = await db.collection('locations').add({
        ...location,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      locationIds[location.name] = docRef.id;
    }
    
    console.log(`✅ Created ${locations.length} locations with complete details\n`);

    console.log('Step 6: Creating detailed scenes (4)...\n');

    // SCENES - Complete production breakdown
    const scenes = [
      {
        sceneNumber: '1',
        title: 'Opening Montage - Dawn Warriors',
        description: 'Athletes training at sunrise - runners on beach, pull-ups on bars, sprints in sand. Intercut with Nike shoe close-ups. Energetic, inspirational.',
        intExt: 'EXT',
        dayNight: 'DAWN',
        locationId: locationIds['Venice Beach Boardwalk'],
        locationName: 'Venice Beach Boardwalk',
        pageCount: '1.5',
        duration: 45,
        status: 'not-shot',
        specialRequirements: 'Golden hour timing critical (5:30-6:30 AM), beach access permits',
        continuityNotes: JSON.stringify({
          wardrobe: ['Nike training gear - coordinated black/white/neon'],
          props: ['Resistance bands', 'Jump ropes', 'Nike water bottles'],
          timeOfDay: '5:30 AM - Golden Hour',
        }),
        vfxNotes: 'Speed ramps in post, warm sunrise color grade',
      },
      {
        sceneNumber: '2',
        title: 'LeBron Speech - Inspiration',
        description: 'LeBron James direct-to-camera motivational speech. Clean corporate background. Emotional, powerful delivery. Just Do It message.',
        intExt: 'INT',
        dayNight: 'DAY',
        locationId: locationIds['Nike World Headquarters'],
        locationName: 'Nike HQ - Innovation Kitchen',
        pageCount: '0.5',
        duration: 20,
        status: 'not-shot',
        specialRequirements: 'Minimal setup, clean corporate environment',
        continuityNotes: JSON.stringify({
          wardrobe: ['Nike Tech fleece hoodie (black)'],
          props: [],
          timeOfDay: '8:30 AM',
        }),
      },
      {
        sceneNumber: '3',
        title: 'Basketball Game - Competition',
        description: 'Intense street basketball game. Fast-paced, athletic. Multiple angles of drives, dunks, crossovers. Focus on footwork and Nike shoes. Urban energy.',
        intExt: 'EXT',
        dayNight: 'DAY',
        locationId: locationIds['Downtown LA Street Basketball Court'],
        locationName: 'LA Street Basketball Court',
        pageCount: '2.0',
        duration: 60,
        status: 'not-shot',
        specialRequirements: 'Street closure 8am-6pm, traffic control, crowd management, stunt coordinator',
        continuityNotes: JSON.stringify({
          wardrobe: ['Mix of Nike basketball gear', 'Street style'],
          props: ['Basketballs (Spalding)', 'Water station', 'Chalk dust'],
          timeOfDay: '9:00 AM - 12:00 PM',
        }),
        stuntsRequired: true,
      },
      {
        sceneNumber: '4',
        title: 'Product Showcase - Innovation',
        description: 'Macro product shots of new Nike Air Max. Rotating turntable, dramatic lighting. Detail shots of swoosh, air bubble, materials. Premium, luxury feel.',
        intExt: 'INT',
        dayNight: 'DAY',
        locationId: locationIds['Nike World Headquarters'],
        locationName: 'Nike HQ - Product Studio',
        pageCount: '0.5',
        duration: 15,
        status: 'not-shot',
        specialRequirements: 'Motion control rig, product turntable, specialized macro lighting',
        continuityNotes: JSON.stringify({
          props: ['Nike Air Max shoes (3 colorways)', 'White seamless backdrop', 'Pedestals'],
        }),
      },
    ];

    const sceneIds = {};
    for (const scene of scenes) {
      const docRef = await db.collection('scenes').add({
        ...scene,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      sceneIds[scene.sceneNumber] = docRef.id;
    }
    
    console.log(`✅ Created ${scenes.length} scenes with complete breakdowns\n`);

    console.log('Step 7: Creating shots with full technical specs (21 shots)...\n');

    // SHOTS - Complete technical specifications
    const shots = [
      // Scene 1 shots
      { sceneId: sceneIds['1'], shotNumber: '1A', shotType: 'Master', cameraAngle: 'High angle drone', lens: '16mm', movement: 'Descending crane', duration: 10, description: 'Aerial Venice Beach at sunrise', fStop: 'f/5.6', frameRate: '24fps', iso: 400, coverageType: 'master', isMaster: true },
      { sceneId: sceneIds['1'], shotNumber: '1B', shotType: 'Medium', cameraAngle: 'Eye level profile', lens: '50mm', movement: 'Steadicam tracking', duration: 8, description: 'Serena running on beach', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'medium' },
      { sceneId: sceneIds['1'], shotNumber: '1C', shotType: 'Insert', cameraAngle: 'Low angle', lens: '100mm macro', movement: 'Slow push', duration: 5, description: 'Nike shoe hitting sand', fStop: 'f/4', frameRate: '120fps', coverageType: 'insert' },
      { sceneId: sceneIds['1'], shotNumber: '1D', shotType: 'Medium', cameraAngle: 'Low angle', lens: '35mm', movement: 'Static', duration: 6, description: 'Pull-ups on Muscle Beach bar', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'medium' },
      { sceneId: sceneIds['1'], shotNumber: '1E', shotType: 'Wide', cameraAngle: 'Eye level', lens: '24mm', movement: 'Slow pan right', duration: 8, description: 'All athletes training in unison', fStop: 'f/5.6', frameRate: '24fps', coverageType: 'master' },
      { sceneId: sceneIds['1'], shotNumber: '1F', shotType: 'Wide', cameraAngle: 'Backlit', lens: '85mm', movement: 'Static', duration: 8, description: 'Silhouette against sunrise', fStop: 'f/11', frameRate: '60fps', coverageType: 'cutaway' },
      
      // Scene 2 shots
      { sceneId: sceneIds['2'], shotNumber: '2A', shotType: 'Master', cameraAngle: 'Straight on', lens: '50mm', movement: 'Slow push', duration: 15, description: 'LeBron speaking to camera', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'master', isMaster: true },
      { sceneId: sceneIds['2'], shotNumber: '2B', shotType: 'Close-up', cameraAngle: 'Tight, low', lens: '85mm', movement: 'Static', duration: 10, description: 'Tight on LeBron face', fStop: 'f/2', frameRate: '24fps', coverageType: 'closeup' },
      { sceneId: sceneIds['2'], shotNumber: '2C', shotType: 'Insert', cameraAngle: 'Detail', lens: '100mm', movement: 'Rack focus', duration: 5, description: 'Nike logo to eyes', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'insert' },
      
      // Scene 3 shots
      { sceneId: sceneIds['3'], shotNumber: '3A', shotType: 'Master', cameraAngle: 'High angle', lens: '24mm', movement: 'Crane down', duration: 12, description: 'Wide establishing basketball game', fStop: 'f/5.6', frameRate: '24fps', coverageType: 'master', isMaster: true },
      { sceneId: sceneIds['3'], shotNumber: '3B', shotType: 'Medium', cameraAngle: 'Eye level tracking', lens: '50mm', movement: 'Handheld follow', duration: 8, description: 'Cristiano drives to basket', fStop: 'f/2.8', frameRate: '60fps', coverageType: 'medium' },
      { sceneId: sceneIds['3'], shotNumber: '3C', shotType: 'Insert', cameraAngle: 'Low angle', lens: '85mm', movement: 'Slow motion', duration: 5, description: 'Shoes pivoting on asphalt', fStop: 'f/4', frameRate: '240fps', coverageType: 'insert' },
      { sceneId: sceneIds['3'], shotNumber: '3D', shotType: 'Wide', cameraAngle: 'Drone overhead', lens: '16mm', movement: 'Circular orbit', duration: 10, description: 'Aerial dunk view', fStop: 'Auto', frameRate: '60fps', coverageType: 'cutaway' },
      { sceneId: sceneIds['3'], shotNumber: '3E', shotType: 'Close-up', cameraAngle: 'Various', lens: '85mm', movement: 'Static', duration: 8, description: 'Determined faces montage', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'closeup' },
      { sceneId: sceneIds['3'], shotNumber: '3F', shotType: 'Insert', cameraAngle: 'Low angle', lens: '50mm', movement: 'Static', duration: 6, description: 'Ball through net slow-mo', fStop: 'f/5.6', frameRate: '240fps', coverageType: 'insert' },
      { sceneId: sceneIds['3'], shotNumber: '3G', shotType: 'Medium', cameraAngle: 'Eye level', lens: '35mm', movement: 'Handheld', duration: 6, description: 'Players celebrating', fStop: 'f/2.8', frameRate: '24fps', coverageType: 'medium' },
      { sceneId: sceneIds['3'], shotNumber: '3H', shotType: 'Close-up', cameraAngle: 'Hero angle', lens: '50mm', movement: 'Slow reveal', duration: 5, description: 'Cristiano shoes in hero light', fStop: 'f/2.8', frameRate: '60fps', coverageType: 'closeup' },
      
      // Scene 4 shots
      { sceneId: sceneIds['4'], shotNumber: '4A', shotType: 'Master', cameraAngle: '45-degree', lens: '50mm', movement: 'Turntable rotation', duration: 8, description: 'Nike Air Max hero shot', fStop: 'f/8', frameRate: '24fps', coverageType: 'master', isMaster: true },
      { sceneId: sceneIds['4'], shotNumber: '4B', shotType: 'Insert', cameraAngle: 'Macro', lens: '100mm macro', movement: 'Slow push', duration: 5, description: 'Air bubble detail', fStop: 'f/4', frameRate: '60fps', coverageType: 'insert' },
      { sceneId: sceneIds['4'], shotNumber: '4C', shotType: 'Medium', cameraAngle: 'Straight on', lens: '50mm', movement: '360° rotation', duration: 10, description: 'Complete shoe rotation', fStop: 'f/8', frameRate: '24fps', coverageType: 'medium' },
      { sceneId: sceneIds['4'], shotNumber: '4D', shotType: 'Medium', cameraAngle: 'Elevated', lens: '35mm', movement: 'Crane down', duration: 7, description: 'Shoe with Nike gear context', fStop: 'f/5.6', frameRate: '24fps', coverageType: 'medium' },
    ];

    for (const shot of shots) {
      await db.collection('shots').add({
        ...shot,
        projectId: DEMO_PROJECT_ID,
        status: 'not-shot',
        sortOrder: shots.indexOf(shot) * 1000,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${shots.length} shots with complete technical specs\n`);

    console.log('Step 8: Creating detailed shooting schedule (3 days)...\n');

    // SHOOTING DAYS
    const shootingDays = [
      {
        date: new Date('2026-02-01T05:00:00'),
        dayNumber: 1,
        callTime: '5:00 AM',
        location: 'Venice Beach Boardwalk',
        weather: 'Clear, 62°F, Sunrise 6:42 AM',
        notes: 'Golden hour shoot - timing critical. Beach access permits confirmed.',
        status: 'scheduled',
      },
      {
        date: new Date('2026-02-02T06:00:00'),
        dayNumber: 2,
        callTime: '6:00 AM',
        location: 'Nike World Headquarters',
        weather: 'Partly cloudy, 55°F',
        notes: 'Nike HQ - Two locations (Innovation Kitchen AM, Product Studio PM)',
        status: 'scheduled',
      },
      {
        date: new Date('2026-02-03T07:00:00'),
        dayNumber: 3,
        callTime: '7:00 AM',
        location: 'Downtown LA Street Basketball Court',
        weather: 'Sunny, 68°F',
        notes: 'Street closure 7am-4pm. Traffic control arranged. Drone permit approved.',
        status: 'scheduled',
      },
    ];

    const dayIds = {};
    for (const day of shootingDays) {
      const docRef = await db.collection('shootingDays').add({
        ...day,
        projectId: DEMO_PROJECT_ID,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      dayIds[day.dayNumber] = docRef.id;
    }
    
    console.log(`✅ Created ${shootingDays.length} shooting days with detailed schedules\n`);

    console.log('Step 9: Creating schedule events (scene-to-day mapping)...\n');

    // SCHEDULE EVENTS
    const scheduleEvents = [
      { shootingDayId: dayIds[1], sceneId: sceneIds['1'], sceneNumber: '1', description: 'Opening Montage', location: 'Venice Beach', duration: 45, order: 0 },
      { shootingDayId: dayIds[2], sceneId: sceneIds['2'], sceneNumber: '2', description: 'LeBron Speech', location: 'Nike HQ', duration: 20, order: 0 },
      { shootingDayId: dayIds[2], sceneId: sceneIds['4'], sceneNumber: '4', description: 'Product Shots', location: 'Nike HQ Studio', duration: 15, order: 1 },
      { shootingDayId: dayIds[3], sceneId: sceneIds['3'], sceneNumber: '3', description: 'Basketball Game', location: 'LA Street Court', duration: 60, order: 0 },
    ];

    for (const event of scheduleEvents) {
      await db.collection('scheduleEvents').add({
        ...event,
        projectId: DEMO_PROJECT_ID,
        type: 'scene',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${scheduleEvents.length} schedule events\n`);

    console.log('Step 10: Creating comprehensive budget ($250,000)...\n');

    // BUDGET CATEGORIES - Complete breakdown
    const budgetCategories = [
      { name: 'Above the Line', order: 0, isCategory: true },
      { name: 'Director', categoryName: 'Above the Line', estimatedAmount: 7500, description: 'Sarah Johnson - 3 days', unitRate: 2500, quantity: 3, unit: 'days', order: 1 },
      { name: 'Producer', categoryName: 'Above the Line', estimatedAmount: 6000, description: 'Morgan Davis - 3 days', unitRate: 2000, quantity: 3, unit: 'days', order: 2 },
      { name: 'DP', categoryName: 'Above the Line', estimatedAmount: 6000, description: 'Alex Rivera - 3 days', unitRate: 2000, quantity: 3, unit: 'days', order: 3 },
      { name: 'Agency Fee', categoryName: 'Above the Line', estimatedAmount: 15000, description: 'Wieden+Kennedy', order: 4 },
      
      { name: 'Talent', order: 5, isCategory: true },
      { name: 'LeBron James', categoryName: 'Talent', estimatedAmount: 50000, description: 'Lead - Buyout', order: 6 },
      { name: 'Serena Williams', categoryName: 'Talent', estimatedAmount: 40000, description: 'Featured - Buyout', order: 7 },
      { name: 'Cristiano Ronaldo', categoryName: 'Talent', estimatedAmount: 45000, description: 'Featured - Buyout', order: 8 },
      { name: 'Supporting Cast', categoryName: 'Talent', estimatedAmount: 4000, description: 'SAG principals', order: 9 },
      { name: 'Extras', categoryName: 'Talent', estimatedAmount: 6000, description: 'Background players', order: 10 },
      
      { name: 'Camera Department', order: 11, isCategory: true },
      { name: 'Camera Crew', categoryName: 'Camera Department', estimatedAmount: 7200, description: '1st AC, 2nd AC, DIT - 3 days', order: 12 },
      { name: 'Camera Package', categoryName: 'Camera Department', estimatedAmount: 4500, description: 'RED Komodo, lenses, accessories', order: 13 },
      
      { name: 'Lighting & Grip', order: 14, isCategory: true },
      { name: 'Lighting Crew', categoryName: 'Lighting & Grip', estimatedAmount: 6600, description: 'Gaffer, Best Boy, Electric', order: 15 },
      { name: 'Grip Crew', categoryName: 'Lighting & Grip', estimatedAmount: 6600, description: 'Key Grip, Best Boy, Grips', order: 16 },
      { name: 'Lighting Package', categoryName: 'Lighting & Grip', estimatedAmount: 4200, description: 'ARRI, Aputure lights', order: 17 },
      { name: 'Grip Package', categoryName: 'Lighting & Grip', estimatedAmount: 1800, description: 'C-stands, frames, rigging', order: 18 },
      
      { name: 'Sound', order: 19, isCategory: true },
      { name: 'Sound Crew', categoryName: 'Sound', estimatedAmount: 5100, description: 'Mixer, boom op - 3 days', order: 20 },
      { name: 'Sound Package', categoryName: 'Sound', estimatedAmount: 1200, description: 'SD 833, mics, wireless', order: 21 },
      
      { name: 'Locations', order: 22, isCategory: true },
      { name: 'Nike HQ', categoryName: 'Locations', estimatedAmount: 10000, description: '2 days rental', order: 23 },
      { name: 'LA Street Court', categoryName: 'Locations', estimatedAmount: 2000, description: '1 day + street closure', order: 24 },
      
      { name: 'Production', order: 25, isCategory: true },
      { name: 'Catering', categoryName: 'Production', estimatedAmount: 5400, description: '60 people x 3 days', order: 26 },
      { name: 'Transportation', categoryName: 'Production', estimatedAmount: 4000, order: 27 },
      { name: 'Permits', categoryName: 'Production', estimatedAmount: 3000, description: 'LA Film, Parks permits', order: 28 },
      
      { name: 'Post-Production', order: 29, isCategory: true },
      { name: 'Editing', categoryName: 'Post-Production', estimatedAmount: 8000, description: '1 week', order: 30 },
      { name: 'Color Grading', categoryName: 'Post-Production', estimatedAmount: 3000, order: 31 },
      { name: 'Sound Mix', categoryName: 'Post-Production', estimatedAmount: 2500, order: 32 },
    ];

    for (const item of budgetCategories) {
      await db.collection('budgetCategories').add({
        ...item,
        projectId: DEMO_PROJECT_ID,
        actualAmount: 0,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created ${budgetCategories.length} budget line items\n`);

    console.log('Step 11: Adding admin features...\n');

    // PROJECT MEMBERS
    const projectMembers = [
      { userId: 'demo-owner', email: 'sarah.johnson@production.com', displayName: 'Sarah Johnson', role: 'owner', status: 'active' },
      { userId: 'demo-admin', email: 'morgan.davis@production.com', displayName: 'Morgan Davis', role: 'admin', status: 'active' },
      { userId: 'demo-depthead', email: 'alex.rivera@camera.com', displayName: 'Alex Rivera', role: 'dept_head', status: 'active' },
      { userId: null, email: 'pending@example.com', displayName: 'Pending Member', role: 'crew', status: 'pending' },
    ];

    for (const member of projectMembers) {
      await db.collection('project_members').add({
        ...member,
        projectId: DEMO_PROJECT_ID,
        invitedBy: 'system',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        joinedAt: member.status === 'active' ? admin.firestore.FieldValue.serverTimestamp() : null,
      });
    }

    // DEPARTMENT HEADS
    await db.collection('department_heads').add({
      projectId: DEMO_PROJECT_ID,
      userId: 'demo-depthead',
      department: 'Camera',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('department_heads').add({
      projectId: DEMO_PROJECT_ID,
      userId: 'demo-depthead',
      department: 'Lighting',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ROLE REQUEST
    await db.collection('role_requests').add({
      projectId: DEMO_PROJECT_ID,
      requestedByUserId: 'demo-request-user',
      requestedByEmail: 'john.doe@freelancer.com',
      requestedByName: 'John Doe',
      requestedRole: 'crew',
      requestedDepartment: 'Sound',
      message: 'I have 5 years of experience as a boom operator and would love to join your sound department.',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ Added project members, department heads, role requests\n`);

    console.log('\n🎉 NIKE DEMO REBUILD COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Crew: ${crew.length} members (no duplicates)`);
    console.log(`   - Cast: ${cast.length} members with agents`);
    console.log(`   - Equipment: ${equipment.length} items with rates`);
    console.log(`   - Locations: ${locations.length} with permits & contacts`);
    console.log(`   - Scenes: ${scenes.length} with complete breakdowns`);
    console.log(`   - Shots: ${shots.length} with technical specs`);
    console.log(`   - Budget Items: ${budgetCategories.length}`);
    console.log(`   - Shooting Days: ${shootingDays.length} with schedules`);
    console.log(`   - Total Budget: $250,000`);
    console.log('\n✨ Production-quality Nike commercial demo ready!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

rebuildNikeDemo();

