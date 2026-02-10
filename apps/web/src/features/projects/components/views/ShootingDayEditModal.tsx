'use client';

import { useState, useEffect, useRef } from 'react';
// import { trpc } from '@/lib/trpc/client';
import type { ShootingDay } from '@/lib/schemas';
import { useLocationsByProject } from '@/features/locations/hooks/useLocations';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';

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
  const { data: locations = [] } = useLocationsByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);

  const [formData, setFormData] = useState({
    date: '',
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
      // Format date to YYYY-MM-DD for the date input
      let dateStr = '';
      if (shootingDay.date) {
        const d = shootingDay.date instanceof Date ? shootingDay.date : new Date(shootingDay.date);
        dateStr = d.toISOString().split('T')[0];
      }
      
      setFormData({
        date: dateStr,
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
      date: formData.date ? new Date(formData.date + 'T12:00:00') : undefined,
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
          {/* Form fields... reusing the logic */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                    required
                  />
                </div>
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

            {/* Times */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Schedule Times</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Crew Call Time
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
                    Shoot Call Time
                  </label>
                  <input
                    type="time"
                    value={formData.shootCall}
                    onChange={(e) => setFormData({ ...formData, shootCall: e.target.value })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary h-24 resize-y"
                placeholder="Day notes, special instructions, etc."
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
