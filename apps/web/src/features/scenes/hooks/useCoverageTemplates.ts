import { useProjectShots } from './useProjectShots';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CoverageTemplate } from '../templates/shotCoverageTemplates';

export function useApplyCoverageTemplate(sceneId: string, projectId: string) {
  const { user } = useAuth();
  const { createShot } = useProjectShots(projectId);

  const applyTemplate = async (template: CoverageTemplate) => {
    if (!user) throw new Error('Must be logged in');

    // Get scene to determine shot numbering
    const sceneDoc = await getDoc(doc(db, 'scenes', sceneId));
    if (!sceneDoc.exists()) throw new Error('Scene not found');
    
    const sceneData = sceneDoc.data();
    const sceneNumber = sceneData.sceneNumber || '1';

    // Create shots from template
    let sortOrder = 1000; // Start at 1000, increment by 1000
    
    for (const shotTemplate of template.shots) {
      const shotNumber = `${sceneNumber}${shotTemplate.shotNumber}`;
      
      await createShot.mutateAsync({
        projectId,
        sceneId,
        shotNumber,
        shotType: shotTemplate.shotType,
        cameraAngle: shotTemplate.cameraAngle,
        lens: shotTemplate.lens || '',
        movement: shotTemplate.movement || '',
        description: shotTemplate.description,
        duration: shotTemplate.duration,
        isMaster: shotTemplate.isMaster || false,
        coverageType: shotTemplate.coverageType || 'medium',
        status: 'not-shot',
        sortOrder,
        createdBy: user.id,
      });
      
      sortOrder += 1000;
    }

    return { shotsCreated: template.shots.length };
  };

  return { applyTemplate };
}

