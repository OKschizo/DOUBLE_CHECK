'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { ShootingDay } from '@doublecheck/schemas';

interface ShootingDayEditModalProps {
  shootingDay: ShootingDay | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ShootingDay>) => void;
}

export function ShootingDayEditModal({
  shootingDay,
  projectId,
  isOpen,
  onClose,
  onSave,
}: ShootingDayEditModalProps) {
  // Fetch locations and crew
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId });
  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });

  const [formData, setFormData] = useState({
    dayNumber: '',
    totalDays: '',
    callTime: '',
    shootCall: '',
    locationId: '',
    basecampLocationId: '',
    crewParkLocationId: '',
    techTrucksLocationId: '',
    bgHoldingLocationId: '',
    bgParkingLocationId: '',
    nearestHospital: '',
    directorCrewId: '',
    executiveProducerCrewId: '',
    productionCoordinatorCrewId: '',
    notes: '',
  });

  // Dropdown states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showBasecampDropdown, setShowBasecampDropdown] = useState(false);
  const [showCrewParkDropdown, setShowCrewParkDropdown] = useState(false);
  const [showTechTrucksDropdown, setShowTechTrucksDropdown] = useState(false);
  const [showBgHoldingDropdown, setShowBgHoldingDropdown] = useState(false);
  const [showBgParkingDropdown, setShowBgParkingDropdown] = useState(false);
  const [showDirectorDropdown, setShowDirectorDropdown] = useState(false);
  const [showExecProducerDropdown, setShowExecProducerDropdown] = useState(false);
  const [showProdCoordDropdown, setShowProdCoordDropdown] = useState(false);

  const [locationSearch, setLocationSearch] = useState('');
  const [basecampSearch, setBasecampSearch] = useState('');
  const [crewParkSearch, setCrewParkSearch] = useState('');
  const [techTrucksSearch, setTechTrucksSearch] = useState('');
  const [bgHoldingSearch, setBgHoldingSearch] = useState('');
  const [bgParkingSearch, setBgParkingSearch] = useState('');
  const [directorSearch, setDirectorSearch] = useState('');
  const [execProducerSearch, setExecProducerSearch] = useState('');
  const [prodCoordSearch, setProdCoordSearch] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shootingDay && isOpen) {
      setFormData({
        dayNumber: shootingDay.dayNumber?.toString() || '',
        totalDays: shootingDay.totalDays?.toString() || '',
        callTime: shootingDay.callTime || '',
        shootCall: shootingDay.shootCall || '',
        locationId: shootingDay.locationId || '',
        basecampLocationId: shootingDay.basecampLocationId || '',
        crewParkLocationId: shootingDay.crewParkLocationId || '',
        techTrucksLocationId: shootingDay.techTrucksLocationId || '',
        bgHoldingLocationId: shootingDay.bgHoldingLocationId || '',
        bgParkingLocationId: shootingDay.bgParkingLocationId || '',
        nearestHospital: shootingDay.nearestHospital || '',
        directorCrewId: shootingDay.directorCrewId || '',
        executiveProducerCrewId: shootingDay.executiveProducerCrewId || '',
        productionCoordinatorCrewId: shootingDay.productionCoordinatorCrewId || '',
        notes: shootingDay.notes || '',
      });
    }
  }, [shootingDay, isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
        setShowBasecampDropdown(false);
        setShowCrewParkDropdown(false);
        setShowTechTrucksDropdown(false);
        setShowBgHoldingDropdown(false);
        setShowBgParkingDropdown(false);
        setShowDirectorDropdown(false);
        setShowExecProducerDropdown(false);
        setShowProdCoordDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isOpen || !shootingDay) return null;

  // Filter locations by search
  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredBasecampLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(basecampSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(basecampSearch.toLowerCase())
  );

  const filteredCrewParkLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(crewParkSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(crewParkSearch.toLowerCase())
  );

  const filteredTechTrucksLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(techTrucksSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(techTrucksSearch.toLowerCase())
  );

  const filteredBgHoldingLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(bgHoldingSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(bgHoldingSearch.toLowerCase())
  );

  const filteredBgParkingLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(bgParkingSearch.toLowerCase()) ||
    loc.address?.toLowerCase().includes(bgParkingSearch.toLowerCase())
  );

  // Filter crew by role and search
  const directors = crewMembers.filter(c => 
    c.role === 'Director' || c.role?.includes('Director')
  );
  const filteredDirectors = directors.filter(c =>
    c.name.toLowerCase().includes(directorSearch.toLowerCase())
  );

  const execProducers = crewMembers.filter(c =>
    c.role === 'Executive Producer' || c.role?.includes('Executive Producer')
  );
  const filteredExecProducers = execProducers.filter(c =>
    c.name.toLowerCase().includes(execProducerSearch.toLowerCase())
  );

  const prodCoords = crewMembers.filter(c =>
    c.role === 'Production Coordinator' || c.role?.includes('Production Coordinator')
  );
  const filteredProdCoords = prodCoords.filter(c =>
    c.name.toLowerCase().includes(prodCoordSearch.toLowerCase())
  );

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || '';
  };

  const getCrewName = (crewId: string) => {
    return crewMembers.find(c => c.id === crewId)?.name || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: Partial<ShootingDay> = {
      dayNumber: formData.dayNumber ? parseInt(formData.dayNumber) : undefined,
      totalDays: formData.totalDays ? parseInt(formData.totalDays) : undefined,
      callTime: formData.callTime || undefined,
      shootCall: formData.shootCall || undefined,
      locationId: formData.locationId || undefined,
      basecampLocationId: formData.basecampLocationId || undefined,
      crewParkLocationId: formData.crewParkLocationId || undefined,
      techTrucksLocationId: formData.techTrucksLocationId || undefined,
      bgHoldingLocationId: formData.bgHoldingLocationId || undefined,
      bgParkingLocationId: formData.bgParkingLocationId || undefined,
      nearestHospital: formData.nearestHospital || undefined,
      directorCrewId: formData.directorCrewId || undefined,
      executiveProducerCrewId: formData.executiveProducerCrewId || undefined,
      productionCoordinatorCrewId: formData.productionCoordinatorCrewId || undefined,
      notes: formData.notes || undefined,
    };
    onSave(updateData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div ref={modalRef} className="bg-background-secondary border border-border-default rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default bg-background-primary">
          <h2 className="text-2xl font-bold text-text-primary">Edit Shooting Day</h2>
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
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Day Number
                  </label>
                  <input
                    type="number"
                    value={formData.dayNumber}
                    onChange={(e) => setFormData({ ...formData, dayNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Total Days (for &quot;Day X of Y&quot;)
                  </label>
                  <input
                    type="number"
                    value={formData.totalDays}
                    onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Call Times */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Call Times</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Crew Call (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.callTime}
                    onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Shoot Call (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.shootCall}
                    onChange={(e) => setFormData({ ...formData, shootCall: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                  />
                </div>
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                Note: Breakfast and lunch times are pulled from events with type &quot;break&quot;
              </p>
            </div>

            {/* Locations */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Location Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Primary Location */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Primary Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.locationId ? getLocationName(formData.locationId) : ''}
                      onFocus={() => setShowLocationDropdown(true)}
                      onChange={(e) => {
                        setLocationSearch(e.target.value);
                        setShowLocationDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showLocationDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, locationId: loc.id });
                              setShowLocationDropdown(false);
                              setLocationSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Basecamp */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Basecamp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.basecampLocationId ? getLocationName(formData.basecampLocationId) : ''}
                      onFocus={() => setShowBasecampDropdown(true)}
                      onChange={(e) => {
                        setBasecampSearch(e.target.value);
                        setShowBasecampDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showBasecampDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={basecampSearch}
                          onChange={(e) => setBasecampSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredBasecampLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, basecampLocationId: loc.id });
                              setShowBasecampDropdown(false);
                              setBasecampSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredBasecampLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Crew Park */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Crew Park
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.crewParkLocationId ? getLocationName(formData.crewParkLocationId) : ''}
                      onFocus={() => setShowCrewParkDropdown(true)}
                      onChange={(e) => {
                        setCrewParkSearch(e.target.value);
                        setShowCrewParkDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showCrewParkDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={crewParkSearch}
                          onChange={(e) => setCrewParkSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredCrewParkLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, crewParkLocationId: loc.id });
                              setShowCrewParkDropdown(false);
                              setCrewParkSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredCrewParkLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tech Trucks */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Tech Trucks
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.techTrucksLocationId ? getLocationName(formData.techTrucksLocationId) : ''}
                      onFocus={() => setShowTechTrucksDropdown(true)}
                      onChange={(e) => {
                        setTechTrucksSearch(e.target.value);
                        setShowTechTrucksDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showTechTrucksDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={techTrucksSearch}
                          onChange={(e) => setTechTrucksSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredTechTrucksLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, techTrucksLocationId: loc.id });
                              setShowTechTrucksDropdown(false);
                              setTechTrucksSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredTechTrucksLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* BG Holding */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    BG Holding
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.bgHoldingLocationId ? getLocationName(formData.bgHoldingLocationId) : ''}
                      onFocus={() => setShowBgHoldingDropdown(true)}
                      onChange={(e) => {
                        setBgHoldingSearch(e.target.value);
                        setShowBgHoldingDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showBgHoldingDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={bgHoldingSearch}
                          onChange={(e) => setBgHoldingSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredBgHoldingLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, bgHoldingLocationId: loc.id });
                              setShowBgHoldingDropdown(false);
                              setBgHoldingSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredBgHoldingLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* BG Parking */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    BG Parking
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.bgParkingLocationId ? getLocationName(formData.bgParkingLocationId) : ''}
                      onFocus={() => setShowBgParkingDropdown(true)}
                      onChange={(e) => {
                        setBgParkingSearch(e.target.value);
                        setShowBgParkingDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select location"
                    />
                    {showBgParkingDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={bgParkingSearch}
                          onChange={(e) => setBgParkingSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search locations..."
                          autoFocus
                        />
                        {filteredBgParkingLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, bgParkingLocationId: loc.id });
                              setShowBgParkingDropdown(false);
                              setBgParkingSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {loc.name}
                          </button>
                        ))}
                        {filteredBgParkingLocations.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nearest Hospital */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Nearest Hospital
                  </label>
                  <input
                    type="text"
                    value={formData.nearestHospital}
                    onChange={(e) => setFormData({ ...formData, nearestHospital: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                    placeholder="Nearest hospital name and address"
                  />
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Key Contacts</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Director */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Director
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.directorCrewId ? getCrewName(formData.directorCrewId) : ''}
                      onFocus={() => setShowDirectorDropdown(true)}
                      onChange={(e) => {
                        setDirectorSearch(e.target.value);
                        setShowDirectorDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select director from crew"
                    />
                    {showDirectorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={directorSearch}
                          onChange={(e) => setDirectorSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search directors..."
                          autoFocus
                        />
                        {filteredDirectors.map((crew) => (
                          <button
                            key={crew.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, directorCrewId: crew.id });
                              setShowDirectorDropdown(false);
                              setDirectorSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {crew.name} {crew.role && `- ${crew.role}`}
                          </button>
                        ))}
                        {filteredDirectors.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No directors found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Executive Producer */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Executive Producer
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.executiveProducerCrewId ? getCrewName(formData.executiveProducerCrewId) : ''}
                      onFocus={() => setShowExecProducerDropdown(true)}
                      onChange={(e) => {
                        setExecProducerSearch(e.target.value);
                        setShowExecProducerDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select executive producer from crew"
                    />
                    {showExecProducerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={execProducerSearch}
                          onChange={(e) => setExecProducerSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search executive producers..."
                          autoFocus
                        />
                        {filteredExecProducers.map((crew) => (
                          <button
                            key={crew.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, executiveProducerCrewId: crew.id });
                              setShowExecProducerDropdown(false);
                              setExecProducerSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {crew.name} {crew.role && `- ${crew.role}`}
                          </button>
                        ))}
                        {filteredExecProducers.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No executive producers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Production Coordinator */}
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Production Coordinator
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.productionCoordinatorCrewId ? getCrewName(formData.productionCoordinatorCrewId) : ''}
                      onFocus={() => setShowProdCoordDropdown(true)}
                      onChange={(e) => {
                        setProdCoordSearch(e.target.value);
                        setShowProdCoordDropdown(true);
                      }}
                      className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                      placeholder="Select production coordinator from crew"
                    />
                    {showProdCoordDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-background-primary border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          value={prodCoordSearch}
                          onChange={(e) => setProdCoordSearch(e.target.value)}
                          className="w-full px-3 py-2 border-b border-border-default bg-background-secondary text-text-primary"
                          placeholder="Search production coordinators..."
                          autoFocus
                        />
                        {filteredProdCoords.map((crew) => (
                          <button
                            key={crew.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, productionCoordinatorCrewId: crew.id });
                              setShowProdCoordDropdown(false);
                              setProdCoordSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-secondary text-text-primary"
                          >
                            {crew.name} {crew.role && `- ${crew.role}`}
                          </button>
                        ))}
                        {filteredProdCoords.length === 0 && (
                          <div className="px-3 py-2 text-text-tertiary text-sm">No production coordinators found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary min-h-[100px]"
                placeholder="Important notes for this shooting day..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-default bg-background-primary">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
