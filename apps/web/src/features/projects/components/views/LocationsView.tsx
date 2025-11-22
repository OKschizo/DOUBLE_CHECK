'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Location, LocationType, LocationStatus } from '@doublecheck/schemas';
import { uploadImage, deleteImage, isBlobUrl, isFirebaseStorageUrl, generateUniqueFilename } from '@/lib/firebase/storage';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { LocationTemplates } from '@/features/locations/components/LocationTemplates';

interface LocationsViewProps {
  projectId: string;
}

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'studio', label: 'Studio' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'other', label: 'Other' },
];

const LOCATION_STATUSES: { value: LocationStatus; label: string; color: string }[] = [
  { value: 'scouted', label: 'Scouted', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500/20 text-green-400' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  { value: 'backup', label: 'Backup', color: 'bg-gray-500/20 text-gray-400' },
];

export function LocationsView({ projectId }: LocationsViewProps) {
  const { firebaseUser } = useAuth();
  const { data: myRole } = useMyRole(projectId);
  const canEdit = myRole === 'owner' || myRole === 'admin' || myRole === 'dept_head' || myRole === 'crew';

  const utils = trpc.useUtils();
  const { data: locations = [], isLoading, error, refetch } = trpc.locations.listByProject.useQuery({ projectId });

  // Budget mutations
  const createFromLocations = trpc.budget.createFromLocations.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
      alert('Budget items created successfully!');
    },
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapView, setMapView] = useState<'list' | 'map'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Auto-select first location when switching to map view
  useEffect(() => {
    if (mapView === 'map' && locations.length > 0 && !selectedLocation) {
      // Use setTimeout to defer state update and avoid DOM node resolution issues
      const timeoutId = setTimeout(() => {
        setSelectedLocation(locations[0]);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [mapView, locations, selectedLocation]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: '',
    longitude: '',
    type: 'interior' as LocationType,
    status: 'scouted' as LocationStatus,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    photoUrl: '',
    parkingInfo: '',
    accessInfo: '',
    restrictions: '',
    permitRequired: false,
    permitInfo: '',
    rentalCost: '',
  });

  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      utils.locations.listByProject.invalidate({ projectId });
      resetForm();
      setShowAddModal(false);
    },
  });

  const updateLocation = trpc.locations.update.useMutation({
    onSuccess: () => {
      utils.locations.listByProject.invalidate({ projectId });
      resetForm();
      setEditingLocation(null);
    },
  });

  const deleteLocation = trpc.locations.delete.useMutation({
    onSuccess: () => {
      utils.locations.listByProject.invalidate({ projectId });
    },
  });

  // Bulk delete mutation
  const bulkDeleteLocations = trpc.locations.delete.useMutation({
    onSuccess: () => {
      utils.locations.listByProject.invalidate({ projectId });
      setSelectedLocations(new Set());
    },
  });

  // Handle bulk actions
  const handleBulkCreateBudget = () => {
    if (selectedLocations.size === 0) return;
    const locationIds = Array.from(selectedLocations);
    createFromLocations.mutate({ 
      projectId, 
      locationIds 
    });
    setSelectedLocations(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedLocations.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLocations.size} location(s)?`)) return;
    
    Promise.all(
      Array.from(selectedLocations).map(id => 
        bulkDeleteLocations.mutateAsync({ id })
      )
    ).then(() => {
      setSelectedLocations(new Set());
    });
  };

  const handleSelectAll = () => {
    if (selectedLocations.size === locations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(locations.map(l => l.id)));
    }
  };

  const handleToggleSelect = (locationId: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId);
    } else {
      newSelected.add(locationId);
    }
    setSelectedLocations(newSelected);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      latitude: '',
      longitude: '',
      type: 'interior',
      status: 'scouted',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      photoUrl: '',
      parkingInfo: '',
      accessInfo: '',
      restrictions: '',
      permitRequired: false,
      permitInfo: '',
      rentalCost: '',
    });
    setImagePreview(null);
    setImageFile(null);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city || '',
      state: location.state || '',
      zipCode: location.zipCode || '',
      country: location.country || '',
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      type: location.type,
      status: location.status,
      contactName: location.contactName || '',
      contactPhone: location.contactPhone || '',
      contactEmail: location.contactEmail || '',
      notes: location.notes || '',
      photoUrl: location.photoUrl || '',
      parkingInfo: location.parkingInfo || '',
      accessInfo: location.accessInfo || '',
      restrictions: location.restrictions || '',
      permitRequired: location.permitRequired || false,
      permitInfo: location.permitInfo || '',
      rentalCost: location.rentalCost?.toString() || '',
    });
    setImagePreview(location.photoUrl || null);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
    setFormData({ ...formData, photoUrl: previewUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.uid) {
      alert('Please wait for authentication to complete');
      return;
    }

    let finalPhotoUrl = formData.photoUrl;

    // Handle image upload if it's a blob URL
    if (imagePreview && isBlobUrl(imagePreview) && imageFile) {
      setUploadingImage(true);
      try {
        const filename = generateUniqueFilename(imageFile.name);
        const storagePath = `locations/${projectId}/${filename}`;
        finalPhotoUrl = await uploadImage(imageFile, storagePath);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const locationData = {
      projectId,
      name: formData.name,
      address: formData.address,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      country: formData.country || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      type: formData.type,
      status: formData.status,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
      contactEmail: formData.contactEmail || undefined,
      notes: formData.notes || undefined,
      photoUrl: finalPhotoUrl || undefined,
      parkingInfo: formData.parkingInfo || undefined,
      accessInfo: formData.accessInfo || undefined,
      restrictions: formData.restrictions || undefined,
      permitRequired: formData.permitRequired,
      permitInfo: formData.permitInfo || undefined,
      rentalCost: formData.rentalCost ? parseFloat(formData.rentalCost) : undefined,
      createdBy: firebaseUser.uid,
    };

    if (editingLocation) {
      // Delete old image if changed
      if (
        editingLocation.photoUrl &&
        isFirebaseStorageUrl(editingLocation.photoUrl) &&
        finalPhotoUrl !== editingLocation.photoUrl
      ) {
        try {
          await deleteImage(editingLocation.photoUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      await updateLocation.mutateAsync({
        id: editingLocation.id,
        ...locationData,
      });
    } else {
      await createLocation.mutateAsync(locationData);
    }
  };

  // Geocode address to get coordinates using Google Maps Geocoding API
  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      alert('Please enter an address first');
      return;
    }

    const address = [
      formData.address,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country,
    ]
      .filter(Boolean)
      .join(', ');

    try {
      // Use Google Maps Geocoding API via a Next.js API route to keep API key secure
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.latitude && data.longitude) {
        setFormData({
          ...formData,
          latitude: parseFloat(data.latitude).toFixed(6),
          longitude: parseFloat(data.longitude).toFixed(6),
        });
      } else {
        alert('Could not find coordinates for this address');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode address. Please check your Google Maps API key configuration.');
    }
  };

  const getMapUrl = (location: Location) => {
    if (location.latitude && location.longitude) {
      return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }
    const address = [location.address, location.city, location.state, location.zipCode, location.country]
      .filter(Boolean)
      .join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const getEmbedMapUrl = (location: Location) => {
    // Use Google Maps with dark mode styling via API route
    const fullAddress = [location.address, location.city, location.state, location.zipCode, location.country]
      .filter(Boolean)
      .join(', ');
    
    const params = new URLSearchParams();
    if (location.latitude && location.longitude) {
      params.set('lat', location.latitude.toString());
      params.set('lng', location.longitude.toString());
    }
    if (fullAddress) {
      params.set('address', fullAddress);
    }
    if (location.name) {
      params.set('name', location.name);
    }
    
    return `/api/maps/dark?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">Error Loading Locations</h3>
          <p className="text-text-secondary mb-4">{error.message}</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Locations</h1>
          <p className="text-text-secondary mt-1">Manage filming locations for your project</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background-secondary border border-border-default">
            <button
              onClick={() => setMapView('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mapView === 'list'
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={mapView === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              List
            </button>
            <button
              onClick={() => setMapView('map')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mapView === 'map'
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={mapView === 'map' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              Map
            </button>
          </div>
          {mapView === 'list' && (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border border-border-default rounded-lg p-1 bg-background-secondary">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-accent-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={viewMode === 'grid' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-accent-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={viewMode === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {canEdit && (
                <button
                  className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary font-medium"
                  onClick={() => setShowTemplatesModal(true)}
                >
                  📋 Apply Template
                </button>
              )}
            </>
          )}
          {canEdit && (
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
              + Add Location
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {mapView === 'list' && selectedLocations.size > 0 && (
        <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">
              {selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-accent-primary hover:underline"
            >
              {selectedLocations.size === locations.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={handleBulkCreateBudget}
                  className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                  disabled={createFromLocations.isPending}
                >
                  {createFromLocations.isPending ? 'Creating...' : '💰 Create Budget Items'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                  disabled={bulkDeleteLocations.isPending}
                >
                  {bulkDeleteLocations.isPending ? 'Deleting...' : '🗑️ Delete Selected'}
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedLocations(new Set())}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map View */}
      {mapView === 'map' && (
        <div className="bg-background-primary border border-border-default" style={{ height: '600px' }}>
          {locations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-text-secondary">No locations to display on map</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 h-full">
              <div className="border-r border-border-default overflow-y-auto">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`p-4 border-b border-border-default cursor-pointer hover:bg-accent-primary/5 transition-colors ${
                      selectedLocation?.id === location.id ? 'bg-accent-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">{location.name}</h3>
                        <p className="text-sm text-text-secondary mt-1">{location.address}</p>
                        {location.city && (
                          <p className="text-xs text-text-tertiary mt-1">
                            {[location.city, location.state, location.zipCode].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${LOCATION_STATUSES.find(s => s.value === location.status)?.color || ''}`}>
                        {LOCATION_STATUSES.find(s => s.value === location.status)?.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative bg-background-secondary">
                {selectedLocation ? (
                  <iframe
                    key={selectedLocation.id}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={getEmbedMapUrl(selectedLocation)}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    title={`Map view for ${selectedLocation.name}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-text-secondary">Select a location to view on map</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {mapView === 'list' && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => {
                const statusInfo = LOCATION_STATUSES.find(s => s.value === location.status);
                return (
                  <div
                    id={`element-${location.id}`}
                    key={location.id}
                    className={`bg-background-primary border border-border-default hover:border-accent-primary transition-colors relative ${selectedLocations.has(location.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    {canEdit && (
                      <div className="absolute top-2 right-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedLocations.has(location.id)}
                          onChange={() => handleToggleSelect(location.id)}
                          className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer bg-transparent checked:bg-accent-primary"
                          style={{
                            accentColor: 'rgb(var(--accent-primary))',
                          }}
                        />
                      </div>
                    )}
                {location.photoUrl && (
                  <div className="aspect-video bg-background-secondary overflow-hidden">
                    <img
                      src={location.photoUrl}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text-primary">{location.name}</h3>
                    {statusInfo && (
                      <span className={`px-2 py-1 text-xs rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{location.address}</p>
                  {location.city && (
                    <p className="text-xs text-text-tertiary mb-3">
                      {[location.city, location.state, location.zipCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                    <span className="capitalize">{location.type}</span>
                    {location.rentalCost && (
                      <>
                        <span>•</span>
                        <span>${location.rentalCost}/day</span>
                      </>
                    )}
                  </div>

                  {/* Budget Integration */}
                  <LocationBudgetSection 
                    projectId={projectId} 
                    locationId={location.id}
                    canEdit={canEdit}
                    onCreateBudgetItem={() => {
                      createFromLocations.mutate({ 
                        projectId, 
                        locationIds: [location.id] 
                      });
                    }}
                    onViewBudget={() => {
                      window.location.href = `/projects/${projectId}#budget`;
                    }}
                  />

                  <div className="flex items-center gap-2">
                    {location.latitude && location.longitude && (
                      <a
                        href={getMapUrl(location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-primary hover:underline"
                      >
                        View Map
                      </a>
                    )}
                    {canEdit && (
                      <>
                        <span className="text-text-tertiary">•</span>
                        <button
                          onClick={() => handleEdit(location)}
                          className="text-xs text-accent-primary hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-text-tertiary">•</span>
                        <button
                          onClick={() => {
                            if (confirm('Delete this location?')) {
                              deleteLocation.mutate({ id: location.id });
                            }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {locations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-text-secondary mb-4">No locations added yet</p>
              {canEdit && (
                <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
                  Add Your First Location
                </button>
              )}
            </div>
          )}
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => {
                const statusInfo = LOCATION_STATUSES.find(s => s.value === location.status);
                return (
                  <div 
                    id={`element-${location.id}`}
                    key={location.id} 
                    className={`bg-background-primary border border-border-default rounded-lg p-4 hover:border-accent-primary transition-all flex items-center gap-4 ${selectedLocations.has(location.id) ? 'ring-2 ring-accent-primary border-accent-primary bg-accent-primary/5' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    {canEdit && (
                      <input
                        type="checkbox"
                        checked={selectedLocations.has(location.id)}
                        onChange={() => handleToggleSelect(location.id)}
                        className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary flex-shrink-0 cursor-pointer bg-transparent checked:bg-accent-primary"
                        style={{
                          accentColor: 'rgb(var(--accent-primary))',
                        }}
                      />
                    )}
                    
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {location.photoUrl ? (
                        <img
                          src={location.photoUrl}
                          alt={location.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-background-secondary rounded-lg flex items-center justify-center text-2xl">
                          📍
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">{location.name}</h3>
                          <p className="text-sm text-text-secondary truncate">{location.address}</p>
                          {location.city && (
                            <p className="text-xs text-text-tertiary">
                              {[location.city, location.state, location.zipCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        {statusInfo && (
                          <span className={`px-2 py-1 text-xs rounded ml-2 ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="capitalize">{location.type}</span>
                        {location.rentalCost && <span>${location.rentalCost}/day</span>}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {location.latitude && location.longitude && (
                        <a
                          href={getMapUrl(location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-primary hover:underline"
                        >
                          View Map
                        </a>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-xs text-accent-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this location?')) {
                                deleteLocation.mutate({ id: location.id });
                              }
                            }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {locations.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-text-secondary mb-4">No locations added yet</p>
                  {canEdit && (
                    <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
                      Add Your First Location
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-primary border border-border-default max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-default flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setEditingLocation(null);
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationType })}
                    className="input-field"
                    required
                  >
                    {LOCATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationStatus })}
                    className="input-field"
                    required
                  >
                    {LOCATION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rental Cost (per day)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentalCost}
                    onChange={(e) => setFormData({ ...formData, rentalCost: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 40.7128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input-field"
                      placeholder="e.g., -74.0060"
                    />
                    <button
                      type="button"
                      onClick={handleGeocodeAddress}
                      className="px-4 py-2 bg-background-tertiary text-text-primary hover:bg-accent-primary/5 border border-border-default text-sm"
                      title="Get coordinates from address"
                    >
                      📍
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-32 h-32 bg-background-secondary">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setFormData({ ...formData, photoUrl: '' });
                        }}
                        className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        style={{ color: 'rgb(var(--colored-button-text))' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="px-4 py-2 bg-background-tertiary border border-border-default hover:bg-accent-primary/5 text-sm">
                      {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Parking Info</label>
                <textarea
                  value={formData.parkingInfo}
                  onChange={(e) => setFormData({ ...formData, parkingInfo: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Access Info</label>
                <textarea
                  value={formData.accessInfo}
                  onChange={(e) => setFormData({ ...formData, accessInfo: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Restrictions</label>
                <textarea
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="permitRequired"
                  checked={formData.permitRequired}
                  onChange={(e) => setFormData({ ...formData, permitRequired: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="permitRequired" className="text-sm">
                  Permit Required
                </label>
              </div>

              {formData.permitRequired && (
                <div>
                  <label className="block text-sm font-medium mb-2">Permit Info</label>
                  <textarea
                    value={formData.permitInfo}
                    onChange={(e) => setFormData({ ...formData, permitInfo: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setEditingLocation(null);
                  }}
                  className="px-4 py-2 bg-background-tertiary text-text-primary hover:bg-accent-primary/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLocation.isPending || updateLocation.isPending || uploadingImage}
                  className="btn-primary"
                >
                  {uploadingImage
                    ? 'Uploading...'
                    : editingLocation
                    ? 'Update Location'
                    : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <LocationTemplates
          projectId={projectId}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
    </div>
  );
}

// Component to show budget items linked to a location
function LocationBudgetSection({ 
  projectId, 
  locationId, 
  canEdit,
  onCreateBudgetItem,
  onViewBudget 
}: { 
  projectId: string; 
  locationId: string;
  canEdit: boolean;
  onCreateBudgetItem: () => void;
  onViewBudget: () => void;
}) {
  const { data: budgetItems = [], isLoading } = trpc.budget.getItemsByLocation.useQuery({
    projectId,
    locationId,
  });

  if (isLoading) {
    return <div className="text-xs text-text-tertiary mb-2">Loading budget...</div>;
  }

  if (budgetItems.length === 0) {
    return (
      <div className="pt-2 pb-2 border-t border-border-default mb-2">
        {canEdit && (
          <button
            onClick={onCreateBudgetItem}
            className="w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
          >
            💰 Create Budget Item
          </button>
        )}
      </div>
    );
  }

  const totalAmount = budgetItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);

  return (
    <div className="pt-2 pb-2 border-t border-border-default mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-primary">
          💰 {budgetItems.length} Budget Item{budgetItems.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onViewBudget}
          className="text-xs text-accent-primary hover:text-accent-hover"
        >
          View →
        </button>
      </div>
      <div className="text-xs text-text-secondary">
        Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {canEdit && (
        <button
          onClick={onCreateBudgetItem}
          className="mt-1 w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
        >
          + Add Another
        </button>
      )}
    </div>
  );
}

