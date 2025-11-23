'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { ScheduleEventType } from '@/lib/schemas';

interface EventCreationModalProps {
  projectId: string;
  shootingDayId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  initialData?: {
    time?: string;
    sceneNumber?: string;
    description?: string;
    location?: string;
    locationId?: string;
    pageCount?: string;
    type?: ScheduleEventType;
    duration?: number;
    notes?: string;
    castIds?: string[];
    crewIds?: string[];
    equipmentIds?: string[];
    storyboardIds?: string[];
  };
}

export function EventCreationModal({
  projectId,
  shootingDayId,
  isOpen,
  onClose,
  onCreate,
  initialData,
}: EventCreationModalProps) {
  // Fetch data for dropdowns
  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });
  const { data: castMembers = [] } = trpc.cast.listByProject.useQuery({ projectId });
  const { data: equipment = [] } = trpc.equipment.listByProject.useQuery({ projectId });
  const { data: equipmentPackages = [] } = trpc.equipment.listPackages.useQuery({ projectId });
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId });
  const { data: scenes = [], isLoading: isLoadingScenes } = trpc.scenes.listByProject.useQuery({ projectId });
  const { data: schedule } = trpc.schedule.getSchedule.useQuery({ projectId });
  const { data: referenceImages = [] } = trpc.referenceImages.list.useQuery({ projectId });
  
  // Get shots for selected scene
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const { data: shots = [] } = trpc.scenes.getShotsByScene.useQuery(
    { sceneId: selectedSceneId },
    { enabled: !!selectedSceneId }
  );

  // Form state
  const [formData, setFormData] = useState({
    time: initialData?.time || '',
    sceneNumber: initialData?.sceneNumber || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    locationId: '',
    pageCount: initialData?.pageCount || '',
    type: (initialData?.type || 'scene') as ScheduleEventType,
    duration: '',
    notes: '',
    sceneId: '',
    shotId: '',
  });

  const [selectedCastIds, setSelectedCastIds] = useState<Set<string>>(new Set());
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  const [selectedStoryboardIds, setSelectedStoryboardIds] = useState<Set<string>>(new Set());
  
  // Dropdown states for searchable selects
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [showShotDropdown, setShowShotDropdown] = useState(false);
  const [showCastDropdown, setShowCastDropdown] = useState(false);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [showStoryboardDropdown, setShowStoryboardDropdown] = useState(false);
  
  // Search states
  const [sceneSearch, setSceneSearch] = useState('');
  const [shotSearch, setShotSearch] = useState('');
  const [castSearch, setCastSearch] = useState('');
  const [crewSearch, setCrewSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [storyboardSearch, setStoryboardSearch] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing mode - populate with existing data
        setFormData({
          time: initialData.time || '',
          sceneNumber: initialData.sceneNumber || '',
          description: initialData.description || '',
          location: initialData.location || '',
          locationId: initialData.locationId || '',
          pageCount: initialData.pageCount || '',
          type: initialData.type || 'scene',
          duration: initialData.duration?.toString() || '',
          notes: initialData.notes || '',
          sceneId: (initialData as any).sceneId || '',
          shotId: (initialData as any).shotId || '',
        });
        setSelectedCastIds(new Set(initialData.castIds || []));
        setSelectedCrewIds(new Set(initialData.crewIds || []));
        setSelectedEquipmentIds(new Set(initialData.equipmentIds || []));
        setSelectedStoryboardIds(new Set(initialData.storyboardIds || []));
        setSelectedSceneId((initialData as any).sceneId || '');
      } else {
        // New event mode - reset to defaults
        setFormData({
          time: '',
          sceneNumber: '',
          description: '',
          location: '',
          locationId: '',
          pageCount: '',
          type: 'scene',
          duration: '',
          notes: '',
          sceneId: '',
          shotId: '',
        });
        setSelectedCastIds(new Set());
        setSelectedCrewIds(new Set());
        setSelectedEquipmentIds(new Set());
        setSelectedStoryboardIds(new Set());
        setSelectedSceneId('');
        setSceneSearch('');
        setShotSearch('');
        setCastSearch('');
        setCrewSearch('');
        setEquipmentSearch('');
        setShowSceneDropdown(false);
        setShowShotDropdown(false);
        setShowCastDropdown(false);
        setShowCrewDropdown(false);
        setShowEquipmentDropdown(false);
        setShowStoryboardDropdown(false);
        setStoryboardSearch('');
      }
    }
  }, [isOpen, initialData]);

  // Handle scene selection - auto-populate form
  const handleSceneChange = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setFormData(prev => ({ ...prev, shotId: '' })); // Clear shot when scene changes
    setShowSceneDropdown(false);
    setSceneSearch('');
    
    if (sceneId) {
      const scene = scenes.find(s => s.id === sceneId);
      if (scene) {
        const locationIds = scene.locationIds || (scene.locationId ? [scene.locationId] : []);
        const locationNames = scene.locationNames || (scene.locationName ? [scene.locationName] : []);
        const location = locations.find(l => locationIds.includes(l.id));
        
        setFormData(prev => ({
          ...prev,
          sceneId,
          sceneNumber: scene.sceneNumber,
          description: scene.title || `Scene ${scene.sceneNumber}`,
          location: locationNames[0] || location?.name || scene.locationName || '',
          locationId: locationIds[0] || scene.locationId || '',
          pageCount: scene.pageCount || '',
          duration: scene.estimatedDuration?.toString() || '',
          notes: scene.continuityNotes || scene.specialRequirements || '',
        }));
        
        setSelectedCastIds(new Set(scene.castIds || []));
        setSelectedCrewIds(new Set(scene.crewIds || []));
        setSelectedEquipmentIds(new Set(scene.equipmentIds || []));
      }
    } else {
      // Clear scene-related data
      setFormData(prev => ({
        ...prev,
        sceneId: '',
        sceneNumber: '',
        pageCount: '',
        duration: '',
        notes: '',
      }));
    }
  };

  // Handle shot selection - auto-populate form
  const handleShotChange = (shotId: string) => {
    setShowShotDropdown(false);
    setShotSearch('');
    
    if (shotId) {
      const shot = shots.find(s => s.id === shotId);
      if (shot) {
        const locationIds = shot.locationIds || [];
        const locationNames = shot.locationNames || [];
        const location = locations.find(l => locationIds.includes(l.id));
        
        setFormData(prev => ({
          ...prev,
          shotId,
          description: shot.title || `Shot ${shot.shotNumber}`,
          location: locationNames[0] || location?.name || '',
          locationId: locationIds[0] || '',
          duration: shot.duration?.toString() || '',
          notes: shot.actionDescription || shot.composition || '',
        }));
        
        // Merge shot cast/crew/equipment with scene's
        const scene = scenes.find(s => s.id === selectedSceneId);
        setSelectedCastIds(new Set([...(shot.castIds || []), ...(scene?.castIds || [])]));
        setSelectedCrewIds(new Set([...(shot.crewIds || []), ...(scene?.crewIds || [])]));
        setSelectedEquipmentIds(new Set([...(shot.equipmentIds || []), ...(scene?.equipmentIds || [])]));
        
        // Sync storyboard references - add all reference images associated with this shot
        if (shot.shotReferences && shot.shotReferences.length > 0) {
          const referenceIds = shot.shotReferences.map((ref: any) => ref.id).filter(Boolean);
          setSelectedStoryboardIds(new Set(referenceIds));
        } else {
          // If shot has no references, clear storyboard selection
          setSelectedStoryboardIds(new Set());
        }
      }
    } else {
      setFormData(prev => ({ ...prev, shotId: '' }));
      // Clear storyboard selection when shot is cleared
      setSelectedStoryboardIds(new Set());
    }
  };
  
  // Add crew by department
  const addCrewDepartment = (department: string) => {
    const deptCrew = crewMembers.filter(c => c.department === department);
    const newSet = new Set(selectedCrewIds);
    deptCrew.forEach(member => newSet.add(member.id));
    setSelectedCrewIds(newSet);
    setShowCrewDropdown(false);
    setCrewSearch('');
  };
  
  // Add equipment package
  const addEquipmentPackage = (packageId: string) => {
    const pkg = equipmentPackages.find(p => p.id === packageId);
    if (pkg) {
      const newSet = new Set(selectedEquipmentIds);
      pkg.equipmentIds.forEach((id: any) => newSet.add(id));
      setSelectedEquipmentIds(newSet);
      setShowEquipmentDropdown(false);
      setEquipmentSearch('');
    }
  };
  
  // Filtered lists
  const filteredScenes = scenes.filter(s => 
    s.sceneNumber?.toLowerCase().includes(sceneSearch.toLowerCase()) ||
    s.title?.toLowerCase().includes(sceneSearch.toLowerCase())
  );
  const filteredShots = shots.filter(s => 
    s.shotNumber?.toLowerCase().includes(shotSearch.toLowerCase()) ||
    s.title?.toLowerCase().includes(shotSearch.toLowerCase())
  );
  const filteredCast = castMembers.filter(c => 
    c.characterName?.toLowerCase().includes(castSearch.toLowerCase()) ||
    c.actorName?.toLowerCase().includes(castSearch.toLowerCase())
  );
  const filteredCrew = crewMembers.filter(c => 
    c.name?.toLowerCase().includes(crewSearch.toLowerCase()) ||
    c.role?.toLowerCase().includes(crewSearch.toLowerCase()) ||
    c.department?.toLowerCase().includes(crewSearch.toLowerCase())
  );
  const filteredEquipment = equipment.filter(e => 
    e.name?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    e.category?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );
  const filteredEquipmentPackages = equipmentPackages.filter(p => 
    p.name?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );
  const filteredStoryboards = referenceImages.filter(r => 
    r.name?.toLowerCase().includes(storyboardSearch.toLowerCase()) ||
    r.category?.toLowerCase().includes(storyboardSearch.toLowerCase()) ||
    r.tags?.some(tag => tag.toLowerCase().includes(storyboardSearch.toLowerCase()))
  );
  
  // Group crew by department
  const crewByDepartment = crewMembers.reduce((acc, member) => {
    const dept = member.department || 'other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, typeof crewMembers>);
  
  // Group equipment by category
  const equipmentByCategory = equipment.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);
  
  // Close dropdowns when clicking outside
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowSceneDropdown(false);
        setShowShotDropdown(false);
        setShowCastDropdown(false);
        setShowCrewDropdown(false);
        setShowEquipmentDropdown(false);
        setShowStoryboardDropdown(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }

    // Build event data object
    const eventData: any = {
      projectId,
      shootingDayId,
      type: formData.type,
      description: formData.description.trim(),
    };

    // Add optional fields only if they have values
    if (formData.time) eventData.time = formData.time;
    if (formData.sceneNumber?.trim()) eventData.sceneNumber = formData.sceneNumber.trim();
    if (formData.pageCount?.trim()) eventData.pageCount = formData.pageCount.trim();
    if (formData.location?.trim()) eventData.location = formData.location.trim();
    if (formData.locationId) eventData.locationId = formData.locationId;
    if (formData.duration && formData.duration.trim()) {
      const durationNum = parseInt(formData.duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        eventData.duration = durationNum;
      }
    }
    if (formData.notes?.trim()) eventData.notes = formData.notes.trim();
    if (formData.sceneId) eventData.sceneId = formData.sceneId;
    if (formData.shotId) eventData.shotId = formData.shotId;
    
    // Only include arrays if they have items
    const castArray = Array.from(selectedCastIds);
    if (castArray.length > 0) eventData.castIds = castArray;
    
    const crewArray = Array.from(selectedCrewIds);
    if (crewArray.length > 0) eventData.crewIds = crewArray;
    
    const equipmentArray = Array.from(selectedEquipmentIds);
    if (equipmentArray.length > 0) eventData.equipmentIds = equipmentArray;
    
    const storyboardArray = Array.from(selectedStoryboardIds);
    if (storyboardArray.length > 0) eventData.storyboardIds = storyboardArray;

    console.log('Creating event with data:', eventData);
    onCreate(eventData);
    // Don't close here - let parent handle it after successful mutation
  };

  const toggleCast = (id: string) => {
    const newSet = new Set(selectedCastIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCastIds(newSet);
  };

  const toggleCrew = (id: string) => {
    const newSet = new Set(selectedCrewIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCrewIds(newSet);
  };

  const toggleEquipment = (id: string) => {
    const newSet = new Set(selectedEquipmentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEquipmentIds(newSet);
  };

  const handleLocationChange = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    setFormData({
      ...formData,
      locationId: locationId || '',
      location: location ? location.name : formData.location,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-background-secondary border border-border-default rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            {initialData ? 'Edit Schedule Event' : 'Create Schedule Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border-default pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Event Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleEventType })}
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    required
                  >
                    <option value="scene">Scene</option>
                    <option value="break">Break</option>
                    <option value="move">Move</option>
                    <option value="prep">Prep</option>
                    <option value="wrap">Wrap</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Scene and Shot Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Scene (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSceneDropdown(!showSceneDropdown);
                      setShowShotDropdown(false);
                    }}
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary text-left flex items-center justify-between"
                  >
                    <span>
                      {selectedSceneId 
                        ? `Scene ${scenes.find(s => s.id === selectedSceneId)?.sceneNumber}${scenes.find(s => s.id === selectedSceneId)?.title ? ` - ${scenes.find(s => s.id === selectedSceneId)?.title}` : ''}`
                        : 'None - Create manually'}
                    </span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSceneDropdown && (
                    <div 
                      className="absolute z-50 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        placeholder="Search scenes..."
                        value={sceneSearch}
                        onChange={(e) => setSceneSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                      />
                      <div className="overflow-y-auto max-h-48">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSceneChange('');
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                        >
                          None - Create manually
                        </button>
                        {isLoadingScenes ? (
                          <div className="px-4 py-2 text-sm text-text-tertiary flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Loading scenes...
                          </div>
                        ) : scenes.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-text-tertiary">No scenes available</div>
                        ) : filteredScenes.length > 0 ? (
                          filteredScenes.map((scene) => (
                            <button
                              key={scene.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSceneChange(scene.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                            >
                              Scene {scene.sceneNumber} {scene.title ? `- ${scene.title}` : ''}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedSceneId && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Select Shot (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShotDropdown(!showShotDropdown);
                        setShowSceneDropdown(false);
                      }}
                      className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary text-left flex items-center justify-between"
                    >
                      <span>
                        {formData.shotId 
                          ? `Shot ${shots.find(s => s.id === formData.shotId)?.shotNumber}${shots.find(s => s.id === formData.shotId)?.title ? ` - ${shots.find(s => s.id === formData.shotId)?.title}` : ''}`
                          : 'None - Use scene data'}
                      </span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showShotDropdown && (
                      <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                        <input
                          type="text"
                          placeholder="Search shots..."
                          value={shotSearch}
                          onChange={(e) => setShotSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                        />
                        <div className="overflow-y-auto max-h-48">
                          <button
                            type="button"
                            onClick={() => handleShotChange('')}
                            className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                          >
                            None - Use scene data
                          </button>
                          {filteredShots.length > 0 ? (
                            filteredShots.map((shot) => (
                              <button
                                key={shot.id}
                                type="button"
                                onClick={() => handleShotChange(shot.id)}
                                className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm text-text-primary transition-colors"
                              >
                                Shot {shot.shotNumber} {shot.title ? `- ${shot.title}` : ''}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Scene Number
                  </label>
                  <input
                    type="text"
                    value={formData.sceneNumber}
                    onChange={(e) => setFormData({ ...formData, sceneNumber: e.target.value })}
                    placeholder="e.g., 1, 2A, 3B"
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                    placeholder="e.g., 1/8, 3 4/8"
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 30"
                    min="0"
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Location
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="">Select location or enter manually</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </option>
                    ))}
                  </select>
                </div>

                {!formData.locationId && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Location (Manual Entry)
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location name"
                      className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                  rows={3}
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                />
              </div>
            </div>

            {/* Cast */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border-default pb-2">
                Cast
              </h3>
              {selectedCastIds.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(selectedCastIds).map((id) => {
                    const member = castMembers.find(c => c.id === id);
                    if (!member) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                      >
                        <span className="text-sm text-text-primary">
                          {member.actorName} as {member.characterName}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCast(id)}
                          className="text-text-tertiary hover:text-error transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCastDropdown(!showCastDropdown);
                    setShowCrewDropdown(false);
                    setShowEquipmentDropdown(false);
                  }}
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
                        filteredCast.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              toggleCast(member.id);
                              setCastSearch('');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm transition-colors ${
                              selectedCastIds.has(member.id) ? 'bg-background-tertiary' : ''
                            }`}
                          >
                            <div className="font-medium text-text-primary">
                              {member.actorName} as {member.characterName}
                            </div>
                            <div className="text-xs text-text-tertiary">{member.castType}</div>
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

            {/* Crew */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border-default pb-2">
                Crew Required
              </h3>
              {selectedCrewIds.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(selectedCrewIds).map((id) => {
                    const member = crewMembers.find(c => c.id === id);
                    if (!member) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                      >
                        <span className="text-sm text-text-primary">
                          {member.name} - {member.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCrew(id)}
                          className="text-text-tertiary hover:text-error transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCrewDropdown(!showCrewDropdown);
                    setShowCastDropdown(false);
                    setShowEquipmentDropdown(false);
                  }}
                  className="btn-secondary flex items-center gap-2 w-full"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Crew
                </button>
                {showCrewDropdown && (
                  <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col">
                    <input
                      type="text"
                      placeholder="Search crew or departments..."
                      value={crewSearch}
                      onChange={(e) => setCrewSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                    <div className="overflow-y-auto max-h-80">
                      {/* Department Quick Add */}
                      {Object.entries(crewByDepartment).map(([department, members]) => {
                        const deptSelected = members.length > 0 && members.every(m => selectedCrewIds.has(m.id));
                        const deptPartiallySelected = members.some(m => selectedCrewIds.has(m.id));
                        const matchesSearch = !crewSearch || department.toLowerCase().includes(crewSearch.toLowerCase()) || 
                          members.some(m => m.name.toLowerCase().includes(crewSearch.toLowerCase()) || m.role.toLowerCase().includes(crewSearch.toLowerCase()));
                        
                        if (!matchesSearch) return null;
                        
                        const visibleMembers = members.filter(m => !crewSearch || filteredCrew.includes(m));
                        
                        return (
                          <div key={department} className="border-b border-border-subtle">
                            <button
                              type="button"
                              onClick={() => {
                                if (deptSelected) {
                                  // Remove all from department
                                  const newSet = new Set(selectedCrewIds);
                                  members.forEach(m => newSet.delete(m.id));
                                  setSelectedCrewIds(newSet);
                                } else {
                                  // Add all from department
                                  addCrewDepartment(department);
                                }
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm font-semibold transition-colors flex items-center justify-between ${
                                deptSelected ? 'bg-accent-primary/10 text-accent-primary' : ''
                              }`}
                            >
                              <span className="capitalize">{department.replace(/_/g, ' ')} ({members.length})</span>
                              {deptSelected && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            {visibleMembers.length > 0 && (
                              <div className="pl-4">
                                {visibleMembers.map((member) => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      toggleCrew(member.id);
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm transition-colors ${
                                      selectedCrewIds.has(member.id) ? 'bg-background-tertiary' : ''
                                    }`}
                                  >
                                    <div className="font-medium text-text-primary">{member.name}</div>
                                    <div className="text-xs text-text-tertiary">{member.role}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {filteredCrew.length === 0 && Object.keys(crewByDepartment).length === 0 && (
                        <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border-default pb-2">
                Equipment Needed
              </h3>
              {selectedEquipmentIds.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(selectedEquipmentIds).map((id) => {
                    const item = equipment.find(e => e.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                      >
                        <span className="text-sm text-text-primary">
                          {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleEquipment(id)}
                          className="text-text-tertiary hover:text-error transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowEquipmentDropdown(!showEquipmentDropdown);
                    setShowCastDropdown(false);
                    setShowCrewDropdown(false);
                  }}
                  className="btn-secondary flex items-center gap-2 w-full"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Equipment
                </button>
                {showEquipmentDropdown && (
                  <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col">
                    <input
                      type="text"
                      placeholder="Search equipment, packages, or categories..."
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                    <div className="overflow-y-auto max-h-80">
                      {/* Equipment Packages */}
                      {filteredEquipmentPackages.length > 0 && (
                        <div className="border-b border-border-subtle">
                          <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-background-tertiary">
                            Packages
                          </div>
                          {filteredEquipmentPackages.map((pkg) => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => addEquipmentPackage(pkg.id)}
                              className="w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm transition-colors"
                            >
                              <div className="font-medium text-text-primary">{pkg.name}</div>
                              {pkg.description && (
                                <div className="text-xs text-text-tertiary">{pkg.description}</div>
                              )}
                              <div className="text-xs text-text-tertiary">
                                {pkg.equipmentIds.length} item{pkg.equipmentIds.length !== 1 ? 's' : ''}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Equipment by Category */}
                      {Object.entries(equipmentByCategory).map(([category, items]) => {
                        const catItems = items.filter(item => 
                          !equipmentSearch || filteredEquipment.includes(item)
                        );
                        if (catItems.length === 0) return null;
                        
                        const catSelected = catItems.every(i => selectedEquipmentIds.has(i.id));
                        const catPartiallySelected = catItems.some(i => selectedEquipmentIds.has(i.id));
                        
                        return (
                          <div key={category} className="border-b border-border-subtle">
                            <button
                              type="button"
                              onClick={() => {
                                const newSet = new Set(selectedEquipmentIds);
                                if (catSelected) {
                                  // Remove all from category
                                  catItems.forEach(item => newSet.delete(item.id));
                                } else {
                                  // Add all from category
                                  catItems.forEach(item => newSet.add(item.id));
                                }
                                setSelectedEquipmentIds(newSet);
                                setEquipmentSearch('');
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm font-semibold transition-colors flex items-center justify-between ${
                                catSelected ? 'bg-accent-primary/10 text-accent-primary' : ''
                              }`}
                            >
                              <span className="capitalize">{category.replace(/_/g, ' ')} ({catItems.length})</span>
                              {catSelected && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="pl-4">
                              {catItems.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    toggleEquipment(item.id);
                                    setEquipmentSearch('');
                                  }}
                                  className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm transition-colors ${
                                    selectedEquipmentIds.has(item.id) ? 'bg-background-tertiary' : ''
                                  }`}
                                >
                                  <div className="font-medium text-text-primary">
                                    {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                                  </div>
                                  {item.manufacturer && item.model && (
                                    <div className="text-xs text-text-tertiary">
                                      {item.manufacturer} {item.model}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {filteredEquipment.length === 0 && filteredEquipmentPackages.length === 0 && (
                        <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Storyboards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border-default pb-2">
                Storyboard References
              </h3>
              {selectedStoryboardIds.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(selectedStoryboardIds).map((id) => {
                    const ref = referenceImages.find(r => r.id === id);
                    if (!ref) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg border border-border-default"
                      >
                        <img 
                          src={ref.url} 
                          alt={ref.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-sm text-text-primary">{ref.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSet = new Set(selectedStoryboardIds);
                            newSet.delete(id);
                            setSelectedStoryboardIds(newSet);
                          }}
                          className="text-text-tertiary hover:text-error transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-text-secondary">
                {formData.shotId 
                  ? `References from selected shot are automatically included. You can add more below.`
                  : `Select a shot to automatically include its storyboard references, or add references manually.`}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowStoryboardDropdown(!showStoryboardDropdown);
                    setShowEquipmentDropdown(false);
                    setShowCastDropdown(false);
                    setShowCrewDropdown(false);
                  }}
                  className="btn-secondary flex items-center gap-2 w-full"
                  disabled={referenceImages.length === 0}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Storyboard Reference
                </button>
                {showStoryboardDropdown && referenceImages.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-background-primary border border-border-default rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <input
                      type="text"
                      placeholder="Search references..."
                      value={storyboardSearch}
                      onChange={(e) => setStoryboardSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                    <div className="overflow-y-auto max-h-48">
                      {filteredStoryboards.length > 0 ? (
                        filteredStoryboards.map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            onClick={() => {
                              const newSet = new Set(selectedStoryboardIds);
                              if (newSet.has(ref.id)) {
                                newSet.delete(ref.id);
                              } else {
                                newSet.add(ref.id);
                              }
                              setSelectedStoryboardIds(newSet);
                              setStoryboardSearch('');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-background-tertiary text-sm transition-colors flex items-center gap-3 ${
                              selectedStoryboardIds.has(ref.id) ? 'bg-background-tertiary' : ''
                            }`}
                          >
                            <img 
                              src={ref.url} 
                              alt={ref.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">{ref.name}</div>
                              {ref.category && (
                                <div className="text-xs text-text-tertiary capitalize">{ref.category}</div>
                              )}
                            </div>
                            {selectedStoryboardIds.has(ref.id) && (
                              <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-text-tertiary">No results found</div>
                      )}
                    </div>
                  </div>
                )}
                {referenceImages.length === 0 && (
                  <p className="text-xs text-text-tertiary mt-1">No reference images available. Add them in the Storyboards tab.</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            {initialData ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

