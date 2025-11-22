import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createBudgetTemplateSchema,
  applyBudgetTemplateSchema,
  type BudgetTemplate,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { hasPermission } from './projectMembers';

// Comprehensive system templates
// In production, these would be stored in database
const systemTemplates: Array<Omit<BudgetTemplate, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Feature Film Template',
    type: 'film',
    description: 'Comprehensive feature film budget template with all major departments and line items',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Above The Line',
          order: 0,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Executive Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Co-Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Director', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Writer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Script Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Story Consultant', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Script Development', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Production',
          order: 1,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Line Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Manager', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Production Coordinator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: '1st AD', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: '2nd AD', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: '2nd 2nd AD', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Assistants', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Set PA', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Office PA', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Office Rent', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Office Supplies & Equipment', estimatedAmount: 0 },
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Workers Compensation', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Camera',
          order: 2,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Director of Photography', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Camera Operator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: '1st AC (Focus Puller)', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: '2nd AC (Clapper Loader)', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'DIT (Digital Imaging Technician)', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Steadicam Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Drone Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera PA', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Camera Package Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Lens Package Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Filters & Matte Box', estimatedAmount: 0 },
          { description: 'Camera Support Equipment', estimatedAmount: 0 },
          { description: 'Media & Storage', estimatedAmount: 0 },
          { description: 'Camera Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Lighting & Grip',
          order: 3,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Gaffer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Best Boy Electric', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Electricians', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Board Operator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Key Grip', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Best Boy Grip', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Dolly Grip', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Grips', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Swing', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Lighting Package Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Grip Package Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Generator Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Cables & Distribution', estimatedAmount: 0 },
          { description: 'Grip Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Lighting Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Sound',
          order: 4,
          department: 'sound',
          phase: 'production',
        },
        items: [
          { description: 'Production Sound Mixer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Boom Operator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Sound Utility', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Playback Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Package Rental', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Wireless Microphones', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Sound Accessories', estimatedAmount: 0 },
          { description: 'Sound Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Art Department',
          order: 5,
          department: 'art',
          phase: 'production',
        },
        items: [
          { description: 'Production Designer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Art Director', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Set Decorator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Lead Person', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Set Dressers', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Prop Master', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Prop Master', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Prop Builder', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Scenic Artist', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Construction Coordinator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Carpenters', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Painters', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Set Construction', estimatedAmount: 0 },
          { description: 'Set Dressing', estimatedAmount: 0 },
          { description: 'Props Purchase', estimatedAmount: 0 },
          { description: 'Props Rental', estimatedAmount: 0 },
          { description: 'Art Department Supplies', estimatedAmount: 0 },
          { description: 'Art Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Wardrobe',
          order: 6,
          department: 'wardrobe',
          phase: 'production',
        },
        items: [
          { description: 'Costume Designer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Costume Designer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Costume Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Key Costumer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Set Costumer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Costume PA', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Costume Rental', estimatedAmount: 0 },
          { description: 'Costume Purchase', estimatedAmount: 0 },
          { description: 'Costume Alterations', estimatedAmount: 0 },
          { description: 'Wardrobe Supplies', estimatedAmount: 0 },
          { description: 'Wardrobe Truck', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Hair & Makeup',
          order: 7,
          department: 'makeup_hair',
          phase: 'production',
        },
        items: [
          { description: 'Key Makeup Artist', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Makeup Artists', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'SFX Makeup Artist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Hairstylist', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Hairstylists', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Makeup Supplies', estimatedAmount: 0 },
          { description: 'Hair Supplies', estimatedAmount: 0 },
          { description: 'Makeup Trailer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Locations',
          order: 8,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Location Manager', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location PA', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Parking Fees', estimatedAmount: 0 },
          { description: 'Security', estimatedAmount: 0 },
          { description: 'Location Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Transportation',
          order: 9,
          department: 'transportation',
          phase: 'production',
        },
        items: [
          { description: 'Transportation Coordinator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Picture Vehicles', estimatedAmount: 0 },
          { description: 'Production Vehicles', estimatedAmount: 0 },
          { description: 'Honeywagons (Restroom Trailers)', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Fuel', estimatedAmount: 0 },
          { description: 'Vehicle Rental', estimatedAmount: 0 },
          { description: 'Vehicle Insurance', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Catering',
          order: 10,
          department: 'catering',
          phase: 'production',
        },
        items: [
          { description: 'Caterer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Craft Services', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Meals', estimatedAmount: 0 },
          { description: 'Craft Service Supplies', estimatedAmount: 0 },
          { description: 'Catering Equipment', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Stunts',
          order: 11,
          department: 'stunts',
          phase: 'production',
        },
        items: [
          { description: 'Stunt Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Stunt Performers', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Stunt Equipment', estimatedAmount: 0 },
          { description: 'Stunt Safety', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'VFX',
          order: 12,
          department: 'vfx',
          phase: 'production',
        },
        items: [
          { description: 'VFX Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'VFX Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'On-Set VFX Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'VFX Facility', estimatedAmount: 0 },
          { description: 'VFX Shots', estimatedAmount: 0 },
          { description: 'Motion Capture', estimatedAmount: 0 },
          { description: 'VFX Equipment', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 13,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Additional Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Post-Production Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Colorist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Designer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Sound Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Dialogue Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'ADR Recording', estimatedAmount: 0 },
          { description: 'Foley', estimatedAmount: 0 },
          { description: 'Sound Mix', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Composer', estimatedAmount: 0 },
          { description: 'Music Recording', estimatedAmount: 0 },
          { description: 'Music Licensing', estimatedAmount: 0 },
          { description: 'Music Supervisor', estimatedAmount: 0 },
          { description: 'Post-Production Facility', estimatedAmount: 0 },
          { description: 'Editing Equipment', estimatedAmount: 0 },
          { description: 'Storage & Media', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance & Legal',
          order: 14,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'Errors & Omissions', estimatedAmount: 0 },
          { description: 'General Liability', estimatedAmount: 0 },
          { description: 'Legal Fees', estimatedAmount: 0 },
          { description: 'Clearances', estimatedAmount: 0 },
          { description: 'Trademark/Copyright', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 15,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Commercial Production Template',
    type: 'commercial',
    description: 'Comprehensive commercial/agency production budget template',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Agency/Client',
          order: 0,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Executive Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Creative Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Copywriter', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Account Executive', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Agency PAs', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Client Travel & Accommodations', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Production',
          order: 1,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Line Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '1st AD', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '2nd AD', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Assistants', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Office', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Camera',
          order: 2,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Director of Photography', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '1st AC', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '2nd AC', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'DIT', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Steadicam Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Drone Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lens Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Media & Storage', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Lighting & Grip',
          order: 3,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Gaffer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Best Boy Electric', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Electricians', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Grip', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Best Boy Grip', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Grips', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lighting Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Grip Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Generator', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Sound',
          order: 4,
          department: 'sound',
          phase: 'production',
        },
        items: [
          { description: 'Production Sound Mixer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Boom Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Wireless Microphones', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Art Department',
          order: 5,
          department: 'art',
          phase: 'production',
        },
        items: [
          { description: 'Production Designer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Decorator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Dressers', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Prop Master', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Construction', estimatedAmount: 0 },
          { description: 'Set Dressing', estimatedAmount: 0 },
          { description: 'Props Purchase', estimatedAmount: 0 },
          { description: 'Props Rental', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Talent',
          order: 6,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Principal Talent', estimatedAmount: 0 },
          { description: 'Talent Agent Fees', estimatedAmount: 0 },
          { description: 'Talent Buyout', estimatedAmount: 0 },
          { description: 'Talent Usage Rights', estimatedAmount: 0 },
          { description: 'Background Talent', estimatedAmount: 0 },
          { description: 'Talent Casting', estimatedAmount: 0 },
          { description: 'Talent Fitting', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Wardrobe & Makeup',
          order: 7,
          department: 'wardrobe',
          phase: 'production',
        },
        items: [
          { description: 'Costume Designer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Makeup Artist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Makeup Artists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Hairstylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Hairstylists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Wardrobe Purchase', estimatedAmount: 0 },
          { description: 'Wardrobe Rental', estimatedAmount: 0 },
          { description: 'Makeup Supplies', estimatedAmount: 0 },
          { description: 'Hair Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Locations',
          order: 8,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
          { description: 'Security', estimatedAmount: 0 },
          { description: 'Location Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Transportation',
          order: 9,
          department: 'transportation',
          phase: 'production',
        },
        items: [
          { description: 'Transportation Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Picture Vehicles', estimatedAmount: 0 },
          { description: 'Production Vehicles', estimatedAmount: 0 },
          { description: 'Honeywagons', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Fuel', estimatedAmount: 0 },
          { description: 'Vehicle Rental', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Catering',
          order: 10,
          department: 'catering',
          phase: 'production',
        },
        items: [
          { description: 'Caterer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Craft Services', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Meals', estimatedAmount: 0 },
          { description: 'Craft Service Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 11,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Editor', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Assistant Editor', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Colorist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Mix', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Music', estimatedAmount: 0 },
          { description: 'Music Licensing', estimatedAmount: 0 },
          { description: 'Graphics & Titles', estimatedAmount: 0 },
          { description: 'VFX', estimatedAmount: 0 },
          { description: 'Post Facility', estimatedAmount: 0 },
          { description: 'Client Review Sessions', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance & Legal',
          order: 12,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'Legal Clearances', estimatedAmount: 0 },
          { description: 'Trademark/Copyright', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 13,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Documentary Template',
    type: 'documentary',
    description: 'Comprehensive documentary production budget template',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Production',
          order: 0,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Director', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Co-Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Executive Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Manager', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Field Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Associate Producer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Assistants', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Office', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Production Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Camera',
          order: 1,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Cinematographer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Assistant', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Additional Camera Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lens Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Media & Storage', estimatedAmount: 0 },
          { description: 'Camera Stabilization (Gimbal)', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Drone Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Drone Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Sound',
          order: 2,
          department: 'sound',
          phase: 'production',
        },
        items: [
          { description: 'Sound Recordist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Boom Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Wireless Lavaliers', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Accessories', estimatedAmount: 0 },
          { description: 'Field Recording Equipment', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Lighting',
          order: 3,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Gaffer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lighting Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Battery Packs', estimatedAmount: 0 },
          { description: 'LED Panels', estimatedAmount: 0 },
          { description: 'Lighting Accessories', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Locations & Travel',
          order: 4,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Travel - Airfare', estimatedAmount: 0 },
          { description: 'Travel - Accommodations', estimatedAmount: 0 },
          { description: 'Travel - Per Diem', estimatedAmount: 0 },
          { description: 'Ground Transportation', estimatedAmount: 0 },
          { description: 'Visa & Travel Documents', estimatedAmount: 0 },
          { description: 'Travel Insurance', estimatedAmount: 0 },
          { description: 'Parking & Tolls', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Archival & Stock Footage',
          order: 5,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Archival Footage Licensing', estimatedAmount: 0 },
          { description: 'Stock Footage', estimatedAmount: 0 },
          { description: 'Photo Licensing', estimatedAmount: 0 },
          { description: 'Music Licensing', estimatedAmount: 0 },
          { description: 'News Archive Licensing', estimatedAmount: 0 },
          { description: 'Historical Footage', estimatedAmount: 0 },
          { description: 'Archival Research', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 6,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Assistant Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Additional Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Post-Production Supervisor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Colorist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Designer', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Sound Editor', estimatedAmount: 0, unit: 'weeks', quantity: 1 },
          { description: 'Composer', estimatedAmount: 0 },
          { description: 'Music Recording', estimatedAmount: 0 },
          { description: 'Narration Recording', estimatedAmount: 0 },
          { description: 'Voiceover Talent', estimatedAmount: 0 },
          { description: 'Graphics & Titles', estimatedAmount: 0 },
          { description: 'Motion Graphics', estimatedAmount: 0 },
          { description: 'Animation', estimatedAmount: 0 },
          { description: 'Post-Production Facility', estimatedAmount: 0 },
          { description: 'Editing Equipment', estimatedAmount: 0 },
          { description: 'Storage & Media', estimatedAmount: 0 },
          { description: 'Transcription Services', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance & Legal',
          order: 7,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'Errors & Omissions', estimatedAmount: 0 },
          { description: 'Legal Fees', estimatedAmount: 0 },
          { description: 'Clearances', estimatedAmount: 0 },
          { description: 'Release Forms', estimatedAmount: 0 },
          { description: 'Rights & Permissions', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 8,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Episodic/Series Template',
    type: 'episodic',
    description: 'Comprehensive episodic television/series production budget template',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Above The Line',
          order: 0,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Showrunner', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Executive Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Co-Executive Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Supervising Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Co-Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Director (per episode)', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Writers', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Story Editor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Script Coordinator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Production',
          order: 1,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Line Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Manager', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Production Coordinator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: '1st AD', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: '2nd AD', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: '2nd 2nd AD', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Script Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Assistants', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Set PA', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Office PA', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Office', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Production Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Camera',
          order: 2,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Director of Photography', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Camera Operator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: '1st AC', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: '2nd AC', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'DIT', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Steadicam Operator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Camera Package', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Lens Package', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Media & Storage', estimatedAmount: 0 },
          { description: 'Camera Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Lighting & Grip',
          order: 3,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Gaffer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Best Boy Electric', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Electricians', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Board Operator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Key Grip', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Best Boy Grip', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Dolly Grip', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Grips', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Lighting Package', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Grip Package', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Generator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Grip Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Lighting Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Sound',
          order: 4,
          department: 'sound',
          phase: 'production',
        },
        items: [
          { description: 'Production Sound Mixer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Boom Operator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Sound Utility', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Sound Package', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Wireless Microphones', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Sound Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Art Department',
          order: 5,
          department: 'art',
          phase: 'production',
        },
        items: [
          { description: 'Production Designer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Art Director', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Set Decorator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Lead Person', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Set Dressers', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Prop Master', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Prop Master', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Set Construction', estimatedAmount: 0 },
          { description: 'Set Dressing', estimatedAmount: 0 },
          { description: 'Props Purchase', estimatedAmount: 0 },
          { description: 'Props Rental', estimatedAmount: 0 },
          { description: 'Art Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Wardrobe',
          order: 6,
          department: 'wardrobe',
          phase: 'production',
        },
        items: [
          { description: 'Costume Designer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Costume Designer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Costume Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Key Costumer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Set Costumer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Costume Rental', estimatedAmount: 0 },
          { description: 'Costume Purchase', estimatedAmount: 0 },
          { description: 'Costume Alterations', estimatedAmount: 0 },
          { description: 'Wardrobe Truck', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Hair & Makeup',
          order: 7,
          department: 'makeup_hair',
          phase: 'production',
        },
        items: [
          { description: 'Key Makeup Artist', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Makeup Artists', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'SFX Makeup Artist', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Key Hairstylist', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Hairstylists', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Makeup Supplies', estimatedAmount: 0 },
          { description: 'Hair Supplies', estimatedAmount: 0 },
          { description: 'Makeup Trailer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Locations',
          order: 8,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Location Manager', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
          { description: 'Security', estimatedAmount: 0 },
          { description: 'Location Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Transportation',
          order: 9,
          department: 'transportation',
          phase: 'production',
        },
        items: [
          { description: 'Transportation Coordinator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Picture Vehicles', estimatedAmount: 0 },
          { description: 'Production Vehicles', estimatedAmount: 0 },
          { description: 'Honeywagons', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Fuel', estimatedAmount: 0 },
          { description: 'Vehicle Rental', estimatedAmount: 0 },
          { description: 'Vehicle Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Catering',
          order: 10,
          department: 'catering',
          phase: 'production',
        },
        items: [
          { description: 'Caterer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Craft Services', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Meals', estimatedAmount: 0 },
          { description: 'Craft Service Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Stunts',
          order: 11,
          department: 'stunts',
          phase: 'production',
        },
        items: [
          { description: 'Stunt Coordinator', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Stunt Performers', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Stunt Equipment', estimatedAmount: 0 },
          { description: 'Stunt Safety', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'VFX',
          order: 12,
          department: 'vfx',
          phase: 'production',
        },
        items: [
          { description: 'VFX Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'VFX Producer', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'On-Set VFX Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'VFX Facility', estimatedAmount: 0 },
          { description: 'VFX Shots', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 13,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Editor (per episode)', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Assistant Editor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Post-Production Supervisor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Colorist', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Sound Mix', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'Sound Editor', estimatedAmount: 0, unit: 'episodes', quantity: 1 },
          { description: 'ADR Recording', estimatedAmount: 0 },
          { description: 'Music', estimatedAmount: 0 },
          { description: 'Music Licensing', estimatedAmount: 0 },
          { description: 'VFX', estimatedAmount: 0 },
          { description: 'Post Facility', estimatedAmount: 0 },
          { description: 'Storage & Media', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance & Legal',
          order: 14,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'Errors & Omissions', estimatedAmount: 0 },
          { description: 'Legal Fees', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 15,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Music Video Template',
    type: 'music_video',
    description: 'Comprehensive music video production budget template',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Production',
          order: 0,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Executive Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '1st AD', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '2nd AD', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Assistants', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Office', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Camera',
          order: 1,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Director of Photography', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '1st AC', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: '2nd AC', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'DIT', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lens Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Specialty Camera (Drone/Gimbal)', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Drone Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Media & Storage', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Lighting & Grip',
          order: 2,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Gaffer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Best Boy Electric', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Electricians', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Grip', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Best Boy Grip', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Grips', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lighting Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Grip Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Generator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Specialty Lighting', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Sound',
          order: 3,
          department: 'sound',
          phase: 'production',
        },
        items: [
          { description: 'Production Sound Mixer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Playback Operator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Package', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Playback System', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Accessories', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Art Department',
          order: 4,
          department: 'art',
          phase: 'production',
        },
        items: [
          { description: 'Production Designer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Decorator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Dressers', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Prop Master', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Construction', estimatedAmount: 0 },
          { description: 'Set Dressing', estimatedAmount: 0 },
          { description: 'Props Purchase', estimatedAmount: 0 },
          { description: 'Props Rental', estimatedAmount: 0 },
          { description: 'Special Effects', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Talent',
          order: 5,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Artist/Performer', estimatedAmount: 0 },
          { description: 'Dancers', estimatedAmount: 0 },
          { description: 'Choreographer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Background Talent', estimatedAmount: 0 },
          { description: 'Talent Fees', estimatedAmount: 0 },
          { description: 'Talent Buyout', estimatedAmount: 0 },
          { description: 'Talent Usage Rights', estimatedAmount: 0 },
          { description: 'Talent Casting', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Wardrobe & Makeup',
          order: 6,
          department: 'wardrobe',
          phase: 'production',
        },
        items: [
          { description: 'Costume Designer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Makeup Artist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Makeup Artists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Hairstylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Hairstylists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Wardrobe Purchase', estimatedAmount: 0 },
          { description: 'Wardrobe Rental', estimatedAmount: 0 },
          { description: 'Makeup Supplies', estimatedAmount: 0 },
          { description: 'Hair Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Locations',
          order: 7,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
          { description: 'Security', estimatedAmount: 0 },
          { description: 'Location Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Transportation',
          order: 8,
          department: 'transportation',
          phase: 'production',
        },
        items: [
          { description: 'Transportation Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Picture Vehicles', estimatedAmount: 0 },
          { description: 'Production Vehicles', estimatedAmount: 0 },
          { description: 'Honeywagons', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Fuel', estimatedAmount: 0 },
          { description: 'Vehicle Rental', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Catering',
          order: 9,
          department: 'catering',
          phase: 'production',
        },
        items: [
          { description: 'Caterer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Craft Services', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Meals', estimatedAmount: 0 },
          { description: 'Craft Service Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 10,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Editor', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Assistant Editor', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Colorist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Sound Mix', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'VFX', estimatedAmount: 0 },
          { description: 'Graphics & Titles', estimatedAmount: 0 },
          { description: 'Motion Graphics', estimatedAmount: 0 },
          { description: 'Post Facility', estimatedAmount: 0 },
          { description: 'Storage & Media', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance',
          order: 11,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'General Liability', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 12,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Photoshoot Template',
    type: 'custom',
    description: 'Comprehensive photoshoot production budget template for fashion, commercial, editorial, and product photography',
    isPublic: true,
    categories: [
      {
        category: {
          name: 'Creative Team',
          order: 0,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Photographer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Assistant Photographer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Digital Tech', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Photo Assistant', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Art Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Creative Director', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Stylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Assistant Stylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Producer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Camera & Equipment',
          order: 1,
          department: 'camera',
          phase: 'production',
        },
        items: [
          { description: 'Camera Body Rental', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lens Package Rental', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Camera Accessories', estimatedAmount: 0 },
          { description: 'Memory Cards & Storage', estimatedAmount: 0 },
          { description: 'Camera Support (Tripods, etc.)', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Backup Equipment', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Lighting',
          order: 2,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Lighting Technician', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Lighting Package Rental', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Strobes & Flash Units', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Continuous Lighting', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Light Modifiers (Softboxes, etc.)', estimatedAmount: 0 },
          { description: 'Light Stands & Accessories', estimatedAmount: 0 },
          { description: 'Batteries & Power', estimatedAmount: 0 },
          { description: 'Generator', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Grip & Support',
          order: 3,
          department: 'lighting_grip',
          phase: 'production',
        },
        items: [
          { description: 'Grip Equipment', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'C-Stands', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Apple Boxes', estimatedAmount: 0 },
          { description: 'Sandbags', estimatedAmount: 0 },
          { description: 'Backgrounds & Seamless Paper', estimatedAmount: 0 },
          { description: 'Reflectors & Flags', estimatedAmount: 0 },
          { description: 'Grip Truck', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Hair & Makeup',
          order: 4,
          department: 'makeup_hair',
          phase: 'production',
        },
        items: [
          { description: 'Key Makeup Artist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Makeup Artists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Key Hairstylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Hairstylists', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Makeup Supplies', estimatedAmount: 0 },
          { description: 'Hair Supplies', estimatedAmount: 0 },
          { description: 'Makeup Trailer/Station', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Wardrobe & Styling',
          order: 5,
          department: 'wardrobe',
          phase: 'production',
        },
        items: [
          { description: 'Wardrobe Stylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Assistant Stylist', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Wardrobe Rental', estimatedAmount: 0 },
          { description: 'Wardrobe Purchase', estimatedAmount: 0 },
          { description: 'Wardrobe Alterations', estimatedAmount: 0 },
          { description: 'Shoes & Accessories', estimatedAmount: 0 },
          { description: 'Wardrobe Truck/Station', estimatedAmount: 0, unit: 'days', quantity: 1 },
        ],
      },
      {
        category: {
          name: 'Talent',
          order: 6,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Model(s)', estimatedAmount: 0 },
          { description: 'Model Agent Fees', estimatedAmount: 0 },
          { description: 'Talent Buyout', estimatedAmount: 0 },
          { description: 'Usage Rights', estimatedAmount: 0 },
          { description: 'Talent Casting', estimatedAmount: 0 },
          { description: 'Talent Fitting', estimatedAmount: 0 },
          { description: 'Talent Travel & Accommodations', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Locations',
          order: 7,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Location Manager', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Scout', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Studio Rental', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Location Fees', estimatedAmount: 0 },
          { description: 'Location Permits', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
          { description: 'Security', estimatedAmount: 0 },
          { description: 'Location Insurance', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Set Design & Props',
          order: 8,
          department: 'art',
          phase: 'production',
        },
        items: [
          { description: 'Set Designer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Builder', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Set Construction', estimatedAmount: 0 },
          { description: 'Set Dressing', estimatedAmount: 0 },
          { description: 'Props Purchase', estimatedAmount: 0 },
          { description: 'Props Rental', estimatedAmount: 0 },
          { description: 'Set Materials', estimatedAmount: 0 },
          { description: 'Paint & Finishing', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Catering & Craft Services',
          order: 9,
          department: 'catering',
          phase: 'production',
        },
        items: [
          { description: 'Caterer', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Craft Services', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Meals', estimatedAmount: 0 },
          { description: 'Beverages', estimatedAmount: 0 },
          { description: 'Craft Service Supplies', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Transportation',
          order: 10,
          department: 'transportation',
          phase: 'production',
        },
        items: [
          { description: 'Transportation Coordinator', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Production Vehicles', estimatedAmount: 0 },
          { description: 'Equipment Truck', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Fuel', estimatedAmount: 0 },
          { description: 'Vehicle Rental', estimatedAmount: 0 },
          { description: 'Parking', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Post-Production',
          order: 11,
          department: 'post_production',
          phase: 'post-production',
        },
        items: [
          { description: 'Photo Retoucher', estimatedAmount: 0, unit: 'images', quantity: 1 },
          { description: 'Photo Editor', estimatedAmount: 0, unit: 'days', quantity: 1 },
          { description: 'Color Correction', estimatedAmount: 0 },
          { description: 'Image Processing', estimatedAmount: 0 },
          { description: 'File Delivery', estimatedAmount: 0 },
          { description: 'Storage & Backup', estimatedAmount: 0 },
          { description: 'Post-Production Facility', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Insurance & Legal',
          order: 12,
          department: 'production',
          phase: 'pre-production',
        },
        items: [
          { description: 'Production Insurance', estimatedAmount: 0 },
          { description: 'Equipment Insurance', estimatedAmount: 0 },
          { description: 'General Liability', estimatedAmount: 0 },
          { description: 'Model Releases', estimatedAmount: 0 },
          { description: 'Location Releases', estimatedAmount: 0 },
          { description: 'Usage Rights & Licensing', estimatedAmount: 0 },
          { description: 'Legal Fees', estimatedAmount: 0 },
        ],
      },
      {
        category: {
          name: 'Contingency',
          order: 13,
          department: 'production',
          phase: 'production',
        },
        items: [
          { description: 'Contingency (10%)', estimatedAmount: 0 },
        ],
      },
    ],
  },
];

function getAllTemplates(): BudgetTemplate[] {
  return systemTemplates.map((t, idx) => ({
    ...t,
    id: `system_template_${idx}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function getTemplateByType(type: BudgetTemplate['type']): BudgetTemplate | undefined {
  const templates = getAllTemplates();
  return templates.find(t => t.type === type);
}

export const budgetTemplatesRouter = router({
  /**
   * Get all available templates (system + user templates)
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Get system templates
    const systemTemplates = getAllTemplates();

    // Get user's custom templates
    const userTemplatesSnapshot = await adminDb
      .collection('budgetTemplates')
      .where('createdBy', '==', ctx.user.id)
      .get();

    const userTemplates = userTemplatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BudgetTemplate;
    });

    return [...systemTemplates, ...userTemplates];
  }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      // Check system templates first
      const systemTemplate = getAllTemplates().find(t => t.id === input.templateId);
      if (systemTemplate) {
        return systemTemplate;
      }

      // Check user templates
      const doc = await adminDb.collection('budgetTemplates').doc(input.templateId).get();
      if (!doc.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BudgetTemplate;
    }),

  /**
   * Get template by type
   */
  getByType: protectedProcedure
    .input(z.object({ type: z.enum(['film', 'commercial', 'documentary', 'episodic', 'music_video', 'corporate', 'custom']) }))
    .query(async ({ input }) => {
      // For 'custom' type, try to find photoshoot template
      if (input.type === 'custom') {
        const templates = getAllTemplates();
        const photoshootTemplate = templates.find(t => t.name.toLowerCase().includes('photoshoot'));
        if (photoshootTemplate) {
          return photoshootTemplate;
        }
      }
      
      const template = getTemplateByType(input.type);
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Template type ${input.type} not found` });
      }
      return template;
    }),

  /**
   * Create a custom template from existing budget
   */
  create: protectedProcedure
    .input(createBudgetTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = await adminDb.collection('budgetTemplates').add({
        ...input,
        createdBy: ctx.user.id,
        isPublic: false, // User templates are private by default
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const data = doc.data()!;

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BudgetTemplate;
    }),

  /**
   * Apply template to a project
   */
  applyTemplate: protectedProcedure
    .input(applyBudgetTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check access
      const hasAccess = await hasPermission(input.projectId, ctx.user.id, ['owner', 'admin']);
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners and admins can apply templates' });
      }

      // Get template
      let template: BudgetTemplate;
      const systemTemplate = getAllTemplates().find(t => t.id === input.templateId);
      if (systemTemplate) {
        template = systemTemplate;
      } else {
        const doc = await adminDb.collection('budgetTemplates').doc(input.templateId).get();
        if (!doc.exists) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        const data = doc.data()!;
        template = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BudgetTemplate;
      }

      // Get existing categories to check for conflicts
      const existingCategoriesSnapshot = await adminDb
        .collection('budgetCategories')
        .where('projectId', '==', input.projectId)
        .get();

      const existingCategoryNames = new Set(
        existingCategoriesSnapshot.docs.map(doc => doc.data().name)
      );

      // Apply template
      const categoriesRef = adminDb.collection('budgetCategories');
      const itemsRef = adminDb.collection('budgetItems');
      let order = existingCategoriesSnapshot.size;

      const createdCategories: string[] = [];

      for (const templateCategory of template.categories) {
        // Skip if category exists and overwriteExisting is false
        if (existingCategoryNames.has(templateCategory.category.name) && !input.overwriteExisting) {
          continue;
        }

        // Create category
        const categoryRef = await categoriesRef.add({
          projectId: input.projectId,
          name: templateCategory.category.name,
          order: order++,
          department: templateCategory.category.department,
          phase: input.phase || templateCategory.category.phase,
          isSubtotal: templateCategory.category.isSubtotal || false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        const categoryId = categoryRef.id;
        createdCategories.push(categoryId);

        // Create items if requested
        if (input.includeItems && templateCategory.items.length > 0) {
          for (const item of templateCategory.items) {
            await itemsRef.add({
              projectId: input.projectId,
              categoryId,
              description: item.description,
              estimatedAmount: item.estimatedAmount || 0,
              actualAmount: 0,
              status: 'estimated',
              unit: item.unit,
              quantity: item.quantity || 1,
              unitRate: item.unitRate,
              phase: input.phase || item.phase,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      return {
        success: true,
        categoriesCreated: createdCategories.length,
      };
    }),
});
