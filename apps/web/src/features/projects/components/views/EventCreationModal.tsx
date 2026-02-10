'use client';

import { useState, useEffect, useRef } from 'react';
// import { trpc } from '@/lib/trpc/client';
import type { ScheduleEventType } from '@/lib/schemas';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useCastByProject } from '@/features/cast/hooks/useCast';
import { useEquipmentByProject } from '@/features/equipment/hooks/useEquipment';
import { useLocationsByProject } from '@/features/locations/hooks/useLocations';
import { useScenesByProject } from '@/features/scenes/hooks/useScenes';
import { useSchedule } from '@/features/projects/hooks/useSchedule';
import { useReferenceImages } from '@/features/projects/hooks/useReferenceImages';
import { useShotsByScene } from '@/features/scenes/hooks/useShots';

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
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { data: castMembers = [] } = useCastByProject(projectId);
  const { data: equipment = [] } = useEquipmentByProject(projectId);
  const { data: locations = [] } = useLocationsByProject(projectId);
  const { data: scenes = [], isLoading: isLoadingScenes } = useScenesByProject(projectId);
  const { schedule } = useSchedule(projectId);
  const { images: referenceImages = [] } = useReferenceImages(projectId);
  
  // Get shots for selected scene
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const { data: shots = [] } = useShotsByScene(selectedSceneId);

  // Placeholder
  const equipmentPackages: any[] = [];

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
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30"
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description"
                    required
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Scene Number
                  </label>
                  <input
                    type="text"
                    value={formData.sceneNumber}
                    onChange={(e) => setFormData({ ...formData, sceneNumber: e.target.value })}
                    placeholder="1A"
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
                    placeholder="2/8"
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Location
                  </label>
                  <select
                    value={formData.locationId || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="">Select location or type below...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Or type custom location"
                    className="w-full px-4 py-2 mt-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                  />
                </div>
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
