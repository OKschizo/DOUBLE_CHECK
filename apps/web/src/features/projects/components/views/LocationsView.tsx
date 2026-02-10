'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocationsByProject, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/features/locations/hooks/useLocations';
import { useProject } from '@/features/projects/hooks/useProjects';
import { LocationTemplates } from '@/features/locations/components/LocationTemplates';
import type { Location, LocationType, LocationStatus, NearbyFacility, ParkingOption } from '@/lib/schemas/location';

interface LocationsViewProps {
  projectId: string;
}

// API helper functions
async function geocodeAddress(address: string) {
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!response.ok) throw new Error('Geocoding failed');
    return await response.json();
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function findNearbyPlaces(lat: number, lng: number, type: string) {
  try {
    const response = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&type=${type}&radius=8000`);
    if (!response.ok) throw new Error('Places search failed');
    return await response.json();
  } catch (error) {
    console.error('Places error:', error);
    return { places: [] };
  }
}

async function getDirections(origin: string, destination: string) {
  try {
    const response = await fetch(`/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
    if (!response.ok) throw new Error('Directions failed');
    return await response.json();
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
}

// Location type options with icons
const LOCATION_TYPES: { value: LocationType; label: string; icon: string }[] = [
  { value: 'interior', label: 'Interior', icon: '🏠' },
  { value: 'exterior', label: 'Exterior', icon: '🌳' },
  { value: 'studio', label: 'Studio', icon: '🎬' },
  { value: 'outdoor', label: 'Outdoor', icon: '☀️' },
  { value: 'indoor', label: 'Indoor', icon: '🏢' },
  { value: 'basecamp', label: 'Basecamp', icon: '⛺' },
  { value: 'holding', label: 'Holding', icon: '👥' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'catering', label: 'Catering', icon: '🍽️' },
  { value: 'other', label: 'Other', icon: '📍' },
];

// Location status options with colors
const LOCATION_STATUSES: { value: LocationStatus; label: string; color: string }[] = [
  { value: 'scouted', label: 'Scouted', color: 'bg-blue-500' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
  { value: 'backup', label: 'Backup', color: 'bg-purple-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'wrapped', label: 'Wrapped', color: 'bg-gray-500' },
];

// Google Maps embed component
function GoogleMapEmbed({ 
  address, 
  latitude, 
  longitude,
  className = ''
}: { 
  address?: string; 
  latitude?: number; 
  longitude?: number;
  className?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className={`bg-background-tertiary rounded-lg flex items-center justify-center text-text-tertiary text-sm ${className}`}>
        <span>Map unavailable (API key not configured)</span>
      </div>
    );
  }

  // Use coordinates if available, otherwise use address
  const query = latitude && longitude 
    ? `${latitude},${longitude}`
    : encodeURIComponent(address || '');

  if (!query) {
    return (
      <div className={`bg-background-tertiary rounded-lg flex items-center justify-center text-text-tertiary text-sm ${className}`}>
        <span>No address provided</span>
      </div>
    );
  }

  return (
    <iframe
      className={`rounded-lg border border-border-default ${className}`}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`}
    />
  );
}

// Nearby facility badge
function FacilityBadge({ facility }: { facility: NearbyFacility }) {
  const icons: Record<string, string> = {
    hospital: '🏥',
    police: '👮',
    fire: '🚒',
    pharmacy: '💊',
    urgent_care: '🩺',
    other: '📍',
  };
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background-tertiary rounded-lg text-sm">
      <span>{icons[facility.type] || '📍'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate">{facility.name}</div>
        {facility.distance && (
          <div className="text-xs text-text-secondary">{facility.distance} {facility.driveTime && `• ${facility.driveTime}`}</div>
        )}
      </div>
      {facility.phone && (
        <a href={`tel:${facility.phone}`} className="text-accent-primary hover:underline text-xs">
          📞 {facility.phone}
        </a>
      )}
    </div>
  );
}

// Location card component
function LocationCard({ 
  location, 
  onEdit, 
  onDelete,
  expanded,
  onToggleExpand
}: { 
  location: Location; 
  onEdit: () => void; 
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const typeInfo = LOCATION_TYPES.find(t => t.value === location.type) || LOCATION_TYPES[LOCATION_TYPES.length - 1];
  const statusInfo = LOCATION_STATUSES.find(s => s.value === location.status) || LOCATION_STATUSES[1];

  return (
    <div className="card overflow-hidden">
      {/* Header with image and map */}
      <div className="flex flex-col lg:flex-row">
        {/* Cover Image (if available) */}
        {(location as any).imageUrl && (
          <div className="lg:w-60 flex-shrink-0 relative">
            <img 
              src={(location as any).imageUrl} 
              alt={location.name}
              className="w-full h-48 lg:h-full lg:min-h-[200px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        
        {/* Map */}
        <div className={`${(location as any).imageUrl ? 'lg:w-60' : 'lg:w-80'} flex-shrink-0`}>
          <GoogleMapEmbed 
            address={location.address}
            latitude={location.latitude}
            longitude={location.longitude}
            className="w-full h-48 lg:h-full lg:min-h-[200px]"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{typeInfo.icon}</span>
                <h3 className="text-lg font-bold text-text-primary">{location.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-text-secondary">{location.address}</p>
              {location.city && (
                <p className="text-xs text-text-tertiary">
                  {location.city}{location.state && `, ${location.state}`} {location.zipCode}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onToggleExpand}
                className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-lg hover:bg-background-secondary transition-colors"
              >
                {expanded ? '▼ Less' : '▶ More'}
              </button>
              <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-accent-primary">✏️</button>
              <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-error">🗑️</button>
            </div>
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-3">
            {location.rentalCost && (
              <span className="flex items-center gap-1">
                💰 ${location.rentalCost.toLocaleString()}{location.rentalCostPeriod && `/${location.rentalCostPeriod}`}
              </span>
            )}
            {location.permitRequired && (
              <span className="flex items-center gap-1 text-yellow-600">
                📋 Permit Required
              </span>
            )}
            {location.contactName && (
              <span className="flex items-center gap-1">
                👤 {location.contactName}
              </span>
            )}
            {location.contactPhone && (
              <a href={`tel:${location.contactPhone}`} className="flex items-center gap-1 text-accent-primary hover:underline">
                📞 {location.contactPhone}
              </a>
            )}
          </div>

          {/* Hospital info (always shown if available) */}
          {location.nearestHospital && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm mb-3">
              <span className="font-medium text-red-600">🏥 Nearest Hospital:</span>{' '}
              <span className="text-text-primary">{location.nearestHospital}</span>
              {location.nearestHospitalDistance && (
                <span className="text-text-secondary"> • {location.nearestHospitalDistance}</span>
              )}
              {location.nearestHospitalPhone && (
                <a href={`tel:${location.nearestHospitalPhone}`} className="ml-2 text-accent-primary hover:underline">
                  {location.nearestHospitalPhone}
                </a>
              )}
            </div>
          )}

          {/* Notes preview */}
          {location.notes && !expanded && (
            <p className="text-sm text-text-secondary line-clamp-2">{location.notes}</p>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border-default p-4 space-y-6">
          {/* Description & Notes */}
          {(location.description || location.notes) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">📝 Description & Notes</h4>
              {location.description && <p className="text-sm text-text-secondary mb-2">{location.description}</p>}
              {location.notes && <p className="text-sm text-text-secondary">{location.notes}</p>}
            </div>
          )}

          {/* Parking Information */}
          {(location.parkingInfo || location.crewParkingAddress || location.truckParkingAddress || location.basecampAddress) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">🅿️ Parking & Basecamp</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {location.crewParkingAddress && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <span className="font-medium text-text-primary">Crew Parking:</span>
                    <p className="text-text-secondary">{location.crewParkingAddress}</p>
                    {location.crewParkingCapacity && <p className="text-xs text-text-tertiary">Capacity: {location.crewParkingCapacity}</p>}
                  </div>
                )}
                {location.truckParkingAddress && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <span className="font-medium text-text-primary">🚚 Truck Parking:</span>
                    <p className="text-text-secondary">{location.truckParkingAddress}</p>
                  </div>
                )}
                {location.basecampAddress && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <span className="font-medium text-text-primary">⛺ Basecamp:</span>
                    <p className="text-text-secondary">{location.basecampAddress}</p>
                  </div>
                )}
                {location.bgHoldingAddress && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <span className="font-medium text-text-primary">👥 BG Holding:</span>
                    <p className="text-text-secondary">{location.bgHoldingAddress}</p>
                  </div>
                )}
              </div>
              {location.parkingInfo && <p className="text-sm text-text-secondary mt-2">{location.parkingInfo}</p>}
            </div>
          )}

          {/* Nearby Facilities */}
          {(location.nearbyFacilities && location.nearbyFacilities.length > 0) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">🏥 Nearby Facilities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {location.nearbyFacilities.map((facility, idx) => (
                  <FacilityBadge key={idx} facility={facility} />
                ))}
              </div>
            </div>
          )}

          {/* Access & Logistics */}
          {(location.accessInfo || location.loadInInfo || location.powerInfo || location.restrictions) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">🚪 Access & Logistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {location.accessInfo && (
                  <div><span className="font-medium">Access:</span> {location.accessInfo}</div>
                )}
                {location.loadInInfo && (
                  <div><span className="font-medium">Load In/Out:</span> {location.loadInInfo}</div>
                )}
                {location.powerInfo && (
                  <div><span className="font-medium">⚡ Power:</span> {location.powerInfo}</div>
                )}
                {location.bathroomInfo && (
                  <div><span className="font-medium">🚻 Bathrooms:</span> {location.bathroomInfo}</div>
                )}
                {location.wifiInfo && (
                  <div><span className="font-medium">📶 WiFi:</span> {location.wifiInfo}</div>
                )}
                {location.cellService && (
                  <div><span className="font-medium">📱 Cell Service:</span> {location.cellService}</div>
                )}
                {location.restrictions && (
                  <div className="col-span-2 text-yellow-600">
                    <span className="font-medium">⚠️ Restrictions:</span> {location.restrictions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permits & Insurance */}
          {(location.permitRequired || location.insuranceRequired || location.permitInfo) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">📋 Permits & Insurance</h4>
              <div className="text-sm space-y-2">
                {location.permitRequired && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded text-xs font-medium">Permit Required</span>
                    {location.permitNumber && <span className="text-text-secondary">#{location.permitNumber}</span>}
                  </div>
                )}
                {location.permitInfo && <p className="text-text-secondary">{location.permitInfo}</p>}
                {location.insuranceRequired && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded text-xs font-medium">Insurance Required</span>
                  </div>
                )}
                {location.insuranceInfo && <p className="text-text-secondary">{location.insuranceInfo}</p>}
              </div>
            </div>
          )}

          {/* Environment */}
          {(location.weatherConsiderations || location.sunDirection || location.noiseLevel) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">🌤️ Environment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {location.sunDirection && (
                  <div><span className="font-medium">☀️ Sun:</span> {location.sunDirection}</div>
                )}
                {location.noiseLevel && (
                  <div><span className="font-medium">🔊 Noise:</span> {location.noiseLevel}</div>
                )}
                {location.weatherConsiderations && (
                  <div className="col-span-2"><span className="font-medium">Weather:</span> {location.weatherConsiderations}</div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(location.contactName || location.ownerName) && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">👤 Contacts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {location.contactName && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <div className="font-medium text-text-primary">{location.contactName}</div>
                    <div className="text-xs text-text-tertiary">Location Contact</div>
                    {location.contactPhone && <a href={`tel:${location.contactPhone}`} className="text-accent-primary">📞 {location.contactPhone}</a>}
                    {location.contactEmail && <a href={`mailto:${location.contactEmail}`} className="block text-accent-primary">✉️ {location.contactEmail}</a>}
                  </div>
                )}
                {location.ownerName && (
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <div className="font-medium text-text-primary">{location.ownerName}</div>
                    <div className="text-xs text-text-tertiary">Owner</div>
                    {location.ownerPhone && <a href={`tel:${location.ownerPhone}`} className="text-accent-primary">📞 {location.ownerPhone}</a>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LocationsView({ projectId }: LocationsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Location | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'details' | 'parking' | 'safety' | 'permits'>('details');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [filterStatus, setFilterStatus] = useState<LocationStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<LocationType | 'all'>('all');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFindingFacilities, setIsFindingFacilities] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'other' as LocationType,
    status: 'pending' as LocationStatus,
    description: '',
    notes: '',
    // Contact
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    ownerName: '',
    ownerPhone: '',
    // Parking
    parkingInfo: '',
    crewParkingAddress: '',
    crewParkingCapacity: '',
    truckParkingAddress: '',
    basecampAddress: '',
    bgHoldingAddress: '',
    bgParkingAddress: '',
    // Safety
    nearestHospital: '',
    nearestHospitalAddress: '',
    nearestHospitalPhone: '',
    nearestHospitalDistance: '',
    nearestPoliceStation: '',
    nearestFireStation: '',
    // Logistics
    accessInfo: '',
    loadInInfo: '',
    restrictions: '',
    powerInfo: '',
    bathroomInfo: '',
    wifiInfo: '',
    cellService: '',
    // Permits
    permitRequired: false,
    permitInfo: '',
    permitNumber: '',
    insuranceRequired: false,
    insuranceInfo: '',
    // Financial
    rentalCost: '',
    rentalCostPeriod: 'day' as 'day' | 'week' | 'flat',
    depositAmount: '',
    paymentTerms: '',
    // Environment
    weatherConsiderations: '',
    sunDirection: '',
    noiseLevel: '',
  });

  const { data: locations = [], isLoading } = useLocationsByProject(projectId);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  // Filter locations
  const filteredLocations = locations.filter((loc: Location) => {
    if (filterStatus !== 'all' && loc.status !== filterStatus) return false;
    if (filterType !== 'all' && loc.type !== filterType) return false;
    return true;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'other',
      status: 'pending',
      description: '',
      notes: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      ownerName: '',
      ownerPhone: '',
      parkingInfo: '',
      crewParkingAddress: '',
      crewParkingCapacity: '',
      truckParkingAddress: '',
      basecampAddress: '',
      bgHoldingAddress: '',
      bgParkingAddress: '',
      nearestHospital: '',
      nearestHospitalAddress: '',
      nearestHospitalPhone: '',
      nearestHospitalDistance: '',
      nearestPoliceStation: '',
      nearestFireStation: '',
      accessInfo: '',
      loadInInfo: '',
      restrictions: '',
      powerInfo: '',
      bathroomInfo: '',
      wifiInfo: '',
      cellService: '',
      permitRequired: false,
      permitInfo: '',
      permitNumber: '',
      insuranceRequired: false,
      insuranceInfo: '',
      rentalCost: '',
      rentalCostPeriod: 'day',
      depositAmount: '',
      paymentTerms: '',
      weatherConsiderations: '',
      sunDirection: '',
      noiseLevel: '',
    });
    setActiveTab('details');
    setGeocodedCoords(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        projectId,
        name: formData.name,
        address: formData.address,
        type: formData.type,
        status: formData.status,
      };
      
      // Only include non-empty fields
      if (formData.city) submitData.city = formData.city;
      if (formData.state) submitData.state = formData.state;
      if (formData.zipCode) submitData.zipCode = formData.zipCode;
      if (formData.description) submitData.description = formData.description;
      if (formData.notes) submitData.notes = formData.notes;
      if (formData.contactName) submitData.contactName = formData.contactName;
      if (formData.contactPhone) submitData.contactPhone = formData.contactPhone;
      if (formData.contactEmail) submitData.contactEmail = formData.contactEmail;
      if (formData.ownerName) submitData.ownerName = formData.ownerName;
      if (formData.ownerPhone) submitData.ownerPhone = formData.ownerPhone;
      if (formData.parkingInfo) submitData.parkingInfo = formData.parkingInfo;
      if (formData.crewParkingAddress) submitData.crewParkingAddress = formData.crewParkingAddress;
      if (formData.crewParkingCapacity) submitData.crewParkingCapacity = parseInt(formData.crewParkingCapacity);
      if (formData.truckParkingAddress) submitData.truckParkingAddress = formData.truckParkingAddress;
      if (formData.basecampAddress) submitData.basecampAddress = formData.basecampAddress;
      if (formData.bgHoldingAddress) submitData.bgHoldingAddress = formData.bgHoldingAddress;
      if (formData.bgParkingAddress) submitData.bgParkingAddress = formData.bgParkingAddress;
      if (formData.nearestHospital) submitData.nearestHospital = formData.nearestHospital;
      if (formData.nearestHospitalAddress) submitData.nearestHospitalAddress = formData.nearestHospitalAddress;
      if (formData.nearestHospitalPhone) submitData.nearestHospitalPhone = formData.nearestHospitalPhone;
      if (formData.nearestHospitalDistance) submitData.nearestHospitalDistance = formData.nearestHospitalDistance;
      if (formData.nearestPoliceStation) submitData.nearestPoliceStation = formData.nearestPoliceStation;
      if (formData.nearestFireStation) submitData.nearestFireStation = formData.nearestFireStation;
      if (formData.accessInfo) submitData.accessInfo = formData.accessInfo;
      if (formData.loadInInfo) submitData.loadInInfo = formData.loadInInfo;
      if (formData.restrictions) submitData.restrictions = formData.restrictions;
      if (formData.powerInfo) submitData.powerInfo = formData.powerInfo;
      if (formData.bathroomInfo) submitData.bathroomInfo = formData.bathroomInfo;
      if (formData.wifiInfo) submitData.wifiInfo = formData.wifiInfo;
      if (formData.cellService) submitData.cellService = formData.cellService;
      submitData.permitRequired = formData.permitRequired;
      if (formData.permitInfo) submitData.permitInfo = formData.permitInfo;
      if (formData.permitNumber) submitData.permitNumber = formData.permitNumber;
      submitData.insuranceRequired = formData.insuranceRequired;
      if (formData.insuranceInfo) submitData.insuranceInfo = formData.insuranceInfo;
      if (formData.rentalCost) submitData.rentalCost = parseFloat(formData.rentalCost);
      if (formData.rentalCost) submitData.rentalCostPeriod = formData.rentalCostPeriod;
      if (formData.depositAmount) submitData.depositAmount = parseFloat(formData.depositAmount);
      if (formData.paymentTerms) submitData.paymentTerms = formData.paymentTerms;
      if (formData.weatherConsiderations) submitData.weatherConsiderations = formData.weatherConsiderations;
      if (formData.sunDirection) submitData.sunDirection = formData.sunDirection;
      if (formData.noiseLevel) submitData.noiseLevel = formData.noiseLevel;

      await createLocation.mutateAsync(submitData);
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to add location");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const submitData: any = {
        name: formData.name,
        address: formData.address,
        type: formData.type,
        status: formData.status,
      };
      
      // Include all fields (can be empty to clear them)
      submitData.city = formData.city || undefined;
      submitData.state = formData.state || undefined;
      submitData.zipCode = formData.zipCode || undefined;
      submitData.description = formData.description || undefined;
      submitData.notes = formData.notes || undefined;
      submitData.contactName = formData.contactName || undefined;
      submitData.contactPhone = formData.contactPhone || undefined;
      submitData.contactEmail = formData.contactEmail || undefined;
      submitData.ownerName = formData.ownerName || undefined;
      submitData.ownerPhone = formData.ownerPhone || undefined;
      submitData.parkingInfo = formData.parkingInfo || undefined;
      submitData.crewParkingAddress = formData.crewParkingAddress || undefined;
      submitData.crewParkingCapacity = formData.crewParkingCapacity ? parseInt(formData.crewParkingCapacity) : undefined;
      submitData.truckParkingAddress = formData.truckParkingAddress || undefined;
      submitData.basecampAddress = formData.basecampAddress || undefined;
      submitData.bgHoldingAddress = formData.bgHoldingAddress || undefined;
      submitData.bgParkingAddress = formData.bgParkingAddress || undefined;
      submitData.nearestHospital = formData.nearestHospital || undefined;
      submitData.nearestHospitalAddress = formData.nearestHospitalAddress || undefined;
      submitData.nearestHospitalPhone = formData.nearestHospitalPhone || undefined;
      submitData.nearestHospitalDistance = formData.nearestHospitalDistance || undefined;
      submitData.nearestPoliceStation = formData.nearestPoliceStation || undefined;
      submitData.nearestFireStation = formData.nearestFireStation || undefined;
      submitData.accessInfo = formData.accessInfo || undefined;
      submitData.loadInInfo = formData.loadInInfo || undefined;
      submitData.restrictions = formData.restrictions || undefined;
      submitData.powerInfo = formData.powerInfo || undefined;
      submitData.bathroomInfo = formData.bathroomInfo || undefined;
      submitData.wifiInfo = formData.wifiInfo || undefined;
      submitData.cellService = formData.cellService || undefined;
      submitData.permitRequired = formData.permitRequired;
      submitData.permitInfo = formData.permitInfo || undefined;
      submitData.permitNumber = formData.permitNumber || undefined;
      submitData.insuranceRequired = formData.insuranceRequired;
      submitData.insuranceInfo = formData.insuranceInfo || undefined;
      submitData.rentalCost = formData.rentalCost ? parseFloat(formData.rentalCost) : undefined;
      submitData.rentalCostPeriod = formData.rentalCost ? formData.rentalCostPeriod : undefined;
      submitData.depositAmount = formData.depositAmount ? parseFloat(formData.depositAmount) : undefined;
      submitData.paymentTerms = formData.paymentTerms || undefined;
      submitData.weatherConsiderations = formData.weatherConsiderations || undefined;
      submitData.sunDirection = formData.sunDirection || undefined;
      submitData.noiseLevel = formData.noiseLevel || undefined;

      // Clean up undefined values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined) delete submitData[key];
      });

      await updateLocation.mutateAsync({
        id: editingItem.id,
        data: submitData,
      });
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to update location");
    }
  };

  const handleEdit = (item: Location) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      zipCode: item.zipCode || '',
      type: item.type || 'other',
      status: item.status || 'pending',
      description: item.description || '',
      notes: item.notes || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      contactEmail: item.contactEmail || '',
      ownerName: item.ownerName || '',
      ownerPhone: item.ownerPhone || '',
      parkingInfo: item.parkingInfo || '',
      crewParkingAddress: item.crewParkingAddress || '',
      crewParkingCapacity: item.crewParkingCapacity?.toString() || '',
      truckParkingAddress: item.truckParkingAddress || '',
      basecampAddress: item.basecampAddress || '',
      bgHoldingAddress: item.bgHoldingAddress || '',
      bgParkingAddress: item.bgParkingAddress || '',
      nearestHospital: item.nearestHospital || '',
      nearestHospitalAddress: item.nearestHospitalAddress || '',
      nearestHospitalPhone: item.nearestHospitalPhone || '',
      nearestHospitalDistance: item.nearestHospitalDistance || '',
      nearestPoliceStation: item.nearestPoliceStation || '',
      nearestFireStation: item.nearestFireStation || '',
      accessInfo: item.accessInfo || '',
      loadInInfo: item.loadInInfo || '',
      restrictions: item.restrictions || '',
      powerInfo: item.powerInfo || '',
      bathroomInfo: item.bathroomInfo || '',
      wifiInfo: item.wifiInfo || '',
      cellService: item.cellService || '',
      permitRequired: item.permitRequired || false,
      permitInfo: item.permitInfo || '',
      permitNumber: item.permitNumber || '',
      insuranceRequired: item.insuranceRequired || false,
      insuranceInfo: item.insuranceInfo || '',
      rentalCost: item.rentalCost?.toString() || '',
      rentalCostPeriod: item.rentalCostPeriod || 'day',
      depositAmount: item.depositAmount?.toString() || '',
      paymentTerms: item.paymentTerms || '',
      weatherConsiderations: item.weatherConsiderations || '',
      sunDirection: item.sunDirection || '',
      noiseLevel: item.noiseLevel || '',
    });
    setActiveTab('details');
    setShowEditModal(true);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLocations(newExpanded);
  };

  // Geocode address to get coordinates and auto-fill city/state/zip
  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      alert('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode]
        .filter(Boolean)
        .join(', ');
      
      const result = await geocodeAddress(fullAddress);
      
      if (result && result.latitude && result.longitude) {
        setGeocodedCoords({ lat: result.latitude, lng: result.longitude });
        setFormData(prev => ({
          ...prev,
          city: result.city || prev.city,
          state: result.state || prev.state,
          zipCode: result.zipCode || prev.zipCode,
        }));
        alert(`✅ Address verified!\nCoordinates: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
      } else {
        alert('Could not geocode this address. Please check the address and try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode address');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Find nearby facilities (hospitals, police, fire stations)
  const handleFindNearbyFacilities = async () => {
    // First, geocode if we don't have coordinates
    let coords = geocodedCoords;
    
    if (!coords) {
      if (!formData.address) {
        alert('Please enter an address first');
        return;
      }

      setIsFindingFacilities(true);
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode]
        .filter(Boolean)
        .join(', ');
      
      const geoResult = await geocodeAddress(fullAddress);
      if (!geoResult || !geoResult.latitude || !geoResult.longitude) {
        alert('Could not geocode address. Please verify the address.');
        setIsFindingFacilities(false);
        return;
      }
      coords = { lat: geoResult.latitude, lng: geoResult.longitude };
      setGeocodedCoords(coords);
    } else {
      setIsFindingFacilities(true);
    }

    try {
      // Find nearest hospital
      const hospitalResult = await findNearbyPlaces(coords.lat, coords.lng, 'hospital');
      if (hospitalResult.places && hospitalResult.places.length > 0) {
        const hospital = hospitalResult.places[0];
        
        // Get directions to hospital
        const directions = await getDirections(
          `${coords.lat},${coords.lng}`,
          hospital.address || `${hospital.latitude},${hospital.longitude}`
        );

        setFormData(prev => ({
          ...prev,
          nearestHospital: hospital.name,
          nearestHospitalAddress: hospital.address || '',
          nearestHospitalDistance: directions ? `${directions.distance} (${directions.duration})` : '',
        }));
      }

      // Find nearest police station
      const policeResult = await findNearbyPlaces(coords.lat, coords.lng, 'police');
      if (policeResult.places && policeResult.places.length > 0) {
        const police = policeResult.places[0];
        const directions = await getDirections(
          `${coords.lat},${coords.lng}`,
          police.address || `${police.latitude},${police.longitude}`
        );
        setFormData(prev => ({
          ...prev,
          nearestPoliceStation: `${police.name}${directions ? ` - ${directions.distance} (${directions.duration})` : ''}`,
        }));
      }

      // Find nearest fire station
      const fireResult = await findNearbyPlaces(coords.lat, coords.lng, 'fire_station');
      if (fireResult.places && fireResult.places.length > 0) {
        const fire = fireResult.places[0];
        const directions = await getDirections(
          `${coords.lat},${coords.lng}`,
          fire.address || `${fire.latitude},${fire.longitude}`
        );
        setFormData(prev => ({
          ...prev,
          nearestFireStation: `${fire.name}${directions ? ` - ${directions.distance} (${directions.duration})` : ''}`,
        }));
      }

      alert('✅ Nearby facilities found! Check the Safety tab.');
    } catch (error) {
      console.error('Error finding facilities:', error);
      alert('Failed to find some nearby facilities');
    } finally {
      setIsFindingFacilities(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-text-secondary">Loading locations...</div>;

  // Form modal content (shared between add and edit)
  const FormModal = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-xl font-bold text-text-primary">
            {isEdit ? 'Edit Location' : 'Add New Location'}
          </h2>
          <button
            onClick={() => { isEdit ? setShowEditModal(false) : setShowAddModal(false); resetForm(); }}
            className="text-text-tertiary hover:text-text-primary text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-default px-4">
          {[
            { id: 'details', label: '📍 Details' },
            { id: 'parking', label: '🅿️ Parking' },
            { id: 'safety', label: '🏥 Safety' },
            { id: 'permits', label: '📋 Permits & Cost' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <form onSubmit={isEdit ? handleUpdateSubmit : handleAddSubmit} className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                  <input
                    className="input-field w-full"
                    placeholder="Location name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                    <select
                      className="input-field w-full"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as LocationType })}
                    >
                      {LOCATION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <select
                      className="input-field w-full"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as LocationStatus })}
                    >
                      {LOCATION_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Address *</label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding || !formData.address}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    title="Verify address and get coordinates"
                  >
                    {isGeocoding ? '...' : '📍 Verify'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFindNearbyFacilities}
                    disabled={isFindingFacilities || !formData.address}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    title="Auto-find nearest hospital, police, and fire station"
                  >
                    {isFindingFacilities ? '...' : '🏥 Find Nearby'}
                  </button>
                </div>
                {geocodedCoords && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Verified: {geocodedCoords.lat.toFixed(6)}, {geocodedCoords.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
                  <input
                    className="input-field w-full"
                    placeholder="City"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">State</label>
                  <input
                    className="input-field w-full"
                    placeholder="State"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">ZIP</label>
                  <input
                    className="input-field w-full"
                    placeholder="ZIP code"
                    value={formData.zipCode}
                    onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  className="input-field w-full"
                  placeholder="Describe this location..."
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Contact Name</label>
                  <input
                    className="input-field w-full"
                    placeholder="Location contact"
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Contact Phone</label>
                  <input
                    className="input-field w-full"
                    placeholder="(555) 555-5555"
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Contact Email</label>
                  <input
                    className="input-field w-full"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Owner Name</label>
                  <input
                    className="input-field w-full"
                    placeholder="Property owner"
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-text-primary pt-4">🚪 Access & Logistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Access Info</label>
                  <input
                    className="input-field w-full"
                    placeholder="Gate codes, keys, etc."
                    value={formData.accessInfo}
                    onChange={e => setFormData({ ...formData, accessInfo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Load In/Out</label>
                  <input
                    className="input-field w-full"
                    placeholder="Loading dock info"
                    value={formData.loadInInfo}
                    onChange={e => setFormData({ ...formData, loadInInfo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">⚡ Power</label>
                  <input
                    className="input-field w-full"
                    placeholder="Available power"
                    value={formData.powerInfo}
                    onChange={e => setFormData({ ...formData, powerInfo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">📶 WiFi</label>
                  <input
                    className="input-field w-full"
                    placeholder="Network/password"
                    value={formData.wifiInfo}
                    onChange={e => setFormData({ ...formData, wifiInfo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">📱 Cell Service</label>
                  <input
                    className="input-field w-full"
                    placeholder="Coverage quality"
                    value={formData.cellService}
                    onChange={e => setFormData({ ...formData, cellService: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">⚠️ Restrictions</label>
                <textarea
                  className="input-field w-full"
                  placeholder="Noise limits, time restrictions, no-go areas..."
                  rows={2}
                  value={formData.restrictions}
                  onChange={e => setFormData({ ...formData, restrictions: e.target.value })}
                />
              </div>

              <h3 className="text-lg font-semibold text-text-primary pt-4">🌤️ Environment</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">☀️ Sun Direction</label>
                  <input
                    className="input-field w-full"
                    placeholder="East-facing, morning sun"
                    value={formData.sunDirection}
                    onChange={e => setFormData({ ...formData, sunDirection: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">🔊 Noise Level</label>
                  <input
                    className="input-field w-full"
                    placeholder="Traffic, planes, etc."
                    value={formData.noiseLevel}
                    onChange={e => setFormData({ ...formData, noiseLevel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Weather Notes</label>
                  <input
                    className="input-field w-full"
                    placeholder="Wind, shade, etc."
                    value={formData.weatherConsiderations}
                    onChange={e => setFormData({ ...formData, weatherConsiderations: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">📝 Notes</label>
                <textarea
                  className="input-field w-full"
                  placeholder="Additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'parking' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">🅿️ General Parking Info</label>
                <textarea
                  className="input-field w-full"
                  placeholder="Overall parking situation..."
                  rows={2}
                  value={formData.parkingInfo}
                  onChange={e => setFormData({ ...formData, parkingInfo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">👥 Crew Parking Address</label>
                  <input
                    className="input-field w-full"
                    placeholder="Crew parking location"
                    value={formData.crewParkingAddress}
                    onChange={e => setFormData({ ...formData, crewParkingAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Capacity</label>
                  <input
                    className="input-field w-full"
                    type="number"
                    placeholder="Number of spots"
                    value={formData.crewParkingCapacity}
                    onChange={e => setFormData({ ...formData, crewParkingCapacity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">🚚 Truck/Equipment Parking</label>
                <input
                  className="input-field w-full"
                  placeholder="Production truck staging area"
                  value={formData.truckParkingAddress}
                  onChange={e => setFormData({ ...formData, truckParkingAddress: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">⛺ Basecamp Location</label>
                <input
                  className="input-field w-full"
                  placeholder="Hair/makeup, catering, etc."
                  value={formData.basecampAddress}
                  onChange={e => setFormData({ ...formData, basecampAddress: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">👥 Background Holding</label>
                  <input
                    className="input-field w-full"
                    placeholder="BG holding area"
                    value={formData.bgHoldingAddress}
                    onChange={e => setFormData({ ...formData, bgHoldingAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">🅿️ BG Parking</label>
                  <input
                    className="input-field w-full"
                    placeholder="Background parking"
                    value={formData.bgParkingAddress}
                    onChange={e => setFormData({ ...formData, bgParkingAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h3 className="text-lg font-semibold text-red-600 mb-4">🏥 Nearest Hospital</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Hospital Name</label>
                    <input
                      className="input-field w-full"
                      placeholder="Hospital name"
                      value={formData.nearestHospital}
                      onChange={e => setFormData({ ...formData, nearestHospital: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Distance</label>
                    <input
                      className="input-field w-full"
                      placeholder="e.g., 2.5 miles / 8 min"
                      value={formData.nearestHospitalDistance}
                      onChange={e => setFormData({ ...formData, nearestHospitalDistance: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                    <input
                      className="input-field w-full"
                      placeholder="Hospital address"
                      value={formData.nearestHospitalAddress}
                      onChange={e => setFormData({ ...formData, nearestHospitalAddress: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Emergency Phone</label>
                    <input
                      className="input-field w-full"
                      placeholder="(555) 555-5555"
                      value={formData.nearestHospitalPhone}
                      onChange={e => setFormData({ ...formData, nearestHospitalPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">👮 Nearest Police Station</label>
                  <input
                    className="input-field w-full"
                    placeholder="Police station info"
                    value={formData.nearestPoliceStation}
                    onChange={e => setFormData({ ...formData, nearestPoliceStation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">🚒 Nearest Fire Station</label>
                  <input
                    className="input-field w-full"
                    placeholder="Fire station info"
                    value={formData.nearestFireStation}
                    onChange={e => setFormData({ ...formData, nearestFireStation: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">🚻 Bathroom Facilities</label>
                <input
                  className="input-field w-full"
                  placeholder="On-site facilities, honeywagon needed, etc."
                  value={formData.bathroomInfo}
                  onChange={e => setFormData({ ...formData, bathroomInfo: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'permits' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permitRequired}
                    onChange={e => setFormData({ ...formData, permitRequired: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-medium text-text-primary">📋 Permit Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.insuranceRequired}
                    onChange={e => setFormData({ ...formData, insuranceRequired: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-medium text-text-primary">🛡️ Insurance Required</span>
                </label>
              </div>

              {formData.permitRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Permit Number</label>
                    <input
                      className="input-field w-full"
                      placeholder="Permit #"
                      value={formData.permitNumber}
                      onChange={e => setFormData({ ...formData, permitNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Permit Details</label>
                    <input
                      className="input-field w-full"
                      placeholder="Permit info, issuing authority"
                      value={formData.permitInfo}
                      onChange={e => setFormData({ ...formData, permitInfo: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.insuranceRequired && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Insurance Details</label>
                  <input
                    className="input-field w-full"
                    placeholder="Insurance requirements"
                    value={formData.insuranceInfo}
                    onChange={e => setFormData({ ...formData, insuranceInfo: e.target.value })}
                  />
                </div>
              )}

              <h3 className="text-lg font-semibold text-text-primary pt-4">💰 Financial</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Rental Cost</label>
                  <input
                    className="input-field w-full"
                    type="number"
                    placeholder="0.00"
                    value={formData.rentalCost}
                    onChange={e => setFormData({ ...formData, rentalCost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Period</label>
                  <select
                    className="input-field w-full"
                    value={formData.rentalCostPeriod}
                    onChange={e => setFormData({ ...formData, rentalCostPeriod: e.target.value as any })}
                  >
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                    <option value="flat">Flat Rate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Deposit</label>
                  <input
                    className="input-field w-full"
                    type="number"
                    placeholder="0.00"
                    value={formData.depositAmount}
                    onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Payment Terms</label>
                <input
                  className="input-field w-full"
                  placeholder="Net 30, 50% deposit, etc."
                  value={formData.paymentTerms}
                  onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border-default">
          <button
            type="button"
            onClick={() => { isEdit ? setShowEditModal(false) : setShowAddModal(false); resetForm(); }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={isEdit ? handleUpdateSubmit : handleAddSubmit}
            className="btn-primary"
          >
            {isEdit ? 'Update Location' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">📍 Locations</h1>
          <p className="text-text-secondary">
            {filteredLocations.length} of {locations.length} locations
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
            + Add Location
          </button>
          <button onClick={() => setShowTemplatesModal(true)} className="btn-secondary">
            📋 Templates
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as LocationStatus | 'all')}
          className="input-field"
        >
          <option value="all">All Statuses</option>
          {LOCATION_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as LocationType | 'all')}
          className="input-field"
        >
          <option value="all">All Types</option>
          {LOCATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
      </div>

      {/* Location cards */}
      <div className="space-y-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg mb-2">No locations yet</p>
            <p className="text-sm">Add your first location to get started</p>
          </div>
        ) : (
          filteredLocations.map((loc: Location) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={() => handleEdit(loc)}
              onDelete={() => {
                if (confirm('Delete this location?')) {
                  deleteLocation.mutateAsync({ id: loc.id });
                }
              }}
              expanded={expandedLocations.has(loc.id)}
              onToggleExpand={() => toggleExpand(loc.id)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && <FormModal isEdit={false} />}
      {showEditModal && <FormModal isEdit={true} />}
      {showTemplatesModal && (
        <LocationTemplates projectId={projectId} onClose={() => setShowTemplatesModal(false)} />
      )}
    </div>
  );
}
