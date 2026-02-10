// Comprehensive list of film production equipment categories and items

export interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  typicalDailyRate?: number;
  typicalWeeklyRate?: number;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  icon: string;
  items: EquipmentItem[];
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'cameras',
    name: 'Cameras',
    icon: '📷',
    items: [
      { id: 'arri-alexa-35', name: 'ARRI Alexa 35', description: '4.6K Super 35 cinema camera', typicalDailyRate: 1500 },
      { id: 'arri-alexa-mini-lf', name: 'ARRI Alexa Mini LF', description: 'Large format cinema camera', typicalDailyRate: 1200 },
      { id: 'arri-alexa-mini', name: 'ARRI Alexa Mini', description: 'Compact cinema camera', typicalDailyRate: 900 },
      { id: 'red-v-raptor', name: 'RED V-RAPTOR 8K VV', description: '8K VV sensor camera', typicalDailyRate: 800 },
      { id: 'red-komodo', name: 'RED KOMODO 6K', description: 'Compact 6K camera', typicalDailyRate: 400 },
      { id: 'sony-venice-2', name: 'Sony VENICE 2', description: '8.6K full-frame cinema camera', typicalDailyRate: 1000 },
      { id: 'sony-fx6', name: 'Sony FX6', description: 'Full-frame cinema line camera', typicalDailyRate: 350 },
      { id: 'sony-fx9', name: 'Sony FX9', description: 'Full-frame 6K camera', typicalDailyRate: 450 },
      { id: 'blackmagic-ursa-12k', name: 'Blackmagic URSA Mini Pro 12K', description: '12K cinema camera', typicalDailyRate: 300 },
      { id: 'canon-c500-ii', name: 'Canon C500 Mark II', description: 'Full-frame cinema camera', typicalDailyRate: 400 },
      { id: 'canon-c70', name: 'Canon C70', description: 'Compact cinema camera', typicalDailyRate: 200 },
      { id: 'panasonic-varicam-lt', name: 'Panasonic VariCam LT', description: 'Super 35 cinema camera', typicalDailyRate: 350 },
      { id: 'dji-ronin-4d', name: 'DJI Ronin 4D', description: '6K integrated gimbal camera', typicalDailyRate: 450 },
      { id: 'gopro-hero', name: 'GoPro Hero 12', description: 'Action camera', typicalDailyRate: 50 },
      { id: 'insta360', name: 'Insta360 Pro 2', description: '360° VR camera', typicalDailyRate: 200 },
    ]
  },
  {
    id: 'lenses',
    name: 'Lenses',
    icon: '🔭',
    items: [
      // Primes
      { id: 'arri-signature-prime-set', name: 'ARRI Signature Prime Set', description: 'Full-frame prime lens set', typicalDailyRate: 1200 },
      { id: 'master-prime-set', name: 'ARRI Master Prime Set', description: 'S35 prime lens set', typicalDailyRate: 1000 },
      { id: 'zeiss-supreme-set', name: 'Zeiss Supreme Prime Set', description: 'Full-frame primes', typicalDailyRate: 800 },
      { id: 'cooke-s7-set', name: 'Cooke S7/i Full Frame Set', description: 'Full-frame primes', typicalDailyRate: 900 },
      { id: 'cooke-sp3-set', name: 'Cooke SP3 Set', description: 'Full-frame primes', typicalDailyRate: 600 },
      { id: 'panavision-primo-set', name: 'Panavision Primo Set', description: 'S35 prime set', typicalDailyRate: 800 },
      // Zooms
      { id: 'angenieux-optimo-24-290', name: 'Angenieux Optimo 24-290mm', description: 'Cinema zoom', typicalDailyRate: 700 },
      { id: 'fujinon-premista-28-100', name: 'Fujinon Premista 28-100mm', description: 'Full-frame zoom', typicalDailyRate: 500 },
      { id: 'fujinon-premista-80-250', name: 'Fujinon Premista 80-250mm', description: 'Full-frame zoom', typicalDailyRate: 500 },
      { id: 'arri-signature-zoom-set', name: 'ARRI Signature Zoom Set', description: 'Full-frame zoom set', typicalDailyRate: 900 },
      // Specialty
      { id: 'laowa-probe', name: 'Laowa Probe Lens', description: 'Macro probe lens', typicalDailyRate: 200 },
      { id: 'lensbaby-set', name: 'Lensbaby Creative Set', description: 'Creative effect lenses', typicalDailyRate: 100 },
      { id: 'diopter-set', name: 'Diopter Set', description: 'Close-up diopters', typicalDailyRate: 50 },
      { id: 'tilt-shift-lens', name: 'Canon TS-E Set', description: 'Tilt-shift lenses', typicalDailyRate: 150 },
      // Vintage/Character
      { id: 'cooke-panchro-set', name: 'Cooke Panchro Set', description: 'Vintage character primes', typicalDailyRate: 600 },
      { id: 'zeiss-super-speed-set', name: 'Zeiss Super Speed Set', description: 'Fast S35 primes', typicalDailyRate: 400 },
    ]
  },
  {
    id: 'camera-support',
    name: 'Camera Support',
    icon: '📹',
    items: [
      // Tripods
      { id: 'oconnor-2575', name: "O'Connor 2575D Head", description: 'Cinema fluid head', typicalDailyRate: 150 },
      { id: 'sachtler-video-25', name: 'Sachtler Video 25', description: 'Fluid head', typicalDailyRate: 100 },
      { id: 'ronford-baker-legs', name: 'Ronford Baker Heavy Duty Legs', description: 'Cinema tripod legs', typicalDailyRate: 75 },
      // Dollies
      { id: 'fisher-10-dolly', name: 'Fisher 10 Dolly', description: 'Studio dolly', typicalDailyRate: 400 },
      { id: 'chapman-peewee-4', name: 'Chapman Pee Wee IV', description: 'Versatile dolly', typicalDailyRate: 350 },
      { id: 'doorway-dolly', name: 'Doorway Dolly', description: 'Compact dolly', typicalDailyRate: 75 },
      { id: 'dana-dolly', name: 'Dana Dolly', description: 'Lightweight slider dolly', typicalDailyRate: 100 },
      { id: 'dolly-track-straight', name: 'Dolly Track (Straight) 8ft', description: 'Per section', typicalDailyRate: 15 },
      { id: 'dolly-track-curve', name: 'Dolly Track (Curved) 8ft', description: 'Per section', typicalDailyRate: 20 },
      // Cranes/Jibs
      { id: 'technocrane-22', name: 'Technocrane 22', description: 'Telescoping crane', typicalDailyRate: 2500 },
      { id: 'moviebird-30', name: 'MovieBird 30', description: 'Cinema crane', typicalDailyRate: 1500 },
      { id: 'jimmy-jib-12', name: 'Jimmy Jib 12ft', description: 'Small jib arm', typicalDailyRate: 200 },
      { id: 'porta-jib', name: 'Porta-Jib', description: 'Portable jib', typicalDailyRate: 150 },
      // Gimbals
      { id: 'ronin-2', name: 'DJI Ronin 2', description: 'Heavy-duty gimbal', typicalDailyRate: 250 },
      { id: 'movi-pro', name: 'Freefly MōVI Pro', description: 'Cinema gimbal', typicalDailyRate: 300 },
      { id: 'rs3-pro', name: 'DJI RS 3 Pro', description: 'Lightweight gimbal', typicalDailyRate: 75 },
      // Steadicam
      { id: 'steadicam-m2', name: 'Steadicam M-2', description: 'Cinema Steadicam', typicalDailyRate: 400 },
      { id: 'steadicam-archer', name: 'Steadicam Archer 2', description: 'Lightweight Steadicam', typicalDailyRate: 200 },
      { id: 'easyrig-vario', name: 'Easyrig Vario 5', description: 'Camera support vest', typicalDailyRate: 100 },
      // Sliders
      { id: 'slider-4ft', name: 'Slider 4ft', description: 'Camera slider', typicalDailyRate: 50 },
      { id: 'slider-motorized', name: 'Motorized Slider', description: 'Motion control slider', typicalDailyRate: 150 },
    ]
  },
  {
    id: 'lighting-hmi',
    name: 'Lighting - HMI/LED',
    icon: '💡',
    items: [
      // HMI
      { id: 'arri-m18', name: 'ARRI M18 1800W HMI', description: 'Daylight HMI', typicalDailyRate: 200 },
      { id: 'arri-m40', name: 'ARRI M40 4000W HMI', description: 'Large daylight HMI', typicalDailyRate: 350 },
      { id: 'arrimax-18', name: 'ARRIMAX 18/12', description: '18K HMI Fresnel', typicalDailyRate: 600 },
      { id: 'joker-800', name: 'K5600 Joker 800', description: 'Portable HMI', typicalDailyRate: 100 },
      // LED
      { id: 'arri-skypanel-s60', name: 'ARRI SkyPanel S60-C', description: 'LED soft panel', typicalDailyRate: 200 },
      { id: 'arri-skypanel-s360', name: 'ARRI SkyPanel S360-C', description: 'Large LED panel', typicalDailyRate: 400 },
      { id: 'arri-orbiter', name: 'ARRI Orbiter', description: 'Versatile LED fixture', typicalDailyRate: 300 },
      { id: 'litepanels-gemini', name: 'Litepanels Gemini 2x1', description: 'RGBWW LED panel', typicalDailyRate: 150 },
      { id: 'aputure-600d', name: 'Aputure 600d Pro', description: 'Daylight LED', typicalDailyRate: 100 },
      { id: 'aputure-300x', name: 'Aputure 300x', description: 'Bi-color LED', typicalDailyRate: 75 },
      { id: 'nanlite-forza-500', name: 'Nanlite Forza 500', description: 'Daylight LED', typicalDailyRate: 60 },
      { id: 'astera-titan-tube', name: 'Astera Titan Tube (8 pack)', description: 'RGBW LED tubes', typicalDailyRate: 250 },
      { id: 'quasar-crossfade', name: 'Quasar Crossfade 4ft (4 pack)', description: 'LED tubes', typicalDailyRate: 100 },
      { id: 'creamsource-vortex8', name: 'Creamsource Vortex8', description: 'High-output LED', typicalDailyRate: 200 },
    ]
  },
  {
    id: 'lighting-tungsten',
    name: 'Lighting - Tungsten/Practical',
    icon: '🔦',
    items: [
      { id: 'arri-t1', name: 'ARRI T1 1K Fresnel', description: '1K tungsten Fresnel', typicalDailyRate: 30 },
      { id: 'arri-t2', name: 'ARRI T2 2K Fresnel', description: '2K tungsten Fresnel', typicalDailyRate: 40 },
      { id: 'arri-t5', name: 'ARRI T5 5K Fresnel', description: '5K tungsten Fresnel', typicalDailyRate: 60 },
      { id: 'mole-10k', name: 'Mole-Richardson 10K', description: '10K tungsten', typicalDailyRate: 80 },
      { id: 'arri-650', name: 'ARRI 650 Plus', description: '650W Fresnel', typicalDailyRate: 20 },
      { id: 'arri-300', name: 'ARRI 300 Plus', description: '300W Fresnel', typicalDailyRate: 15 },
      { id: 'kino-flo-4bank', name: 'Kino Flo 4Bank 4ft', description: 'Fluorescent fixture', typicalDailyRate: 75 },
      { id: 'kino-celeb-450', name: 'Kino Flo Celeb 450', description: 'LED Celeb light', typicalDailyRate: 150 },
      { id: 'china-ball-12', name: 'China Ball 12"', description: 'Practical china ball', typicalDailyRate: 10 },
      { id: 'china-ball-20', name: 'China Ball 20"', description: 'Large china ball', typicalDailyRate: 15 },
      { id: 'practicals-kit', name: 'Practicals Kit', description: 'Assorted practical bulbs', typicalDailyRate: 50 },
    ]
  },
  {
    id: 'grip-rigging',
    name: 'Grip & Rigging',
    icon: '🔧',
    items: [
      // C-Stands & Stands
      { id: 'c-stand', name: 'C-Stand 40"', description: 'With arm and knuckle', typicalDailyRate: 8 },
      { id: 'c-stand-low', name: 'C-Stand Low Boy', description: 'Short C-stand', typicalDailyRate: 8 },
      { id: 'combo-stand', name: 'Combo Stand', description: 'Heavy-duty stand', typicalDailyRate: 15 },
      { id: 'mombo-combo', name: 'Mombo Combo', description: 'Extra heavy-duty', typicalDailyRate: 25 },
      { id: 'rolling-stand', name: 'Rolling Stand', description: 'With wheels', typicalDailyRate: 20 },
      // Flags & Diffusion
      { id: 'floppy-4x4', name: '4x4 Floppy', description: 'Double net/solid', typicalDailyRate: 15 },
      { id: 'flag-set-18x24', name: '18x24 Flag Set', description: 'Nets, silks, solids', typicalDailyRate: 30 },
      { id: 'flag-set-24x36', name: '24x36 Flag Set', description: 'Nets, silks, solids', typicalDailyRate: 40 },
      { id: 'frame-4x4', name: '4x4 Frame', description: 'With fabric options', typicalDailyRate: 20 },
      { id: 'frame-6x6', name: '6x6 Frame', description: 'With fabric options', typicalDailyRate: 30 },
      { id: 'frame-8x8', name: '8x8 Frame', description: 'With fabric options', typicalDailyRate: 40 },
      { id: 'frame-12x12', name: '12x12 Frame', description: 'With fabric options', typicalDailyRate: 75 },
      { id: 'frame-20x20', name: '20x20 Frame', description: 'With fabric options', typicalDailyRate: 150 },
      { id: 'butterfly-kit-12x12', name: '12x12 Butterfly Kit', description: 'Frame with stands/fabric', typicalDailyRate: 125 },
      { id: 'butterfly-kit-20x20', name: '20x20 Butterfly Kit', description: 'Frame with stands/fabric', typicalDailyRate: 200 },
      // Rigging
      { id: 'speed-rail-8ft', name: 'Speed Rail 8ft', description: 'Aluminum pipe', typicalDailyRate: 5 },
      { id: 'speed-rail-clamp', name: 'Speed Rail Clamps', description: 'Various clamps', typicalDailyRate: 3 },
      { id: 'truss-10ft', name: 'Box Truss 10ft', description: 'Aluminum truss', typicalDailyRate: 50 },
      { id: 'chain-motor', name: 'Chain Motor 1 Ton', description: 'Electric hoist', typicalDailyRate: 75 },
      { id: 'menace-arm', name: 'Menace Arm', description: 'Light positioning arm', typicalDailyRate: 50 },
      { id: 'wall-spreader', name: 'Wall Spreader', description: 'For overhead work', typicalDailyRate: 30 },
      // Bounce/Negative
      { id: 'beadboard-4x8', name: 'Beadboard 4x8', description: 'White bounce', typicalDailyRate: 15 },
      { id: 'shiny-board', name: 'Shiny Board', description: 'Reflector', typicalDailyRate: 25 },
      { id: 'griffolyn-20x20', name: 'Griffolyn 20x20', description: 'Black/white fabric', typicalDailyRate: 40 },
    ]
  },
  {
    id: 'sound',
    name: 'Sound',
    icon: '🎙️',
    items: [
      // Recorders
      { id: 'sound-devices-888', name: 'Sound Devices 888', description: '8-channel recorder/mixer', typicalDailyRate: 350 },
      { id: 'sound-devices-833', name: 'Sound Devices 833', description: '6-channel recorder/mixer', typicalDailyRate: 250 },
      { id: 'zoom-f8n-pro', name: 'Zoom F8n Pro', description: '8-channel recorder', typicalDailyRate: 100 },
      { id: 'sound-devices-cl16', name: 'Sound Devices CL-16', description: 'Fader controller', typicalDailyRate: 150 },
      // Microphones - Boom
      { id: 'sennheiser-mkh-416', name: 'Sennheiser MKH 416', description: 'Shotgun mic', typicalDailyRate: 50 },
      { id: 'sennheiser-mkh-8060', name: 'Sennheiser MKH 8060', description: 'Short shotgun', typicalDailyRate: 60 },
      { id: 'schoeps-cmit-5u', name: 'Schoeps CMIT 5U', description: 'Premium shotgun', typicalDailyRate: 75 },
      { id: 'sanken-cs3e', name: 'Sanken CS-3e', description: 'Shotgun mic', typicalDailyRate: 55 },
      // Microphones - Lavs
      { id: 'sanken-cos11d', name: 'Sanken COS-11D', description: 'Lavalier mic', typicalDailyRate: 35 },
      { id: 'dpa-4060', name: 'DPA 4060', description: 'Lavalier mic', typicalDailyRate: 40 },
      { id: 'countryman-b3', name: 'Countryman B3', description: 'Lavalier mic', typicalDailyRate: 25 },
      // Wireless
      { id: 'lectrosonics-dbsm', name: 'Lectrosonics DBSM Kit', description: 'Wireless lav system', typicalDailyRate: 100 },
      { id: 'wisycom-mpr52', name: 'Wisycom MPR52 Kit', description: 'Wireless lav system', typicalDailyRate: 125 },
      { id: 'sennheiser-g4', name: 'Sennheiser G4 Kit', description: 'Wireless lav system', typicalDailyRate: 50 },
      { id: 'comtek-216', name: 'Comtek 216 (Set of 4)', description: 'IFB system', typicalDailyRate: 75 },
      // Boom Poles
      { id: 'k-tek-klassic', name: 'K-Tek Klassic Boom Pole', description: '12ft carbon fiber', typicalDailyRate: 25 },
      { id: 'ambient-qp-5100', name: 'Ambient QP 5100', description: 'Premium boom pole', typicalDailyRate: 40 },
      // Accessories
      { id: 'rycote-windshield', name: 'Rycote Windshield Kit', description: 'Wind protection', typicalDailyRate: 30 },
      { id: 'sound-cart', name: 'Sound Cart', description: 'Equipment cart', typicalDailyRate: 50 },
      { id: 'timecode-slate', name: 'Timecode Slate', description: 'Denecke TS-3', typicalDailyRate: 75 },
    ]
  },
  {
    id: 'video-assist',
    name: 'Video Assist & Monitors',
    icon: '🖥️',
    items: [
      // Monitors
      { id: 'flanders-cm250', name: 'Flanders CM250', description: '24" OLED reference monitor', typicalDailyRate: 300 },
      { id: 'sony-bvm-e251', name: 'Sony BVM-E251', description: '25" OLED reference', typicalDailyRate: 350 },
      { id: 'atomos-shogun-7', name: 'Atomos Shogun 7', description: '7" HDR monitor/recorder', typicalDailyRate: 100 },
      { id: 'smallhd-cine-24', name: 'SmallHD Cine 24', description: '24" production monitor', typicalDailyRate: 200 },
      { id: 'smallhd-702', name: 'SmallHD 702 Touch', description: '7" on-camera monitor', typicalDailyRate: 75 },
      { id: 'tvlogic-7', name: 'TVLogic 7" OLED', description: 'On-camera monitor', typicalDailyRate: 75 },
      // Video Village
      { id: 'video-village-cart', name: 'Video Village Cart', description: 'Complete setup', typicalDailyRate: 250 },
      { id: 'directors-monitor-stand', name: 'Directors Monitor Stand', description: 'With shade', typicalDailyRate: 50 },
      // Wireless Video
      { id: 'teradek-bolt-4k', name: 'Teradek Bolt 4K Max', description: 'Wireless video TX/RX', typicalDailyRate: 400 },
      { id: 'teradek-bolt-6', name: 'Teradek Bolt 6 XT', description: 'Wireless video set', typicalDailyRate: 300 },
      { id: 'vaxis-storm-3000', name: 'Vaxis Storm 3000', description: 'Long-range wireless', typicalDailyRate: 200 },
      // Recorders
      { id: 'atomos-ninja-v', name: 'Atomos Ninja V+', description: 'ProRes recorder', typicalDailyRate: 75 },
      { id: 'video-devices-pix-e7', name: 'Video Devices PIX-E7', description: '4K recorder', typicalDailyRate: 150 },
      { id: 'blackmagic-hyperdeck', name: 'Blackmagic HyperDeck', description: 'Studio recorder', typicalDailyRate: 100 },
    ]
  },
  {
    id: 'drones',
    name: 'Drones & Aerial',
    icon: '🚁',
    items: [
      { id: 'dji-inspire-3', name: 'DJI Inspire 3', description: '8K cinema drone', typicalDailyRate: 500 },
      { id: 'dji-mavic-3-cine', name: 'DJI Mavic 3 Cine', description: 'Compact 5.1K drone', typicalDailyRate: 200 },
      { id: 'freefly-alta-x', name: 'Freefly Alta X', description: 'Heavy-lift drone', typicalDailyRate: 800 },
      { id: 'dji-m600', name: 'DJI M600 Pro', description: 'Cinema camera drone', typicalDailyRate: 600 },
      { id: 'fpv-cinewhoop', name: 'FPV Cinewhoop', description: 'FPV indoor drone', typicalDailyRate: 150 },
      { id: 'fpv-racing', name: 'FPV Racing Drone', description: 'High-speed FPV', typicalDailyRate: 200 },
      { id: 'drone-batteries', name: 'Drone Battery Package', description: 'Extra batteries', typicalDailyRate: 50 },
    ]
  },
  {
    id: 'power-distribution',
    name: 'Power & Distribution',
    icon: '⚡',
    items: [
      { id: 'generator-tow-plant', name: 'Tow Plant Generator 125A', description: '3-phase generator', typicalDailyRate: 400 },
      { id: 'generator-whisper', name: 'Honda EU7000 Whisper', description: 'Quiet generator', typicalDailyRate: 150 },
      { id: 'generator-putt-putt', name: 'Putt-Putt Generator', description: 'Small portable gen', typicalDailyRate: 75 },
      { id: 'distro-lunch-box', name: 'Lunch Box Distro', description: '100A distribution', typicalDailyRate: 50 },
      { id: 'distro-gang-box', name: 'Gang Box', description: 'Power distribution', typicalDailyRate: 30 },
      { id: 'bates-cable-100ft', name: 'Bates Cable 100ft', description: 'Heavy-duty cable', typicalDailyRate: 15 },
      { id: 'stingers-set', name: 'Stingers (Set of 10)', description: 'Extension cords', typicalDailyRate: 20 },
      { id: 'cube-tap-set', name: 'Cube Tap Set', description: '3-way adapters', typicalDailyRate: 10 },
      { id: 'v-mount-batteries', name: 'V-Mount Batteries (4 pack)', description: '150Wh batteries', typicalDailyRate: 50 },
      { id: 'gold-mount-batteries', name: 'Gold Mount Batteries (4 pack)', description: '150Wh batteries', typicalDailyRate: 50 },
      { id: 'battery-charger', name: 'Battery Charger Quad', description: '4-way charger', typicalDailyRate: 25 },
      { id: 'block-batteries', name: 'Block Batteries (4 pack)', description: 'For Alexa cameras', typicalDailyRate: 75 },
    ]
  },
  {
    id: 'expendables',
    name: 'Expendables',
    icon: '📦',
    items: [
      { id: 'gaff-tape-black', name: 'Gaff Tape Black (Case)', description: '12 rolls', typicalDailyRate: 0 },
      { id: 'gaff-tape-white', name: 'Gaff Tape White (Case)', description: '12 rolls', typicalDailyRate: 0 },
      { id: 'paper-tape', name: 'Paper Tape (Case)', description: '12 rolls', typicalDailyRate: 0 },
      { id: 'duvetyne-bolt', name: 'Duvetyne (Bolt)', description: 'Black fabric', typicalDailyRate: 0 },
      { id: 'diffusion-roll', name: 'Diffusion Roll', description: 'Various types', typicalDailyRate: 0 },
      { id: 'gel-pack', name: 'Gel Pack CTO/CTB', description: 'Color correction', typicalDailyRate: 0 },
      { id: 'blackwrap-roll', name: 'Blackwrap Roll', description: 'Light control', typicalDailyRate: 0 },
      { id: 'sandbags-set', name: 'Sandbags (Set of 10)', description: '25lb sandbags', typicalDailyRate: 20 },
      { id: 'apple-boxes-set', name: 'Apple Box Set', description: 'Full, half, quarter, pancake', typicalDailyRate: 15 },
      { id: 'furniture-pads', name: 'Furniture Pads (10)', description: 'Moving blankets', typicalDailyRate: 10 },
      { id: 'c47-clothespins', name: 'C47s (Box)', description: 'Wooden clothespins', typicalDailyRate: 0 },
      { id: 'show-cards', name: 'Show Cards (Pack)', description: 'Bounce cards', typicalDailyRate: 0 },
    ]
  },
  {
    id: 'vehicles',
    name: 'Production Vehicles',
    icon: '🚛',
    items: [
      { id: 'grip-truck-3ton', name: '3-Ton Grip Truck', description: 'Fully stocked', typicalDailyRate: 500 },
      { id: 'grip-truck-5ton', name: '5-Ton Grip Truck', description: 'Fully stocked', typicalDailyRate: 700 },
      { id: 'lighting-truck-5ton', name: '5-Ton Lighting Truck', description: 'Fully stocked', typicalDailyRate: 700 },
      { id: 'camera-truck', name: 'Camera Truck', description: 'Climate-controlled', typicalDailyRate: 400 },
      { id: 'honeywagon', name: 'Honeywagon', description: 'Portable restrooms', typicalDailyRate: 350 },
      { id: 'production-trailer', name: 'Production Trailer', description: 'Office trailer', typicalDailyRate: 300 },
      { id: 'hair-makeup-trailer', name: 'Hair & Makeup Trailer', description: 'HMU stations', typicalDailyRate: 400 },
      { id: 'wardrobe-trailer', name: 'Wardrobe Trailer', description: 'Costume storage', typicalDailyRate: 350 },
      { id: 'cast-trailer', name: 'Cast Trailer', description: 'Star trailer', typicalDailyRate: 300 },
      { id: 'catering-truck', name: 'Catering Truck', description: 'Mobile kitchen', typicalDailyRate: 500 },
      { id: 'passenger-van', name: 'Passenger Van 15-seat', description: 'Crew transport', typicalDailyRate: 150 },
      { id: 'cargo-van', name: 'Cargo Van', description: 'Equipment transport', typicalDailyRate: 100 },
      { id: 'picture-car-coordinator', name: 'Picture Car (Rental)', description: 'On-camera vehicle', typicalDailyRate: 200 },
    ]
  },
  {
    id: 'specialty',
    name: 'Specialty & VFX',
    icon: '✨',
    items: [
      // Green Screen
      { id: 'green-screen-12x12', name: 'Green Screen 12x12', description: 'Chroma key fabric', typicalDailyRate: 75 },
      { id: 'green-screen-20x20', name: 'Green Screen 20x20', description: 'Large chroma key', typicalDailyRate: 150 },
      { id: 'cyclorama-paint', name: 'Cyclorama Paint Kit', description: 'For painted cyc', typicalDailyRate: 100 },
      // Motion Control
      { id: 'bolt-high-speed', name: 'Bolt High-Speed Robot', description: 'High-speed robot arm', typicalDailyRate: 3500 },
      { id: 'milo-motion-control', name: 'Milo Motion Control', description: 'Precision camera robot', typicalDailyRate: 2500 },
      { id: 'kira-robot', name: 'Kira Robot Arm', description: 'Small motion control', typicalDailyRate: 1500 },
      // High-Speed
      { id: 'phantom-flex-4k', name: 'Phantom Flex 4K', description: 'High-speed camera', typicalDailyRate: 2000 },
      { id: 'phantom-veo-4k', name: 'Phantom VEO 4K', description: 'High-speed camera', typicalDailyRate: 1200 },
      // Underwater
      { id: 'underwater-housing', name: 'Underwater Housing', description: 'For cinema camera', typicalDailyRate: 500 },
      { id: 'underwater-lights', name: 'Underwater Lighting Kit', description: 'Submersible lights', typicalDailyRate: 300 },
      // SFX
      { id: 'rain-tower', name: 'Rain Tower', description: 'Rain effects', typicalDailyRate: 250 },
      { id: 'wind-machine', name: 'Wind Machine', description: 'Large fan', typicalDailyRate: 100 },
      { id: 'fog-machine', name: 'Professional Fog Machine', description: 'Atmosphere effects', typicalDailyRate: 75 },
      { id: 'hazer', name: 'Hazer', description: 'Atmospheric haze', typicalDailyRate: 75 },
      { id: 'snow-machine', name: 'Snow Machine', description: 'Snow effects', typicalDailyRate: 150 },
    ]
  },
  {
    id: 'art-props',
    name: 'Art Department & Props',
    icon: '🎭',
    items: [
      { id: 'prop-kit-office', name: 'Office Props Kit', description: 'Generic office items', typicalDailyRate: 100 },
      { id: 'prop-kit-kitchen', name: 'Kitchen Props Kit', description: 'Kitchen items', typicalDailyRate: 100 },
      { id: 'prop-kit-medical', name: 'Medical Props Kit', description: 'Hospital items', typicalDailyRate: 150 },
      { id: 'prop-kit-police', name: 'Police Props Kit', description: 'Law enforcement items', typicalDailyRate: 150 },
      { id: 'greens-plants', name: 'Greens/Plants Package', description: 'Foliage package', typicalDailyRate: 200 },
      { id: 'set-dressing-kit', name: 'Set Dressing Kit', description: 'General dressing items', typicalDailyRate: 150 },
      { id: 'practical-lamps', name: 'Practical Lamps Kit', description: 'On-set lighting fixtures', typicalDailyRate: 100 },
      { id: 'breakaway-glass', name: 'Breakaway Glass Kit', description: 'Sugar glass', typicalDailyRate: 75 },
    ]
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe & Costume',
    icon: '👗',
    items: [
      { id: 'wardrobe-rack', name: 'Wardrobe Rack', description: 'Rolling rack', typicalDailyRate: 15 },
      { id: 'steamer', name: 'Professional Steamer', description: 'Clothes steamer', typicalDailyRate: 25 },
      { id: 'iron-board-kit', name: 'Iron & Board Kit', description: 'Ironing station', typicalDailyRate: 15 },
      { id: 'sewing-kit-pro', name: 'Professional Sewing Kit', description: 'Alteration supplies', typicalDailyRate: 30 },
      { id: 'quick-change-tent', name: 'Quick Change Tent', description: 'Privacy tent', typicalDailyRate: 50 },
      { id: 'full-length-mirror', name: 'Full-Length Mirror', description: 'Wardrobe mirror', typicalDailyRate: 20 },
    ]
  },
  {
    id: 'makeup',
    name: 'Hair & Makeup',
    icon: '💄',
    items: [
      { id: 'makeup-station', name: 'Makeup Station', description: 'With lights and mirror', typicalDailyRate: 75 },
      { id: 'hair-station', name: 'Hair Station', description: 'With styling tools', typicalDailyRate: 75 },
      { id: 'sfx-makeup-kit', name: 'SFX Makeup Kit', description: 'Prosthetics supplies', typicalDailyRate: 150 },
      { id: 'airbrush-kit', name: 'Airbrush Makeup Kit', description: 'Professional airbrush', typicalDailyRate: 50 },
      { id: 'salon-chair', name: 'Salon Chair', description: 'Professional chair', typicalDailyRate: 25 },
      { id: 'director-chair-hmu', name: 'Director Chairs for HMU (4)', description: 'Makeup chairs', typicalDailyRate: 30 },
    ]
  },
  {
    id: 'craft-services',
    name: 'Craft Services & Catering',
    icon: '🍽️',
    items: [
      { id: 'craft-table', name: 'Craft Services Table Setup', description: '8ft tables and linens', typicalDailyRate: 75 },
      { id: 'coffee-station', name: 'Coffee Station', description: 'Commercial brewer', typicalDailyRate: 50 },
      { id: 'coolers-set', name: 'Cooler Set (4)', description: 'Beverage coolers', typicalDailyRate: 25 },
      { id: 'pop-up-tent', name: 'Pop-Up Tent 10x10', description: 'Shade tent', typicalDailyRate: 35 },
      { id: 'heaters-outdoor', name: 'Outdoor Heaters (4)', description: 'Propane heaters', typicalDailyRate: 100 },
      { id: 'portable-ac', name: 'Portable AC Unit', description: 'Spot cooling', typicalDailyRate: 150 },
      { id: 'catering-tent-20x20', name: 'Catering Tent 20x20', description: 'Meal tent', typicalDailyRate: 200 },
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '📡',
    items: [
      { id: 'walkie-set-12', name: 'Walkie Talkies (Set of 12)', description: 'Motorola radios', typicalDailyRate: 100 },
      { id: 'walkie-set-24', name: 'Walkie Talkies (Set of 24)', description: 'Motorola radios', typicalDailyRate: 175 },
      { id: 'repeater', name: 'Radio Repeater', description: 'Signal booster', typicalDailyRate: 75 },
      { id: 'bullhorn', name: 'Bullhorn/Megaphone', description: 'Voice amplification', typicalDailyRate: 15 },
      { id: 'wifi-hotspot', name: 'WiFi Hotspot Kit', description: 'Mobile internet', typicalDailyRate: 50 },
      { id: 'cell-booster', name: 'Cell Signal Booster', description: 'WeBoost system', typicalDailyRate: 75 },
    ]
  },
];

// Helper functions
export const getAllCategories = (): string[] => {
  return EQUIPMENT_CATEGORIES.map(c => c.name);
};

export const getItemsForCategory = (categoryName: string): EquipmentItem[] => {
  const cat = EQUIPMENT_CATEGORIES.find(c => c.name === categoryName);
  return cat?.items || [];
};

export const getAllItems = (): { category: string; item: EquipmentItem }[] => {
  const result: { category: string; item: EquipmentItem }[] = [];
  EQUIPMENT_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      result.push({ category: cat.name, item });
    });
  });
  return result;
};

export const getCategoryIcon = (categoryName: string): string => {
  const cat = EQUIPMENT_CATEGORIES.find(c => c.name === categoryName);
  return cat?.icon || '📦';
};
