/**
 * Shot Coverage Templates
 * Pre-built coverage patterns for common scene types
 */

import type { Scene } from '@/lib/schemas';

export interface ShotTemplate {
  shotNumber: string; // Will be replaced with actual number
  shotType: string;
  cameraAngle: string;
  lens?: string;
  movement?: string;
  description: string;
  isMaster?: boolean;
  coverageType?: 'master' | 'medium' | 'closeup' | 'insert' | 'cutaway';
  duration?: number;
}

export interface CoverageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'dialogue' | 'action' | 'interview' | 'product' | 'standard';
  shots: ShotTemplate[];
  recommendedFor: string[];
}

export const coverageTemplates: CoverageTemplate[] = [
  {
    id: 'standard-coverage',
    name: 'Standard Coverage',
    description: 'Basic master + coverage for general scenes',
    category: 'standard',
    recommendedFor: ['General scenes', 'Establishing moments'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Master',
        cameraAngle: 'Wide',
        lens: '24-35mm',
        description: 'Master wide establishing shot',
        isMaster: true,
        coverageType: 'master',
        duration: 30,
      },
      {
        shotNumber: 'B',
        shotType: 'Medium',
        cameraAngle: 'Eye level',
        lens: '50mm',
        description: 'Medium shot of main subject',
        coverageType: 'medium',
        duration: 15,
      },
      {
        shotNumber: 'C',
        shotType: 'Close-up',
        cameraAngle: 'Eye level',
        lens: '85mm',
        description: 'Close-up on subject',
        coverageType: 'closeup',
        duration: 10,
      },
      {
        shotNumber: 'D',
        shotType: 'Close-up',
        cameraAngle: 'Low angle',
        lens: '85mm',
        description: 'Close-up detail/reaction',
        coverageType: 'closeup',
        duration: 8,
      },
    ],
  },
  {
    id: 'dialogue-2person',
    name: 'Dialogue (2 Person)',
    description: 'Standard coverage for two-person conversation',
    category: 'dialogue',
    recommendedFor: ['Conversations', 'Interviews', 'Confrontations'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Master',
        cameraAngle: 'Wide two-shot',
        lens: '35mm',
        description: 'Master wide showing both characters',
        isMaster: true,
        coverageType: 'master',
        duration: 45,
      },
      {
        shotNumber: 'B',
        shotType: 'Over-the-shoulder',
        cameraAngle: 'Over shoulder A to B',
        lens: '50mm',
        description: 'Over-the-shoulder favoring character B',
        coverageType: 'medium',
        duration: 20,
      },
      {
        shotNumber: 'C',
        shotType: 'Over-the-shoulder',
        cameraAngle: 'Over shoulder B to A',
        lens: '50mm',
        description: 'Reverse over-the-shoulder favoring character A',
        coverageType: 'medium',
        duration: 20,
      },
      {
        shotNumber: 'D',
        shotType: 'Single',
        cameraAngle: 'Medium close-up',
        lens: '85mm',
        description: 'Single on character A',
        coverageType: 'closeup',
        duration: 15,
      },
      {
        shotNumber: 'E',
        shotType: 'Single',
        cameraAngle: 'Medium close-up',
        lens: '85mm',
        description: 'Single on character B',
        coverageType: 'closeup',
        duration: 15,
      },
    ],
  },
  {
    id: 'action-sequence',
    name: 'Action Sequence',
    description: 'Multi-angle coverage for dynamic action',
    category: 'action',
    recommendedFor: ['Sports', 'Fights', 'Chase scenes', 'Stunts'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Master',
        cameraAngle: 'Wide establishing',
        lens: '24mm',
        movement: 'Static or slow pan',
        description: 'Master wide showing full action geography',
        isMaster: true,
        coverageType: 'master',
        duration: 30,
      },
      {
        shotNumber: 'B',
        shotType: 'Medium',
        cameraAngle: 'Eye level tracking',
        lens: '50mm',
        movement: 'Handheld follow',
        description: 'Medium tracking main subject through action',
        coverageType: 'medium',
        duration: 20,
      },
      {
        shotNumber: 'C',
        shotType: 'Close-up',
        cameraAngle: 'Low angle',
        lens: '85mm',
        movement: 'Steadicam',
        description: 'Close-up on subject during key moment',
        coverageType: 'closeup',
        duration: 10,
      },
      {
        shotNumber: 'D',
        shotType: 'Insert',
        cameraAngle: 'Extreme close-up',
        lens: '100mm macro',
        description: 'Insert detail (hands, feet, object)',
        coverageType: 'insert',
        duration: 5,
      },
      {
        shotNumber: 'E',
        shotType: 'Wide',
        cameraAngle: 'High angle',
        lens: '16mm or drone',
        movement: 'Crane or drone',
        description: 'Overhead/aerial perspective',
        coverageType: 'cutaway',
        duration: 15,
      },
      {
        shotNumber: 'F',
        shotType: 'Slow Motion',
        cameraAngle: 'Variable',
        lens: '50-85mm',
        description: 'High frame rate for dramatic moment',
        coverageType: 'insert',
        duration: 8,
      },
    ],
  },
  {
    id: 'interview-setup',
    name: 'Interview Setup',
    description: 'Documentary/interview coverage',
    category: 'interview',
    recommendedFor: ['Interviews', 'Testimonials', 'Documentary'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Master',
        cameraAngle: 'Wide',
        lens: '35mm',
        description: 'Wide showing interview subject and environment',
        isMaster: true,
        coverageType: 'master',
        duration: 60,
      },
      {
        shotNumber: 'B',
        shotType: 'Medium',
        cameraAngle: 'Straight on',
        lens: '50mm',
        description: 'Medium shot of subject',
        coverageType: 'medium',
        duration: 120,
      },
      {
        shotNumber: 'C',
        shotType: 'Close-up',
        cameraAngle: 'Tight',
        lens: '85mm',
        description: 'Tight close-up for emotional moments',
        coverageType: 'closeup',
        duration: 30,
      },
      {
        shotNumber: 'D',
        shotType: 'B-roll',
        cameraAngle: 'Various',
        lens: '24-70mm',
        description: 'Cutaway to environment/context',
        coverageType: 'cutaway',
        duration: 20,
      },
      {
        shotNumber: 'E',
        shotType: 'B-roll',
        cameraAngle: 'Detail',
        lens: '85mm',
        description: 'Detail shots (hands, objects mentioned)',
        coverageType: 'insert',
        duration: 15,
      },
    ],
  },
  {
    id: 'product-commercial',
    name: 'Product Commercial',
    description: 'Product-focused coverage with multiple angles',
    category: 'product',
    recommendedFor: ['Commercials', 'Product reveals', 'E-commerce'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Hero',
        cameraAngle: 'Straight on',
        lens: '50mm',
        movement: 'Slow push in',
        description: 'Hero shot of product',
        isMaster: true,
        coverageType: 'master',
        duration: 10,
      },
      {
        shotNumber: 'B',
        shotType: 'Detail',
        cameraAngle: 'Macro',
        lens: '100mm macro',
        description: 'Extreme close-up of key feature',
        coverageType: 'insert',
        duration: 8,
      },
      {
        shotNumber: 'C',
        shotType: 'Rotating',
        cameraAngle: '360° turntable',
        lens: '50mm',
        movement: 'Product rotates',
        description: 'Full 360° rotation of product',
        coverageType: 'medium',
        duration: 15,
      },
      {
        shotNumber: 'D',
        shotType: 'Lifestyle',
        cameraAngle: 'Wide',
        lens: '35mm',
        description: 'Product in use/lifestyle context',
        coverageType: 'medium',
        duration: 12,
      },
      {
        shotNumber: 'E',
        shotType: 'Detail',
        cameraAngle: 'Low angle',
        lens: '85mm',
        description: 'Dramatic angle emphasizing quality',
        coverageType: 'closeup',
        duration: 8,
      },
    ],
  },
  {
    id: 'minimal-coverage',
    name: 'Minimal Coverage',
    description: 'Quick and efficient for simple scenes',
    category: 'standard',
    recommendedFor: ['Simple scenes', 'Transitions', 'Quick moments'],
    shots: [
      {
        shotNumber: 'A',
        shotType: 'Master',
        cameraAngle: 'Wide',
        lens: '35mm',
        description: 'Master shot',
        isMaster: true,
        coverageType: 'master',
        duration: 20,
      },
      {
        shotNumber: 'B',
        shotType: 'Close-up',
        cameraAngle: 'Eye level',
        lens: '85mm',
        description: 'Close-up for emphasis',
        coverageType: 'closeup',
        duration: 10,
      },
    ],
  },
];

