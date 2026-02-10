/**
 * Populate Nike Demo Project with Real Images from Unsplash
 * 
 * This script adds high-quality stock images to all elements of the Nike demo project.
 * Uses Unsplash's direct URL format (free for demos/non-commercial use).
 * 
 * For production use, you should:
 * 1. Sign up for Unsplash API: https://unsplash.com/developers
 * 2. Download images to your own storage (Firebase Storage)
 * 3. Attribute photographers as required
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
const PROJECT_ID = 'SomJJD3bEqn2yHhXW79e';

// Curated Unsplash image URLs for each category
// Using specific photo IDs for consistency (won't change randomly)
const IMAGES = {
  // Locations
  locations: {
    'Nike World Headquarters': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', // Modern office building
    'Nike Innovation Center': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', // High-tech lab/office
    'Downtown Portland Street': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80', // Portland downtown
    'Forest Park Trail': 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', // Forest trail
    'Moda Center Arena': 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=800&q=80', // Basketball arena
  },

  // Cast headshots - Professional athletic/actor photos
  cast: {
    'Marcus Thompson': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', // Athletic Black male
    'Jasmine Williams': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', // Professional Black female
    'David Park': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', // Asian male athlete
    'Elena Rodriguez': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', // Latina female
    'Michael Chen': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', // Asian male professional
    'Amanda Foster': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', // Female reporter type
  },

  // Crew headshots - Behind-the-scenes professionals
  crew: {
    director: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    producer: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    dp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    female_crew: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
    male_crew: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  },

  // Equipment photos
  equipment: {
    camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', // Pro camera
    lens: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&q=80', // Camera lens
    lighting: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80', // Studio lights
    grip: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&q=80', // Film equipment
    audio: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80', // Audio equipment
    drone: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80', // Drone
    vehicles: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', // Production trucks
    specialty: 'https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=600&q=80', // Gimbal/steadicam
  },

  // Scene reference images - Nike/Running themed
  scenes: {
    morning_run: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80', // Sunrise run
    innovation_lab: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80', // Tech lab
    product_reveal: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', // Nike shoe
    training_track: 'https://images.unsplash.com/photo-1461896836934- voices-5?w=800&q=80', // Track training
    coaching: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', // Coach athlete
    forest_run: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&q=80', // Trail running
    competition: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80', // Running competition
    victory: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80', // Victory celebration
    press: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80', // Press conference
    sunset_run: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', // Sunset runner
  },

  // Shot storyboard/reference images
  shots: {
    wide: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80', // Wide city shot
    medium: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80', // Medium runner
    closeup: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80', // Nike shoe closeup
    tracking: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&q=80', // Running tracking
    drone: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&q=80', // Aerial shot
    slowmo: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80', // Action shot
  },

  // Reference images for creative boards
  references: {
    nike_brand: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    athlete_lifestyle: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    portland_city: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    golden_hour: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    tech_innovation: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    competition_energy: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
  },
};

// Equipment category to image mapping
const EQUIPMENT_CATEGORY_IMAGES = {
  camera: IMAGES.equipment.camera,
  lenses: IMAGES.equipment.lens,
  lighting: IMAGES.equipment.lighting,
  grip: IMAGES.equipment.grip,
  audio: IMAGES.equipment.audio,
  specialty: IMAGES.equipment.specialty,
  vehicles: IMAGES.equipment.vehicles,
  power: IMAGES.equipment.grip,
  monitors: IMAGES.equipment.camera,
  wireless_video: IMAGES.equipment.camera,
};

async function populateImages() {
  console.log('🖼️  Starting image population for Nike Demo Project...\n');

  // 1. Update Locations with images
  console.log('📍 Updating location images...');
  const locationsSnap = await db.collection('locations')
    .where('projectId', '==', PROJECT_ID)
    .get();

  for (const doc of locationsSnap.docs) {
    const data = doc.data();
    const imageUrl = IMAGES.locations[data.name];
    if (imageUrl) {
      await doc.ref.update({ 
        imageUrl,
        coverImageUrl: imageUrl,
      });
      console.log(`  ✓ ${data.name}`);
    }
  }

  // 2. Update Cast with headshots
  console.log('\n🎭 Updating cast headshots...');
  const castSnap = await db.collection('cast')
    .where('projectId', '==', PROJECT_ID)
    .get();

  for (const doc of castSnap.docs) {
    const data = doc.data();
    const imageUrl = IMAGES.cast[data.actorName];
    if (imageUrl) {
      await doc.ref.update({ photoUrl: imageUrl });
      console.log(`  ✓ ${data.actorName}`);
    }
  }

  // 3. Update Crew with headshots (assign based on department/role)
  console.log('\n👥 Updating crew headshots...');
  const crewSnap = await db.collection('crew')
    .where('projectId', '==', PROJECT_ID)
    .get();

  let crewIndex = 0;
  const crewImages = [
    IMAGES.crew.director,
    IMAGES.crew.producer,
    IMAGES.crew.dp,
    IMAGES.crew.female_crew,
    IMAGES.crew.male_crew,
  ];

  for (const doc of crewSnap.docs) {
    const data = doc.data();
    let imageUrl;

    // Assign specific images to key roles
    if (data.role === 'Director') {
      imageUrl = IMAGES.crew.director;
    } else if (data.role === 'Executive Producer' || data.role === 'Line Producer') {
      imageUrl = IMAGES.crew.producer;
    } else if (data.role === 'Director of Photography') {
      imageUrl = IMAGES.crew.dp;
    } else {
      // Alternate between male/female crew photos
      imageUrl = crewImages[crewIndex % crewImages.length];
      crewIndex++;
    }

    await doc.ref.update({ photoUrl: imageUrl });
  }
  console.log(`  ✓ Updated ${crewSnap.size} crew members`);

  // 4. Update Equipment with images
  console.log('\n📷 Updating equipment images...');
  const equipmentSnap = await db.collection('equipment')
    .where('projectId', '==', PROJECT_ID)
    .get();

  for (const doc of equipmentSnap.docs) {
    const data = doc.data();
    const category = data.category?.toLowerCase() || '';
    let imageUrl = EQUIPMENT_CATEGORY_IMAGES[category] || IMAGES.equipment.camera;

    // More specific matching
    const name = data.name?.toLowerCase() || '';
    if (name.includes('drone')) imageUrl = IMAGES.equipment.drone;
    else if (name.includes('lens') || name.includes('angenieux') || name.includes('prime')) imageUrl = IMAGES.equipment.lens;
    else if (name.includes('light') || name.includes('sky') || name.includes('hmi') || name.includes('titan')) imageUrl = IMAGES.equipment.lighting;
    else if (name.includes('sound') || name.includes('mic') || name.includes('boom') || name.includes('lectro') || name.includes('sennheiser')) imageUrl = IMAGES.equipment.audio;
    else if (name.includes('dolly') || name.includes('track') || name.includes('stand') || name.includes('lift')) imageUrl = IMAGES.equipment.grip;
    else if (name.includes('truck') || name.includes('trailer') || name.includes('van')) imageUrl = IMAGES.equipment.vehicles;
    else if (name.includes('gimbal') || name.includes('steadicam') || name.includes('trinity') || name.includes('ronin')) imageUrl = IMAGES.equipment.specialty;

    await doc.ref.update({ imageUrl });
  }
  console.log(`  ✓ Updated ${equipmentSnap.size} equipment items`);

  // 5. Update Scenes with reference images
  console.log('\n🎬 Updating scene reference images...');
  const scenesSnap = await db.collection('scenes')
    .where('projectId', '==', PROJECT_ID)
    .get();

  const sceneImageMap = {
    '1': IMAGES.scenes.morning_run,
    '2': IMAGES.scenes.innovation_lab,
    '3': IMAGES.scenes.product_reveal,
    '4': IMAGES.scenes.training_track,
    '5': IMAGES.scenes.coaching,
    '6': IMAGES.scenes.forest_run,
    '7': IMAGES.scenes.competition,
    '8': IMAGES.scenes.victory,
    '9': IMAGES.scenes.press,
    '10': IMAGES.scenes.sunset_run,
  };

  for (const doc of scenesSnap.docs) {
    const data = doc.data();
    const imageUrl = sceneImageMap[data.sceneNumber] || IMAGES.scenes.morning_run;
    await doc.ref.update({ 
      referenceImageUrl: imageUrl,
      thumbnailUrl: imageUrl,
    });
    console.log(`  ✓ Scene ${data.sceneNumber}: ${data.title}`);
  }

  // 6. Update Shots with storyboard images
  console.log('\n🎥 Updating shot storyboard images...');
  const shotsSnap = await db.collection('shots')
    .where('projectId', '==', PROJECT_ID)
    .get();

  for (const doc of shotsSnap.docs) {
    const data = doc.data();
    let imageUrl = IMAGES.shots.medium;

    const shotType = data.shotType?.toLowerCase() || '';
    if (shotType.includes('wide')) imageUrl = IMAGES.shots.wide;
    else if (shotType.includes('close')) imageUrl = IMAGES.shots.closeup;
    else if (shotType.includes('insert')) imageUrl = IMAGES.shots.closeup;
    else if (data.description?.toLowerCase().includes('drone') || data.description?.toLowerCase().includes('aerial')) imageUrl = IMAGES.shots.drone;
    else if (data.description?.toLowerCase().includes('slow') || data.description?.toLowerCase().includes('phantom')) imageUrl = IMAGES.shots.slowmo;
    else if (data.description?.toLowerCase().includes('tracking')) imageUrl = IMAGES.shots.tracking;

    await doc.ref.update({ 
      storyboardUrl: imageUrl,
      referenceImageUrl: imageUrl,
    });
  }
  console.log(`  ✓ Updated ${shotsSnap.size} shots`);

  // 7. Create Reference Images collection for mood boards
  console.log('\n🎨 Creating reference image boards...');
  
  // Clear existing reference images
  const existingRefs = await db.collection('reference_images')
    .where('projectId', '==', PROJECT_ID)
    .get();
  for (const doc of existingRefs.docs) {
    await doc.ref.delete();
  }

  const referenceCategories = [
    { category: 'Brand & Product', images: [
      { url: IMAGES.references.nike_brand, caption: 'Nike product hero shot inspiration' },
      { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', caption: 'Sneaker detail reference' },
    ]},
    { category: 'Athlete Lifestyle', images: [
      { url: IMAGES.references.athlete_lifestyle, caption: 'Training lifestyle' },
      { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', caption: 'Coach-athlete dynamic' },
    ]},
    { category: 'Locations', images: [
      { url: IMAGES.references.portland_city, caption: 'Portland urban aesthetic' },
      { url: IMAGES.locations['Forest Park Trail'], caption: 'Pacific Northwest trails' },
    ]},
    { category: 'Lighting & Mood', images: [
      { url: IMAGES.references.golden_hour, caption: 'Golden hour running silhouette' },
      { url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80', caption: 'Dawn city atmosphere' },
    ]},
    { category: 'Competition & Energy', images: [
      { url: IMAGES.references.competition_energy, caption: 'Race day intensity' },
      { url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80', caption: 'Victory emotion' },
    ]},
  ];

  for (const cat of referenceCategories) {
    for (const img of cat.images) {
      await db.collection('reference_images').add({
        projectId: PROJECT_ID,
        category: cat.category,
        imageUrl: img.url,
        caption: img.caption,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`  ✓ ${cat.category}: ${cat.images.length} images`);
  }

  console.log('\n✅ Image population complete!');
  console.log('\n📊 Summary:');
  console.log(`   - ${locationsSnap.size} locations with cover images`);
  console.log(`   - ${castSnap.size} cast members with headshots`);
  console.log(`   - ${crewSnap.size} crew members with photos`);
  console.log(`   - ${equipmentSnap.size} equipment items with product images`);
  console.log(`   - ${scenesSnap.size} scenes with reference images`);
  console.log(`   - ${shotsSnap.size} shots with storyboard images`);
  console.log(`   - ${referenceCategories.reduce((sum, c) => sum + c.images.length, 0)} reference board images`);
}

populateImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
