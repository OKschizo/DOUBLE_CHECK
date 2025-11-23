import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  createProjectSchema,
  updateProjectSchema,
  type Project,
  type ProjectMember,
} from '@/lib/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const projectsRouter = router({
  /**
   * List all projects the user is a member of
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['planning', 'pre-production', 'production', 'post-production', 'completed', 'archived'])
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // First, get all projects the user is an active member of
      const membersSnapshot = await adminDb
        .collection('projectMembers')
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .get();

      if (membersSnapshot.empty) {
        return [];
      }

      const projectIds = membersSnapshot.docs.map(doc => doc.data().projectId);

      // Then fetch those projects
      const projectsRef = adminDb.collection('projects');
      const projects: Project[] = [];

      // Firestore 'in' queries are limited to 10, so batch if needed
      for (let i = 0; i < projectIds.length; i += 10) {
        const batch = projectIds.slice(i, i + 10);
        
        // Use get() for individual docs instead of 'in' query to avoid index issues
        const projectDocs = await Promise.all(
          batch.map(id => projectsRef.doc(id).get())
        );

        // Process each document
        for (const doc of projectDocs) {
          if (!doc.exists) continue;
          
          const data = doc.data();
          if (!data) continue;
          
          // Filter by status if specified
          if (input.status && data.status !== input.status) {
            continue;
          }

          // Verify orgId matches user's org
          if (data.orgId !== ctx.user.orgId) {
            continue;
          }

          projects.push({
            id: doc.id,
            orgId: data.orgId,
            title: data.title,
            client: data.client,
            description: data.description,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            status: data.status || 'planning',
            budget: data.budget,
            coverImageUrl: data.coverImageUrl,
            customCastTypes: data.customCastTypes || [],
            customCrewDepartments: data.customCrewDepartments || [],
            customRolesByDepartment: data.customRolesByDepartment || {},
            customEquipmentCategories: data.customEquipmentCategories || [],
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Project);
        }
      }

      // Sort by createdAt desc
      projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return projects;
    }),

  /**
   * Get a single project by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      
      if (data.orgId !== ctx.user.orgId) {
        return null;
      }

      return {
        id: doc.id,
        orgId: data.orgId,
        title: data.title,
        client: data.client,
        description: data.description,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        status: data.status || 'planning',
        budget: data.budget,
        coverImageUrl: data.coverImageUrl,
        customCastTypes: data.customCastTypes || [],
        customCrewDepartments: data.customCrewDepartments || [],
        customRolesByDepartment: data.customRolesByDepartment || {},
        customEquipmentCategories: data.customEquipmentCategories || [],
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Project;
    }),

  /**
   * List available project templates
   */
  listTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const projectsRef = adminDb.collection('projects');
      const snapshot = await projectsRef
        .where('isTemplate', '==', true)
        .where('isPublic', '==', true)
        .get();

      const templates = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          orgId: data.orgId,
          title: data.title,
          client: data.client,
          description: data.description,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          status: data.status || 'planning',
          budget: data.budget,
          coverImageUrl: data.coverImageUrl,
          customCastTypes: data.customCastTypes || [],
          customCrewDepartments: data.customCrewDepartments || [],
          customRolesByDepartment: data.customRolesByDepartment || {},
          customEquipmentCategories: data.customEquipmentCategories || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isTemplate: true,
          isPublic: true,
        } as Project;
      });

      return templates;
    }),

  /**
   * Seed the "Nike - Air Max Launch" template project
   */
  seedTemplate: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Helper to create colorful placeholder images for crew/cast
      const createColorfulPlaceholder = (name: string, width = 400, height = 400) => {
        // Get initials from name
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        // Colorful gradient pairs (matching frontend getAvatarColor)
        const gradients = [
          { from: '#a855f7', to: '#ec4899' }, // purple-500 to pink-500
          { from: '#3b82f6', to: '#06b6d4' }, // blue-500 to cyan-500
          { from: '#22c55e', to: '#10b981' }, // green-500 to emerald-500
          { from: '#f97316', to: '#ef4444' }, // orange-500 to red-500
          { from: '#ec4899', to: '#f43f5e' }, // pink-500 to rose-500
          { from: '#6366f1', to: '#a855f7' }, // indigo-500 to purple-500
          { from: '#06b6d4', to: '#3b82f6' }, // cyan-500 to blue-500
          { from: '#f59e0b', to: '#f97316' }, // amber-500 to orange-500
        ];
        
        // Select gradient based on name hash
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
        const gradient = gradients[index];
        
        // Create unique gradient ID based on name hash to avoid conflicts
        const gradientId = `grad-${name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}`;
        
        // Calculate font size based on width (roughly 40% of width for 2 letters)
        const fontSize = Math.floor(width * 0.4);
        
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#${gradientId})"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      };

      // Helper to create data URI placeholder images (for non-person images)
      const createPlaceholder = (text: string, bgColor = '1e293b', textColor = 'ffffff', width = 600, height = 337) => {
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      };

      // Create project
      const projectRef = adminDb.collection('projects').doc();
      const projectId = projectRef.id;
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 2); // Started 2 days ago
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 5); // Ends in 5 days

      await projectRef.set({
        title: 'Nike - Air Max Launch',
        client: 'Nike',
        description: 'Commercial spot for the new Air Max release. High energy, urban setting.',
        status: 'production',
        budget: 275000,
        coverImageUrl: createPlaceholder('Nike - Air Max Launch', '1e293b', 'ffffff', 1200, 600),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        orgId: ctx.user.orgId,
        createdBy: ctx.user.id,
        isTemplate: true,
        isPublic: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        customCastTypes: ['Athlete', 'Extra'],
        customCrewDepartments: [],
        customRolesByDepartment: {},
        customEquipmentCategories: ['Camera', 'Lighting', 'Grip', 'Sound', 'Transportation'],
      });

      // 1. Crew - Comprehensive crew for Nike commercial shoot
      const crewRef = adminDb.collection('crew');
      const crewData = [
        // Production
        { name: 'Sarah Jenkins', role: 'Director', department: 'production', rate: 2500, photoUrl: createColorfulPlaceholder('Sarah Jenkins'), onPrep: false },
        { name: 'Mike Chen', role: 'Executive Producer', department: 'production', rate: 2200, photoUrl: createColorfulPlaceholder('Mike Chen'), onPrep: false },
        { name: 'Jessica Wong', role: 'Producer', department: 'production', rate: 1800, photoUrl: createColorfulPlaceholder('Jessica Wong'), onPrep: true },
        { name: 'Rachel Green', role: 'Production Coordinator', department: 'production', rate: 400, photoUrl: createColorfulPlaceholder('Rachel Green'), onPrep: true },
        { name: 'Kevin Brown', role: '1st AD', department: 'production', rate: 900, photoUrl: createColorfulPlaceholder('Kevin Brown'), onPrep: true },
        { name: 'Amanda White', role: '2nd AD', department: 'production', rate: 600, photoUrl: createColorfulPlaceholder('Amanda White'), onPrep: true },
        { name: 'James Taylor', role: 'Production Assistant', department: 'production', rate: 250, photoUrl: createColorfulPlaceholder('James Taylor'), onPrep: true },
        { name: 'Maria Garcia', role: 'Production Assistant', department: 'production', rate: 250, photoUrl: createColorfulPlaceholder('Maria Garcia'), onPrep: true },
        { name: 'Robert Kim', role: 'Location Manager', department: 'production', rate: 500, photoUrl: createColorfulPlaceholder('Robert Kim'), onPrep: true },
        
        // Camera
        { name: 'David Miller', role: 'Director of Photography', department: 'camera', rate: 1500, photoUrl: createColorfulPlaceholder('David Miller'), onPrep: true },
        { name: 'Chris Thompson', role: '1st AC', department: 'camera', rate: 700, photoUrl: createColorfulPlaceholder('Chris Thompson'), onPrep: true },
        { name: 'Ryan Park', role: '2nd AC', department: 'camera', rate: 500, photoUrl: createColorfulPlaceholder('Ryan Park'), onPrep: true },
        { name: 'Lisa Chen', role: 'DIT', department: 'camera', rate: 600, photoUrl: createColorfulPlaceholder('Lisa Chen'), onPrep: true },
        { name: 'Michael Johnson', role: 'Camera Operator', department: 'camera', rate: 800, photoUrl: createColorfulPlaceholder('Michael Johnson'), onPrep: true },
        { name: 'Jennifer Lee', role: 'Steadicam Operator', department: 'camera', rate: 1000, photoUrl: createColorfulPlaceholder('Jennifer Lee'), onPrep: false },
        { name: 'Daniel Smith', role: 'B Camera Operator', department: 'camera', rate: 800, photoUrl: createColorfulPlaceholder('Daniel Smith'), onPrep: true },
        { name: 'Nicole Williams', role: 'B Camera 1st AC', department: 'camera', rate: 700, photoUrl: createColorfulPlaceholder('Nicole Williams'), onPrep: true },
        
        // Lighting & Grip
        { name: 'Emily Davis', role: 'Gaffer', department: 'lighting_grip', rate: 700, photoUrl: createColorfulPlaceholder('Emily Davis'), onPrep: true },
        { name: 'Tom Martinez', role: 'Best Boy Electric', department: 'lighting_grip', rate: 550, photoUrl: createColorfulPlaceholder('Tom Martinez'), onPrep: true },
        { name: 'Alex Wilson', role: 'Key Grip', department: 'lighting_grip', rate: 700, photoUrl: createColorfulPlaceholder('Alex Wilson'), onPrep: true },
        { name: 'Brian Anderson', role: 'Best Boy Grip', department: 'lighting_grip', rate: 550, photoUrl: createColorfulPlaceholder('Brian Anderson'), onPrep: true },
        { name: 'Stephanie Moore', role: 'Electric', department: 'lighting_grip', rate: 400, photoUrl: createColorfulPlaceholder('Stephanie Moore'), onPrep: true },
        { name: 'Mark Thompson', role: 'Electric', department: 'lighting_grip', rate: 400, photoUrl: createColorfulPlaceholder('Mark Thompson'), onPrep: true },
        { name: 'Laura Rodriguez', role: 'Grip', department: 'lighting_grip', rate: 400, photoUrl: createColorfulPlaceholder('Laura Rodriguez'), onPrep: true },
        { name: 'Kevin Martinez', role: 'Grip', department: 'lighting_grip', rate: 400, photoUrl: createColorfulPlaceholder('Kevin Martinez'), onPrep: true },
        { name: 'David Lee', role: 'Dolly Grip', department: 'lighting_grip', rate: 500, photoUrl: createColorfulPlaceholder('David Lee'), onPrep: true },
        
        // Sound
        { name: 'Pat Casey', role: 'Sound Mixer', department: 'sound', rate: 800, photoUrl: createColorfulPlaceholder('Pat Casey'), onPrep: true },
        { name: 'Samantha Brown', role: 'Boom Operator', department: 'sound', rate: 500, photoUrl: createColorfulPlaceholder('Samantha Brown'), onPrep: true },
        { name: 'Ryan Cooper', role: 'Sound Utility', department: 'sound', rate: 350, photoUrl: createColorfulPlaceholder('Ryan Cooper'), onPrep: true },
        
        // Art Department
        { name: 'Sam Taylor', role: 'Production Designer', department: 'art', rate: 1200, photoUrl: createColorfulPlaceholder('Sam Taylor'), onPrep: true },
        { name: 'Emma Wilson', role: 'Art Director', department: 'art', rate: 800, photoUrl: createColorfulPlaceholder('Emma Wilson'), onPrep: true },
        { name: 'Carlos Mendez', role: 'Set Decorator', department: 'art', rate: 700, photoUrl: createColorfulPlaceholder('Carlos Mendez'), onPrep: true },
        { name: 'Ashley Chen', role: 'Set Dresser', department: 'art', rate: 400, photoUrl: createColorfulPlaceholder('Ashley Chen'), onPrep: true },
        { name: 'Tyler Johnson', role: 'Set Dresser', department: 'art', rate: 400, photoUrl: createColorfulPlaceholder('Tyler Johnson'), onPrep: true },
        { name: 'Maya Patel', role: 'Props Master', department: 'art', rate: 600, photoUrl: createColorfulPlaceholder('Maya Patel'), onPrep: true },
        
        // Wardrobe
        { name: 'Jordan Lee', role: 'Costume Designer', department: 'wardrobe', rate: 1000, photoUrl: createColorfulPlaceholder('Jordan Lee'), onPrep: true },
        { name: 'Sophie Martin', role: 'Wardrobe Supervisor', department: 'wardrobe', rate: 600, photoUrl: createColorfulPlaceholder('Sophie Martin'), onPrep: true },
        { name: 'Olivia Davis', role: 'Wardrobe Assistant', department: 'wardrobe', rate: 350, photoUrl: createColorfulPlaceholder('Olivia Davis'), onPrep: true },
        
        // Hair & Makeup
        { name: 'Jessica Kim', role: 'Key Hair', department: 'hair_makeup', rate: 700, photoUrl: createColorfulPlaceholder('Jessica Kim'), onPrep: true },
        { name: 'Michelle Park', role: 'Hair Assistant', department: 'hair_makeup', rate: 400, photoUrl: createColorfulPlaceholder('Michelle Park'), onPrep: true },
        { name: 'Rachel Adams', role: 'Key Makeup', department: 'hair_makeup', rate: 700, photoUrl: createColorfulPlaceholder('Rachel Adams'), onPrep: true },
        { name: 'Lauren Taylor', role: 'Makeup Assistant', department: 'hair_makeup', rate: 400, photoUrl: createColorfulPlaceholder('Lauren Taylor'), onPrep: true },
        
        // Transportation
        { name: 'John Smith', role: 'Transportation Coordinator', department: 'transportation', rate: 500, photoUrl: createColorfulPlaceholder('John Smith'), onPrep: true },
        { name: 'Robert Davis', role: 'Driver', department: 'transportation', rate: 300, photoUrl: createColorfulPlaceholder('Robert Davis'), onPrep: true },
        { name: 'William Brown', role: 'Driver', department: 'transportation', rate: 300, photoUrl: createColorfulPlaceholder('William Brown'), onPrep: true },
        
        // Craft Services
        { name: 'Linda Martinez', role: 'Craft Service', department: 'craft', rate: 350, photoUrl: createColorfulPlaceholder('Linda Martinez'), onPrep: true },
        
        // Security
        { name: 'Michael Chen', role: 'Security', department: 'security', rate: 300, photoUrl: createColorfulPlaceholder('Michael Chen'), onPrep: true },
      ];

      const crewMap = new Map<string, string>(); // Role -> ID
      const prepCrewIds: string[] = []; // Crew that work prep
      const allCrewIds: string[] = []; // All crew (for shooting days)

      for (const member of crewData) {
        const doc = await crewRef.add({
          projectId,
          name: member.name,
          role: member.role,
          department: member.department,
          email: `${member.name.toLowerCase().replace(' ', '.')}@example.com`,
          phone: '555-01' + String(Math.floor(Math.random() * 99)).padStart(2, '0'),
          dayRate: member.rate,
          photoUrl: member.photoUrl,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        crewMap.set(member.role, doc.id);
        allCrewIds.push(doc.id);
        if (member.onPrep) {
          prepCrewIds.push(doc.id);
        }
      }

      // 2. Cast - Expanded
      const castRef = adminDb.collection('cast');
      const castData = [
        { name: 'Marcus Johnson', character: 'Hero Runner', type: 'Athlete', rate: 2000, photoUrl: createColorfulPlaceholder('Marcus Johnson') },
        { name: 'Elena Rodriguez', character: 'Sprinter', type: 'Athlete', rate: 2000, photoUrl: createColorfulPlaceholder('Elena Rodriguez') },
        { name: 'Tom Baker', character: 'Coach', type: 'Principal', rate: 1200, photoUrl: createColorfulPlaceholder('Tom Baker') },
        { name: 'Jamie Kim', character: 'Training Partner', type: 'Athlete', rate: 1500, photoUrl: createColorfulPlaceholder('Jamie Kim') },
      ];

      const castMap = new Map<string, string>(); // Character -> ID

      for (const member of castData) {
        const doc = await castRef.add({
          projectId,
          actorName: member.name, // Use actorName to match schema
          characterName: member.character,
          castType: member.type,
          email: `${member.name.toLowerCase().replace(' ', '.')}@example.com`,
          phone: '555-02' + String(Math.floor(Math.random() * 99)).padStart(2, '0'),
          rate: member.rate, // Use 'rate' not 'dayRate' for cast
          photoUrl: member.photoUrl, // Use photoUrl not avatarUrl for cast
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        castMap.set(member.character, doc.id);
      }

      // 3. Locations - Comprehensive including parking, staging, production offices
      const locRef = adminDb.collection('locations');
      const locData = [
        // Main shooting locations
        { name: 'City Stadium', address: '123 Stadium Way, Los Angeles, CA 90001', cost: 5000, type: 'shooting', notes: 'Main shooting location. Permit required. Contact: John Smith (555-0100)' },
        { name: 'Downtown Gym', address: '456 Fitness Blvd, Los Angeles, CA 90002', cost: 2500, type: 'shooting', notes: 'Interior locker room scenes. Contact: Maria Garcia (555-0200)' },
        { name: 'Urban Park', address: '789 Park Ave, Los Angeles, CA 90003', cost: 1000, type: 'shooting', notes: 'Exterior running scenes. Permit required.' },
        
        // Support locations
        { name: 'Stadium Crew Parking', address: 'Lot A - 123 Stadium Way, Los Angeles, CA 90001', cost: 0, type: 'parking', notes: 'Crew parking for City Stadium shoot. Enter via Gate 3.' },
        { name: 'Stadium Basecamp', address: 'North Lot - 123 Stadium Way, Los Angeles, CA 90001', cost: 0, type: 'basecamp', notes: 'Production basecamp with trailers and craft services.' },
        { name: 'Stadium Tech Trucks', address: 'South Lot - 123 Stadium Way, Los Angeles, CA 90001', cost: 0, type: 'tech', notes: 'Equipment trucks and generators.' },
        { name: 'Stadium BG Holding', address: 'East Lot - 123 Stadium Way, Los Angeles, CA 90001', cost: 0, type: 'holding', notes: 'Background talent holding area.' },
        { name: 'Stadium BG Parking', address: 'West Lot - 123 Stadium Way, Los Angeles, CA 90001', cost: 0, type: 'parking', notes: 'Background talent parking.' },
        
        { name: 'Production Office', address: '100 Production Blvd, Suite 200, Los Angeles, CA 90004', cost: 2000, type: 'office', notes: 'Main production office. Open 8am-8pm.' },
        { name: 'Gym Crew Parking', address: '456 Fitness Blvd Parking Garage, Los Angeles, CA 90002', cost: 0, type: 'parking', notes: 'Validated parking for crew.' },
        { name: 'Park Crew Parking', address: '789 Park Ave Street Parking, Los Angeles, CA 90003', cost: 0, type: 'parking', notes: 'Street parking available. Metered.' },
      ];

      const locMap = new Map<string, string>(); // Name -> ID

      for (const loc of locData) {
        const doc = await locRef.add({
          projectId,
          name: loc.name,
          address: loc.address,
          cost: loc.cost,
          type: loc.type,
          notes: loc.notes,
          status: 'confirmed',
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        locMap.set(loc.name, doc.id);
      }

      // 4. Equipment - Exhaustive list for Nike commercial
      const equipRef = adminDb.collection('equipment');
      const equipData = [
        // Camera
        { name: 'ARRI Alexa Mini LF', category: 'Camera', quantity: 2, cost: 3500, vendor: 'Camera Rentals LA', photoUrl: createPlaceholder('ARRI', '1e293b', 'ffffff', 400, 300) },
        { name: 'Cooke S7/i Prime Lens Set', category: 'Camera', quantity: 1, cost: 2000, vendor: 'Camera Rentals LA', photoUrl: createPlaceholder('Cooke', '1e293b', 'ffffff', 400, 300) },
        { name: 'Canon CN-E 15-120mm T2.95', category: 'Camera', quantity: 1, cost: 1200, vendor: 'Camera Rentals LA', photoUrl: createPlaceholder('Canon', '1e293b', 'ffffff', 400, 300) },
        { name: 'DJI Ronin 4D', category: 'Camera', quantity: 1, cost: 1500, vendor: 'Camera Rentals LA', photoUrl: createPlaceholder('DJI', '1e293b', 'ffffff', 400, 300) },
        { name: 'RED Komodo 6K', category: 'Camera', quantity: 1, cost: 800, vendor: 'Camera Rentals LA', photoUrl: createPlaceholder('RED', '1e293b', 'ffffff', 400, 300) },
        
        // Lighting
        { name: 'ARRI Skypanel S60-C', category: 'Lighting', quantity: 6, cost: 400, vendor: 'Lighting Solutions Inc', photoUrl: createPlaceholder('Skypanel', '1e293b', 'ffffff', 400, 300) },
        { name: 'ARRI M18 HMI', category: 'Lighting', quantity: 2, cost: 600, vendor: 'Lighting Solutions Inc', photoUrl: createPlaceholder('M18', '1e293b', 'ffffff', 400, 300) },
        { name: 'Kino Flo Celeb 400', category: 'Lighting', quantity: 4, cost: 300, vendor: 'Lighting Solutions Inc', photoUrl: createPlaceholder('Kino Flo', '1e293b', 'ffffff', 400, 300) },
        { name: 'Aputure 600D Pro', category: 'Lighting', quantity: 2, cost: 250, vendor: 'Lighting Solutions Inc', photoUrl: createPlaceholder('Aputure', '1e293b', 'ffffff', 400, 300) },
        { name: 'LED Light Panels (1x1)', category: 'Lighting', quantity: 8, cost: 150, vendor: 'Lighting Solutions Inc', photoUrl: createPlaceholder('LED', '1e293b', 'ffffff', 400, 300) },
        
        // Grip
        { name: '3-Ton Grip Truck', category: 'Grip', quantity: 1, cost: 1500, vendor: 'Grip & Electric Co', photoUrl: createPlaceholder('Grip Truck', '1e293b', 'ffffff', 400, 300) },
        { name: 'C-Stand Set (10x)', category: 'Grip', quantity: 1, cost: 200, vendor: 'Grip & Electric Co', photoUrl: createPlaceholder('C-Stand', '1e293b', 'ffffff', 400, 300) },
        { name: 'Matthews Flags & Nets Kit', category: 'Grip', quantity: 1, cost: 300, vendor: 'Grip & Electric Co', photoUrl: createPlaceholder('Flags', '1e293b', 'ffffff', 400, 300) },
        { name: 'Dolly Track (20ft sections)', category: 'Grip', quantity: 4, cost: 400, vendor: 'Grip & Electric Co', photoUrl: createPlaceholder('Dolly Track', '1e293b', 'ffffff', 400, 300) },
        { name: 'Camera Slider (6ft)', category: 'Grip', quantity: 1, cost: 250, vendor: 'Grip & Electric Co', photoUrl: createPlaceholder('Slider', '1e293b', 'ffffff', 400, 300) },
        
        // Sound
        { name: 'Sound Devices 833 Mixer/Recorder', category: 'Sound', quantity: 1, cost: 500, vendor: 'Sound Rentals LA', photoUrl: createPlaceholder('Mixer', '1e293b', 'ffffff', 400, 300) },
        { name: 'Sennheiser MKH 416 Shotgun Mic', category: 'Sound', quantity: 2, cost: 200, vendor: 'Sound Rentals LA', photoUrl: createPlaceholder('Mic', '1e293b', 'ffffff', 400, 300) },
        { name: 'Lavalier Mic Set (4x)', category: 'Sound', quantity: 1, cost: 300, vendor: 'Sound Rentals LA', photoUrl: createPlaceholder('Lav', '1e293b', 'ffffff', 400, 300) },
        { name: 'Boom Pole & Shock Mount', category: 'Sound', quantity: 2, cost: 150, vendor: 'Sound Rentals LA', photoUrl: createPlaceholder('Boom', '1e293b', 'ffffff', 400, 300) },
        
        // Transportation
        { name: 'Production Van (15-passenger)', category: 'Transportation', quantity: 2, cost: 400, vendor: 'Transport Solutions', photoUrl: createPlaceholder('Van', '1e293b', 'ffffff', 400, 300) },
        { name: 'Equipment Truck (26ft)', category: 'Transportation', quantity: 1, cost: 600, vendor: 'Transport Solutions', photoUrl: createPlaceholder('Truck', '1e293b', 'ffffff', 400, 300) },
      ];

      const equipIds: string[] = [];
      const equipMap = new Map<string, string>(); // Name -> ID

      for (const item of equipData) {
        const doc = await equipRef.add({
          projectId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          dailyRate: item.cost,
          rentalVendor: item.vendor,
          photoUrl: item.photoUrl,
          source: 'rental',
          status: 'available',
          assignedTo: [],
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        equipIds.push(doc.id);
        equipMap.set(item.name, doc.id);
      }

      // 5. Scenes with proper image placeholders
      const sceneRef = adminDb.collection('scenes');
      const scenesData = [
        { number: '1', title: 'Locker Room Prep', desc: 'Hero ties shoes, focused.', loc: 'Downtown Gym', status: 'completed', cast: ['Hero Runner'], equip: ['ARRI Alexa Mini LF', 'Cooke S7/i Prime Lens Set'] },
        { number: '2', title: 'Tunnel Walk', desc: 'Walking out to the track.', loc: 'City Stadium', status: 'completed', cast: ['Hero Runner', 'Sprinter'], equip: ['ARRI Alexa Mini LF', 'DJI Ronin 4D'] },
        { number: '3', title: 'Warm Up', desc: 'Stretching on the track.', loc: 'City Stadium', status: 'completed', cast: ['Hero Runner', 'Sprinter'], equip: ['ARRI Alexa Mini LF', 'ARRI Skypanel S60-C'] },
        { number: '4', title: 'The Start', desc: 'Blocks setup, ready to run.', loc: 'City Stadium', status: 'completed', cast: ['Hero Runner', 'Sprinter', 'Coach'], equip: ['ARRI Alexa Mini LF', 'RED Komodo 6K'] },
        { number: '5', title: 'The Sprint', desc: 'Explosive start, slow mo.', loc: 'City Stadium', status: 'completed', cast: ['Hero Runner', 'Sprinter'], equip: ['ARRI Alexa Mini LF', 'DJI Ronin 4D'] },
        { number: '6', title: 'The Finish', desc: 'Crossing the line.', loc: 'City Stadium', status: 'in-progress', cast: ['Hero Runner', 'Sprinter'], equip: ['ARRI Alexa Mini LF', 'ARRI Skypanel S60-C'] },
        { number: '7', title: 'Celebration', desc: 'High fives with teammates.', loc: 'City Stadium', status: 'not-shot', cast: ['Hero Runner', 'Sprinter', 'Training Partner'], equip: ['ARRI Alexa Mini LF'] },
        { number: '8', title: 'Cool Down', desc: 'Jogging on grass.', loc: 'Urban Park', status: 'not-shot', cast: ['Hero Runner'], equip: ['ARRI Alexa Mini LF', 'DJI Ronin 4D'] },
        { number: '9', title: 'Interview', desc: 'Post-race interview.', loc: 'City Stadium', status: 'not-shot', cast: ['Hero Runner', 'Coach'], equip: ['ARRI Alexa Mini LF', 'Kino Flo Celeb 400'] },
        { number: '10', title: 'Product Shot', desc: 'Shoes hero shot.', loc: 'Downtown Gym', status: 'not-shot', cast: [], equip: ['ARRI Alexa Mini LF', 'ARRI Skypanel S60-C'] },
      ];

      const sceneMap = new Map<string, string>(); // Number -> ID
      const shotMap = new Map<string, string>(); // SceneNumber-ShotNumber -> ID

      // Add reference images
      const refImageRef = adminDb.collection('referenceImages');
      const refImages = [
        { category: 'wardrobe', url: createPlaceholder('Wardrobe Reference', 'e11d48', 'ffffff', 400, 600) },
        { category: 'camera', url: createPlaceholder('Camera Reference', '059669', 'ffffff', 600, 400) },
        { category: 'location', url: createPlaceholder('Location Reference', 'd97706', 'ffffff', 600, 400) },
        { category: 'character', url: createPlaceholder('Character Reference', '7c3aed', 'ffffff', 400, 600) },
      ];
      
      const refIds = [];
      for (const ref of refImages) {
        const doc = await refImageRef.add({
          projectId,
          url: ref.url,
          category: ref.category,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: ctx.user.id,
        });
        refIds.push(doc.id);
      }

      for (const scene of scenesData) {
        const sceneCastIds = scene.cast.map(c => castMap.get(c)).filter(Boolean) as string[];
        const sceneEquipIds = scene.equip.map(e => equipMap.get(e)).filter(Boolean) as string[];
        
        // Calculate page count (rough estimate: 1/8 page per scene)
        const pageCount = `${scene.number}/8`;
        
        const doc = await sceneRef.add({
          projectId,
          sceneNumber: scene.number,
          title: scene.title,
          description: scene.desc,
          status: scene.status,
          locationId: locMap.get(scene.loc),
          pageCount: pageCount,
          imageUrl: createPlaceholder(`Scene ${scene.number}`, '1e293b', 'ffffff'),
          scriptText: `EXT. ${scene.loc.toUpperCase()} - DAY\n\n${scene.desc}`,
          castIds: sceneCastIds,
          crewIds: allCrewIds, // Assign ALL crew to scenes
          equipmentIds: sceneEquipIds,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        sceneMap.set(scene.number, doc.id);

        // Add Shots for each scene with cast and equipment
        const shotRef = adminDb.collection('shots');
        const shotA = await shotRef.add({
          projectId,
          sceneId: doc.id,
          shotNumber: 'A',
          shotType: 'Wide',
          description: 'Establishing shot',
          status: scene.status === 'completed' ? 'completed' : 'not-shot',
          imageUrl: createPlaceholder(`Scene ${scene.number} Shot A`, '334155', 'ffffff'),
          castIds: sceneCastIds,
          equipmentIds: sceneEquipIds.slice(0, 2), // Assign first 2 equipment items
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        shotMap.set(`${scene.number}-A`, shotA.id);
        
        const shotB = await shotRef.add({
          projectId,
          sceneId: doc.id,
          shotNumber: 'B',
          shotType: 'Close-up',
          description: 'Detail shot',
          status: scene.status === 'completed' ? 'completed' : 'not-shot',
          imageUrl: createPlaceholder(`Scene ${scene.number} Shot B`, '475569', 'ffffff'),
          castIds: sceneCastIds.slice(0, 1), // Assign first cast member
          equipmentIds: sceneEquipIds.slice(0, 1), // Assign first equipment
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        shotMap.set(`${scene.number}-B`, shotB.id);
      }

      // 6. Schedule - More thorough with cast/crew/equipment
      const dayRef = adminDb.collection('shootingDays');
      const eventRef = adminDb.collection('scheduleEvents');

      // Day 1 (Past)
      const day1Date = new Date(startDate);
      const day1 = await dayRef.add({
        projectId,
        date: Timestamp.fromDate(day1Date),
        dayNumber: 1,
        totalDays: 3,
        callTime: '07:00',
        shootCall: '08:00',
        locationId: locMap.get('City Stadium'),
        basecampLocationId: locMap.get('Stadium Basecamp'),
        crewParkLocationId: locMap.get('Stadium Crew Parking'),
        techTrucksLocationId: locMap.get('Stadium Tech Trucks'),
        bgHoldingLocationId: locMap.get('Stadium BG Holding'),
        bgParkingLocationId: locMap.get('Stadium BG Parking'),
        nearestHospital: 'City General Hospital, 123 Main St (5 mins)',
        notes: 'First day of principal photography. Heavy equipment day. Safety meeting at 07:15.',
        directorCrewId: crewMap.get('Director'),
        executiveProducerCrewId: crewMap.get('Executive Producer'),
        productionCoordinatorCrewId: crewMap.get('Production Coordinator'),
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Day 2 (Today)
      const day2Date = new Date(now);
      const day2 = await dayRef.add({
        projectId,
        date: Timestamp.fromDate(day2Date),
        dayNumber: 2,
        totalDays: 3,
        callTime: '06:30',
        shootCall: '07:30',
        locationId: locMap.get('City Stadium'),
        basecampLocationId: locMap.get('Stadium Basecamp'),
        crewParkLocationId: locMap.get('Stadium Crew Parking'),
        techTrucksLocationId: locMap.get('Stadium Tech Trucks'),
        bgHoldingLocationId: locMap.get('Stadium BG Holding'),
        bgParkingLocationId: locMap.get('Stadium BG Parking'),
        nearestHospital: 'City General Hospital, 123 Main St (5 mins)',
        notes: 'Heavy stunt day. Safety meeting at 06:45. Catering truck will be on site at 12:00.',
        directorCrewId: crewMap.get('Director'),
        executiveProducerCrewId: crewMap.get('Executive Producer'),
        productionCoordinatorCrewId: crewMap.get('Production Coordinator'),
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Day 3 (Future)
      const day3Date = new Date(endDate);
      day3Date.setDate(day3Date.getDate() - 2);
      const day3 = await dayRef.add({
        projectId,
        date: Timestamp.fromDate(day3Date),
        dayNumber: 3,
        totalDays: 3,
        callTime: '08:00',
        shootCall: '09:00',
        locationId: locMap.get('Urban Park'),
        basecampLocationId: locMap.get('Park Crew Parking'), // Using parking as basecamp for park
        crewParkLocationId: locMap.get('Park Crew Parking'),
        techTrucksLocationId: locMap.get('Park Crew Parking'),
        bgHoldingLocationId: locMap.get('Park Crew Parking'),
        bgParkingLocationId: locMap.get('Park Crew Parking'),
        nearestHospital: 'Urban Medical Center, 456 Park Ave (10 mins)',
        notes: 'Exterior scenes. Check weather. Company move to Downtown Gym in afternoon.',
        directorCrewId: crewMap.get('Director'),
        executiveProducerCrewId: crewMap.get('Executive Producer'),
        productionCoordinatorCrewId: crewMap.get('Production Coordinator'),
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Add realistic events for each shooting day
      const days = [day1, day2, day3];
      let sceneIndex = 1;
      let orderCounter = 0;
      
      for (const day of days) {
        const baseCallTime = day === day2 ? '06:30' : day === day3 ? '08:00' : '07:00';
        const baseShootCall = day === day2 ? '07:30' : day === day3 ? '09:00' : '08:00';
        
        // 1. Crew Call / Prep - only prep crew
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'prep',
          time: baseCallTime,
          description: 'Crew Call / Prep',
          duration: 60,
          order: orderCounter++,
          crewIds: prepCrewIds,
          equipmentIds: equipIds.slice(0, 10),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Breakfast
        const breakfastTime = day === day2 ? '07:00' : day === day3 ? '08:30' : '07:30';
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'break',
          time: breakfastTime,
          description: 'Breakfast',
          duration: 30,
          order: orderCounter++,
          crewIds: allCrewIds,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 3. Camera Blocking / Rehearsal
        const blockingTime = day === day2 ? '07:30' : day === day3 ? '09:00' : '08:00';
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'prep',
          time: blockingTime,
          description: 'Camera Blocking / Rehearsal',
          duration: 30,
          order: orderCounter++,
          crewIds: allCrewIds.slice(0, 15), // Key crew for blocking
          castIds: Array.from(castMap.values()), // All cast for rehearsal
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 4. First Shot Setup
        const firstSetupTime = day === day2 ? '08:00' : day === day3 ? '09:30' : '08:30';
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'prep',
          time: firstSetupTime,
          description: 'First Shot Setup',
          duration: 30,
          order: orderCounter++,
          crewIds: allCrewIds,
          equipmentIds: equipIds.slice(0, 15),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 5. Morning Scenes (3-4 scenes before lunch)
        const morningSceneCount = day === day2 ? 4 : 3;
        for (let i = 0; i < morningSceneCount; i++) {
          if (sceneIndex > 10) break;
          const sceneId = sceneMap.get(sceneIndex.toString());
          if (sceneId) {
            const scene = scenesData[sceneIndex - 1];
            const sceneCastIds = scene.cast.map(c => castMap.get(c)).filter(Boolean) as string[];
            const sceneEquipIds = scene.equip.map(e => equipMap.get(e)).filter(Boolean) as string[];
            const sceneLocationId = locMap.get(scene.loc);
            const pageCount = `${sceneIndex}/8`;
            
            // Calculate time (start around 9:00, then every 90-120 minutes)
            const sceneHour = 9 + Math.floor(i * 1.5);
            const sceneMinute = i === 0 ? 0 : (i * 1.5 % 1) * 60;
            const sceneTime = `${Math.floor(sceneHour)}:${String(Math.floor(sceneMinute)).padStart(2, '0')}`;
            
            await eventRef.add({
              projectId,
              shootingDayId: day.id,
              type: 'scene',
              time: sceneTime,
              description: `Scene ${sceneIndex}: ${scene.title}`,
              sceneId: sceneId,
              sceneNumber: sceneIndex.toString(),
              duration: 90,
              pageCount: pageCount,
              locationId: sceneLocationId,
              location: scene.loc,
              order: orderCounter++,
              castIds: sceneCastIds,
              crewIds: allCrewIds,
              equipmentIds: sceneEquipIds,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          sceneIndex++;
        }

        // 6. Craft Service Break (mid-morning)
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'break',
          time: '11:00',
          description: 'Craft Service Break',
          duration: 15,
          order: orderCounter++,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 7. Lunch
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'break',
          time: '13:00',
          description: 'Lunch',
          duration: 60,
          order: orderCounter++,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 8. Afternoon Scenes (3-4 scenes after lunch)
        const afternoonSceneCount = day === day2 ? 4 : 3;
        for (let i = 0; i < afternoonSceneCount; i++) {
          if (sceneIndex > 10) break;
          const sceneId = sceneMap.get(sceneIndex.toString());
          if (sceneId) {
            const scene = scenesData[sceneIndex - 1];
            const sceneCastIds = scene.cast.map(c => castMap.get(c)).filter(Boolean) as string[];
            const sceneEquipIds = scene.equip.map(e => equipMap.get(e)).filter(Boolean) as string[];
            const sceneLocationId = locMap.get(scene.loc);
            const pageCount = `${sceneIndex}/8`;
            
            // Calculate time (start around 14:00, then every 90-120 minutes)
            const sceneHour = 14 + Math.floor(i * 1.5);
            const sceneMinute = (i * 1.5 % 1) * 60;
            const sceneTime = `${Math.floor(sceneHour)}:${String(Math.floor(sceneMinute)).padStart(2, '0')}`;
            
            await eventRef.add({
              projectId,
              shootingDayId: day.id,
              type: 'scene',
              time: sceneTime,
              description: `Scene ${sceneIndex}: ${scene.title}`,
              sceneId: sceneId,
              sceneNumber: sceneIndex.toString(),
              duration: 90,
              pageCount: pageCount,
              locationId: sceneLocationId,
              location: scene.loc,
              order: orderCounter++,
              castIds: sceneCastIds,
              crewIds: allCrewIds,
              equipmentIds: sceneEquipIds,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          sceneIndex++;
        }

        // 9. Company Move (if needed - only on day 3)
        if (day === day3) {
          await eventRef.add({
            projectId,
            shootingDayId: day.id,
            type: 'move',
            time: '16:30',
            description: 'Company Move to Downtown Gym',
            duration: 30,
            order: orderCounter++,
            crewIds: allCrewIds,
            equipmentIds: equipIds,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // 10. Wrap
        const wrapTime = day === day2 ? '19:00' : day === day3 ? '18:00' : '18:30';
        await eventRef.add({
          projectId,
          shootingDayId: day.id,
          type: 'wrap',
          time: wrapTime,
          description: 'Wrap',
          duration: 30,
          order: orderCounter++,
          crewIds: allCrewIds,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // 7. Budget - Ensure proper linking
      const budgetCatRef = adminDb.collection('budgetCategories');
      const budgetItemRef = adminDb.collection('budgetItems');

      // Create Categories
      const categoriesData = [
        { name: '1000 - Above The Line', order: 1, phase: 'pre-production' },
        { name: '2000 - Production Staff', order: 2, phase: 'production' },
        { name: '3000 - Talent', order: 3, phase: 'production' },
        { name: '4000 - Camera & Sound', order: 4, phase: 'production' },
        { name: '5000 - Locations', order: 5, phase: 'production' },
        { name: '6000 - Art Department', order: 6, phase: 'production' },
        { name: '7000 - Post Production', order: 7, phase: 'post-production' },
      ];

      const catMap = new Map<string, string>(); // Name -> ID

      for (const cat of categoriesData) {
        const doc = await budgetCatRef.add({
          projectId,
          name: cat.name,
          order: cat.order,
          phase: cat.phase,
          isSubtotal: false,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        catMap.set(cat.name, doc.id);
      }

      // Add crew costs linked to categories
      for (const member of crewData) {
        let categoryName = '2000 - Production Staff';
        if (['Director', 'Producer', 'Executive Producer'].includes(member.role)) {
          categoryName = '1000 - Above The Line';
        } else if (['Director of Photography', '1st AC', '2nd AC', 'DIT', 'Sound Mixer'].includes(member.role)) {
          categoryName = '4000 - Camera & Sound';
        } else if (['Production Designer', 'Stylist'].includes(member.role) || member.department === 'art') {
          categoryName = '6000 - Art Department';
        }

        await budgetItemRef.add({
          projectId,
          categoryId: catMap.get(categoryName)!,
          description: `${member.role} - ${member.name}`,
          estimatedAmount: member.rate * 3,
          actualAmount: member.rate * 3,
          status: 'paid',
          unit: 'days',
          quantity: 3,
          unitRate: member.rate,
          linkedCrewMemberId: crewMap.get(member.role),
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Add cast costs
      for (const member of castData) {
        await budgetItemRef.add({
          projectId,
          categoryId: catMap.get('3000 - Talent')!,
          description: `${member.character} - ${member.name}`,
          estimatedAmount: member.rate * 3,
          actualAmount: member.rate * 3,
          status: 'paid',
          unit: 'days',
          quantity: 3,
          unitRate: member.rate,
          linkedCastMemberId: castMap.get(member.character),
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Add equipment costs - properly linked
      for (let i = 0; i < equipData.length; i++) {
        const item = equipData[i];
        const equipId = equipIds[i];
        let categoryName = '4000 - Camera & Sound';
        if (item.category === 'Lighting' || item.category === 'Grip') {
          categoryName = '4000 - Camera & Sound'; // Grouped together
        } else if (item.category === 'Transportation') {
          categoryName = '2000 - Production Staff';
        }

        await budgetItemRef.add({
          projectId,
          categoryId: catMap.get(categoryName)!,
          description: `${item.name} (${item.quantity}x)`,
          estimatedAmount: item.cost * 3,
          actualAmount: item.cost * 3,
          status: 'pending',
          unit: 'days',
          quantity: 3,
          unitRate: item.cost,
          vendor: item.vendor, // Budget items use 'vendor', not 'rentalVendor'
          linkedEquipmentId: equipId,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Add Location costs
      for (const loc of locData) {
        if (loc.cost > 0) { // Only add locations with costs
          await budgetItemRef.add({
            projectId,
            categoryId: catMap.get('5000 - Locations')!,
            description: `Location Fee: ${loc.name}`,
            estimatedAmount: loc.cost,
            actualAmount: loc.cost,
            status: 'paid',
            unit: 'flat',
            quantity: 1,
            unitRate: loc.cost,
            linkedLocationId: locMap.get(loc.name),
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // Add Misc Costs (Catering, Insurance, Post)
      const miscItems = [
        { cat: '2000 - Production Staff', desc: 'Catering & Craft Service', est: 3000, act: 3200, status: 'paid', vendor: 'Yum Catering' },
        { cat: '1000 - Above The Line', desc: 'Production Insurance', est: 5000, act: 5000, status: 'paid', vendor: 'FilmInsure Co' },
        { cat: '5000 - Locations', desc: 'Permits', est: 1200, act: 1200, status: 'paid', vendor: 'City Film Office' },
        { cat: '7000 - Post Production', desc: 'Editor', est: 5000, act: 0, status: 'estimated', vendor: 'TBD' },
        { cat: '7000 - Post Production', desc: 'Color Grading', est: 2500, act: 0, status: 'estimated', vendor: 'TBD' },
        { cat: '7000 - Post Production', desc: 'Sound Design', est: 1500, act: 0, status: 'estimated', vendor: 'TBD' },
      ];

      for (const item of miscItems) {
        await budgetItemRef.add({
          projectId,
          categoryId: catMap.get(item.cat)!,
          description: item.desc,
          estimatedAmount: item.est,
          actualAmount: item.act,
          status: item.status,
          vendor: item.vendor,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { success: true, projectId };
    }),

  /**
   * Create a new project from a template
   */
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      title: z.string().min(1),
      client: z.string().min(1),
      startDate: z.coerce.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Get template project
      const templateDoc = await adminDb.collection('projects').doc(input.templateId).get();
      if (!templateDoc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      const templateData = templateDoc.data()!;
      
      // 2. Create new project
      const projectRef = adminDb.collection('projects').doc();
      const projectId = projectRef.id;
      
      // Calculate date shift
      const oldStartDate = templateData.startDate?.toDate() || new Date();
      const newStartDate = input.startDate;
      const timeDiff = newStartDate.getTime() - oldStartDate.getTime();
      
      const newEndDate = new Date((templateData.endDate?.toDate() || new Date()).getTime() + timeDiff);

      await projectRef.set({
        ...templateData,
        title: input.title,
        client: input.client,
        startDate: Timestamp.fromDate(newStartDate),
        endDate: Timestamp.fromDate(newEndDate),
        orgId: ctx.user.orgId,
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isTemplate: false,
        isPublic: false,
        // Clear any template-specific fields if needed
      });

      // Add user as owner
      await adminDb.collection('projectMembers').add({
        projectId,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.displayName,
        role: 'owner',
        invitedBy: ctx.user.id,
        invitedAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp(),
        status: 'active',
      });

      // ID Maps for relationships
      const crewMap = new Map<string, string>();
      const castMap = new Map<string, string>();
      const locMap = new Map<string, string>();
      const equipMap = new Map<string, string>();
      const sceneMap = new Map<string, string>();
      const shotMap = new Map<string, string>();
      const dayMap = new Map<string, string>();
      const budgetCategoryMap = new Map<string, string>();

      // Helper to copy collection
      const copyCollection = async (collectionName: string, map?: Map<string, string>, transform?: (data: any) => any) => {
        const snapshot = await adminDb.collection(collectionName)
          .where('projectId', '==', input.templateId)
          .get();
        
        const batch = adminDb.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
          const newRef = adminDb.collection(collectionName).doc();
          if (map) map.set(doc.id, newRef.id);
          
          let data = {
            ...doc.data(),
            projectId,
            createdBy: ctx.user.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (transform) {
            data = transform(data);
          }

          batch.set(newRef, data);
          batchCount++;
        }

        if (batchCount > 0) await batch.commit();
      };

      // 3. Copy Base Resources (Crew, Cast, Locations, Equipment)
      await copyCollection('crew', crewMap);
      await copyCollection('cast', castMap);
      await copyCollection('locations', locMap);
      await copyCollection('equipment', equipMap);

      // 4. Copy Scenes (updates IDs)
      await copyCollection('scenes', sceneMap, (data) => ({
        ...data,
        locationId: data.locationId ? locMap.get(data.locationId) : null,
        castIds: data.castIds?.map((id: string) => castMap.get(id)).filter(Boolean) || [],
        crewIds: data.crewIds?.map((id: string) => crewMap.get(id)).filter(Boolean) || [],
        equipmentIds: data.equipmentIds?.map((id: string) => equipMap.get(id)).filter(Boolean) || [],
      }));

      // 5. Copy Shots (updates IDs)
      await copyCollection('shots', shotMap, (data) => ({
        ...data,
        sceneId: sceneMap.get(data.sceneId),
        locationIds: data.locationIds?.map((id: string) => locMap.get(id)).filter(Boolean) || [],
        castIds: data.castIds?.map((id: string) => castMap.get(id)).filter(Boolean) || [],
        crewIds: data.crewIds?.map((id: string) => crewMap.get(id)).filter(Boolean) || [],
        equipmentIds: data.equipmentIds?.map((id: string) => equipMap.get(id)).filter(Boolean) || [],
      }));

      // 6. Copy Shooting Days (updates IDs and Dates)
      await copyCollection('shootingDays', dayMap, (data) => {
        const oldDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        const newDate = new Date(oldDate.getTime() + timeDiff);
        return {
          ...data,
          date: Timestamp.fromDate(newDate),
          directorCrewId: data.directorCrewId ? crewMap.get(data.directorCrewId) : null,
          executiveProducerCrewId: data.executiveProducerCrewId ? crewMap.get(data.executiveProducerCrewId) : null,
          productionCoordinatorCrewId: data.productionCoordinatorCrewId ? crewMap.get(data.productionCoordinatorCrewId) : null,
          locationId: data.locationId ? locMap.get(data.locationId) : null,
          basecampLocationId: data.basecampLocationId ? locMap.get(data.basecampLocationId) : null,
          crewParkLocationId: data.crewParkLocationId ? locMap.get(data.crewParkLocationId) : null,
          techTrucksLocationId: data.techTrucksLocationId ? locMap.get(data.techTrucksLocationId) : null,
          bgHoldingLocationId: data.bgHoldingLocationId ? locMap.get(data.bgHoldingLocationId) : null,
          bgParkingLocationId: data.bgParkingLocationId ? locMap.get(data.bgParkingLocationId) : null,
        };
      });

      // 7. Copy Schedule Events
      await copyCollection('scheduleEvents', undefined, (data) => ({
        ...data,
        shootingDayId: dayMap.get(data.shootingDayId),
        sceneId: data.sceneId ? sceneMap.get(data.sceneId) : null,
        shotId: data.shotId ? shotMap.get(data.shotId) : null,
        locationId: data.locationId ? locMap.get(data.locationId) : null,
        castIds: data.castIds?.map((id: string) => castMap.get(id)).filter(Boolean) || [],
        crewIds: data.crewIds?.map((id: string) => crewMap.get(id)).filter(Boolean) || [],
        equipmentIds: data.equipmentIds?.map((id: string) => equipMap.get(id)).filter(Boolean) || [],
      }));

      // 8. Copy Budget Categories (must be done before budget items)
      await copyCollection('budgetCategories', budgetCategoryMap);

      // 9. Copy Budget Items (update categoryId references)
      await copyCollection('budgetItems', undefined, (data) => ({
        ...data,
        categoryId: data.categoryId ? budgetCategoryMap.get(data.categoryId) : null,
        linkedCrewMemberId: data.linkedCrewMemberId ? crewMap.get(data.linkedCrewMemberId) : null,
        linkedCastMemberId: data.linkedCastMemberId ? castMap.get(data.linkedCastMemberId) : null,
        linkedLocationId: data.linkedLocationId ? locMap.get(data.linkedLocationId) : null,
        linkedEquipmentId: data.linkedEquipmentId ? equipMap.get(data.linkedEquipmentId) : null,
      }));

      return { success: true, projectId };
    }),

  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const projectsRef = adminDb.collection('projects');

      const docRef = await projectsRef.add({
        title: input.title,
        client: input.client,
        status: input.status,
        budget: input.budget,
        startDate: Timestamp.fromDate(input.startDate),
        endDate: Timestamp.fromDate(input.endDate),
        customCastTypes: [],
        customCrewDepartments: [],
        customRolesByDepartment: {},
        customEquipmentCategories: [],
        orgId: ctx.user.orgId,
        createdBy: ctx.user.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get the created document
      const doc = await docRef.get();
      const data = doc.data()!;

      const newProject: Project = {
        id: doc.id,
        ...input,
        orgId: ctx.user.orgId,
        createdBy: ctx.user.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      // Automatically add creator as owner
      const membersRef = adminDb.collection('projectMembers');
      await membersRef.add({
        projectId: newProject.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.displayName,
        role: 'owner',
        invitedBy: ctx.user.id,
        invitedAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp(),
        status: 'active',
      });

      // Auto-create crew card for project owner
      try {
        const crewRef = adminDb.collection('crew');
        await crewRef.add({
          projectId: newProject.id,
          userId: ctx.user.id,
          name: ctx.user.displayName || ctx.user.email?.split('@')[0] || 'Project Owner',
          department: 'production', // Default department
          role: 'Crew - TBD', // Owner can update their own role
          email: ctx.user.email,
          createdBy: ctx.user.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to create owner crew card:', error);
        // Don't fail project creation if crew card creation fails
      }

      return newProject;
    }),

  /**
   * Update an existing project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateProjectSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        return null;
      }

      await docRef.update({
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        orgId: data.orgId,
        title: data.title,
        client: data.client,
        description: data.description,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        status: data.status || 'planning',
        budget: data.budget,
        coverImageUrl: data.coverImageUrl,
        customCastTypes: data.customCastTypes || [],
        customCrewDepartments: data.customCrewDepartments || [],
        customRolesByDepartment: data.customRolesByDepartment || {},
        customEquipmentCategories: data.customEquipmentCategories || [],
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Project;
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        return { success: false };
      }

      await docRef.delete();
      return { success: true };
    }),

  /**
   * Add a custom cast type to a project
   */
  addCustomCastType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        castType: z.string().min(1, 'Cast type name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      const data = doc.data()!;
      const existingTypes = data.customCastTypes || [];

      // Check if type already exists (case-insensitive)
      const normalizedNewType = input.castType.toLowerCase().trim();
      const typeExists = existingTypes.some(
        (type: string) => type.toLowerCase().trim() === normalizedNewType
      );

      if (typeExists) {
        throw new Error('This cast type already exists');
      }

      // Add the new type
      await docRef.update({
        customCastTypes: FieldValue.arrayUnion(input.castType.trim()),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, castType: input.castType.trim() };
    }),

  /**
   * Remove a custom cast type from a project
   */
  removeCustomCastType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        castType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      // Remove the type
      await docRef.update({
        customCastTypes: FieldValue.arrayRemove(input.castType),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),

  /**
   * Add a custom crew department to a project
   */
  addCustomCrewDepartment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        department: z.string().min(1, 'Department name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      const data = doc.data()!;
      const existingDepartments = data.customCrewDepartments || [];

      // Check if department already exists (case-insensitive)
      const normalizedNewDept = input.department.toLowerCase().trim();
      const deptExists = existingDepartments.some(
        (dept: string) => dept.toLowerCase().trim() === normalizedNewDept
      );

      if (deptExists) {
        throw new Error('This department already exists');
      }

      // Add the new department
      await docRef.update({
        customCrewDepartments: FieldValue.arrayUnion(input.department.trim()),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, department: input.department.trim() };
    }),

  /**
   * Remove a custom crew department from a project
   */
  removeCustomCrewDepartment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        department: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      // Remove the department
      await docRef.update({
        customCrewDepartments: FieldValue.arrayRemove(input.department),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),

  /**
   * Add a custom role to a department
   */
  addCustomRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        department: z.string(),
        role: z.string().min(1, 'Role name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      const data = doc.data()!;
      const customRoles = data.customRolesByDepartment || {};
      const deptRoles = customRoles[input.department] || [];

      // Check if role already exists (case-insensitive)
      const normalizedNewRole = input.role.toLowerCase().trim();
      const roleExists = deptRoles.some(
        (role: string) => role.toLowerCase().trim() === normalizedNewRole
      );

      if (roleExists) {
        throw new Error('This role already exists in this department');
      }

      // Add the new role to the department's roles array
      const updatedRoles = [...deptRoles, input.role.trim()];
      const updatedCustomRoles = {
        ...customRoles,
        [input.department]: updatedRoles,
      };

      await docRef.update({
        customRolesByDepartment: updatedCustomRoles,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, role: input.role.trim() };
    }),

  /**
   * Remove a custom role from a department
   */
  removeCustomRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        department: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      const data = doc.data()!;
      const customRoles = data.customRolesByDepartment || {};
      const deptRoles = customRoles[input.department] || [];

      // Remove the role
      const updatedRoles = deptRoles.filter((role: string) => role !== input.role);
      const updatedCustomRoles = {
        ...customRoles,
        [input.department]: updatedRoles,
      };

      // Clean up empty arrays
      if (updatedRoles.length === 0) {
        delete updatedCustomRoles[input.department];
      }

      await docRef.update({
        customRolesByDepartment: updatedCustomRoles,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),

  /**
   * Add a custom equipment category to a project
   */
  addCustomEquipmentCategory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        category: z.string().min(1, 'Category name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      const data = doc.data()!;
      const existingCategories = data.customEquipmentCategories || [];

      // Check if category already exists (case-insensitive)
      const normalizedNewCategory = input.category.toLowerCase().trim();
      const categoryExists = existingCategories.some(
        (cat: string) => cat.toLowerCase().trim() === normalizedNewCategory
      );

      if (categoryExists) {
        throw new Error('This equipment category already exists');
      }

      // Add the new category
      await docRef.update({
        customEquipmentCategories: FieldValue.arrayUnion(input.category.trim()),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, category: input.category.trim() };
    }),

  /**
   * Remove a custom equipment category from a project
   */
  removeCustomEquipmentCategory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        category: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('projects').doc(input.projectId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.orgId !== ctx.user.orgId) {
        throw new Error('Project not found');
      }

      // Remove the category
      await docRef.update({
        customEquipmentCategories: FieldValue.arrayRemove(input.category),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),
});
