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

const DEFAULT_CAST_TEMPLATES = [
  {
    id: 'default-feature-film-cast',
    name: 'Feature Film Cast',
    description: 'Standard cast roles for a feature film',
    type: 'film',
    roles: [
      { characterName: 'Lead 1', castType: 'Lead Role', quantity: 1, required: true, dayRate: 5000 },
      { characterName: 'Lead 2', castType: 'Lead Role', quantity: 1, required: true, dayRate: 5000 },
      { characterName: 'Supporting 1', castType: 'Supporting Role', quantity: 1, required: true, dayRate: 2500 },
      { characterName: 'Supporting 2', castType: 'Supporting Role', quantity: 1, required: true, dayRate: 2500 },
      { characterName: 'Supporting 3', castType: 'Supporting Role', quantity: 1, required: false, dayRate: 2000 },
      { characterName: 'Featured 1', castType: 'Featured', quantity: 1, required: false, dayRate: 1000 },
      { characterName: 'Featured 2', castType: 'Featured', quantity: 1, required: false, dayRate: 1000 },
      { characterName: 'Featured 3', castType: 'Featured', quantity: 1, required: false, dayRate: 1000 },
      { characterName: 'Stunt Double 1', castType: 'Stunt Performer', quantity: 1, required: false, dayRate: 1500 },
    ],
  },
  {
    id: 'default-commercial-cast',
    name: 'Commercial Cast',
    description: 'Standard cast roles for a commercial',
    type: 'commercial',
    roles: [
      { characterName: 'Principal 1', castType: 'Lead Role', quantity: 1, required: true, dayRate: 3000 },
      { characterName: 'Principal 2', castType: 'Lead Role', quantity: 1, required: false, dayRate: 3000 },
      { characterName: 'Spokesperson', castType: 'Featured', quantity: 1, required: false, dayRate: 5000 },
      { characterName: 'Background', castType: 'Extra/Background', quantity: 5, required: false, dayRate: 200 },
    ],
  },
  {
    id: 'default-music-video-cast',
    name: 'Music Video Cast',
    description: 'Standard cast for a music video production',
    type: 'music_video',
    roles: [
      { characterName: 'Lead Performer', castType: 'Lead Role', quantity: 1, required: true, dayRate: 0 },
      { characterName: 'Dancer 1', castType: 'Featured', quantity: 1, required: false, dayRate: 500 },
      { characterName: 'Dancer 2', castType: 'Featured', quantity: 1, required: false, dayRate: 500 },
      { characterName: 'Background', castType: 'Extra/Background', quantity: 5, required: false, dayRate: 150 },
    ],
  },
];

export function useCastTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'cast_templates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dbIds = new Set(dbTemplates.map(t => t.id));
      const combined = [
        ...DEFAULT_CAST_TEMPLATES.filter(t => !dbIds.has(t.id)),
        ...dbTemplates,
      ];
      setTemplates(combined);
      setIsLoading(false);
    }, () => {
      setTemplates(DEFAULT_CAST_TEMPLATES);
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

      let rolesCreated = 0;
      let rolesSkipped = 0;

      const existingQuery = query(
        collection(db, 'cast'),
        where('projectId', '==', projectId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingCharacters = new Set(
        existingSnapshot.docs.map(doc => 
          `${doc.data().characterName}-${doc.data().castType}`.toLowerCase()
        )
      );

      for (const role of template.roles || []) {
        const roleKey = `${role.characterName}-${role.castType}`.toLowerCase();

        if (skipExisting && existingCharacters.has(roleKey)) {
          rolesSkipped++;
          continue;
        }

        const qty = role.quantity || 1;
        for (let q = 0; q < qty; q++) {
          await addDoc(collection(db, 'cast'), {
            projectId,
            actorName: '',
            characterName: qty > 1 ? `${role.characterName} ${q + 1}` : role.characterName,
            castType: role.castType || 'Featured',
            email: '',
            phone: '',
            agent: '',
            dayRate: role.dayRate || 0,
            status: 'pending',
            createdBy: user.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          rolesCreated++;
        }
      }

      setIsPending(false);
      return { rolesCreated, rolesSkipped };
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
