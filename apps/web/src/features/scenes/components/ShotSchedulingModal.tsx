'use client';

import { useState, useMemo } from 'react';
import type { Shot } from '@/lib/schemas';

interface ShotSchedulingModalProps {
  shots: Shot[];
  scenes: any[];
  shootingDays: any[];
  onClose: () => void;
  onSchedule: (shotIds: string[], dayId: string, timeSlot?: string) => Promise<void>;
  onCreateDay?: (data: any) => Promise<string>; // Returns new day ID
}

export function ShotSchedulingModal({
  shots,
  scenes,
  shootingDays,
  onClose,
  onSchedule,
  onCreateDay,
}: ShotSchedulingModalProps) {
  const [selectedShots, setSelectedShots] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  
  // New shoot day form state
  const [showCreateDay, setShowCreateDay] = useState(false);
  const [isCreatingDay, setIsCreatingDay] = useState(false);
  const [newDayData, setNewDayData] = useState({
    date: new Date().toISOString().split('T')[0],
    dayNumber: shootingDays.length + 1,
    callTime: '06:00',
    shootTime: '07:00',
    wrapTime: '19:00',
    notes: '',
  });

  // Group shots by scene for better organization
  const shotsByScene = useMemo(() => {
    const grouped: Record<string, Shot[]> = {};
    shots.forEach(shot => {
      if (!grouped[shot.sceneId]) {
        grouped[shot.sceneId] = [];
      }
      grouped[shot.sceneId].push(shot);
    });
    return grouped;
  }, [shots]);

  const handleToggleShot = (shotId: string) => {
    const newSelected = new Set(selectedShots);
    if (newSelected.has(shotId)) {
      newSelected.delete(shotId);
    } else {
      newSelected.add(shotId);
    }
    setSelectedShots(newSelected);
  };

  const handleSelectScene = (sceneId: string) => {
    const sceneShots = shotsByScene[sceneId] || [];
    const allSelected = sceneShots.every(s => selectedShots.has(s.id));
    
    const newSelected = new Set(selectedShots);
    sceneShots.forEach(shot => {
      if (allSelected) {
        newSelected.delete(shot.id);
      } else {
        newSelected.add(shot.id);
      }
    });
    setSelectedShots(newSelected);
  };

  const handleCreateDay = async () => {
    if (!onCreateDay) {
      alert('Create day function not available');
      return;
    }

    if (!newDayData.date) {
      alert('Please select a date');
      return;
    }

    setIsCreatingDay(true);
    try {
      // Build data object, only including non-empty fields
      const dayData: any = {
        date: new Date(newDayData.date),
        dayNumber: newDayData.dayNumber,
        status: 'scheduled',
      };
      
      // Only add optional fields if they have values
      if (newDayData.callTime) dayData.callTime = newDayData.callTime;
      if (newDayData.shootTime) dayData.shootTime = newDayData.shootTime;
      if (newDayData.wrapTime) dayData.wrapTime = newDayData.wrapTime;
      if (newDayData.notes && newDayData.notes.trim()) dayData.notes = newDayData.notes.trim();

      const newDayId = await onCreateDay(dayData);

      // Auto-select the newly created day
      setSelectedDay(newDayId);
      setShowCreateDay(false);
      
      // Reset form for next time
      setNewDayData({
        date: new Date().toISOString().split('T')[0],
        dayNumber: shootingDays.length + 2, // +2 because we just created one
        callTime: '06:00',
        shootTime: '07:00',
        wrapTime: '19:00',
        notes: '',
      });

      alert('✅ Shoot day created! It will also appear in the Production > Schedule tab.');
    } catch (error) {
      console.error('Error creating day:', error);
      alert('Failed to create shoot day');
    } finally {
      setIsCreatingDay(false);
    }
  };

  const handleSchedule = async () => {
    if (selectedShots.size === 0 || !selectedDay) {
      alert('Please select shots and a shooting day');
      return;
    }

    setIsScheduling(true);
    try {
      await onSchedule(Array.from(selectedShots), selectedDay, timeSlot || undefined);
      const day = shootingDays.find(d => d.id === selectedDay);
      const dateStr = day?.date instanceof Date 
        ? day.date.toLocaleDateString() 
        : day?.date?.toDate?.()?.toLocaleDateString?.() || 'Selected day';
      alert(`✅ Scheduled ${selectedShots.size} shots to ${dateStr}`);
      onClose();
    } catch (error) {
      console.error('Scheduling error:', error);
      alert('Failed to schedule shots');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background-primary border border-border-default rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-text-primary">📅 Schedule Shots</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-text-secondary">
            Select individual shots from different scenes to schedule on the same day
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shot Selection */}
            <div>
              <h3 className="font-semibold text-text-primary mb-3">
                🎬 Select Shots ({selectedShots.size} selected)
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(shotsByScene).length === 0 ? (
                  <p className="text-text-tertiary text-center py-8">No shots available</p>
                ) : (
                  Object.entries(shotsByScene).map(([sceneId, sceneShots]) => {
                    const scene = scenes.find(s => s.id === sceneId);
                    if (!scene) return null;
                    
                    const allSelected = sceneShots.every(s => selectedShots.has(s.id));
                    const someSelected = sceneShots.some(s => selectedShots.has(s.id));

                    return (
                      <div key={sceneId} className="border border-border-default rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={input => {
                              if (input) input.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => handleSelectScene(sceneId)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-text-primary">
                              Scene {scene.sceneNumber}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {sceneShots.length} shots
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 pl-7">
                          {sceneShots.map(shot => (
                            <label key={shot.id} className="flex items-center gap-2 cursor-pointer hover:bg-background-secondary p-2 rounded">
                              <input
                                type="checkbox"
                                checked={selectedShots.has(shot.id)}
                                onChange={() => handleToggleShot(shot.id)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-text-primary">
                                {shot.shotNumber} - {shot.shotType || 'Shot'}
                              </span>
                              <span className="text-xs text-text-tertiary ml-auto">
                                {shot.duration}s
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Day Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">📆 Shooting Day</h3>
                {onCreateDay && (
                  <button
                    onClick={() => setShowCreateDay(!showCreateDay)}
                    className="text-sm px-3 py-1 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                  >
                    {showCreateDay ? '✕ Cancel' : '+ New Day'}
                  </button>
                )}
              </div>

              {/* Create New Day Form */}
              {showCreateDay && (
                <div className="mb-4 p-4 bg-accent-primary/10 border-2 border-accent-primary/30 rounded-lg">
                  <h4 className="font-semibold text-text-primary mb-3">🆕 Create New Shoot Day</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Date *</label>
                        <input
                          type="date"
                          value={newDayData.date}
                          onChange={(e) => setNewDayData({ ...newDayData, date: e.target.value })}
                          className="input-field w-full text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Day #</label>
                        <input
                          type="number"
                          value={newDayData.dayNumber}
                          onChange={(e) => setNewDayData({ ...newDayData, dayNumber: parseInt(e.target.value) || 1 })}
                          className="input-field w-full text-sm"
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Call Time</label>
                        <input
                          type="time"
                          value={newDayData.callTime}
                          onChange={(e) => setNewDayData({ ...newDayData, callTime: e.target.value })}
                          className="input-field w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Shoot Time</label>
                        <input
                          type="time"
                          value={newDayData.shootTime}
                          onChange={(e) => setNewDayData({ ...newDayData, shootTime: e.target.value })}
                          className="input-field w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Wrap Time</label>
                        <input
                          type="time"
                          value={newDayData.wrapTime}
                          onChange={(e) => setNewDayData({ ...newDayData, wrapTime: e.target.value })}
                          className="input-field w-full text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
                      <input
                        type="text"
                        value={newDayData.notes}
                        onChange={(e) => setNewDayData({ ...newDayData, notes: e.target.value })}
                        placeholder="Any additional notes..."
                        className="input-field w-full text-sm"
                      />
                    </div>

                    <button
                      onClick={handleCreateDay}
                      disabled={isCreatingDay || !newDayData.date}
                      className="w-full py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isCreatingDay ? '⏳ Creating...' : '✓ Create Shoot Day'}
                    </button>
                    <p className="text-xs text-text-tertiary text-center">
                      This will also add the day to Production → Schedule
                    </p>
                  </div>
                </div>
              )}

              {/* Existing Days List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {shootingDays.length === 0 && !showCreateDay ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <p className="mb-2">No shooting days yet</p>
                    {onCreateDay && (
                      <button
                        onClick={() => setShowCreateDay(true)}
                        className="text-accent-primary hover:underline"
                      >
                        Create your first shoot day
                      </button>
                    )}
                  </div>
                ) : (
                  shootingDays.map((day: any, index: number) => {
                    const dateObj = day.date instanceof Date ? day.date : day.date?.toDate?.() || new Date();
                    return (
                      <label
                        key={day.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedDay === day.id
                            ? 'border-accent-primary bg-accent-primary/10'
                            : 'border-border-default hover:border-accent-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shootingDay"
                          value={day.id}
                          checked={selectedDay === day.id}
                          onChange={(e) => setSelectedDay(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-text-primary">
                            Day {day.dayNumber || index + 1}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {dateObj.toLocaleDateString()}
                          </div>
                        </div>
                        {day.location && (
                          <div className="text-sm text-text-secondary">
                            📍 {day.location}
                          </div>
                        )}
                        {day.callTime && (
                          <div className="text-xs text-text-tertiary mt-1">
                            Call: {day.callTime}
                          </div>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {/* Optional Time Slot */}
              {selectedDay && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    ⏰ Time Slot (Optional)
                  </label>
                  <input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g., 09:00"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Specify when these shots will be filmed during the day
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {selectedShots.size > 0 && selectedDay ? (
              <>
                Will schedule <span className="font-bold text-text-primary">{selectedShots.size} shots</span> to Day {shootingDays.find(d => d.id === selectedDay)?.dayNumber || shootingDays.findIndex(d => d.id === selectedDay) + 1}
                {timeSlot && ` at ${timeSlot}`}
              </>
            ) : (
              'Select shots and a shooting day to continue'
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={selectedShots.size === 0 || !selectedDay || isScheduling}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScheduling ? '⏳ Scheduling...' : '✓ Schedule Shots'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
