'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSchedule } from '../../hooks/useSchedule';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { EventCreationModal } from './EventCreationModal';
import { ScheduleSyncModal } from './ScheduleSyncModal';
import { CallSheetModal } from './CallSheetModal';
import { ShootingDayEditModal } from './ShootingDayEditModal';
import { trpc } from '@/lib/trpc/client';
import type { ScheduleEvent, ScheduleEventType } from '@/lib/schemas';

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

  const handleCreateDay = async (date: Date) => {
    // Create date at midnight in local timezone to avoid timezone conversion issues
    // Use the date's year, month, and day directly to avoid timezone shifts
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    
    const result = await createDay.mutateAsync({
      projectId,
      date: localDate,
      dayNumber: (schedule?.days.length || 0) + 1,
    });
    
    setSelectedDayId(result.id);
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
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getShootingDayForDate = (date: Date) => {
    if (!schedule?.days) return null;
    // Compare dates by year, month, day to avoid timezone issues
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
    const shootingDay = getShootingDayForDate(date);
    if (shootingDay) {
      setSelectedDayId(shootingDay.id);
    } else if (canEdit) {
      // Automatically create a shooting day for this date
      await handleCreateDay(date);
    }
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
      {/* Header with Sync Button */}
      {canEdit && (
        <div className="flex justify-end">
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
      )}

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
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-text-secondary py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const shootingDay = getShootingDayForDate(date);
            const isTodayDate = isToday(date);
            const isPast = date < today && !isTodayDate;
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            
            return (
              <button
                key={dateKey}
                onClick={() => handleCalendarDateClick(date)}
                disabled={isPast && !shootingDay && !canEdit}
                className={`
                  aspect-square text-xs transition-all relative
                  ${shootingDay 
                    ? 'bg-accent-primary/20 text-accent-primary border-2 border-accent-primary font-semibold hover:bg-accent-primary/30' 
                    : isPast && !canEdit
                    ? 'text-text-tertiary cursor-not-allowed'
                    : canEdit && !isPast
                    ? 'hover:bg-accent-primary/5 text-text-secondary hover:text-text-primary border-2 border-dashed border-border-default hover:border-accent-primary'
                    : 'text-text-secondary border-2 border-transparent'
                  }
                  ${isTodayDate && !shootingDay ? 'ring-2 ring-gray-600' : ''}
                  ${selectedDay && shootingDay?.id === selectedDayId ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-background-secondary' : ''}
                `}
                title={shootingDay ? `Day ${schedule?.days.indexOf(shootingDay) + 1}` : canEdit && !isPast ? 'Click to add shooting day' : ''}
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

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-800 scrollbar-thin">
          {schedule?.days.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                selectedDayId === day.id
                  ? 'bg-background-primary text-accent-primary border-t border-x border-border-default relative top-[1px]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              Day {index + 1}
              <span className="ml-2 text-xs opacity-70">
                {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </button>
          ))}
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
                Day {schedule?.days.indexOf(selectedDay) + 1} - {selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedDay.notes && <p className="text-sm text-text-secondary mt-1">{selectedDay.notes}</p>}
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
              {canEdit && (
                <>
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
                </>
              )}
            </div>
          </div>

          <div className="p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-secondary border-b border-gray-800">
                  <th className="pb-2 font-medium w-20">Time</th>
                  <th className="pb-2 font-medium w-20">Scene</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium w-32">Location</th>
                  <th className="pb-2 font-medium w-24 text-center">Pages</th>
                  {canEdit && <th className="pb-2 font-medium w-20 text-right">Actions</th>}
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
                {canEdit && (
                  <tr>
                    <td colSpan={6} className="py-3">
                      <button
                        onClick={() => setShowEventModal(true)}
                        className="text-sm text-text-secondary hover:text-accent-primary flex items-center gap-1"
                      >
                        <span>+ Add Event</span>
                      </button>
                    </td>
                  </tr>
                )}
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
              onError: (error) => {
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
                onError: (error) => {
                  console.error('Error updating shooting day:', error);
                  alert(`Failed to update shooting day: ${error.message}`);
                },
              }
            );
          }}
        />
      )}
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
  
  // Fetch data for display
  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId }, { enabled: !!event.crewIds?.length });
  const { data: castMembers = [] } = trpc.cast.listByProject.useQuery({ projectId }, { enabled: !!event.castIds?.length });
  const { data: equipment = [] } = trpc.equipment.listByProject.useQuery({ projectId }, { enabled: !!event.equipmentIds?.length });
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId }, { enabled: !!event.locationId });

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

  return (
    <>
      <tr className={`hover:bg-white/5 transition-colors group ${rowClass}`}>
        <td className="py-3">{event.time}</td>
        <td className="py-3 font-mono">{event.sceneNumber}</td>
        <td className="py-3">
          <div>
            {event.type !== 'scene' && (
              <span className="uppercase text-xs font-bold tracking-wider opacity-70 mr-2">[{event.type}]</span>
            )}
            <div className="font-medium">{event.description}</div>
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
        {canEdit && (
          <td className="py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowEditModal(true)} className="text-accent-primary hover:text-accent-hover text-xs mr-2">Edit</button>
            <button onClick={() => { if (confirm('Delete?')) onDelete(); }} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
          </td>
        )}
      </tr>
      {canEdit && typeof window !== 'undefined' && createPortal(
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

