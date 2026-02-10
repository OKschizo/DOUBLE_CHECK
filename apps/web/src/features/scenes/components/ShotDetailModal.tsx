'use client';

import { useState, useEffect, useRef } from 'react';
import { useShots } from '@/features/scenes/hooks/useShots';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl, isFirebaseStorageUrl } from '@/lib/firebase/storage';
import type { Shot } from '@/lib/schemas';
import Image from 'next/image';
import { ReferenceCategoryModal } from '@/features/projects/components/ReferenceCategoryModal';
import { useReferenceImages } from '@/features/projects/hooks/useReferenceImages';
import { useScene } from '@/features/scenes/hooks/useScenes';
import { useSchedule } from '@/features/projects/hooks/useSchedule';

interface ShotDetailModalProps {
  sceneId: string;
  projectId: string;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
  onClose: () => void;
  onViewShot?: (shot: Shot) => void;
  initialShotId?: string; // Optional: if provided, open directly in edit mode for this shot
}

export function ShotDetailModal({
  sceneId,
  projectId,
  castMembers,
  crewMembers,
  equipment,
  locations,
  schedule,
  onClose,
  onViewShot,
  initialShotId,
}: ShotDetailModalProps) {
  // Placeholder for syncShot - this would need to be implemented as a Cloud Function
  const syncShot = {
    mutate: async ({ shotId }: { shotId: string }) => {
      console.log('Sync shot to schedule', shotId);
      alert('Sync to schedule functionality needs to be implemented');
    },
    isPending: false,
  };
  const { shots, isLoading, createShot, updateShot, deleteShot, markBestTake } = useShots(sceneId);
  const { data: scene } = useScene(sceneId);
  const { createReferenceImage } = useReferenceImages(projectId);
  const { schedule: scheduleData, createDay } = useSchedule(projectId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [newShootingDate, setNewShootingDate] = useState<string>('');
  
  const [showReferenceCategoryModal, setShowReferenceCategoryModal] = useState(false);
  const [pendingReferenceUrl, setPendingReferenceUrl] = useState<string | null>(null);
  const [pendingReferenceName, setPendingReferenceName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shotNumber: '',
    title: '',
    description: '',
    shotType: 'master' as any,
    cameraAngle: '',
    cameraMovement: '',
    lens: '',
    focalLength: '',
    frameRate: '',
    resolution: '',
    cameraId: '',
    lensId: '',
    equipmentIds: [] as string[],
    lightingSetup: '',
    status: 'not-shot' as any,
    duration: '',
    slateInfo: '',
    composition: '',
    blocking: '',
    actionDescription: '',
    castIds: [] as string[],
    crewIds: [] as string[],
    locationIds: [] as string[],
    locationNames: [] as string[],
    shootingDayIds: [] as string[],
    imageUrl: '',
    storyboardId: '',
    shotReferences: [] as NonNullable<Shot['shotReferences']>,
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [showCastDropdown, setShowCastDropdown] = useState(false);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showShootingDayDropdown, setShowShootingDayDropdown] = useState(false);
  
  // Search states for dropdowns
  const [castSearch, setCastSearch] = useState('');
  const [crewSearch, setCrewSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [shootingDaySearch, setShootingDaySearch] = useState('');

  // Initialize form with scene data when creating new shot
  useEffect(() => {
    if (!editingShot && scene && showAddForm) {
      // When creating a new shot, inherit from scene
      setFormData({
        shotNumber: '',
        title: '',
        description: '',
        shotType: 'master',
        cameraAngle: '',
        cameraMovement: '',
        lens: '',
        focalLength: '',
        frameRate: '',
        resolution: '',
        cameraId: '',
        lensId: '',
        equipmentIds: [],
        lightingSetup: '',
        status: 'not-shot',
        duration: '',
        slateInfo: '',
        composition: '',
        blocking: '',
        actionDescription: '',
        castIds: scene.castIds || [],
        crewIds: scene.crewIds || [],
        locationIds: scene.locationIds || (scene.locationId ? [scene.locationId] : []),
        locationNames: scene.locationNames || (scene.locationName ? [scene.locationName] : []),
        shootingDayIds: scene.shootingDayIds || (scene.shootingDayId ? [scene.shootingDayId] : []),
        imageUrl: scene.imageUrl || '',
        storyboardId: '',
        shotReferences: [],
      });
      setImagePreview(scene.imageUrl || null);
    }
  }, [scene, showAddForm, editingShot]);

  useEffect(() => {
    if (editingShot) {
      setFormData({
        shotNumber: editingShot.shotNumber || '',
        title: editingShot.title || '',
        description: editingShot.description || '',
        shotType: editingShot.shotType || 'master',
        cameraAngle: editingShot.cameraAngle || '',
        cameraMovement: editingShot.cameraMovement || '',
        lens: editingShot.lens || '',
        focalLength: editingShot.focalLength?.toString() || '',
        frameRate: editingShot.frameRate?.toString() || '',
        resolution: editingShot.resolution || '',
        cameraId: editingShot.cameraId || '',
        lensId: editingShot.lensId || '',
        equipmentIds: editingShot.equipmentIds || [],
        lightingSetup: editingShot.lightingSetup || '',
        status: editingShot.status || 'not-shot',
        duration: editingShot.duration?.toString() || '',
        slateInfo: editingShot.slateInfo || '',
        composition: editingShot.composition || '',
        blocking: editingShot.blocking || '',
        actionDescription: editingShot.actionDescription || '',
        castIds: editingShot.castIds || [],
        crewIds: editingShot.crewIds || [],
        locationIds: editingShot.locationIds || [],
        locationNames: editingShot.locationNames || [],
        shootingDayIds: editingShot.shootingDayIds || [],
        imageUrl: editingShot.imageUrl || '',
        storyboardId: editingShot.storyboardId || '',
        shotReferences: editingShot.shotReferences || [],
      });
      setImagePreview(editingShot.imageUrl || null);
    }
  }, [editingShot]);

  // Initialize editing mode if initialShotId is provided
  useEffect(() => {
    if (initialShotId && shots.length > 0 && !editingShot) {
      const shotToEdit = shots.find(s => s.id === initialShotId);
      if (shotToEdit) {
        setEditingShot(shotToEdit);
        setShowAddForm(true);
      }
    }
  }, [initialShotId, shots, editingShot]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        setUploadingImage(true);
        const path = `projects/${projectId}/references/${Date.now()}-${file.name}`;
        const url = await uploadImage(file, path);
        setPendingReferenceUrl(url);
        setPendingReferenceName(file.name);
        setShowReferenceCategoryModal(true);
    } catch (error) {
        console.error('Error uploading reference:', error);
        alert('Failed to upload reference image');
    } finally {
        setUploadingImage(false);
        if (referenceInputRef.current) referenceInputRef.current.value = '';
    }
  };

  const handleReferenceCategorySelect = async (category: 'wardrobe' | 'camera' | 'location' | 'character' | 'other') => {
    if (!pendingReferenceUrl || !pendingReferenceName) return;
    
    try {
        // Create a project-level reference image (so it appears in the gallery)
        const referenceImage = await createReferenceImage.mutateAsync({
            projectId,
            url: pendingReferenceUrl,
            name: pendingReferenceName,
            category,
            tags: [],
        });

        // Add the reference to the shot's references array using the project-level reference ID
        const newRef = {
            id: referenceImage.id, // Use the project-level reference ID
            url: pendingReferenceUrl,
            category
        };
        setFormData(prev => ({
            ...prev,
            shotReferences: [...prev.shotReferences, newRef]
        }));
        setShowReferenceCategoryModal(false);
        setPendingReferenceUrl(null);
        setPendingReferenceName(null);
    } catch (error) {
        console.error('Error creating reference image:', error);
        alert('Failed to create reference image');
    }
  };

  const removeReference = (id: string) => {
      setFormData(prev => ({
          ...prev,
          shotReferences: prev.shotReferences.filter(r => r.id !== id)
      }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadingImage(true);

      // Upload image if there's a new file
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const filename = generateUniqueFilename(imageFile.name);
        const path = `shots/${projectId}/${filename}`;
        imageUrl = await uploadImage(imageFile, path);
      }

      // Delete old image if it was replaced
      if (editingShot?.imageUrl && imageUrl !== editingShot.imageUrl && !isBlobUrl(editingShot.imageUrl)) {
        try {
          await deleteImage(editingShot.imageUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      const submitData: any = {
        ...formData,
        imageUrl,
        // Only include numeric fields if they have a value
        ...(formData.focalLength ? { focalLength: parseFloat(formData.focalLength) } : {}),
        ...(formData.frameRate ? { frameRate: parseFloat(formData.frameRate) } : {}),
        ...(formData.duration ? { duration: parseFloat(formData.duration) } : {}),
      };

      // Remove empty strings, empty arrays, null, and undefined values
      Object.keys(submitData).forEach((key) => {
        if (
          submitData[key] === '' || 
          submitData[key] === undefined || 
          submitData[key] === null ||
          (Array.isArray(submitData[key]) && submitData[key].length === 0)
        ) {
          delete submitData[key];
        }
      });

      if (editingShot) {
        await updateShot.mutateAsync({ id: editingShot.id, data: submitData });
      } else {
        await createShot.mutateAsync({
          ...submitData,
          sceneId,
          projectId,
          createdBy: '', // Will be set by backend
        });
      }

      setShowAddForm(false);
      setEditingShot(null);
      setImageFile(null);
      setImagePreview(null);
      // Reset form...
      setFormData({
        shotNumber: '',
        title: '',
        description: '',
        shotType: 'master',
        cameraAngle: '',
        cameraMovement: '',
        lens: '',
        focalLength: '',
        frameRate: '',
        resolution: '',
        cameraId: '',
        lensId: '',
        equipmentIds: [],
        lightingSetup: '',
        status: 'not-shot',
        duration: '',
        slateInfo: '',
        composition: '',
        blocking: '',
        actionDescription: '',
        castIds: [],
        crewIds: [],
        locationIds: [],
        locationNames: [],
        shootingDayIds: [],
        imageUrl: '',
        storyboardId: '',
        shotReferences: [],
      });
    } catch (error) {
      console.error('Error saving shot:', error);
      alert('Failed to save shot. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTake = async (shotId: string, takeNumber: number) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot) return;

    const takeNumbers = shot.takeNumbers || [];
    if (!takeNumbers.includes(takeNumber)) {
      await updateShot.mutateAsync({
        id: shotId,
        data: {
          takeNumbers: [...takeNumbers, takeNumber],
        },
      });
    }
  };

  const addCast = (castId: string) => {
    if (!formData.castIds.includes(castId)) {
      setFormData({ ...formData, castIds: [...formData.castIds, castId] });
    }
    setShowCastDropdown(false);
  };

  const removeCast = (castId: string) => {
    setFormData({ ...formData, castIds: formData.castIds.filter(id => id !== castId) });
  };

  const addCrew = (crewId: string) => {
    if (!formData.crewIds.includes(crewId)) {
      setFormData({ ...formData, crewIds: [...formData.crewIds, crewId] });
    }
    setShowCrewDropdown(false);
  };

  const removeCrew = (crewId: string) => {
    setFormData({ ...formData, crewIds: formData.crewIds.filter(id => id !== crewId) });
  };

  const addEquipment = (equipmentId: string) => {
    if (!formData.equipmentIds.includes(equipmentId)) {
      setFormData({ ...formData, equipmentIds: [...formData.equipmentIds, equipmentId] });
    }
    setShowEquipmentDropdown(false);
  };

  const removeEquipment = (equipmentId: string) => {
    setFormData({ ...formData, equipmentIds: formData.equipmentIds.filter(id => id !== equipmentId) });
  };

  const addLocation = (locationId: string) => {
    if (!formData.locationIds.includes(locationId)) {
      const location = locations.find(l => l.id === locationId);
      setFormData({
        ...formData,
        locationIds: [...formData.locationIds, locationId],
        locationNames: [...formData.locationNames, location?.name || ''],
      });
    }
    setShowLocationDropdown(false);
  };

  const removeLocation = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    setFormData({
      ...formData,
      locationIds: formData.locationIds.filter(id => id !== locationId),
      locationNames: formData.locationNames.filter(name => name !== (location?.name || '')),
    });
  };

  const addShootingDay = (shootingDayId: string) => {
    if (!formData.shootingDayIds.includes(shootingDayId)) {
      setFormData({ ...formData, shootingDayIds: [...formData.shootingDayIds, shootingDayId] });
    }
    setShowShootingDayDropdown(false);
  };

  const removeShootingDay = (shootingDayId: string) => {
    setFormData({ ...formData, shootingDayIds: formData.shootingDayIds.filter(id => id !== shootingDayId) });
  };

  // Create a new shooting day and add it to the shot
  const handleAddNewShootingDay = async () => {
    if (!newShootingDate) return;
    
    const dateToAdd = new Date(newShootingDate);
    
    // Check if a day already exists for this date
    const allDays = scheduleData?.days || schedule?.days || [];
    const existingDay = allDays.find((d: any) => {
      const existingDate = new Date(d.date);
      return existingDate.toDateString() === dateToAdd.toDateString();
    });
    
    if (existingDay) {
      // Day exists, just add it to the shot
      addShootingDay(existingDay.id);
      setNewShootingDate('');
      return;
    }
    
    // Create a new shooting day
    try {
      // Calculate the next day number
      const nextDayNumber = allDays.length > 0 
        ? Math.max(...allDays.map((d: any) => d.dayNumber || 0)) + 1 
        : 1;
      
      // Create the new day and get the new ID back
      const newDayId = await createDay.mutateAsync({
        date: dateToAdd,
        dayNumber: nextDayNumber,
        title: `Day ${nextDayNumber}`,
        sceneIds: [sceneId],
        status: 'scheduled',
      });
      
      // Add the new day directly using the returned ID
      if (newDayId) {
        addShootingDay(newDayId);
      }
      
      setNewShootingDate('');
    } catch (error) {
      console.error('Failed to create shooting day:', error);
      alert('Failed to create shooting day');
    }
  };
  
  // Determine if we're in single-shot edit mode (opened from another modal)
  const isSingleShotMode = !!initialShotId;

  const selectedCast = castMembers.filter(c => formData.castIds.includes(c.id));
  const selectedCrew = crewMembers.filter(c => formData.crewIds.includes(c.id));
  const selectedEquipment = equipment.filter(e => formData.equipmentIds.includes(e.id));
  const selectedLocations = locations.filter(l => formData.locationIds.includes(l.id));
  // Use scheduleData from hook for real-time updates, fallback to schedule prop
  const allShootingDays = scheduleData?.days?.length > 0 ? scheduleData.days : (schedule?.days || []);
  const selectedShootingDays = allShootingDays.filter((d: any) => formData.shootingDayIds.includes(d.id)) || [];

  const availableCast = castMembers.filter(c => !formData.castIds.includes(c.id));
  const availableCrew = crewMembers.filter(c => !formData.crewIds.includes(c.id));
  const availableEquipment = equipment.filter(e => !formData.equipmentIds.includes(e.id));
  const availableLocations = locations.filter(l => !formData.locationIds.includes(l.id));
  const availableShootingDays = allShootingDays.filter((d: any) => !formData.shootingDayIds.includes(d.id)) || [];
  
  // Filtered lists based on search
  const filteredCast = availableCast.filter(c => 
    c.characterName?.toLowerCase().includes(castSearch.toLowerCase())
  );
  const filteredCrew = availableCrew.filter(c => 
    c.name?.toLowerCase().includes(crewSearch.toLowerCase()) ||
    c.role?.toLowerCase().includes(crewSearch.toLowerCase())
  );
  const filteredEquipment = availableEquipment.filter(e => 
    e.name?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );
  const filteredLocations = availableLocations.filter(l => 
    l.name?.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredShootingDays = availableShootingDays.filter((d: any) => {
    if (!shootingDaySearch) return true;
    const dateStr = new Date(d.date).toLocaleDateString().toLowerCase();
    const dayNum = d.dayNumber?.toString() || '';
    return dateStr.includes(shootingDaySearch.toLowerCase()) || 
           dayNum.includes(shootingDaySearch.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background-primary rounded-lg p-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-default flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary">
            {isSingleShotMode && editingShot 
              ? `Edit Shot ${editingShot.shotNumber}` 
              : 'Shots'}
          </h2>
          {!isSingleShotMode && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingShot(null);
                setImageFile(null);
                setImagePreview(null);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Shot
            </button>
          )}
          {isSingleShotMode && (
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showAddForm || editingShot ? (
            <form onSubmit={handleSubmit} className="space-y-6 mb-6">
              {/* Image Upload */}
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                    Main Storyboard Image
                    </label>
                    <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-border-default hover:border-accent-primary/50'
                    }`}
                    >
                    {imagePreview ? (
                        <div className="relative w-full h-48 mb-4">
                        <Image
                            src={imagePreview}
                            alt="Shot preview"
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <button
                            type="button"
                            onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setFormData({ ...formData, imageUrl: '' });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 p-2 bg-error text-white rounded-full hover:bg-error/80 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        </div>
                    ) : (
                        <div className="py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-text-secondary mb-2">
                            Drag and drop an image here
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-accent-primary hover:text-accent-hover font-medium"
                        >
                            Choose File
                        </button>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                    </div>
                  </div>

                  {/* Reference Images */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-text-secondary">
                              Reference Images
                          </label>
                          <button
                              type="button"
                              onClick={() => referenceInputRef.current?.click()}
                              className="text-xs bg-background-tertiary px-2 py-1 rounded hover:bg-background-elevated transition-colors"
                          >
                              + Add Reference
                          </button>
                          <input
                              ref={referenceInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleReferenceUpload}
                              className="hidden"
                          />
                      </div>
                      <div className="border border-border-default rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                          {formData.shotReferences.length === 0 ? (
                              <div className="flex items-center justify-center h-full text-text-tertiary text-sm italic">
                                  No references added
                              </div>
                          ) : (
                              <div className="grid grid-cols-2 gap-2">
                                  {formData.shotReferences.map(ref => (
                                      <div key={ref.id} className="relative aspect-square rounded overflow-hidden group">
                                          <Image
                                              src={ref.url}
                                              alt={ref.category}
                                              fill
                                              className="object-cover"
                                              unoptimized={isFirebaseStorageUrl(ref.url)}
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              <span className="text-white text-xs capitalize font-medium">{ref.category}</span>
                                              <button
                                                  type="button"
                                                  onClick={() => removeReference(ref.id)}
                                                  className="p-1 bg-error text-white rounded-full"
                                              >
                                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Shot Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shotNumber}
                      onChange={(e) => setFormData({ ...formData, shotNumber: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Shot Type
                    </label>
                    <select
                      value={formData.shotType}
                      onChange={(e) => setFormData({ ...formData, shotType: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="master">Master</option>
                      <option value="medium">Medium</option>
                      <option value="close">Close</option>
                      <option value="extreme-close">Extreme Close</option>
                      <option value="wide">Wide</option>
                      <option value="insert">Insert</option>
                      <option value="pov">POV</option>
                      <option value="over-shoulder">Over Shoulder</option>
                      <option value="two-shot">Two Shot</option>
                      <option value="establishing">Establishing</option>
                      <option value="cutaway">Cutaway</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Camera Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Camera Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Camera Angle
                    </label>
                    <input
                      type="text"
                      value={formData.cameraAngle}
                      onChange={(e) => setFormData({ ...formData, cameraAngle: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Camera Movement
                    </label>
                    <input
                      type="text"
                      value={formData.cameraMovement}
                      onChange={(e) => setFormData({ ...formData, cameraMovement: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Lens
                    </label>
                    <input
                      type="text"
                      value={formData.lens}
                      onChange={(e) => setFormData({ ...formData, lens: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Focal Length
                    </label>
                    <input
                      type="number"
                      value={formData.focalLength}
                      onChange={(e) => setFormData({ ...formData, focalLength: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Frame Rate
                    </label>
                    <input
                      type="number"
                      value={formData.frameRate}
                      onChange={(e) => setFormData({ ...formData, frameRate: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Resolution
                    </label>
                    <input
                      type="text"
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Location and Scheduling */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Location & Scheduling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Locations
                    </label>
                    <div className="space-y-2">
                      {selectedLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedLocations.map((loc) => (
                            <div
                              key={loc.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                            >
                              <span className="text-sm text-text-primary">{loc.name}</span>
                              <button
                                type="button"
                                onClick={() => removeLocation(loc.id)}
                                className="text-text-tertiary hover:text-error transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                          className="btn-secondary flex items-center gap-2 w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Location
                        </button>
                        {showLocationDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <input
                              type="text"
                              placeholder="Search locations..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredLocations.length > 0 ? (
                                filteredLocations.map((loc) => (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => {
                                      addLocation(loc.id);
                                      setLocationSearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                                  >
                                    {loc.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Shooting Days
                    </label>
                    <div className="space-y-2">
                      {selectedShootingDays.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedShootingDays.map((day: any) => (
                            <div
                              key={day.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                            >
                              <span className="text-sm text-text-primary">
                                {new Date(day.date).toLocaleDateString()} - Day {day.dayNumber || ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeShootingDay(day.id)}
                                className="text-text-tertiary hover:text-error transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowShootingDayDropdown(!showShootingDayDropdown)}
                          className="btn-secondary flex items-center gap-2 w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Shooting Day
                        </button>
                        {showShootingDayDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <input
                              type="text"
                              placeholder="Search shooting days..."
                              value={shootingDaySearch}
                              onChange={(e) => setShootingDaySearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredShootingDays.length > 0 ? (
                                filteredShootingDays.map((day: any) => (
                                  <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => {
                                      addShootingDay(day.id);
                                      setShootingDaySearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                                  >
                                    {new Date(day.date).toLocaleDateString()} - Day {day.dayNumber || ''}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary">No existing days found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Date picker to create new shooting day */}
                      <div className="mt-3 p-3 bg-background-tertiary rounded-lg border border-border-default">
                        <label className="block text-xs font-medium text-text-secondary mb-2">
                          Or add a new shooting date:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={newShootingDate}
                            onChange={(e) => setNewShootingDate(e.target.value)}
                            className="flex-1 px-3 py-2 bg-background-secondary border border-border-default rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewShootingDay}
                            disabled={!newShootingDate}
                            className="px-3 py-2 bg-accent-primary text-white rounded text-sm hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-text-tertiary mt-2">
                          If this date doesn&apos;t exist as a shooting day, one will be created automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments - Button + Dropdown Pattern */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Assignments</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Cast */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Cast
                    </label>
                    <div className="space-y-2">
                      {selectedCast.length > 0 && (
                        <div className="space-y-1">
                          {selectedCast.map((cast) => (
                            <div
                              key={cast.id}
                              className="flex items-center justify-between px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                            >
                              <span className="text-sm text-text-primary">{cast.characterName}</span>
                              <button
                                type="button"
                                onClick={() => removeCast(cast.id)}
                                className="text-text-tertiary hover:text-error transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCastDropdown(!showCastDropdown)}
                          className="btn-secondary flex items-center gap-2 w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Cast
                        </button>
                        {showCastDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <input
                              type="text"
                              placeholder="Search cast..."
                              value={castSearch}
                              onChange={(e) => setCastSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredCast.length > 0 ? (
                                filteredCast.map((cast) => (
                                  <button
                                    key={cast.id}
                                    type="button"
                                    onClick={() => {
                                      addCast(cast.id);
                                      setCastSearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                                  >
                                    {cast.characterName}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Crew */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Crew
                    </label>
                    <div className="space-y-2">
                      {selectedCrew.length > 0 && (
                        <div className="space-y-1">
                          {selectedCrew.map((crew) => (
                            <div
                              key={crew.id}
                              className="flex items-center justify-between px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                            >
                              <span className="text-sm text-text-primary">{crew.name} - {crew.role}</span>
                              <button
                                type="button"
                                onClick={() => removeCrew(crew.id)}
                                className="text-text-tertiary hover:text-error transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCrewDropdown(!showCrewDropdown)}
                          className="btn-secondary flex items-center gap-2 w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Crew
                        </button>
                        {showCrewDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <input
                              type="text"
                              placeholder="Search crew..."
                              value={crewSearch}
                              onChange={(e) => setCrewSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredCrew.length > 0 ? (
                                filteredCrew.map((crew) => (
                                  <button
                                    key={crew.id}
                                    type="button"
                                    onClick={() => {
                                      addCrew(crew.id);
                                      setCrewSearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                                  >
                                    {crew.name} - {crew.role}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Equipment
                    </label>
                    <div className="space-y-2">
                      {selectedEquipment.length > 0 && (
                        <div className="space-y-1">
                          {selectedEquipment.map((eq) => (
                            <div
                              key={eq.id}
                              className="flex items-center justify-between px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                            >
                              <span className="text-sm text-text-primary">{eq.name}</span>
                              <button
                                type="button"
                                onClick={() => removeEquipment(eq.id)}
                                className="text-text-tertiary hover:text-error transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                          className="btn-secondary flex items-center gap-2 w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Equipment
                        </button>
                        {showEquipmentDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <input
                              type="text"
                              placeholder="Search equipment..."
                              value={equipmentSearch}
                              onChange={(e) => setEquipmentSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredEquipment.length > 0 ? (
                                filteredEquipment.map((eq) => (
                                  <button
                                    key={eq.id}
                                    type="button"
                                    onClick={() => {
                                      addEquipment(eq.id);
                                      setEquipmentSearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                                  >
                                    {eq.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Production Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="not-shot">Not Shot</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="omitted">Omitted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Lighting Setup
                    </label>
                    <input
                      type="text"
                      value={formData.lightingSetup}
                      onChange={(e) => setFormData({ ...formData, lightingSetup: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Slate Info
                    </label>
                    <input
                      type="text"
                      value={formData.slateInfo}
                      onChange={(e) => setFormData({ ...formData, slateInfo: e.target.value })}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Creative Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Creative Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Composition
                    </label>
                    <textarea
                      value={formData.composition}
                      onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Blocking
                    </label>
                    <textarea
                      value={formData.blocking}
                      onChange={(e) => setFormData({ ...formData, blocking: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Action Description
                    </label>
                    <textarea
                      value={formData.actionDescription}
                      onChange={(e) => setFormData({ ...formData, actionDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Only show inline buttons if not in single-shot mode */}
              {!isSingleShotMode && (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingShot(null);
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : editingShot ? 'Update Shot' : 'Create Shot'}
                  </button>
                </div>
              )}
            </form>
          ) : null}

          {/* Hide shots list in single-shot mode */}
          {!isSingleShotMode && (shots.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No shots yet. Add your first shot above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shots.map((shot) => {
                const shotLocationIds = shot.locationIds || [];
                const shotLocations = locations.filter(l => shotLocationIds.includes(l.id));
                const shotCast = castMembers.filter(c => shot.castIds?.includes(c.id));
                const shotCrew = crewMembers.filter(c => shot.crewIds?.includes(c.id));
                const shotShootingDayIds = shot.shootingDayIds || [];
                const shotShootingDays = schedule?.days?.filter((d: any) => shotShootingDayIds.includes(d.id)) || [];

                return (
                  <div 
                    key={shot.id} 
                    className="card-elevated p-4"
                  >
                    {/* Shot Image */}
                    {shot.imageUrl && (
                      <div className="relative w-full h-48 mb-4 overflow-hidden bg-background-secondary rounded-lg">
                        <Image
                          src={shot.imageUrl}
                          alt={shot.title || `Shot ${shot.shotNumber}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          unoptimized={shot.imageUrl.startsWith('blob:') || shot.imageUrl.startsWith('data:') || isFirebaseStorageUrl(shot.imageUrl)}
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onViewShot?.(shot)}
                      >
                        <h3 className="text-lg font-semibold text-text-primary">
                          Shot {shot.shotNumber}
                          {shot.title && <span className="text-text-secondary ml-2">- {shot.title}</span>}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                          <span className="capitalize">{shot.shotType.replace('-', ' ')}</span>
                          {shot.lens && <span>Lens: {shot.lens}</span>}
                          {shot.frameRate && <span>{shot.frameRate} fps</span>}
                          {shot.resolution && <span>{shot.resolution}</span>}
                        </div>
                        {shotLocations.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-text-tertiary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{shotLocations.map(l => l.name).join(', ')}</span>
                          </div>
                        )}
                        {shotShootingDays.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-text-tertiary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{shotShootingDays.map((d: any) => new Date(d.date).toLocaleDateString()).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(shotShootingDayIds.length > 0 || scene?.shootingDayIds?.length > 0 || scene?.shootingDayId) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              syncShot.mutate({ shotId: shot.id });
                            }}
                            className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                            title="Sync to Schedule"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                          shot.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          shot.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {shot.status.replace('-', ' ')}
                        </span>
                        <button
                          onClick={() => {
                            setEditingShot(shot);
                            setShowAddForm(true);
                          }}
                          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this shot?')) {
                              deleteShot.mutate({ id: shot.id });
                            }
                          }}
                          className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onViewShot?.(shot)}
                    >
                      {shot.description && (
                        <p className="text-sm text-text-secondary mb-3">{shot.description}</p>
                      )}

                      {(shotCast.length > 0 || shotCrew.length > 0) && (
                        <div className="mb-3">
                          {shotCast.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-text-tertiary">Cast: </span>
                              <span className="text-sm text-text-secondary">
                                {shotCast.map(c => c.characterName).join(', ')}
                              </span>
                            </div>
                          )}
                          {shotCrew.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-text-tertiary">Crew: </span>
                              <span className="text-sm text-text-secondary">
                                {shotCrew.map(c => `${c.name} (${c.role})`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {shot.takeNumbers && shot.takeNumbers.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">Takes</h4>
                        <div className="flex flex-wrap gap-2">
                          {shot.takeNumbers.map((take) => (
                            <button
                              key={take}
                              onClick={(e) => {
                                e.stopPropagation();
                                markBestTake.mutate({ id: shot.id, takeNumber: take });
                              }}
                              className={`px-3 py-1 text-sm rounded transition-colors ${
                                shot.bestTake === take
                                  ? 'bg-accent-primary font-semibold'
                                  : 'bg-background-tertiary text-text-secondary hover:bg-background-elevated'
                              }`}
                              style={shot.bestTake === take ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                            >
                              Take {take}
                              {shot.bestTake === take && ' ✓'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const takeNumber = prompt('Enter take number:');
                          if (takeNumber) {
                            handleAddTake(shot.id, parseInt(takeNumber));
                          }
                        }}
                        className="text-sm text-accent-primary hover:text-accent-hover font-medium"
                      >
                        + Add Take
                      </button>
                      {onViewShot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewShot(shot);
                          }}
                          className="text-sm text-accent-primary hover:text-accent-hover font-medium flex items-center gap-1"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border-default flex justify-between items-center">
          <div>
            {editingShot && !isSingleShotMode && (() => {
              const shotShootingDayIds = editingShot.shootingDayIds || [];
              const sceneShootingDayIds = scene?.shootingDayIds || (scene?.shootingDayId ? [scene.shootingDayId] : []);
              const hasShootingDays = shotShootingDayIds.length > 0 || sceneShootingDayIds.length > 0;
              
              return hasShootingDays ? (
                <button
                  onClick={() => syncShot.mutate({ shotId: editingShot.id })}
                  disabled={syncShot.isPending}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {syncShot.isPending ? 'Syncing...' : 'Sync to Schedule'}
                </button>
              ) : null;
            })()}
          </div>
          
          {/* Footer buttons depend on mode */}
          {isSingleShotMode ? (
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Trigger form submit
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                className="btn-primary" 
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Update Shot'}
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          )}
        </div>
      </div>

      <ReferenceCategoryModal
        isOpen={showReferenceCategoryModal}
        onClose={() => {
            setShowReferenceCategoryModal(false);
            setPendingReferenceUrl(null);
            setPendingReferenceName(null);
        }}
        onSelectCategory={handleReferenceCategorySelect}
        imageUrl={pendingReferenceUrl || ''}
      />
    </div>
  );
}