/**
 * Get recommended templates based on scene characteristics
 */
export function getRecommendedTemplates(scene: Partial<Scene>): CoverageTemplate[] {
  const recommended: CoverageTemplate[] = [];
  
  // Always include standard
  recommended.push(coverageTemplates.find(t => t.id === 'standard-coverage')!);
  
  // Check scene description for keywords
  const description = (scene.description || '').toLowerCase();
  const title = ((scene as any).title || '').toLowerCase();
  const combined = description + ' ' + title;
  
  if (combined.includes('dialogue') || combined.includes('conversation') || combined.includes('talk')) {
    recommended.push(coverageTemplates.find(t => t.id === 'dialogue-2person')!);
  }
  
  if (combined.includes('action') || combined.includes('fight') || combined.includes('chase') || combined.includes('sport')) {
    recommended.push(coverageTemplates.find(t => t.id === 'action-sequence')!);
  }
  
  if (combined.includes('interview') || combined.includes('testimonial')) {
    recommended.push(coverageTemplates.find(t => t.id === 'interview-setup')!);
  }
  
  if (combined.includes('product') || combined.includes('commercial')) {
    recommended.push(coverageTemplates.find(t => t.id === 'product-commercial')!);
  }
  
  // Add minimal as fallback
  if (recommended.length === 1) {
    recommended.push(coverageTemplates.find(t => t.id === 'minimal-coverage')!);
  }
  
  return recommended;
}

