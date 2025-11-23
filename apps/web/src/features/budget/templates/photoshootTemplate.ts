import type { BudgetTemplate } from '@/lib/schemas';

export const photoshootTemplate =  {
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
};


