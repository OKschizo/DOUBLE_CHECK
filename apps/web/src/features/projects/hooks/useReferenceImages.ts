import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';
import { deleteImage, isBlobUrl } from '@/lib/firebase/storage';

export function useReferenceImages(projectId: string) {
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'reference_images'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const imageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        
        setImages(imageList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching reference images:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const createReferenceImage = async (data: any) => {
    if (!user) throw new Error("Not logged in");
    const docRef = await addDoc(collection(db, 'reference_images'), {
      ...data,
      projectId,
      createdBy: user.id,
      createdAt: serverTimestamp(),
    });
    // Return the new document with its ID
    return { id: docRef.id, ...data, projectId, createdBy: user.id };
  };

  const deleteReferenceImage = async ({ id }: { id: string }) => {
    // Optionally delete from storage too if you have the URL
    // We'd need to fetch the doc first or pass the url
    const image = images.find(img => img.id === id);
    if (image?.url && !isBlobUrl(image.url)) {
      try {
        await deleteImage(image.url);
      } catch (e) {
        console.warn("Failed to delete image from storage", e);
      }
    }
    await deleteDoc(doc(db, 'reference_images', id));
  };

  const migrateShotReferences = async () => {
     // Placeholder - this was likely a one-time migration script
     console.log("Migrate shot references called - no-op in client mode");
  };

  return {
    images,
    isLoading,
    error,
    createReferenceImage: { mutate: createReferenceImage, mutateAsync: createReferenceImage },
    deleteReferenceImage: { mutate: deleteReferenceImage, mutateAsync: deleteReferenceImage },
    migrateShotReferences: { mutate: migrateShotReferences, mutateAsync: migrateShotReferences },
  };
}
