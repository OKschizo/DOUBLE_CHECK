'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';
import type { Scene } from '@doublecheck/schemas';
import Image from 'next/image';

interface SceneDetailModalProps {
  scene: Scene | null;
  projectId: string;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
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
  onClose,
  onSave,
}: SceneDetailModalProps) {
  const utils = trpc.useUtils();
  const syncScene = trpc.scenes.syncToSchedule.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      utils.schedule.getSchedule.invalidate({ projectId });
    },
    onError: (error) => {
      alert(`Failed to sync: ${error.message}`);
    },
  });
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

  const { data: conflicts } = trpc.scenes.getScheduleConflicts.useQuery(
    {
      sceneId: scene?.id || 'new',
      shootingDayId: formData.shootingDayIds[0] || undefined,
      scheduledDate: formData.scheduledDates[0] ? new Date(formData.scheduledDates[0]) : undefined,
    },
    { enabled: (formData.shootingDayIds.length > 0 || formData.scheduledDates.length > 0) }
  );

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
        imageUrl: finalImageUrl || undefined,
        locationNames,
        scheduledDates: scheduledDates.length > 0 ? scheduledDates : undefined,
        scriptPageStart: formData.scriptPageStart ? parseInt(formData.scriptPageStart) : undefined,
        scriptPageEnd: formData.scriptPageEnd ? parseInt(formData.scriptPageEnd) : undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      };

      // Remove empty strings
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === '' || (Array.isArray(submitData[key]) && submitData[key].length === 0)) {
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

  const selectedCast = castMembers.filter(c => formData.castIds.includes(c.id));
  const selectedCrew = crewMembers.filter(c => formData.crewIds.includes(c.id));
  const selectedEquipment = equipment.filter(e => formData.equipmentIds.includes(e.id));
  const selectedLocations = locations.filter(l => formData.locationIds.includes(l.id));
  const selectedShootingDays = schedule?.days?.filter((d: any) => formData.shootingDayIds.includes(d.id)) || [];

  const availableCast = castMembers.filter(c => !formData.castIds.includes(c.id));
  const availableCrew = crewMembers.filter(c => !formData.crewIds.includes(c.id));
  const availableEquipment = equipment.filter(e => !formData.equipmentIds.includes(e.id));
  const availableLocations = locations.filter(l => !formData.locationIds.includes(l.id));
  
  // Filtered lists based on search
  const filteredCast = availableCast.filter(c => 
    c.characterName?.toLowerCase().includes(castSearch.toLowerCase()) ||
    c.actorName?.toLowerCase().includes(castSearch.toLowerCase())
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
  const availableShootingDays = schedule?.days?.filter((d: any) => !formData.shootingDayIds.includes(d.id)) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            {scene ? 'Edit Scene' : 'Create Scene'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    <svg className="w-12 h-12 mx-auto mb-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
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
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Page Count
                  </label>
                  <input
                    type="text"
                    value={formData.pageCount}
                    onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                    placeholder="e.g., 1/8"
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Locations - Multiple */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Locations</h3>
              <div className="space-y-3">
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
                    className="btn-secondary flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Location
                  </button>
                  {showLocationDropdown && (
                    <div className="absolute z-10 mt-2 w-64 bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
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

            {/* Production Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Production Information</h3>
              <div className="grid grid-cols-2 gap-4">
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
                      {showShootingDayDropdown && availableShootingDays.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {availableShootingDays.map((day: any) => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => addShootingDay(day.id)}
                              className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                            >
                              {new Date(day.date).toLocaleDateString()} - Day {day.dayNumber || ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
              {conflicts && (conflicts.crew.length > 0 || conflicts.cast.length > 0 || conflicts.equipment.length > 0 || conflicts.location) && (
                <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-error mb-2">Scheduling Conflicts Detected:</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    {conflicts.crew.length > 0 && <li>Crew conflicts: {conflicts.crew.length} member(s)</li>}
                    {conflicts.cast.length > 0 && <li>Cast conflicts: {conflicts.cast.length} member(s)</li>}
                    {conflicts.equipment.length > 0 && <li>Equipment conflicts: {conflicts.equipment.length} item(s)</li>}
                    {conflicts.location && <li>Location conflict: Already scheduled</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* Creative Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Creative Information</h3>
              <div className="grid grid-cols-2 gap-4">
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
                    <option value="DAY">Day</option>
                    <option value="NIGHT">Night</option>
                    <option value="DAWN">Dawn</option>
                    <option value="DUSK">Dusk</option>
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
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Mood
                  </label>
                  <input
                    type="text"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Visual Notes
                  </label>
                  <textarea
                    value={formData.visualNotes}
                    onChange={(e) => setFormData({ ...formData, visualNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
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
                                  {cast.characterName} {cast.actorName && `(${cast.actorName})`}
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

            {/* Production Details */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Production Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.stuntsRequired}
                      onChange={(e) => setFormData({ ...formData, stuntsRequired: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-text-secondary">Stunts Required</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Continuity Notes
                  </label>
                  <textarea
                    value={formData.continuityNotes}
                    onChange={(e) => setFormData({ ...formData, continuityNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Special Requirements
                  </label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    VFX Notes
                  </label>
                  <textarea
                    value={formData.vfxNotes}
                    onChange={(e) => setFormData({ ...formData, vfxNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border-default flex justify-between items-center">
          <div>
            {scene && (formData.shootingDayIds.length > 0 || (scene.shootingDayIds && scene.shootingDayIds.length > 0)) && (
              <button
                type="button"
                onClick={() => {
                  const sceneId = scene.id;
                  syncScene.mutate({ sceneId });
                }}
                disabled={syncScene.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncScene.isPending ? 'Syncing...' : 'Sync to Schedule'}
              </button>
            )}
          </div>
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
