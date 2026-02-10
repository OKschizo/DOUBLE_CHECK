'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useScenesByProject as useScenes } from '@/features/scenes/hooks/useScenes';
import { useProjectShots } from '@/features/scenes/hooks/useProjectShots';
import { ShotDetailModal } from '@/features/scenes/components/ShotDetailModal';
import { ShotViewModal } from '@/features/scenes/components/ShotViewModal';
import { CoverageTemplateModal } from '@/features/scenes/components/CoverageTemplateModal';
import { AnnotationTools } from '@/features/scenes/components/AnnotationTools';
import { useApplyCoverageTemplate } from '@/features/scenes/hooks/useCoverageTemplates';
import { isFirebaseStorageUrl, uploadImage } from '@/lib/firebase/storage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Shot } from '@/lib/schemas';
import { ReferenceGallery } from '../ReferenceGallery';
import { ReferenceCategoryModal } from '@/features/projects/components/ReferenceCategoryModal';
import { useCastByProject } from '@/features/cast/hooks/useCast';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useEquipmentByProject } from '@/features/equipment/hooks/useEquipment';
import { useLocationsByProject } from '@/features/locations/hooks/useLocations';
import { useSchedule } from '@/features/projects/hooks/useSchedule';

interface StoryboardViewProps {
  projectId: string;
}

