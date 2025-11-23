'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useReferenceImages } from '@/features/projects/hooks/useReferenceImages';
import { uploadImage, isFirebaseStorageUrl } from '@/lib/firebase/storage';
import { ReferenceCategoryModal } from '@/features/projects/components/ReferenceCategoryModal';
import { ReferenceImageModal } from '@/features/projects/components/ReferenceImageModal';
import type { ReferenceImage } from '@/lib/schemas';

interface ReferenceGalleryProps {
  projectId: string;
  onDragStart: (e: React.DragEvent, imageUrl: string) => void;
  onViewShot?: (shotId: string, sceneId: string) => void;
}

// Separate component for reference image item to properly use hooks
interface ReferenceImageItemProps {
  img: ReferenceImage;
  onDragStart: (e: React.DragEvent, imageUrl: string) => void;
  onView: (img: ReferenceImage) => void;
  onDelete: (id: string) => void;
}

function ReferenceImageItem({ img, onDragStart, onView, onDelete }: ReferenceImageItemProps) {
  const dragStateRef = useRef({ wasDragged: false });
  
  return (
    <div
      className="relative group rounded overflow-hidden border border-border-subtle aspect-square"
    >
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={(e) => {
          dragStateRef.current.wasDragged = true;
          onDragStart(e, img.url);
        }}
        onMouseDown={() => {
          dragStateRef.current.wasDragged = false;
        }}
        onMouseUp={(e) => {
          // Only open modal if it was a click (not a drag)
          if (!dragStateRef.current.wasDragged) {
            e.stopPropagation();
            onView(img);
          }
          // Reset after a delay
          setTimeout(() => {
            dragStateRef.current.wasDragged = false;
          }, 100);
        }}
      >
        <Image
          src={img.url}
          alt={img.name}
          fill
          className="object-cover pointer-events-none"
          unoptimized={isFirebaseStorageUrl(img.url)}
        />
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none">
        <div className="p-1.5 bg-white/10 rounded text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(img.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="p-1.5 bg-white/10 hover:bg-error rounded text-white transition-colors pointer-events-auto"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ReferenceGallery({ projectId, onDragStart, onViewShot }: ReferenceGalleryProps) {
  const { images, isLoading, createReferenceImage, deleteReferenceImage, migrateShotReferences } = useReferenceImages(projectId);
  const [uploading, setUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [migrating, setMigrating] = useState(false);
  const [selectedReference, setSelectedReference] = useState<ReferenceImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setPendingFiles(Array.from(files));
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (category: 'wardrobe' | 'camera' | 'location' | 'character' | 'other') => {
    setShowCategoryModal(false);
    setUploading(true);
    
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const path = `projects/${projectId}/references/${Date.now()}-${file.name}`;
        const url = await uploadImage(file, path);
        await createReferenceImage.mutateAsync({
          projectId,
          url,
          name: file.name,
          category,
          tags: [],
        });
      }
    } catch (error) {
      console.error('Error uploading reference:', error);
      alert('Failed to upload reference image');
    } finally {
      setUploading(false);
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reference image?')) {
      await deleteReferenceImage.mutateAsync({ id, projectId });
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will migrate any references that were uploaded directly to shots into the reference gallery. Continue?')) {
      return;
    }
    
    try {
      setMigrating(true);
      const result = await migrateShotReferences.mutateAsync({ projectId });
      alert(result.message || `Migration complete! Created ${result.referencesCreated} reference(s).`);
    } catch (error: any) {
      console.error('Migration error:', error);
      alert(`Migration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setMigrating(false);
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const categoryLabels: Record<string, string> = {
    wardrobe: 'Wardrobe',
    camera: 'Camera',
    location: 'Location',
    character: 'Character',
    other: 'Other',
    uncategorized: 'Uncategorized',
  };

  const groupedImages = images.reduce((acc, img) => {
    const cat = img.category || 'uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(img);
    return acc;
  }, {} as Record<string, typeof images>);

  // Ensure defined order
  const orderedCategories = ['wardrobe', 'camera', 'location', 'character', 'other', 'uncategorized'];

  return (
    <div className="w-64 bg-background-secondary border-l border-border-subtle flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-text-primary">References</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
            disabled={uploading}
            title="Upload References"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
        <button
          onClick={handleMigrate}
          disabled={migrating || migrateShotReferences.isPending}
          className="w-full text-xs text-text-secondary hover:text-text-primary px-2 py-1.5 bg-background-tertiary hover:bg-background-elevated rounded transition-colors flex items-center justify-center gap-1"
          title="Migrate references from shots to gallery"
        >
          {migrating || migrateShotReferences.isPending ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Migrating...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Migrate Shot References</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {images.length === 0 && !isLoading && (
          <div className="text-center py-8 text-sm text-text-tertiary">
            No reference images. Upload some to use them in your storyboard.
          </div>
        )}

        {orderedCategories.map(category => {
            const categoryImages = groupedImages[category];
            if (!categoryImages?.length) return null;
            
            const isCollapsed = collapsedCategories[category];

            return (
                <div key={category} className="border border-border-default rounded-lg overflow-hidden bg-background-primary">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-2 bg-background-tertiary hover:bg-background-elevated transition-colors text-left"
                    >
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            {categoryLabels[category] || category} ({categoryImages.length})
                        </span>
                        <svg 
                            className={`w-3 h-3 text-text-tertiary transition-transform ${isCollapsed ? '-rotate-90' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {!isCollapsed && (
                        <div className="p-2 grid grid-cols-2 gap-2">
                            {categoryImages.map((img) => (
                                <ReferenceImageItem
                                    key={img.id}
                                    img={img}
                                    onDragStart={onDragStart}
                                    onView={setSelectedReference}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      <ReferenceCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
            setShowCategoryModal(false);
            setPendingFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onSelectCategory={handleCategorySelect}
        imageUrl={pendingFiles.length > 0 ? URL.createObjectURL(pendingFiles[0]) : ''}
      />

      {selectedReference && (
        <ReferenceImageModal
          reference={selectedReference}
          projectId={projectId}
          onClose={() => setSelectedReference(null)}
          onViewShot={onViewShot}
        />
      )}
    </div>
  );
}
