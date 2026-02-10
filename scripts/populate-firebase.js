#!/usr/bin/env node

/**
 * Populate Firebase with templates and demo Nike project
 * Run with: node scripts/populate-firebase.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'doublecheck-9f8c1'
});

const db = admin.firestore();

// Equipment Templates
const equipmentTemplates = [
  {
    id: 'film',
    name: 'Feature Film Equipment',
    description: 'Standard equipment package for feature film production',
    type: 'film',
    items: [
      { name: 'ARRI ALEXA Mini LF', category: 'Camera', quantity: 1, required: true, dailyRate: 1500, description: 'Professional cinema camera' },
      { name: 'Camera Assistant Kit', category: 'Camera', quantity: 1, required: true, dailyRate: 200 },
      { name: 'Memory Cards (512GB)', category: 'Camera', quantity: 6, required: true, dailyRate: 50 },
      { name: 'ARRI Signature Prime Set', category: 'Lenses', quantity: 1, required: true, dailyRate: 2000 },
      { name: 'Zoom Lens (24-70mm)', category: 'Lenses', quantity: 1, dailyRate: 800 },
      { name: 'ARRI SkyPanel S60-C', category: 'Lighting', quantity: 4, required: true, dailyRate: 400 },
      { name: 'ARRI M18 HMI', category: 'Lighting', quantity: 2, required: true, dailyRate: 350 },
      { name: 'Light Stands', category: 'Lighting', quantity: 10, required: true, dailyRate: 20 },
      { name: 'C-Stands', category: 'Grip', quantity: 12, required: true, dailyRate: 15 },
      { name: '12x12 Frame', category: 'Grip', quantity: 2, dailyRate: 80 },
      { name: 'Flags/Silks Package', category: 'Grip', quantity: 1, required: true, dailyRate: 150 },
      { name: 'Sound Devices 833', category: 'Sound', quantity: 1, required: true, dailyRate: 400 },
      { name: 'Boom Microphone', category: 'Sound', quantity: 2, required: true, dailyRate: 100 },
      { name: 'Wireless Lav Mics', category: 'Sound', quantity: 4, required: true, dailyRate: 150 },
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Production Equipment',
    description: 'Essential equipment for commercial shoots',
    type: 'commercial',
    items: [
      { name: 'RED Komodo 6K', category: 'Camera', quantity: 1, required: true, dailyRate: 800 },
      { name: 'Camera Package', category: 'Camera', quantity: 1, required: true, dailyRate: 300 },
      { name: 'Prime Lens Set', category: 'Lenses', quantity: 1, required: true, dailyRate: 600 },
      { name: 'ARRI SkyPanel S60', category: 'Lighting', quantity: 3, required: true, dailyRate: 350 },
      { name: 'Aputure 600D', category: 'Lighting', quantity: 2, dailyRate: 250 },
      { name: 'Light Kit Small', category: 'Lighting', quantity: 2, dailyRate: 100 },
      { name: 'C-Stands', category: 'Grip', quantity: 8, required: true, dailyRate: 12 },
      { name: 'Apple Boxes Set', category: 'Grip', quantity: 1, required: true, dailyRate: 40 },
      { name: 'Sound Recorder', category: 'Sound', quantity: 1, required: true, dailyRate: 200 },
      { name: 'Wireless Mics', category: 'Sound', quantity: 2, required: true, dailyRate: 100 },
    ]
  },
  {
    id: 'documentary',
    name: 'Documentary Equipment',
    description: 'Run-and-gun documentary equipment package',
    type: 'documentary',
    items: [
      { name: 'Sony FX6', category: 'Camera', quantity: 1, required: true, dailyRate: 600 },
      { name: 'Zoom Lens 24-105mm', category: 'Lenses', quantity: 1, required: true, dailyRate: 200 },
      { name: 'LED Panel Lights', category: 'Lighting', quantity: 2, required: true, dailyRate: 150 },
      { name: 'Portable Light Kit', category: 'Lighting', quantity: 1, dailyRate: 100 },
      { name: 'Tripod', category: 'Grip', quantity: 1, required: true, dailyRate: 30 },
      { name: 'Monopod', category: 'Grip', quantity: 1, dailyRate: 20 },
      { name: 'Handheld Recorder', category: 'Sound', quantity: 1, required: true, dailyRate: 150 },
      { name: 'Shotgun Mic', category: 'Sound', quantity: 1, required: true, dailyRate: 75 },
      { name: 'Wireless Lavs', category: 'Sound', quantity: 2, required: true, dailyRate: 80 },
    ]
  }
];

// Crew Templates
const crewTemplates = [
  {
    id: 'film',
    name: 'Feature Film Crew',
    description: 'Standard crew for feature film production',
    type: 'film',
    positions: [
      { name: '', role: 'Director', department: 'Direction', required: true, rate: 3000 },
      { name: '', role: '1st Assistant Director', department: 'Direction', required: true, rate: 1500 },
      { name: '', role: 'Director of Photography', department: 'Camera', required: true, rate: 2500 },
      { name: '', role: '1st AC', department: 'Camera', required: true, rate: 800 },
      { name: '', role: '2nd AC', department: 'Camera', required: true, rate: 600 },
      { name: '', role: 'Gaffer', department: 'Lighting', required: true, rate: 1000 },
      { name: '', role: 'Best Boy Electric', department: 'Lighting', required: true, rate: 700 },
      { name: '', role: 'Key Grip', department: 'Grip', required: true, rate: 1000 },
      { name: '', role: 'Best Boy Grip', department: 'Grip', required: true, rate: 700 },
      { name: '', role: 'Sound Mixer', department: 'Sound', required: true, rate: 1200 },
      { name: '', role: 'Boom Operator', department: 'Sound', required: true, rate: 700 },
      { name: '', role: 'Production Designer', department: 'Art', required: true, rate: 2000 },
      { name: '', role: 'Art Director', department: 'Art', rate: 1200 },
      { name: '', role: 'Producer', department: 'Production', required: true, rate: 2500 },
      { name: '', role: 'Line Producer', department: 'Production', required: true, rate: 2000 },
      { name: '', role: 'Production Manager', department: 'Production', required: true, rate: 1500 },
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Crew',
    description: 'Standard crew for commercial production',
    type: 'commercial',
    positions: [
      { name: '', role: 'Director', department: 'Direction', required: true, rate: 2500 },
      { name: '', role: '1st AD', department: 'Direction', required: true, rate: 1200 },
      { name: '', role: 'DP', department: 'Camera', required: true, rate: 2000 },
      { name: '', role: '1st AC', department: 'Camera', required: true, rate: 700 },
      { name: '', role: 'Gaffer', department: 'Lighting', required: true, rate: 900 },
      { name: '', role: 'Key Grip', department: 'Grip', required: true, rate: 900 },
      { name: '', role: 'Sound Mixer', department: 'Sound', required: true, rate: 1000 },
      { name: '', role: 'Producer', department: 'Production', required: true, rate: 2000 },
      { name: '', role: 'Production Coordinator', department: 'Production', required: true, rate: 800 },
    ]
  },
  {
    id: 'documentary',
    name: 'Documentary Crew',
    description: 'Lean crew for documentary production',
    type: 'documentary',
    positions: [
      { name: '', role: 'Director', department: 'Direction', required: true, rate: 1500 },
      { name: '', role: 'Producer', department: 'Production', required: true, rate: 1500 },
      { name: '', role: 'Camera Operator', department: 'Camera', required: true, rate: 1000 },
      { name: '', role: 'Sound Recordist', department: 'Sound', required: true, rate: 800 },
      { name: '', role: 'Production Assistant', department: 'Production', rate: 300 },
    ]
  }
];

// Nike Demo Project
const demoProject = {
  id: 'demo-nike-project',
  orgId: 'demo-public',
  title: 'Nike Commercial - "Just Do It" Campaign',
  client: 'Nike Inc.',
  description: 'High-energy commercial featuring athletes. This is a demo project showcasing all DOUBLEcheck features.',
  status: 'production',
  projectType: 'commercial',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-05'),
  budget: 250000,
  isPublic: true,
  isTemplate: true,
  customCastTypes: [],
  customCrewDepartments: [],
  customRolesByDepartment: {},
  customEquipmentCategories: [],
  coverImageUrl: 'https://placehold.co/800x400/000000/FFFFFF?text=Nike+Commercial',
  createdBy: 'system',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

// Demo Crew for Nike Project
const demoCrew = [
  { name: 'Sarah Johnson', role: 'Director', department: 'Direction', email: 'sarah@example.com', rate: 2500, status: 'confirmed' },
  { name: 'Mike Chen', role: '1st AD', department: 'Direction', email: 'mike@example.com', rate: 1200, status: 'confirmed' },
  { name: 'Alex Rivera', role: 'DP', department: 'Camera', email: 'alex@example.com', rate: 2000, status: 'confirmed' },
  { name: 'Jamie Lee', role: '1st AC', department: 'Camera', email: 'jamie@example.com', rate: 700, status: 'confirmed' },
  { name: 'Chris Martinez', role: 'Gaffer', department: 'Lighting', email: 'chris@example.com', rate: 900, status: 'confirmed' },
  { name: 'Taylor Swift', role: 'Key Grip', department: 'Grip', email: 'taylor@example.com', rate: 900, status: 'confirmed' },
  { name: 'Jordan Kim', role: 'Sound Mixer', department: 'Sound', email: 'jordan@example.com', rate: 1000, status: 'confirmed' },
  { name: 'Morgan Davis', role: 'Producer', department: 'Production', email: 'morgan@example.com', rate: 2000, status: 'confirmed' },
];

// Demo Equipment for Nike Project
const demoEquipment = [
  { name: 'RED Komodo 6K', category: 'Camera', quantity: 2, dailyRate: 800, weeklyRate: 4000, description: 'Main camera package' },
  { name: 'Prime Lens Set', category: 'Lenses', quantity: 1, dailyRate: 600, weeklyRate: 3000 },
  { name: 'Zoom Lens 24-70mm', category: 'Lenses', quantity: 1, dailyRate: 200, weeklyRate: 1000 },
  { name: 'ARRI SkyPanel S60', category: 'Lighting', quantity: 4, dailyRate: 350, weeklyRate: 1750 },
  { name: 'Aputure 600D', category: 'Lighting', quantity: 2, dailyRate: 250, weeklyRate: 1250 },
  { name: 'C-Stands', category: 'Grip', quantity: 12, dailyRate: 12, weeklyRate: 60 },
  { name: '8x8 Frame', category: 'Grip', quantity: 4, dailyRate: 60, weeklyRate: 300 },
  { name: 'Sound Devices 833', category: 'Sound', quantity: 1, dailyRate: 400, weeklyRate: 2000 },
  { name: 'Wireless Lav Mics (4x)', category: 'Sound', quantity: 1, dailyRate: 150, weeklyRate: 750 },
  { name: 'Steadicam', category: 'Camera', quantity: 1, dailyRate: 800, weeklyRate: 4000 },
];

// Demo Cast for Nike Project
const demoCast = [
  { actorName: 'LeBron James', characterName: 'Lead Athlete', castType: 'lead', rate: 50000, email: 'lebron@agency.com' },
  { actorName: 'Serena Williams', characterName: 'Featured Athlete', castType: 'supporting', rate: 40000, email: 'serena@agency.com' },
  { actorName: 'Cristiano Ronaldo', characterName: 'Featured Athlete', castType: 'supporting', rate: 45000, email: 'cristiano@agency.com' },
];

// Demo Budget for Nike Project
const demoBudget = [
  { 
    name: 'Above the Line', 
    order: 0, 
    isCategory: true,
    items: [
      { name: 'Director Fee', description: 'Sarah Johnson - Director', estimatedAmount: 10000, actualAmount: 0, unitRate: 2500, quantity: 4, unit: 'days' },
      { name: 'Producer Fee', description: 'Morgan Davis - Producer', estimatedAmount: 8000, actualAmount: 0, unitRate: 2000, quantity: 4, unit: 'days' },
    ]
  },
  {
    name: 'Camera Department',
    order: 1,
    isCategory: true,
    items: [
      { name: 'DP', description: 'Alex Rivera - DP', estimatedAmount: 8000, actualAmount: 0, unitRate: 2000, quantity: 4, unit: 'days' },
      { name: 'Camera Rental', description: 'RED Komodo 6K (x2)', estimatedAmount: 6400, actualAmount: 0, unitRate: 1600, quantity: 4, unit: 'days' },
    ]
  },
  {
    name: 'Talent',
    order: 2,
    isCategory: true,
    items: [
      { name: 'Lead Athlete', description: 'LeBron James', estimatedAmount: 50000, actualAmount: 0, unitRate: 50000, quantity: 1, unit: 'flat' },
      { name: 'Featured Athletes', description: 'Serena Williams, Cristiano Ronaldo', estimatedAmount: 85000, actualAmount: 0, unitRate: 85000, quantity: 1, unit: 'flat' },
    ]
  },
];

// Demo Locations for Nike Project
const demoLocations = [
  { 
    name: 'Nike Headquarters - Beaverton', 
    address: '1 Bowerman Dr, Beaverton, OR 97005',
    type: 'indoor',
    description: 'Main campus exterior and lobby',
    rentalCost: 5000,
    contactName: 'Location Manager',
    contactPhone: '555-0100'
  },
  { 
    name: 'Downtown LA - Street Basketball Court', 
    address: '123 Spring St, Los Angeles, CA 90012',
    type: 'outdoor',
    description: 'Urban basketball court with city backdrop',
    rentalCost: 2000,
    permitRequired: true
  },
  { 
    name: 'Venice Beach Boardwalk', 
    address: 'Venice Beach, CA 90291',
    type: 'outdoor',
    description: 'Iconic beach location for running scenes',
    rentalCost: 1500,
    permitRequired: true
  }
];

// Demo Scenes for Nike Project
const demoScenes = [
  {
    sceneNumber: '1',
    description: 'Opening montage - Athletes training at dawn',
    intExt: 'EXT',
    dayNight: 'DAWN',
    location: 'Venice Beach Boardwalk',
    pages: 1.5,
    duration: 90,
    specialRequirements: 'Golden hour lighting, steadicam',
    continuityNotes: 'All athletes wear Nike gear'
  },
  {
    sceneNumber: '2',
    description: 'LeBron motivational speech to camera',
    intExt: 'INT',
    dayNight: 'DAY',
    location: 'Nike Headquarters - Beaverton',
    pages: 0.5,
    duration: 30,
    specialRequirements: 'Clean corporate background, key light',
    continuityNotes: 'LeBron in Nike jersey'
  },
  {
    sceneNumber: '3',
    description: 'Street basketball game - dynamic action',
    intExt: 'EXT',
    dayNight: 'DAY',
    location: 'Downtown LA - Street Basketball Court',
    pages: 2,
    duration: 120,
    specialRequirements: 'Multiple cameras, drone shot',
    continuityNotes: 'High energy, fast cuts'
  },
  {
    sceneNumber: '4',
    description: 'Product closeups and branding',
    intExt: 'INT',
    dayNight: 'DAY',
    location: 'Nike Headquarters - Beaverton',
    pages: 0.5,
    duration: 20,
    specialRequirements: 'Macro lenses, product lighting',
    continuityNotes: 'Feature new shoe line'
  }
];

// Demo Shots for Scene 3 (Basketball)
const demoShots = [
  {
    sceneId: null, // Will be set when scene is created
    shotNumber: '3A',
    shotType: 'Wide',
    cameraAngle: 'High angle',
    lens: '24mm',
    movement: 'Crane down',
    duration: 15,
    description: 'Establishing shot of basketball court',
    actionDescription: 'Players warm up, dribbling basketballs',
    sortOrder: 0
  },
  {
    sceneId: null,
    shotNumber: '3B',
    shotType: 'Medium',
    cameraAngle: 'Eye level',
    lens: '50mm',
    movement: 'Handheld follow',
    duration: 20,
    description: 'LeBron drives to basket',
    actionDescription: 'LeBron weaves through defenders, explosive dunk',
    sortOrder: 1
  },
  {
    sceneId: null,
    shotNumber: '3C',
    shotType: 'Close-up',
    cameraAngle: 'Low angle',
    lens: '85mm',
    movement: 'Steadicam',
    duration: 10,
    description: 'Nike shoes close-up',
    actionDescription: 'Feet pivoting, shoes squeaking on court',
    sortOrder: 2
  },
  {
    sceneId: null,
    shotNumber: '3D',
    shotType: 'Wide',
    cameraAngle: 'Drone overhead',
    lens: 'Drone 16mm',
    movement: 'Circular orbit',
    duration: 25,
    description: 'Aerial view of game',
    actionDescription: 'Full court view, players in motion',
    sortOrder: 3
  }
];

// Demo Shooting Days (Schedule)
const demoShootingDays = [
  {
    date: new Date('2026-02-01'),
    callTime: '6:00 AM',
    location: 'Venice Beach Boardwalk',
    weather: 'Clear, 65°F',
    notes: 'Golden hour shoot, arrive early for setup',
    status: 'scheduled'
  },
  {
    date: new Date('2026-02-02'),
    callTime: '7:00 AM',
    location: 'Nike Headquarters - Beaverton',
    weather: 'Partly cloudy, 58°F',
    notes: 'Indoor shoot, corporate environment',
    status: 'scheduled'
  },
  {
    date: new Date('2026-02-03'),
    callTime: '8:00 AM',
    location: 'Downtown LA - Street Basketball Court',
    weather: 'Sunny, 72°F',
    notes: 'Street closures arranged, multiple cameras',
    status: 'scheduled'
  }
];

async function populateDatabase() {
  console.log('🚀 Starting Firebase population...\n');

  try {
    // 1. Add Equipment Templates
    console.log('📦 Adding equipment templates...');
    for (const template of equipmentTemplates) {
      await db.collection('equipmentTemplates').doc(template.id).set(template);
      console.log(`   ✅ Added ${template.name}`);
    }

    // 2. Add Crew Templates
    console.log('\n👥 Adding crew templates...');
    for (const template of crewTemplates) {
      await db.collection('crewTemplates').doc(template.id).set(template);
      console.log(`   ✅ Added ${template.name}`);
    }

    // 3. Create Nike Demo Project
    console.log('\n🎬 Creating Nike demo project...');
    await db.collection('projects').doc(demoProject.id).set(demoProject);
    console.log(`   ✅ Created "${demoProject.title}"`);

    // 4. Add Demo Crew
    console.log('\n👤 Adding demo crew members...');
    for (const member of demoCrew) {
      await db.collection('crew').add({
        ...member,
        projectId: demoProject.id,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Added ${member.name} (${member.role})`);
    }

    // 5. Add Demo Equipment
    console.log('\n🎥 Adding demo equipment...');
    for (const item of demoEquipment) {
      await db.collection('equipment').add({
        ...item,
        projectId: demoProject.id,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Added ${item.name}`);
    }

    // 6. Add Demo Cast
    console.log('\n🌟 Adding demo cast...');
    for (const member of demoCast) {
      await db.collection('cast').add({
        ...member,
        projectId: demoProject.id,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Added ${member.actorName} as ${member.characterName}`);
    }

    // 7. Add Demo Budget
    console.log('\n💰 Adding demo budget categories...');
    for (const category of demoBudget) {
      const categoryDoc = await db.collection('budgetCategories').add({
        projectId: demoProject.id,
        name: category.name,
        order: category.order,
        isCategory: category.isCategory,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Added category: ${category.name}`);

      // Add items under this category
      if (category.items) {
        for (const item of category.items) {
          await db.collection('budgetCategories').add({
            projectId: demoProject.id,
            categoryId: categoryDoc.id,
            ...item,
            isCategory: false,
            createdBy: 'system',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    // 8. Add Demo Locations
    console.log('\n📍 Adding demo locations...');
    const locationIds = {};
    for (const location of demoLocations) {
      const locationDoc = await db.collection('locations').add({
        ...location,
        projectId: demoProject.id,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      locationIds[location.name] = locationDoc.id;
      console.log(`   ✅ Added ${location.name}`);
    }

    // 9. Add Demo Scenes
    console.log('\n🎬 Adding demo scenes...');
    const sceneIds = {};
    for (const scene of demoScenes) {
      const sceneDoc = await db.collection('scenes').add({
        ...scene,
        projectId: demoProject.id,
        locationId: locationIds[scene.location] || null,
        locationName: scene.location,
        status: 'not-shot',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      sceneIds[scene.sceneNumber] = sceneDoc.id;
      console.log(`   ✅ Added Scene ${scene.sceneNumber}: ${scene.description}`);
    }

    // 10. Add Demo Shots
    console.log('\n🎥 Adding demo shots...');
    let shotCount = 0;
    for (const shot of demoShots) {
      await db.collection('shots').add({
        ...shot,
        sceneId: sceneIds['3'], // Scene 3 is the basketball scene
        projectId: demoProject.id,
        status: 'not-shot',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      shotCount++;
      console.log(`   ✅ Added Shot ${shot.shotNumber}: ${shot.description}`);
    }

    // 11. Add Demo Shooting Days (Schedule)
    console.log('\n📅 Adding demo shooting days...');
    const shootingDayIds = {};
    for (let i = 0; i < demoShootingDays.length; i++) {
      const day = demoShootingDays[i];
      const dayDoc = await db.collection('shootingDays').add({
        ...day,
        projectId: demoProject.id,
        dayNumber: i + 1,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      shootingDayIds[i] = dayDoc.id;
      console.log(`   ✅ Added Day ${i + 1}: ${day.date.toDateString()} at ${day.location}`);
    }

    // 12. Add Schedule Events
    console.log('\n📋 Adding schedule events...');
    // Scene 1 on Day 1
    await db.collection('scheduleEvents').add({
      projectId: demoProject.id,
      shootingDayId: shootingDayIds[0],
      sceneId: sceneIds['1'],
      type: 'scene',
      description: 'Scene 1: Opening montage',
      sceneNumber: '1',
      locationId: locationIds['Venice Beach Boardwalk'],
      location: 'Venice Beach Boardwalk',
      duration: 90,
      order: 0,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Scene 2 on Day 2
    await db.collection('scheduleEvents').add({
      projectId: demoProject.id,
      shootingDayId: shootingDayIds[1],
      sceneId: sceneIds['2'],
      type: 'scene',
      description: 'Scene 2: LeBron speech',
      sceneNumber: '2',
      locationId: locationIds['Nike Headquarters - Beaverton'],
      location: 'Nike Headquarters - Beaverton',
      duration: 30,
      order: 0,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Scene 3 on Day 3
    await db.collection('scheduleEvents').add({
      projectId: demoProject.id,
      shootingDayId: shootingDayIds[2],
      sceneId: sceneIds['3'],
      type: 'scene',
      description: 'Scene 3: Basketball game',
      sceneNumber: '3',
      locationId: locationIds['Downtown LA - Street Basketball Court'],
      location: 'Downtown LA - Street Basketball Court',
      duration: 120,
      order: 0,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Scene 4 on Day 2
    await db.collection('scheduleEvents').add({
      projectId: demoProject.id,
      shootingDayId: shootingDayIds[1],
      sceneId: sceneIds['4'],
      type: 'scene',
      description: 'Scene 4: Product shots',
      sceneNumber: '4',
      locationId: locationIds['Nike Headquarters - Beaverton'],
      location: 'Nike Headquarters - Beaverton',
      duration: 20,
      order: 1,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`   ✅ Added 4 schedule events`);

    console.log('\n✅ Database population complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Equipment Templates: ${equipmentTemplates.length}`);
    console.log(`   - Crew Templates: ${crewTemplates.length}`);
    console.log(`   - Demo Project: 1 (Nike Commercial)`);
    console.log(`   - Demo Crew: ${demoCrew.length} members`);
    console.log(`   - Demo Equipment: ${demoEquipment.length} items`);
    console.log(`   - Demo Cast: ${demoCast.length} members`);
    console.log(`   - Demo Budget Categories: ${demoBudget.length}`);
    console.log(`   - Demo Locations: ${demoLocations.length}`);
    console.log(`   - Demo Scenes: ${demoScenes.length}`);
    console.log(`   - Demo Shots: ${shotCount}`);
    console.log(`   - Demo Shooting Days: ${demoShootingDays.length}`);
    console.log(`   - Schedule Events: 4`);
    
    console.log('\n🎉 Your DOUBLEcheck app is now fully populated!');
    console.log('Visit: https://doublecheck-ivory.vercel.app');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the population
populateDatabase();

