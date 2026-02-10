'use client';

import { useState, useEffect, useRef } from 'react';
// import { trpc } from '@/lib/trpc/client';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';
import type { Scene } from '@/lib/schemas';
import Image from 'next/image';
import { useSchedule } from '@/features/projects/hooks/useSchedule';
import { ContinuityPanel } from './ContinuityPanel';
import { CommentsPanel } from './CommentsPanel';

type ModalTab = 'details' | 'continuity' | 'comments';

interface SceneDetailModalProps {
  scene: Scene | null;
  projectId: string;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
  previousScene?: Scene;
  nextScene?: Scene;
  allScenes?: Scene[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function SceneDetailModal({
  scene,
  projectId,
  castMembers,
  crewMembers,
  equipment,
  locations,
  schedule,
  previousScene,
  nextScene,
  allScenes = [],
  onClose,
  onSave,
}: SceneDetailModalProps) {
  const { schedule: scheduleData } = useSchedule(projectId); // Use hook if schedule prop is not enough or if we need to invalidate
  
  // Placeholder mutation
  const syncScene = { isPending: false, mutate: (args: any) => alert("Sync not implemented") };

  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [comments, setComments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    sceneNumber: '',
    title: '',
    description: '',
    pageCount: '',
    locationIds: [] as string[],
    locationNames: [] as string[],
    imageUrl: '',
    scriptText: '',
    scriptPageStart: '',
    scriptPageEnd: '',
    status: 'not-shot' as 'not-shot' | 'in-progress' | 'completed' | 'omitted',
    shootingDayIds: [] as string[],
    scheduledDates: [] as string[],
    estimatedDuration: '',
    timeOfDay: '',
    weather: '',
    mood: '',
    visualNotes: '',
    castIds: [] as string[],
    crewIds: [] as string[],
    equipmentIds: [] as string[],
    continuityNotes: '',
    specialRequirements: '',
    vfxNotes: '',
    stuntsRequired: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Placeholder conflict check
  const conflicts = { crew: [], cast: [], equipment: [], location: null };

  useEffect(() => {
    if (scene) {
      setFormData({
        sceneNumber: scene.sceneNumber || '',
        title: scene.title || '',
        description: scene.description || '',
        pageCount: scene.pageCount || '',
        locationIds: scene.locationIds || (scene.locationId ? [scene.locationId] : []),
        locationNames: scene.locationNames || (scene.locationName ? [scene.locationName] : []),
        imageUrl: scene.imageUrl || '',
        scriptText: scene.scriptText || '',
        scriptPageStart: scene.scriptPageStart?.toString() || '',
        scriptPageEnd: scene.scriptPageEnd?.toString() || '',
        status: scene.status || 'not-shot',
        shootingDayIds: scene.shootingDayIds || (scene.shootingDayId ? [scene.shootingDayId] : []),
        scheduledDates: scene.scheduledDates?.map(d => {
          try {
            const date = d instanceof Date ? d : (d?.toDate ? d.toDate() : new Date(d));
            if (isNaN(date.getTime())) {
              return null;
            }
            return date.toISOString().split('T')[0];
          } catch {
            return null;
          }
        }).filter((d): d is string => d !== null) || [],
        estimatedDuration: scene.estimatedDuration?.toString() || '',
        timeOfDay: scene.timeOfDay || '',
        weather: scene.weather || '',
        mood: scene.mood || '',
        visualNotes: scene.visualNotes || '',
        castIds: scene.castIds || [],
        crewIds: scene.crewIds || [],
        equipmentIds: scene.equipmentIds || [],
        continuityNotes: scene.continuityNotes || '',
        specialRequirements: scene.specialRequirements || '',
        vfxNotes: scene.vfxNotes || '',
        stuntsRequired: scene.stuntsRequired || false,
      });
      setImagePreview(scene.imageUrl || null);
    }
  }, [scene]);

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, imageUrl: previewUrl });
    }
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
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl = formData.imageUrl;
      const oldImageUrl = scene?.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        setUploadingImage(true);
        const filename = generateUniqueFilename(imageFile.name);
        const storagePath = `scenes/${projectId}/${filename}`;
        finalImageUrl = await uploadImage(imageFile, storagePath);
        setUploadingImage(false);