export function StoryboardView({ projectId }: StoryboardViewProps) {
  const { user } = useAuth();
  const { data: scenes = [], isLoading: isLoadingScenes } = useScenes(projectId);
  const { shots, isLoading: isLoadingShots, updateShot, createShot, updateShotOrder } = useProjectShots(projectId);
  
  // Fetch dependencies for modals
  const { data: castMembers = [] } = useCastByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { data: equipment = [] } = useEquipmentByProject(projectId);
  const { data: locations = [] } = useLocationsByProject(projectId);
  const { schedule } = useSchedule(projectId);

  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [showShotViewModal, setShowShotViewModal] = useState(false);
  const [showShotDetailModal, setShowShotDetailModal] = useState(false);
  const [detailSceneId, setDetailSceneId] = useState<string | null>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowShotIndex, setSlideshowShotIndex] = useState(0);
  const [activeSlideshowSceneId, setActiveSlideshowSceneId] = useState<string | null>(null);
  // Default to collapsed on mobile, expanded on desktop
  const [showReferenceGallery, setShowReferenceGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Set initial state based on screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Only set default on initial load, not on resize
    };
    
    checkMobile();
    // Set desktop default on first render
    if (window.innerWidth >= 768) {
      setShowReferenceGallery(true);
    }
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [showReferenceCategoryModal, setShowReferenceCategoryModal] = useState(false);
  const [pendingReferenceUrl, setPendingReferenceUrl] = useState<string | null>(null);
  const [targetShotIdForReference, setTargetShotIdForReference] = useState<string | null>(null);

  const [uploadingShotId, setUploadingShotId] = useState<string | null>(null);
  const [draggedShot, setDraggedShot] = useState<Shot | null>(null);
  const [draggedReference, setDraggedReference] = useState<string | null>(null);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [selectedSceneForCoverage, setSelectedSceneForCoverage] = useState<any | null>(null);
  const [showAnnotationTools, setShowAnnotationTools] = useState(false);
  const [annotationShot, setAnnotationShot] = useState<Shot | null>(null);

  // Group shots by scene with master/coverage hierarchy
  const shotsByScene = useMemo(() => {
    const grouped: Record<string, Shot[]> = {};
    scenes.forEach(scene => {
      grouped[scene.id] = [];
    });
    shots.forEach(shot => {
      if (!grouped[shot.sceneId]) {
        return;
      }
      grouped[shot.sceneId].push(shot);
    });
    
    // Sort shots within scenes
    Object.keys(grouped).forEach(sceneId => {
        grouped[sceneId].sort((a, b) => {
            // Prioritize sortOrder if available
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                return a.sortOrder - b.sortOrder;
            }
            // Fallback to shotNumber
            return a.shotNumber.localeCompare(b.shotNumber, undefined, { numeric: true });
        });
    });

    return grouped;
  }, [scenes, shots]);

  // Create master/coverage hierarchy
  const shotsWithHierarchy = useMemo(() => {
    const hierarchical: Record<string, Array<{ shot: Shot; isCoverage: boolean; indent: number }>> = {};
    
    Object.keys(shotsByScene).forEach(sceneId => {
      const sceneShots = shotsByScene[sceneId];
      hierarchical[sceneId] = [];
      
      sceneShots.forEach(shot => {
        // Check if this is a master shot
        const isMaster = (shot as any).isMaster === true;
        
        // Check if this shot is coverage for a master (linked via masterShotId)
        const isCoverage = !isMaster && (shot as any).masterShotId;
        
        hierarchical[sceneId].push({
          shot,
          isCoverage,
          indent: isCoverage ? 1 : 0,
        });
      });
    });
    
    return hierarchical;
  }, [shotsByScene]);

  const handleImageUpload = async (file: File, shotId: string) => {
    if (!file) return;
    
    try {
      setUploadingShotId(shotId);
      const path = `projects/${projectId}/shots/${shotId}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadImage(file, path);
      
      await updateShot.mutateAsync({
        id: shotId,
        data: { imageUrl: downloadURL }
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingShotId(null);
    }
  };

  const handleCreateShot = async (sceneId: string, variantOf?: Shot) => {
    const sceneShots = shotsByScene[sceneId] || [];
    let nextShotNumber = '1';

    if (variantOf) {
        const baseNumber = variantOf.shotNumber.replace(/[a-zA-Z]+$/, '');
        const currentVariants = sceneShots.filter(s => s.shotNumber.startsWith(baseNumber));
        
        const lastVariant = currentVariants[currentVariants.length - 1];
        const match = lastVariant.shotNumber.match(/(\d+)([a-zA-Z]*)$/);
        if (match) {
            const suffix = match[2];
            if (!suffix) {
                nextShotNumber = `${baseNumber}A`;
            } else {
                const lastChar = suffix.slice(-1);
                const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
                nextShotNumber = `${baseNumber}${suffix.slice(0, -1)}${nextChar}`;
            }
        } else {
            nextShotNumber = `${baseNumber}A`;
        }
    } else {
        const lastShotNumber = sceneShots.length > 0 ? sceneShots[sceneShots.length - 1].shotNumber : '0';
        const match = lastShotNumber.match(/(\d+)([a-zA-Z]*)$/);
        if (match) {
           const num = parseInt(match[1]);
           nextShotNumber = `${num + 1}`;
        } else if (sceneShots.length > 0) {
           nextShotNumber = `${sceneShots.length + 1}`;
        }
    }

    const maxSortOrder = sceneShots.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0);

    await createShot.mutateAsync({
      projectId,
      sceneId,
      shotNumber: nextShotNumber,
      shotType: variantOf ? variantOf.shotType : 'master',
      status: 'not-shot',
      createdBy: user?.id || '',
      sortOrder: maxSortOrder + 1000,
      ...(variantOf ? {
          description: variantOf.description,
          actionDescription: variantOf.actionDescription,
          locationIds: variantOf.locationIds,
          castIds: variantOf.castIds,
          crewIds: variantOf.crewIds,
          equipmentIds: variantOf.equipmentIds,
          // Don't copy references or main image for now, start clean or explicit copy? 
          // Usually variants share setup, so maybe copy refs? Let's keep it clean for now.
      } : {})
    });
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, shot: Shot) => {
    setDraggedShot(shot);
    setDraggedReference(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'shot');
    e.dataTransfer.setData('shotId', shot.id);
  };

  const onReferenceDragStart = (e: React.DragEvent, imageUrl: string) => {
    setDraggedReference(imageUrl);
    setDraggedShot(null);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('type', 'reference');
    e.dataTransfer.setData('imageUrl', imageUrl);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type') || (draggedReference ? 'reference' : draggedShot ? 'shot' : '');
    e.dataTransfer.dropEffect = type === 'reference' ? 'copy' : 'move';
  };

  const onDrop = async (e: React.DragEvent, targetShot: Shot, sceneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');

    // Handle Reference Image Drop
    if (type === 'reference' || draggedReference) {
      const imageUrl = e.dataTransfer.getData('imageUrl') || draggedReference;
      if (imageUrl && targetShot) {
        setPendingReferenceUrl(imageUrl);
        setTargetShotIdForReference(targetShot.id);
        setShowReferenceCategoryModal(true);
      }
      setDraggedReference(null);
      return;
    }

    // Handle Shot Reordering/Moving
    if (!draggedShot || draggedShot.id === targetShot.id) return;

    const sourceSceneId = draggedShot.sceneId;
    const targetSceneId = sceneId;

    if (sourceSceneId === targetSceneId) {
        // Reorder within same scene
        const sceneShots = [...(shotsByScene[sceneId] || [])];
        const oldIndex = sceneShots.findIndex(s => s.id === draggedShot.id);
        const newIndex = sceneShots.findIndex(s => s.id === targetShot.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const [movedShot] = sceneShots.splice(oldIndex, 1);
        sceneShots.splice(newIndex, 0, movedShot);

        const updates = sceneShots.map((s, index) => ({
            id: s.id,
            sortOrder: (index + 1) * 1000,
        }));

        try {
            await updateShotOrder.mutateAsync({ updates });
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    } else {
        // Move to different scene
        const targetSceneShots = [...(shotsByScene[targetSceneId] || [])];
        const targetIndex = targetSceneShots.findIndex(s => s.id === targetShot.id);
        
        // Insert dragged shot into target list for calculation
        targetSceneShots.splice(targetIndex, 0, draggedShot);
        
        // 1. Update shot's sceneId
        await updateShot.mutateAsync({
            id: draggedShot.id,
            data: { sceneId: targetSceneId }
        });

        // 2. Update sortOrders in target scene
        const updates = targetSceneShots.map((s, index) => ({
            id: s.id,
            sortOrder: (index + 1) * 1000,
        }));

        try {
            await updateShotOrder.mutateAsync({ updates });
        } catch (error) {
            console.error('Failed to update order in new scene:', error);
        }
    }
    
    setDraggedShot(null);
  };

  const handleReferenceCategorySelect = async (category: 'wardrobe' | 'camera' | 'location' | 'character' | 'other') => {
    if (!pendingReferenceUrl || !targetShotIdForReference) return;

    const targetShot = shots.find(s => s.id === targetShotIdForReference);
    if (!targetShot) return;

    const newReference = {
      id: crypto.randomUUID(),
      url: pendingReferenceUrl,
      category,
    };

    const updatedReferences = [...(targetShot.shotReferences || []), newReference];

    try {
      await updateShot.mutateAsync({
        id: targetShot.id,
        data: { shotReferences: updatedReferences }
      });
    } catch (error) {
      console.error('Failed to add reference:', error);
      alert('Failed to add reference image');
    }

    setShowReferenceCategoryModal(false);
    setPendingReferenceUrl(null);
    setTargetShotIdForReference(null);
  };

  const openSlideshow = (sceneId: string, initialIndex: number = 0) => {
    setActiveSlideshowSceneId(sceneId);
    setSlideshowShotIndex(initialIndex);
    setShowSlideshow(true);
  };

  if (isLoadingScenes || isLoadingShots) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* Header - Mobile optimized */}
        <div className="flex items-start justify-between gap-2 mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-text-primary">Storyboards</h1>
            <p className="text-sm md:text-base text-text-secondary">Visual planning</p>
          </div>
          {/* Toggle References Panel - Desktop only */}
          <button
            onClick={() => setShowReferenceGallery(!showReferenceGallery)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              showReferenceGallery 
                ? 'bg-accent-primary' 
                : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
            }`}
            style={showReferenceGallery ? { color: 'rgb(var(--colored-button-text))' } : undefined}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showReferenceGallery ? 'Hide' : 'Show'} References
          </button>
        </div>

        <div className="space-y-8 md:space-y-12 pb-20">
          {scenes.map(scene => (
            <div key={scene.id} className="space-y-3 md:space-y-4">
              {/* Scene Header - Mobile stacked, Desktop inline */}
              <div className="border-b border-border-subtle pb-2 sticky top-0 bg-background-primary z-10 pt-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h2 className="text-base md:text-xl font-bold text-text-primary whitespace-nowrap">Scene {scene.sceneNumber}</h2>
                    <span className="text-text-secondary text-xs md:text-sm truncate">{scene.title}</span>
                  </div>
                  {/* Desktop actions */}
                  <div className="hidden md:flex items-center gap-2">
                    <button 
                      onClick={() => openSlideshow(scene.id)}
                      className="text-xs bg-background-tertiary text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-background-elevated transition-colors flex items-center gap-1"
                      disabled={!shotsByScene[scene.id]?.length}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Play
                    </button>
                    <button 
                      onClick={() => handleCreateShot(scene.id)}
                      className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-1 rounded hover:bg-accent-primary/20 transition-colors font-medium"
                    >
                      + Add Shot
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSceneForCoverage(scene);
                        setShowCoverageModal(true);
                      }}
                      className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/20 transition-colors font-medium"
                      title="Apply coverage template"
                    >
                      📋 Coverage
                    </button>
                    <button 
                      onClick={() => {
                          setDetailSceneId(scene.id);
                          setShowShotDetailModal(true);
                      }}
                      className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-background-tertiary transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </div>
                {/* Mobile actions - horizontal scroll */}
                <div className="flex md:hidden gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <button 
                    onClick={() => handleCreateShot(scene.id)}
                    className="text-xs bg-accent-primary text-white px-2.5 py-1.5 rounded font-medium flex-shrink-0"
                  >
                    + Shot
                  </button>
                  <button 
                    onClick={() => openSlideshow(scene.id)}
                    className="text-xs bg-background-secondary text-text-secondary px-2.5 py-1.5 rounded flex items-center gap-1 flex-shrink-0"
                    disabled={!shotsByScene[scene.id]?.length}
                  >
                    ▶ Play
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSceneForCoverage(scene);
                      setShowCoverageModal(true);
                    }}
                    className="text-xs bg-background-secondary text-text-secondary px-2.5 py-1.5 rounded flex-shrink-0"
                  >
                    📋 Coverage
                  </button>
                  <button 
                    onClick={() => {
                        setDetailSceneId(scene.id);
                        setShowShotDetailModal(true);
                    }}
                    className="text-xs bg-background-secondary text-text-secondary px-2.5 py-1.5 rounded flex-shrink-0"
                  >
                    ⚙ Manage
                  </button>
                </div>
              </div>

              <div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 min-h-[80px]"
                onDragOver={(e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type') || (draggedReference ? 'reference' : draggedShot ? 'shot' : '');
                    e.dataTransfer.dropEffect = type === 'reference' ? 'copy' : 'move';
                }}
                onDrop={async (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type');
                    
                    // Handle reference drop on empty scene area (shouldn't happen, but handle gracefully)
                    if (type === 'reference') {
                        // References should be dropped on shots, not scenes
                        return;
                    }
                    
                    // Handle shot drop on empty scene area
                    if (draggedShot && draggedShot.sceneId !== scene.id) {
                        // Only handle if dropping on the grid container itself, not on a shot card
                        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.grid') === e.currentTarget) {
                            await updateShot.mutateAsync({
                                id: draggedShot.id,
                                data: { sceneId: scene.id }
                            });
                            const targetShots = shotsByScene[scene.id] || [];
                            const maxSort = targetShots.reduce((m, s) => Math.max(m, s.sortOrder || 0), 0);
                            await updateShotOrder.mutateAsync({
                                updates: [{ id: draggedShot.id, sortOrder: maxSort + 1000 }]
                            });
                            setDraggedShot(null);
                        }
                    }
                }}
              >
                {(shotsByScene[scene.id] || []).map((shot, index) => (
                  <div 
                    key={shot.id} 
                    draggable
                    onDragStart={(e) => onDragStart(e, shot)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, shot, scene.id)}
                    className={`group relative bg-background-secondary border border-border-default rounded-lg overflow-hidden hover:border-accent-primary/50 transition-all flex flex-col ${
                        draggedShot?.id === shot.id ? 'opacity-50 border-dashed border-accent-primary' : ''
                    } ${draggedReference ? 'border-dashed border-accent-secondary' : ''}`}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-video bg-black/20 group-hover:bg-black/30 transition-colors cursor-move">
                      {shot.imageUrl ? (
                        <Image
                          src={shot.imageUrl}
                          alt={`Shot ${shot.shotNumber}`}
                          fill
                          className="object-cover"
                          unoptimized={shot.imageUrl.startsWith('blob:') || shot.imageUrl.startsWith('data:') || isFirebaseStorageUrl(shot.imageUrl)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
                          <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title="Upload Storyboard Image">
                              <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                          handleImageUpload(e.target.files[0], shot.id);
                                      }
                                  }}
                                  disabled={uploadingShotId === shot.id}
                              />
                              {uploadingShotId === shot.id ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                              )}
                          </label>
                          {shot.imageUrl && (
                            <button 
                                onClick={() => {
                                    setAnnotationShot(shot);
                                    setShowAnnotationTools(true);
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                title="Annotate Image"
                            >
                                ✏️
                            </button>
                          )}
                          <button 
                              onClick={() => openSlideshow(scene.id, index)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                              title="View Fullscreen"
                          >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                          </button>
                          <button 
                              onClick={() => {
                                  setSelectedShot(shot);
                                  setShowShotViewModal(true);
                              }}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                              title="View Details"
                          >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                          </button>
                      </div>
                      
                      {/* Shot Number Badge */}
                      <div className="absolute top-2 left-2 bg-background-primary/90 text-text-primary px-2 py-0.5 text-xs font-bold rounded shadow-sm border border-border-subtle">
                          {shot.shotNumber}
                      </div>

                      {/* Reference Indicators */}
                      {shot.shotReferences && shot.shotReferences.length > 0 && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {shot.shotReferences.some(r => r.category === 'wardrobe') && <span className="bg-black/50 p-1 rounded text-xs" title="Wardrobe">👕</span>}
                          {shot.shotReferences.some(r => r.category === 'camera') && <span className="bg-black/50 p-1 rounded text-xs" title="Camera">🎥</span>}
                          {shot.shotReferences.some(r => r.category === 'location') && <span className="bg-black/50 p-1 rounded text-xs" title="Location">📍</span>}
                          {shot.shotReferences.some(r => r.category === 'character') && <span className="bg-black/50 p-1 rounded text-xs" title="Character">👤</span>}
                          {shot.shotReferences.some(r => r.category === 'other') && <span className="bg-black/50 p-1 rounded text-xs" title="Other">🔖</span>}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-accent-primary uppercase tracking-wider">{shot.shotType}</span>
                          <button 
                              onClick={() => handleCreateShot(scene.id, shot)}
                              className="text-[10px] text-text-tertiary hover:text-accent-primary transition-colors"
                              title="Create Variant"
                          >
                              + Variant
                          </button>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2 flex-1">
                          {shot.description || shot.actionDescription || <span className="text-text-tertiary italic">No description</span>}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Empty state for scene if no shots */}
                {(!shotsByScene[scene.id] || shotsByScene[scene.id].length === 0) && (
                  <div
                      onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const type = e.dataTransfer.getData('type') || (draggedShot ? 'shot' : '');
                          e.dataTransfer.dropEffect = type === 'shot' ? 'move' : 'none';
                      }}
                      onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const type = e.dataTransfer.getData('type');
                          
                          // Only handle shot drops, not references
                          if (type === 'shot' && draggedShot && draggedShot.sceneId !== scene.id) {
                              await updateShot.mutateAsync({
                                  id: draggedShot.id,
                                  data: { sceneId: scene.id }
                              });
                              await updateShotOrder.mutateAsync({
                                  updates: [{ id: draggedShot.id, sortOrder: 1000 }]
                              });
                              setDraggedShot(null);
                          }
                      }}
                      className="aspect-video border-2 border-dashed border-border-default rounded-lg flex flex-col items-center justify-center text-text-tertiary hover:border-accent-primary hover:text-accent-primary transition-colors h-full min-h-[150px] col-span-full"
                  >
                      <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium">Add First Shot</span>
                      {draggedShot && draggedShot.sceneId !== scene.id && (
                          <span className="text-xs mt-1 text-accent-primary">Drop shot here</span>
                      )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {scenes.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                  No scenes found. Create scenes in the Scenes tab to start storyboarding.
              </div>
          )}
        </div>
      </div>

      {/* Mobile Reference Toggle FAB */}
      <button
        onClick={() => setShowReferenceGallery(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-accent-primary rounded-full shadow-lg flex items-center justify-center"
        style={{ color: 'rgb(var(--colored-button-text))' }}
        aria-label="Open references"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Reference Gallery Sidebar - Mobile Overlay */}
      {showReferenceGallery && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={() => setShowReferenceGallery(false)} 
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[90vw] bg-background-secondary border-l border-border-subtle animate-in slide-in-from-right flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">References</h3>
              <button
                onClick={() => setShowReferenceGallery(false)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-background-tertiary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReferenceGallery 
                projectId={projectId} 
                onDragStart={onReferenceDragStart}
                onViewShot={(shotId, sceneId) => {
                  const shot = shots.find(s => s.id === shotId);
                  if (shot) {
                    setSelectedShot(shot);
                    setShowShotViewModal(true);
                    setShowReferenceGallery(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reference Gallery Sidebar - Desktop */}
      {showReferenceGallery && !isMobile && (
        <ReferenceGallery 
            projectId={projectId} 
            onDragStart={onReferenceDragStart}
            onViewShot={(shotId, sceneId) => {
              const shot = shots.find(s => s.id === shotId);
              if (shot) {
                setSelectedShot(shot);
                setShowShotViewModal(true);
              }
            }}
        />
      )}

      {/* Reference Category Selection Modal */}
      <ReferenceCategoryModal
        isOpen={showReferenceCategoryModal}
        onClose={() => {
          setShowReferenceCategoryModal(false);
          setPendingReferenceUrl(null);
          setTargetShotIdForReference(null);
        }}
        onSelectCategory={handleReferenceCategorySelect}
        imageUrl={pendingReferenceUrl || ''}
      />

      {/* Shot View Modal */}
      {showShotViewModal && selectedShot && (
        <ShotViewModal
          shot={selectedShot}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          onClose={() => {
            setShowShotViewModal(false);
            setSelectedShot(null);
          }}
          onEdit={() => {
            setShowShotViewModal(false);
            setDetailSceneId(selectedShot.sceneId);
            setSelectedShot(selectedShot); // Keep selectedShot so we can pass its ID
            setShowShotDetailModal(true);
          }}
        />
      )}
      
      {/* Shot Detail Modal (Edit) */}
      {showShotDetailModal && detailSceneId && (
        <ShotDetailModal
            sceneId={detailSceneId}
            projectId={projectId}
            castMembers={castMembers}
            crewMembers={crewMembers}
            equipment={equipment}
            locations={locations}
            schedule={schedule}
            initialShotId={selectedShot?.id} // Pass the shot ID to open directly in edit mode
            onClose={() => {
                setShowShotDetailModal(false);
                setDetailSceneId(null);
                setSelectedShot(null); // Clear selected shot when closing
            }}
        />
      )}

      {/* Slideshow Modal */}
      {showSlideshow && activeSlideshowSceneId && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10">
                <div className="text-white">
                    <h3 className="font-bold text-lg">Scene {scenes.find(s => s.id === activeSlideshowSceneId)?.sceneNumber}</h3>
                    <p className="text-sm opacity-80">
                        Shot {shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.shotNumber} 
                        ({slideshowShotIndex + 1} / {shotsByScene[activeSlideshowSceneId]?.length})
                    </p>
                </div>
                <button 
                    onClick={() => setShowSlideshow(false)}
                    className="p-2 text-white hover:text-gray-300 rounded-full bg-white/10 hover:bg-white/20"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Prev Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setSlideshowShotIndex(prev => Math.max(0, prev - 1));
                    }}
                    disabled={slideshowShotIndex === 0}
                    className="absolute left-4 p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed z-10 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Image */}
                <div className="relative w-full h-full max-w-6xl max-h-[85vh] p-4">
                    {shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.imageUrl ? (
                        <Image
                            src={shotsByScene[activeSlideshowSceneId][slideshowShotIndex].imageUrl!}
                            alt="Shot"
                            fill
                            className="object-contain"
                            unoptimized={true}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <svg className="w-24 h-24 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>No image uploaded for this shot</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const max = (shotsByScene[activeSlideshowSceneId]?.length || 0) - 1;
                        setSlideshowShotIndex(prev => Math.min(max, prev + 1));
                    }}
                    disabled={slideshowShotIndex >= (shotsByScene[activeSlideshowSceneId]?.length || 0) - 1}
                    className="absolute right-4 p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed z-10 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Footer Info */}
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                <div className="max-w-4xl mx-auto">
                    <h4 className="font-bold mb-2">
                        Shot {shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.shotNumber} - {shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.shotType}
                    </h4>
                    <p className="opacity-80">
                        {shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.description || 
                         shotsByScene[activeSlideshowSceneId]?.[slideshowShotIndex]?.actionDescription || 
                         "No description provided."}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Coverage Template Modal */}
      {showCoverageModal && selectedSceneForCoverage && (
        <CoverageTemplateModalWrapper
          scene={selectedSceneForCoverage}
          projectId={projectId}
          onClose={() => {
            setShowCoverageModal(false);
            setSelectedSceneForCoverage(null);
          }}
        />
      )}

      {/* Annotation Tools */}
      {showAnnotationTools && annotationShot?.imageUrl && (
        <AnnotationTools
          imageUrl={annotationShot.imageUrl}
          onSave={async (annotatedImageData) => {
            // Convert data URL to blob for upload
            const response = await fetch(annotatedImageData);
            const blob = await response.blob();
            const file = new File([blob], `annotated-${Date.now()}.png`, { type: 'image/png' });
            
            // Upload the annotated image
            const path = `projects/${projectId}/shots/${annotationShot.id}/annotated-${Date.now()}.png`;
            const downloadURL = await uploadImage(file, path);
            
            // Update the shot with the new image
            await updateShot.mutateAsync({
              id: annotationShot.id,
              data: { imageUrl: downloadURL }
            });
          }}
          onClose={() => {
            setShowAnnotationTools(false);
            setAnnotationShot(null);
          }}
        />
      )}
    </div>
  );
}

// Coverage Template Modal Wrapper (to use hook properly)
function CoverageTemplateModalWrapper({ scene, projectId, onClose }: { scene: any; projectId: string; onClose: () => void }) {
  const { applyTemplate } = useApplyCoverageTemplate(scene.id, projectId);
  
  return (
    <CoverageTemplateModal
      scene={scene}
      onClose={onClose}
      onApply={async (template) => {
        await applyTemplate(template);
        alert(`✅ Created ${template.shots.length} shots for Scene ${scene.sceneNumber}!`);
        onClose();
      }}
    />
  );
}
