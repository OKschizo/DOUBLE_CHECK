'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSchedule } from '../../hooks/useSchedule';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { EventCreationModal } from './EventCreationModal';
import { ScheduleSyncModal } from './ScheduleSyncModal';
import { CallSheetModal } from './CallSheetModal';
import { ShootingDayEditModal } from './ShootingDayEditModal';
import { ScheduledShotsPanel } from './ScheduledShotsPanel';
import { ShootingDayTemplates, type ShootingDayTemplate } from './ShootingDayTemplates';
import { EventPresetsModal, getTemplateEvents, type EventPreset } from './EventPresets';
import type { ScheduleEvent, ScheduleEventType } from '@/lib/schemas';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useCastByProject } from '@/features/cast/hooks/useCast';
import { useProjectShots } from '@/features/scenes/hooks/useShots';
import { useScenesByProject } from '@/features/scenes/hooks/useScenes';
// import { useEquipmentByProject } from '@/features/equipment/hooks/useEquipment'; // Placeholder if missing
// import { useLocationsByProject } from '@/features/locations/hooks/useLocations'; // Placeholder if missing

interface ScheduleViewProps {
  projectId: string;
}

export function ScheduleView({ projectId }: ScheduleViewProps) {
  const {
    schedule,
    isLoading,
    error,
    createDay,
    updateDay,
    deleteDay,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useSchedule(projectId);

  const { data: myRole } = useMyRole(projectId);
  const canEdit = myRole === 'owner' || myRole === 'admin';

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [pendingTemplateDate, setPendingTemplateDate] = useState<Date | null>(null);
  const [showEventPresetsModal, setShowEventPresetsModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  // Fetch shots and scenes for stats
  const { data: allShots = [] } = useProjectShots(projectId);
  const { scenes = [] } = useScenesByProject(projectId);

  // Get stats for a shooting day
  const getDayStats = (dayId: string) => {
    const scheduledShots = allShots.filter(shot => shot.shootingDayIds?.includes(dayId));
    const sceneIds = [...new Set(scheduledShots.map(s => s.sceneId))];
    const scheduledScenes = scenes.filter(s => sceneIds.includes(s.id));
    const totalPages = scheduledScenes.reduce((sum, s) => sum + (Number(s.pageCount) || 0), 0);
    
    return {
      shotCount: scheduledShots.length,
      sceneCount: sceneIds.length,
      pageCount: totalPages,
    };
  };

  // Select first day by default when loaded
  useEffect(() => {
    if (schedule?.days.length && !selectedDayId) {
      // Use setTimeout to defer state update and avoid DOM node resolution issues
      const timeoutId = setTimeout(() => {
        setSelectedDayId(schedule.days[0].id);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [schedule, selectedDayId]);

  const handleCreateDay = async (date: Date, template?: ShootingDayTemplate) => {
    // Create date at midnight in local timezone to avoid timezone conversion issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    
    const dayData: any = {
      projectId,
      date: localDate,
      dayNumber: (schedule?.days.length || 0) + 1,
    };

    // Apply template values if provided
    if (template) {
      dayData.callTime = template.callTime;
      dayData.shootCall = template.shootCall;
      dayData.notes = template.notes;
    }
    
    const newDayId = await createDay.mutateAsync(dayData);
    
    // Select the newly created day if we got an ID back
    if (newDayId && typeof newDayId === 'string') {
      setSelectedDayId(newDayId);
    }
  };

  // Handle template selection for a pending date
  const handleApplyTemplate = async (template: ShootingDayTemplate) => {
    if (pendingTemplateDate) {
      const newDayId = await handleCreateDay(pendingTemplateDate, template);
      
      // Auto-insert events from template
      if (newDayId && typeof newDayId === 'string') {
        const templateEvents = getTemplateEvents(template.id);
        for (const { preset, time } of templateEvents) {
          await createEvent.mutateAsync({
            projectId,
            shootingDayId: newDayId,
            type: preset.type,
            description: preset.name,
            time,
            duration: preset.duration,
            notes: preset.description,
          });
        }
      }
      
      setPendingTemplateDate(null);
    }
  };

  // Handle adding event from preset
  const handleAddEventFromPreset = async (preset: EventPreset, time: string) => {
    if (!selectedDayId) return;
    
    await createEvent.mutateAsync({
      projectId,
      shootingDayId: selectedDayId,
      type: preset.type,
      description: preset.name,
      time,
      duration: preset.duration,
      notes: preset.description,
    });
    
    setShowEventPresetsModal(false);
  };

  // Create blank shooting day (use selected calendar date)
  const handleCreateBlankDay = async () => {
    await handleCreateDay(selectedCalendarDate);
  };

  // Show template modal for new day
  const handleNewDayWithTemplate = (date: Date) => {
    setPendingTemplateDate(date);
    setShowTemplatesModal(true);
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
          <h3 className="text-xl font-semibold mb-2 text-text-primary">Error Loading Schedule</h3>
          <p className="text-text-secondary mb-4">{error.message}</p>
        </div>
      </div>
    );
  }

  const selectedDay = schedule?.days.find(d => d.id === selectedDayId);
  const dayEvents = schedule?.events.filter(e => e.shootingDayId === selectedDayId) || [];

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getShootingDayForDate = (date: Date) => {
    if (!schedule?.days) return null;
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    
    return schedule.days.find(day => {
      const dayDate = day.date instanceof Date ? day.date : new Date(day.date);
      return dayDate.getFullYear() === targetYear &&
             dayDate.getMonth() === targetMonth &&
             dayDate.getDate() === targetDay;
    });
  };

  const handleCalendarDateClick = async (date: Date) => {
    // Always update selected calendar date
    setSelectedCalendarDate(date);
    
    const shootingDay = getShootingDayForDate(date);
    if (shootingDay) {
      setSelectedDayId(shootingDay.id);
    }
    // Don't auto-create - user can use "Add Blank Day" button
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  
  const isToday = (date: Date) => {
    return date.getFullYear() === todayYear &&
           date.getMonth() === todayMonth &&
           date.getDate() === todayDay;
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPendingTemplateDate(selectedCalendarDate);
              setShowTemplatesModal(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            New Day from Template
          </button>
          <button
            onClick={handleCreateBlankDay}
            className="btn-secondary flex items-center gap-2"
            title={`Add shooting day on ${selectedCalendarDate.toLocaleDateString()}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Day ({selectedCalendarDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
          </button>
        </div>
        <button
          onClick={() => setShowSyncModal(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync to Schedule
        </button>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <div className="bg-background-primary border border-border-default p-5 max-w-[103%]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-3 py-1 hover:bg-accent-primary/5 transition-colors text-sm"
            >
              ←
            </button>
            <span className="text-sm font-medium min-w-[180px] text-center">{monthName}</span>
            <button
              onClick={() => navigateMonth('next')}
              className="px-3 py-1 hover:bg-accent-primary/5 transition-colors text-sm"
            >
              →
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-1 text-xs hover:bg-accent-primary/5 transition-colors text-text-secondary"
            >
              Today
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-text-secondary py-2">
              {day}
            </div>
          ))}
          
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const shootingDay = getShootingDayForDate(date);
            const isTodayDate = isToday(date);
            const isPast = date < today && !isTodayDate;
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const isSelectedCalendarDate = selectedCalendarDate && 
              date.getFullYear() === selectedCalendarDate.getFullYear() &&
              date.getMonth() === selectedCalendarDate.getMonth() &&
              date.getDate() === selectedCalendarDate.getDate();
            
            return (
              <button
                key={dateKey}
                onClick={() => handleCalendarDateClick(date)}
                disabled={isPast && !shootingDay && !canEdit}
                className={`
                  aspect-square text-xs transition-all relative
                  ${shootingDay 
                    ? 'bg-accent-primary/20 text-accent-primary border-2 border-accent-primary font-semibold hover:bg-accent-primary/30' 
                    : isSelectedCalendarDate && !shootingDay
                    ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500 font-semibold'
                    : isPast && !canEdit
                    ? 'text-text-tertiary cursor-not-allowed'
                    : canEdit && !isPast
                    ? 'hover:bg-accent-primary/5 text-text-secondary hover:text-text-primary border-2 border-dashed border-border-default hover:border-accent-primary'
                    : 'text-text-secondary border-2 border-transparent'
                  }
                  ${isTodayDate && !shootingDay ? 'ring-2 ring-gray-600' : ''}
                  ${selectedDay && shootingDay?.id === selectedDayId ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-background-secondary' : ''}
                `}
                title={shootingDay ? `Day ${schedule?.days.indexOf(shootingDay) + 1}` : isSelectedCalendarDate ? 'Selected date - click "Add Day" to create' : canEdit && !isPast ? 'Click to select date' : ''}
              >
                <div className="flex flex-col items-center justify-center h-full p-1">
                  <span className="font-medium">{date.getDate()}</span>
                  {shootingDay ? (
                    <span className="text-[8px] mt-0.5 font-semibold">Day {schedule?.days.indexOf(shootingDay) + 1}</span>
                  ) : canEdit && !isPast ? (
                    <span className="text-[8px] mt-0.5 text-accent-primary font-medium">Add Day</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Shooting Days List */}
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Shooting Days</h2>

        <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-800 scrollbar-thin">
          {schedule?.days.map((day, index) => {
            const stats = getDayStats(day.id);
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  selectedDayId === day.id
                    ? 'bg-background-primary text-accent-primary border-t border-x border-border-default relative top-[1px]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Day {index + 1}</span>
                  <span className="text-xs opacity-70">
                    {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {stats.shotCount > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs opacity-60">
                    <span>🎬 {stats.shotCount}</span>
                    <span>📄 {stats.pageCount.toFixed(1)}pg</span>
                  </div>
                )}
              </button>
            );
          })}
          {schedule?.days.length === 0 && (
            <div className="text-sm text-text-secondary py-2 italic">No shooting days scheduled. Click a date on the calendar above to add one.</div>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedDay ? (
        <div className="bg-background-primary border border-border-default min-h-[400px]">
          <div className="p-4 border-b border-border-default flex justify-between items-center bg-background-primary">
            <div>
              <h3 className="font-bold text-lg">
                Day {(schedule?.days.indexOf(selectedDay) ?? 0) + 1} - {selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {/* Derive times from events or fall back to day settings */}
              {(() => {
                const sortedEvents = [...dayEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                const crewCallEvent = sortedEvents.find(e => e.type === 'prep' && e.description?.toLowerCase().includes('crew call'));
                const firstSceneEvent = sortedEvents.find(e => e.type === 'scene');
                const wrapEvent = sortedEvents.find(e => e.type === 'wrap');
                const callTime = crewCallEvent?.time || selectedDay.callTime;
                const shootTime = firstSceneEvent?.time || selectedDay.shootCall;
                const wrapTime = wrapEvent?.time;
                
                return (callTime || shootTime) && (
                  <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                    {callTime && <span>📞 Call: {callTime}</span>}
                    {shootTime && <span>🎬 Shoot: {shootTime}</span>}
                    {wrapTime && <span>🏁 Wrap: {wrapTime}</span>}
                  </div>
                );
              })()}
              {selectedDay.notes && <p className="text-sm text-text-tertiary mt-1 italic">{selectedDay.notes}</p>}
              {/* Day Stats */}
              {(() => {
                const stats = getDayStats(selectedDay.id);
                return stats.shotCount > 0 ? (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                      {stats.shotCount} shots
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {stats.sceneCount} scenes
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                      {stats.pageCount.toFixed(1)} pages
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCallSheet(true)}
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium flex items-center gap-2"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Call Sheet
              </button>
              <button
                onClick={() => setShowEditDayModal(true)}
                className="px-3 py-2 bg-background-tertiary text-text-primary hover:bg-background-secondary rounded-lg text-sm transition-colors"
              >
                Edit Day
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this day and all its events?')) {
                    deleteDay.mutate({ id: selectedDay.id });
                    setSelectedDayId(null);
                  }
                }}
                className="px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
              >
                Delete Day
              </button>
            </div>
          </div>

          {/* Scheduled Shots Panel */}
          <div className="p-4 border-b border-border-default">
            <ScheduledShotsPanel
              projectId={projectId}
              shootingDayId={selectedDay.id}
              canEdit={canEdit}
            />
          </div>

          <div className="p-4">
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Schedule Events
            </h4>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-secondary border-b border-gray-800">
                  <th className="pb-2 font-medium w-20">Time</th>
                  <th className="pb-2 font-medium w-20">Scene</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium w-32">Location</th>
                  <th className="pb-2 font-medium w-24 text-center">Pages</th>
                  <th className="pb-2 font-medium w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {dayEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    canEdit={canEdit}
                    projectId={projectId}
                    onUpdate={(data) => updateEvent.mutate({ id: event.id, data })}
                    onDelete={() => deleteEvent.mutate({ id: event.id })}
                  />
                ))}
                <tr>
                    <td colSpan={6} className="py-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setShowEventModal(true)}
                          className="text-sm text-text-secondary hover:text-accent-primary flex items-center gap-1"
                        >
                          <span>+ Add Custom Event</span>
                        </button>
                        <button
                          onClick={() => setShowEventPresetsModal(true)}
                          className="text-sm text-accent-primary hover:text-accent-hover flex items-center gap-1"
                        >
                          <span>📋 Add from Presets</span>
                        </button>
                      </div>
                    </td>
                  </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !isLoading && schedule?.days.length === 0 && (
          <div className="text-center py-12 bg-background-primary border border-border-default">
            <p className="text-text-secondary mb-4">No schedule yet. Click a date on the calendar above to add your first shooting day.</p>
          </div>
        )
      )}

      {/* Event Creation Modal */}
      {selectedDay && (
        <EventCreationModal
          projectId={projectId}
          shootingDayId={selectedDay.id}
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onCreate={(data) => {
            createEvent.mutate(data, {
              onSuccess: () => {
                setShowEventModal(false);
              },
              onError: (error: any) => {
                console.error('Error creating event:', error);
                alert(`Failed to create event: ${error.message}`);
              },
            });
          }}
        />
      )}

      {/* Sync Modal */}
      <ScheduleSyncModal
        projectId={projectId}
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />

      {/* Call Sheet Modal */}
      {selectedDay && (
        <CallSheetModal
          projectId={projectId}
          shootingDayId={selectedDay.id}
          isOpen={showCallSheet}
          onClose={() => setShowCallSheet(false)}
        />
      )}

      {/* Edit Shooting Day Modal */}
      {selectedDay && (
        <ShootingDayEditModal
          shootingDay={selectedDay}
          projectId={projectId}
          isOpen={showEditDayModal}
          onClose={() => setShowEditDayModal(false)}
          onSave={(data) => {
            updateDay.mutate(
              { id: selectedDay.id, data },
              {
                onSuccess: () => {
                  setShowEditDayModal(false);
                },
                onError: (error: any) => {
                  console.error('Error updating shooting day:', error);
                  alert(`Failed to update shooting day: ${error.message}`);
                },
              }
            );
          }}
        />
      )}

      {/* Shooting Day Templates Modal */}
      <ShootingDayTemplates
        projectId={projectId}
        isOpen={showTemplatesModal}
        onClose={() => {
          setShowTemplatesModal(false);
          setPendingTemplateDate(null);
        }}
        onApply={handleApplyTemplate}
      />

      {/* Event Presets Modal */}
      <EventPresetsModal
        isOpen={showEventPresetsModal}
        onClose={() => setShowEventPresetsModal(false)}
        onSelect={handleAddEventFromPreset}
      />
    </div>
  );
}

function EventRow({
  event,
  canEdit,
  onUpdate,
  onDelete,
  projectId,
}: {
  event: ScheduleEvent;
  canEdit: boolean;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  projectId: string;
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState(event.time || '');
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editedDuration, setEditedDuration] = useState(event.duration?.toString() || '');
  
  // Fetch data for display - Use new hooks instead of TRPC
  // NOTE: In a real app we might want to optimize this to not fetch all lists for every row
  // or pass down a map from the parent. For now, we rely on hook caching.
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { data: castMembers = [] } = useCastByProject(projectId);
  // const { data: equipment = [] } = useEquipmentByProject(projectId);
  // const { data: locations = [] } = useLocationsByProject(projectId);
  const equipment: any[] = []; // Placeholder
  const locations: any[] = []; // Placeholder

  const typeColors: Record<string, string> = {
    scene: '',
    break: 'bg-yellow-500/10 text-yellow-500',
    move: 'bg-blue-500/10 text-blue-500',
    prep: 'bg-purple-500/10 text-purple-500',
    wrap: 'bg-red-500/10 text-red-500',
    other: 'bg-gray-500/10 text-gray-500',
  };

  const rowClass = typeColors[event.type] || '';

  // Get linked items for display
  const linkedCast = castMembers.filter(c => event.castIds?.includes(c.id));
  const linkedCrew = crewMembers.filter(c => event.crewIds?.includes(c.id));
  const linkedEquipment = equipment.filter(e => event.equipmentIds?.includes(e.id));
  const linkedLocation = locations.find(l => l.id === event.locationId);

  // Handle inline time edit
  const handleTimeSubmit = () => {
    if (editedTime !== event.time) {
      onUpdate({ time: editedTime });
    }
    setIsEditingTime(false);
  };

  // Handle inline duration edit
  const handleDurationSubmit = () => {
    const durationNum = parseInt(editedDuration);
    if (!isNaN(durationNum) && durationNum !== event.duration) {
      onUpdate({ duration: durationNum });
    }
    setIsEditingDuration(false);
  };

  // Calculate end time based on duration
  const getEndTime = () => {
    if (!event.time || !event.duration) return null;
    const [hours, minutes] = event.time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + event.duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <tr className={`hover:bg-white/5 transition-colors group ${rowClass}`}>
        <td className="py-3">
          {isEditingTime ? (
            <input
              type="time"
              value={editedTime}
              onChange={(e) => setEditedTime(e.target.value)}
              onBlur={handleTimeSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTimeSubmit();
                if (e.key === 'Escape') {
                  setEditedTime(event.time || '');
                  setIsEditingTime(false);
                }
              }}
              autoFocus
              className="w-20 px-1 py-0.5 bg-background-secondary border border-accent-primary rounded text-sm text-text-primary"
            />
          ) : (
            <button
              onClick={() => canEdit && setIsEditingTime(true)}
              className={`font-mono text-sm ${canEdit ? 'hover:text-accent-primary cursor-pointer' : ''}`}
              title={canEdit ? 'Click to edit time' : undefined}
            >
              {event.time || '--:--'}
              {event.duration && (
                <span className="text-text-tertiary text-xs ml-1">
                  ({event.duration}m → {getEndTime()})
                </span>
              )}
            </button>
          )}
        </td>
        <td className="py-3 font-mono">{event.sceneNumber}</td>
        <td className="py-3">
          <div>
            <div className="flex items-center gap-2">
              {event.type !== 'scene' && (
                <span className="uppercase text-xs font-bold tracking-wider opacity-70">[{event.type}]</span>
              )}
              <span 
                className={`font-medium ${canEdit ? 'hover:text-accent-primary cursor-pointer' : ''}`}
                onClick={() => canEdit && setShowEditModal(true)}
                title={canEdit ? 'Click to edit event' : undefined}
              >
                {event.description}
              </span>
              {event.duration && (
                <span 
                  className={`text-xs px-1.5 py-0.5 bg-background-tertiary rounded text-text-secondary ${canEdit ? 'hover:bg-accent-primary/20 cursor-pointer' : ''}`}
                  onClick={() => canEdit && setIsEditingDuration(true)}
                  title={canEdit ? 'Click to edit duration' : `Duration: ${event.duration} minutes`}
                >
                  {isEditingDuration ? (
                    <input
                      type="number"
                      value={editedDuration}
                      onChange={(e) => setEditedDuration(e.target.value)}
                      onBlur={handleDurationSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDurationSubmit();
                        if (e.key === 'Escape') {
                          setEditedDuration(event.duration?.toString() || '');
                          setIsEditingDuration(false);
                        }
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 px-1 bg-background-secondary border border-accent-primary rounded text-xs text-text-primary"
                      min="1"
                    />
                  ) : (
                    `${event.duration}min`
                  )}
                </span>
              )}
            </div>
            {(linkedCast.length > 0 || linkedCrew.length > 0 || linkedEquipment.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {linkedCast.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded" title={`Cast: ${linkedCast.map(c => c.actorName).join(', ')}`}>
                    🎭 {linkedCast.length}
                  </span>
                )}
                {linkedCrew.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded" title={`Crew: ${linkedCrew.map(c => c.name).join(', ')}`}>
                    👥 {linkedCrew.length}
                  </span>
                )}
                {linkedEquipment.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded" title={`Equipment: ${linkedEquipment.map(e => e.name).join(', ')}`}>
                    📦 {linkedEquipment.length}
                  </span>
                )}
              </div>
            )}
            {event.notes && (
              <div className="text-xs text-text-tertiary mt-1 italic">{event.notes}</div>
            )}
          </div>
        </td>
        <td className="py-3 text-text-secondary">
          {linkedLocation ? (
            <div>
              <div className="font-medium">{linkedLocation.name}</div>
              <div className="text-xs text-text-tertiary">{linkedLocation.address}</div>
            </div>
          ) : (
            event.location
          )}
        </td>
        <td className="py-3 text-center text-text-secondary">{event.pageCount}</td>
        <td className="py-3 text-right">
          <button onClick={() => setShowEditModal(true)} className="text-accent-primary hover:text-accent-hover text-xs mr-2">Edit</button>
          <button onClick={() => { if (confirm('Delete this event?')) onDelete(); }} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
        </td>
      </tr>
      {typeof window !== 'undefined' && createPortal(
        <EventCreationModal
          projectId={projectId}
          shootingDayId={event.shootingDayId}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onCreate={(data) => {
            onUpdate(data);
            setShowEditModal(false);
          }}
          initialData={{
            time: event.time,
            sceneNumber: event.sceneNumber,
            description: event.description,
            location: event.location,
            locationId: event.locationId,
            pageCount: event.pageCount,
            type: event.type,
            duration: event.duration,
            notes: event.notes,
            castIds: event.castIds,
            crewIds: event.crewIds,
            equipmentIds: event.equipmentIds,
            storyboardIds: event.storyboardIds,
          }}
        />,
        document.body
      )}
    </>
  );
}