        // Delete old image if it exists and is a Firebase Storage URL
        if (oldImageUrl && !isBlobUrl(oldImageUrl)) {
          await deleteImage(oldImageUrl);
        }
      }

      // Get location names from IDs
      const locationNames = formData.locationIds.map(id => {
        const loc = locations.find(l => l.id === id);
        return loc?.name || '';
      }).filter(Boolean);

      // Get scheduled dates from shooting day IDs
      const scheduledDates = formData.shootingDayIds.map(id => {
        const day = schedule?.days?.find((d: any) => d.id === id);
        return day ? new Date(day.date) : null;
      }).filter(Boolean) as Date[];

      const submitData: any = {
        ...formData,
        locationNames,
        // Only include optional fields if they have values
        ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
        ...(scheduledDates.length > 0 ? { scheduledDates } : {}),
        ...(formData.scriptPageStart ? { scriptPageStart: parseInt(formData.scriptPageStart) } : {}),
        ...(formData.scriptPageEnd ? { scriptPageEnd: parseInt(formData.scriptPageEnd) } : {}),
        ...(formData.estimatedDuration ? { estimatedDuration: parseInt(formData.estimatedDuration) } : {}),
      };

      // Remove empty strings, empty arrays, undefined, and null values
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

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving scene:', error);
      alert('Failed to save scene. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ... Add/Remove helpers (same as before) ...
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

  // Handler functions for ContinuityPanel and CommentsPanel
  const handleUpdateContinuity = async (sceneId: string, continuityData: any) => {
    await onSave(continuityData);
  };

  const handleAddComment = async (content: string, mentions: string[]) => {
    // In a real app, this would save to Firebase
    const newComment = {
      id: `comment-${Date.now()}`,
      userId: 'current-user',
      userName: 'Current User',
      content,
      mentions,
      createdAt: new Date(),
      resolved: false,
    };
    setComments([...comments, newComment]);
  };

  const handleResolveComment = async (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
  };

  const handleReplyComment = async (commentId: string, content: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), {
            id: `reply-${Date.now()}`,
            userId: 'current-user',
            userName: 'Current User',
            content,
            mentions: [],
            createdAt: new Date(),
            resolved: false,
          }],
        };
      }
      return c;
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">
              {scene ? `Scene ${scene.sceneNumber}` : 'Create Scene'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
              }`}
            >
              📝 Details
            </button>
            <button
              onClick={() => setActiveTab('continuity')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'continuity'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
              }`}
            >
              🔗 Continuity
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
              }`}
            >
              💬 Comments {comments.filter(c => !c.resolved).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-error rounded-full">
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload and Basic Info (same as before) */}
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Scene Image
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
                      alt="Scene preview"
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
                    <p className="text-sm text-text-secondary mb-2">
                      Drag and drop an image here, or click to browse
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

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Scene Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sceneNumber}
                    onChange={(e) => setFormData({ ...formData, sceneNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
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
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Scene title or heading"
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Scene description and action"
                rows={3}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            {/* Script Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Page Count
                </label>
                <input
                  type="text"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                  placeholder="e.g. 1.5"
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Script Page Start
                </label>
                <input
                  type="number"
                  value={formData.scriptPageStart}
                  onChange={(e) => setFormData({ ...formData, scriptPageStart: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Script Page End
                </label>
                <input
                  type="number"
                  value={formData.scriptPageEnd}
                  onChange={(e) => setFormData({ ...formData, scriptPageEnd: e.target.value })}
                  placeholder="2"
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            {/* Environment */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Time of Day
                </label>
                <select
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Select...</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="dawn">Dawn</option>
                  <option value="dusk">Dusk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Weather
                </label>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  placeholder="Sunny, Rainy, etc."
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Mood
                </label>
                <input
                  type="text"
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  placeholder="Tense, Happy, etc."
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="5"
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stuntsRequired}
                    onChange={(e) => setFormData({ ...formData, stuntsRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="ml-2 text-sm text-text-primary">Stunts Required</span>
                </label>
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Locations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.locationIds.map(id => {
                  const loc = locations.find(l => l.id === id);
                  return loc ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-accent-primary/20 text-accent-primary rounded text-sm">
                      {loc.name}
                      <button type="button" onClick={() => removeLocation(id)} className="hover:text-error">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="btn-secondary text-sm"
                >
                  + Add Location
                </button>
                {showLocationDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-background-secondary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="w-full px-3 py-2 border-b border-border-default bg-transparent text-text-primary focus:outline-none"
                    />
                    {locations
                      .filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()))
                      .filter(l => !formData.locationIds.includes(l.id))
                      .map(loc => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => addLocation(loc.id)}
                          className="w-full px-3 py-2 text-left text-text-primary hover:bg-background-primary text-sm"
                        >
                          {loc.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cast */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Cast
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.castIds.map(id => {
                  const cast = castMembers.find(c => c.id === id);
                  return cast ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                      {cast.characterName || cast.name}
                      <button type="button" onClick={() => removeCast(id)} className="hover:text-error">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCastDropdown(!showCastDropdown)}
                  className="btn-secondary text-sm"
                >
                  + Add Cast
                </button>
                {showCastDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-background-secondary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={castSearch}
                      onChange={(e) => setCastSearch(e.target.value)}
                      placeholder="Search cast..."
                      className="w-full px-3 py-2 border-b border-border-default bg-transparent text-text-primary focus:outline-none"
                    />
                    {castMembers
                      .filter(c => (c.characterName || c.name || '').toLowerCase().includes(castSearch.toLowerCase()))
                      .filter(c => !formData.castIds.includes(c.id))
                      .map(cast => (
                        <button
                          key={cast.id}
                          type="button"
                          onClick={() => addCast(cast.id)}
                          className="w-full px-3 py-2 text-left text-text-primary hover:bg-background-primary text-sm"
                        >
                          {cast.characterName || cast.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Crew */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Crew
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.crewIds.map(id => {
                  const crew = crewMembers.find(c => c.id === id);
                  return crew ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                      {crew.name} ({crew.role})
                      <button type="button" onClick={() => removeCrew(id)} className="hover:text-error">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCrewDropdown(!showCrewDropdown)}
                  className="btn-secondary text-sm"
                >
                  + Add Crew
                </button>
                {showCrewDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-background-secondary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={crewSearch}
                      onChange={(e) => setCrewSearch(e.target.value)}
                      placeholder="Search crew..."
                      className="w-full px-3 py-2 border-b border-border-default bg-transparent text-text-primary focus:outline-none"
                    />
                    {crewMembers
                      .filter(c => (c.name || '').toLowerCase().includes(crewSearch.toLowerCase()))
                      .filter(c => !formData.crewIds.includes(c.id))
                      .map(crew => (
                        <button
                          key={crew.id}
                          type="button"
                          onClick={() => addCrew(crew.id)}
                          className="w-full px-3 py-2 text-left text-text-primary hover:bg-background-primary text-sm"
                        >
                          {crew.name} ({crew.role})
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Equipment
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.equipmentIds.map(id => {
                  const eq = equipment.find(e => e.id === id);
                  return eq ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">
                      {eq.name}
                      <button type="button" onClick={() => removeEquipment(id)} className="hover:text-error">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                  className="btn-secondary text-sm"
                >
                  + Add Equipment
                </button>
                {showEquipmentDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-background-secondary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      placeholder="Search equipment..."
                      className="w-full px-3 py-2 border-b border-border-default bg-transparent text-text-primary focus:outline-none"
                    />
                    {equipment
                      .filter(e => (e.name || '').toLowerCase().includes(equipmentSearch.toLowerCase()))
                      .filter(e => !formData.equipmentIds.includes(e.id))
                      .map(eq => (
                        <button
                          key={eq.id}
                          type="button"
                          onClick={() => addEquipment(eq.id)}
                          className="w-full px-3 py-2 text-left text-text-primary hover:bg-background-primary text-sm"
                        >
                          {eq.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shooting Days */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Shooting Days
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.shootingDayIds.map(id => {
                  const day = schedule?.days?.find((d: any) => d.id === id);
                  return day ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                      Day {day.dayNumber} - {new Date(day.date).toLocaleDateString()}
                      <button type="button" onClick={() => removeShootingDay(id)} className="hover:text-error">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShootingDayDropdown(!showShootingDayDropdown)}
                  className="btn-secondary text-sm"
                >
                  + Add Shooting Day
                </button>
                {showShootingDayDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-background-secondary border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {(schedule?.days || [])
                      .filter((d: any) => !formData.shootingDayIds.includes(d.id))
                      .map((day: any) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => addShootingDay(day.id)}
                          className="w-full px-3 py-2 text-left text-text-primary hover:bg-background-primary text-sm"
                        >
                          Day {day.dayNumber} - {new Date(day.date).toLocaleDateString()}
                        </button>
                      ))}
                    {(schedule?.days || []).filter((d: any) => !formData.shootingDayIds.includes(d.id)).length === 0 && (
                      <div className="px-3 py-2 text-text-tertiary text-sm">No shooting days available</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Production Notes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Visual Notes
              </label>
              <textarea
                value={formData.visualNotes}
                onChange={(e) => setFormData({ ...formData, visualNotes: e.target.value })}
                placeholder="Camera angles, lighting, etc."
                rows={2}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Continuity Notes
              </label>
              <textarea
                value={formData.continuityNotes}
                onChange={(e) => setFormData({ ...formData, continuityNotes: e.target.value })}
                placeholder="Important details for continuity"
                rows={2}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Special Requirements
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                placeholder="Permits, safety, special effects, etc."
                rows={2}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                VFX Notes
              </label>
              <textarea
                value={formData.vfxNotes}
                onChange={(e) => setFormData({ ...formData, vfxNotes: e.target.value })}
                placeholder="Visual effects requirements"
                rows={2}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>
          </form>
          )}

          {/* Continuity Tab */}
          {activeTab === 'continuity' && scene && (
            <ContinuityPanel
              scene={scene}
              previousScene={previousScene}
              nextScene={nextScene}
              onUpdateContinuity={handleUpdateContinuity}
            />
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && scene && (
            <CommentsPanel
              entityId={scene.id}
              entityType="scene"
              comments={comments}
              onAddComment={handleAddComment}
              onResolveComment={handleResolveComment}
              onReplyComment={handleReplyComment}
              teamMembers={[...castMembers, ...crewMembers]}
            />
          )}
        </div>

        <div className="p-6 border-t border-border-default flex justify-between items-center">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSaving || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={isSaving || uploadingImage}
            >
              {isSaving || uploadingImage ? 'Saving...' : 'Save Scene'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
