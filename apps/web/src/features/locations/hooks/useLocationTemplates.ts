import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

const DEFAULT_LOCATION_TEMPLATES = [
  {
    id: 'default-feature-film-locations',
    name: 'Feature Film Locations',
    description: 'Common location types for feature film production',
    type: 'film',
    locations: [
      { name: 'Main Set / Studio', type: 'studio', required: true, description: 'Primary shooting location' },
      { name: 'Exterior Location 1', type: 'exterior', required: true, description: 'Primary exterior filming location' },
      { name: 'Interior Location 1', type: 'interior', required: true, description: 'Primary interior location' },
      { name: 'Basecamp', type: 'other', required: true, description: 'Crew staging area with trucks and trailers' },
      { name: 'Production Office', type: 'office', required: true, description: 'Production headquarters' },
      { name: 'Holding Area', type: 'other', required: false, description: 'Background/extras holding' },
    ],
  },
  {
    id: 'default-commercial-locations',
    name: 'Commercial Locations',
    description: 'Typical location setup for commercial shoots',
    type: 'commercial',
    locations: [
      { name: 'Studio / Stage', type: 'studio', required: true, description: 'Main studio or stage' },
      { name: 'Client Location', type: 'interior', required: false, description: 'On-site at client premises' },
      { name: 'Exterior Location', type: 'exterior', required: false, description: 'Outdoor filming location' },
      { name: 'Basecamp / Staging', type: 'other', required: true, description: 'Equipment and crew staging' },
    ],
  },
  {
    id: 'default-documentary-locations',
    name: 'Documentary Locations',
    description: 'Location types for documentary production',
    type: 'documentary',
    locations: [
      { name: 'Interview Location 1', type: 'interior', required: true, description: 'Primary interview setup' },
      { name: 'Interview Location 2', type: 'interior', required: false, description: 'Secondary interview setup' },
      { name: 'B-Roll Location 1', type: 'exterior', required: true, description: 'B-roll/cutaway filming' },
      { name: 'B-Roll Location 2', type: 'exterior', required: false, description: 'Additional B-roll location' },
      { name: 'Archival/Research', type: 'other', required: false, description: 'Archive or library access' },
    ],
  },
];

export function useLocationTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'location_templates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dbIds = new Set(dbTemplates.map(t => t.id));
      const combined = [
        ...DEFAULT_LOCATION_TEMPLATES.filter(t => !dbIds.has(t.id)),
        ...dbTemplates,
      ];
      setTemplates(combined);
      setIsLoading(false);
    }, () => {
      setTemplates(DEFAULT_LOCATION_TEMPLATES);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const applyTemplate = async ({ projectId, templateId, skipExisting, overwriteExisting }: any) => {
    if (!user) throw new Error('Must be logged in');

    setIsPending(true);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      let locationsCreated = 0;
      let locationsSkipped = 0;

      const existingQuery = query(
        collection(db, 'locations'),
        where('projectId', '==', projectId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingNames = new Set(
        existingSnapshot.docs.map(doc => doc.data().name?.toLowerCase())
      );

      for (const loc of template.locations || []) {
        if (skipExisting && existingNames.has(loc.name?.toLowerCase())) {
          locationsSkipped++;
          continue;
        }

        await addDoc(collection(db, 'locations'), {
          projectId,
          name: loc.name,
          type: loc.type || 'other',
          status: 'pending',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          description: loc.description || '',
          notes: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        locationsCreated++;
      }

      setIsPending(false);
      return { locationsCreated, locationsSkipped };
    } catch (error) {
      setIsPending(false);
      throw error;
    }
  };

  return {
    templates,
    isLoading,
    applyTemplate: { mutate: applyTemplate, mutateAsync: applyTemplate, isPending }
  };
}
