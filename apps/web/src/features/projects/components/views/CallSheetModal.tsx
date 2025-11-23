'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { ShootingDay, ScheduleEvent } from '@/lib/schemas';

interface CallSheetModalProps {
  projectId: string;
  shootingDayId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CallSheetModal({ projectId, shootingDayId, isOpen, onClose }: CallSheetModalProps) {
  const { data: callSheet, isLoading, error } = trpc.schedule.getCallSheet.useQuery(
    { shootingDayId, projectId },
    { enabled: isOpen && !!shootingDayId }
  );

  const { data: project } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: projectMembers } = trpc.projectMembers.listByProject.useQuery(
    { projectId },
    { enabled: isOpen }
  );

  // Calculate total page count
  const totalPages = useMemo(() => {
    if (!callSheet?.events) return 0;
    return callSheet.events.reduce((total, event) => {
      if ((event as any).pageCount) {
        // Parse page count (e.g., "1/8", "3 4/8")
        const match = (event as any).pageCount.match(/(\d+)\s*(\d+)?\/(\d+)/);
        if (match) {
          const whole = parseInt(match[1]) || 0;
          const num = parseInt(match[2]) || 0;
          const den = parseInt(match[3]) || 8;
          return total + (whole + num / den);
        }
      }
      return total;
    }, 0);
  }, [callSheet?.events]);

  // Get breakfast and lunch from break events
  const breakfastTime = useMemo(() => {
    if (!callSheet?.events) return '';
    const breakfastEvent = callSheet.events.find(
      e => e.type === 'break' && e.description.toLowerCase().includes('breakfast')
    );
    return breakfastEvent?.time || '';
  }, [callSheet?.events]);

  const lunchTime = useMemo(() => {
    if (!callSheet?.events) return '';
    const lunchEvent = callSheet.events.find(
      e => e.type === 'break' && e.description.toLowerCase().includes('lunch')
    );
    return lunchEvent?.time || '';
  }, [callSheet?.events]);

  // Get key contacts from crew
  const director = useMemo(() => {
    if (!callSheet?.shootingDay.directorCrewId || !callSheet?.crew) return null;
    return callSheet.crew.find(c => c.id === callSheet.shootingDay.directorCrewId);
  }, [callSheet?.shootingDay.directorCrewId, callSheet?.crew]);

  const executiveProducer = useMemo(() => {
    if (!callSheet?.shootingDay.executiveProducerCrewId || !callSheet?.crew) return null;
    return callSheet.crew.find(c => c.id === callSheet.shootingDay.executiveProducerCrewId);
  }, [callSheet?.shootingDay.executiveProducerCrewId, callSheet?.crew]);

  const productionCoordinator = useMemo(() => {
    if (!callSheet?.shootingDay.productionCoordinatorCrewId || !callSheet?.crew) return null;
    return callSheet.crew.find(c => c.id === callSheet.shootingDay.productionCoordinatorCrewId);
  }, [callSheet?.shootingDay.productionCoordinatorCrewId, callSheet?.crew]);

  // Get location names from location IDs
  const primaryLocation = useMemo(() => {
    if (!callSheet?.shootingDay.locationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.locationId);
  }, [callSheet?.shootingDay.locationId, callSheet?.locations]);

  const basecampLocation = useMemo(() => {
    if (!callSheet?.shootingDay.basecampLocationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.basecampLocationId);
  }, [callSheet?.shootingDay.basecampLocationId, callSheet?.locations]);

  const crewParkLocation = useMemo(() => {
    if (!callSheet?.shootingDay.crewParkLocationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.crewParkLocationId);
  }, [callSheet?.shootingDay.crewParkLocationId, callSheet?.locations]);

  const techTrucksLocation = useMemo(() => {
    if (!callSheet?.shootingDay.techTrucksLocationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.techTrucksLocationId);
  }, [callSheet?.shootingDay.techTrucksLocationId, callSheet?.locations]);

  const bgHoldingLocation = useMemo(() => {
    if (!callSheet?.shootingDay.bgHoldingLocationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.bgHoldingLocationId);
  }, [callSheet?.shootingDay.bgHoldingLocationId, callSheet?.locations]);

  const bgParkingLocation = useMemo(() => {
    if (!callSheet?.shootingDay.bgParkingLocationId || !callSheet?.locations) return null;
    return callSheet.locations.find(l => l.id === callSheet.shootingDay.bgParkingLocationId);
  }, [callSheet?.shootingDay.bgParkingLocationId, callSheet?.locations]);

  // Get cast with call times (NO CONTACT INFO)
  const castWithCallTimes = useMemo(() => {
    if (!callSheet?.cast) return [];
    return callSheet.cast.map((member) => {
      const memberEvents = callSheet.events.filter(
        (e: any) => e.castIds?.includes(member.id)
      );
      const earliestEvent = memberEvents
        .filter((e) => e.time)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
      
      return {
        ...member,
        callTime: earliestEvent?.time || callSheet.shootingDay.callTime,
      };
    });
  }, [callSheet?.cast, callSheet?.events, callSheet?.shootingDay]);

  // Get crew organized by department
  const crewByDepartment = useMemo(() => {
    if (!callSheet?.crew) return {};
    const deptMap: Record<string, any[]> = {};
    
    callSheet.crew.forEach((member: any) => {
      const dept = member.department || 'other';
      if (!deptMap[dept]) deptMap[dept] = [];
      
      const memberEvents = callSheet.events.filter(
        (e: any) => e.crewIds?.includes(member.id)
      );
      const earliestEvent = memberEvents
        .filter((e) => e.time)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
      
      deptMap[dept].push({
        ...member,
        callTime: earliestEvent?.time || callSheet.shootingDay.callTime,
      });
    });
    
    return deptMap;
  }, [callSheet?.crew, callSheet?.events, callSheet?.shootingDay]);

  // Get key production contacts
  const keyContacts = useMemo(() => {
    if (!projectMembers) return {};
    const contacts: Record<string, { name: string; phone?: string }> = {};
    
    // Find Director, Executive Producer, Production Coordinator
    projectMembers.forEach((member) => {
      // This is simplified - you might want to match by role or department
      // For now, we'll use project members as potential contacts
    });
    
    return contacts;
  }, [projectMembers]);

  // Calculate sunrise/sunset
  const getSunTimes = (date: Date | string | any) => {
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date?.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return { sunrise: 'N/A', sunset: 'N/A' };
    }
    
    const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    const lat = 40.7128; // Default to NYC
    const hourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(declination * Math.PI / 180));
    const sunrise = 12 - (hourAngle * 180 / Math.PI) / 15;
    const sunset = 12 + (hourAngle * 180 / Math.PI) / 15;
    
    const formatSunTime = (hours: number) => {
      const h = Math.floor(hours);
      const m = Math.floor((hours - h) * 60);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    
    return {
      sunrise: formatSunTime(sunrise),
      sunset: formatSunTime(sunset),
    };
  };

  if (!isOpen) return null;

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date | string | any) => {
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date?.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (date: Date | string | any) => {
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date?.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate 8ths from page count
  const calculateEighths = (pageCount?: string) => {
    if (!pageCount) return '';
    const match = pageCount.match(/(\d+)\s*(\d+)?\/(\d+)/);
    if (match) {
      const whole = parseInt(match[1]) || 0;
      const num = parseInt(match[2]) || 0;
      const den = parseInt(match[3]) || 8;
      const totalEighths = whole * 8 + (num * 8 / den);
      return totalEighths.toFixed(0);
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto print:bg-white print:p-0">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col my-8 print:max-w-full print:max-h-full print:my-0 print:rounded-none print:border-none print:bg-white">
        {/* Header - Non-print */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gray-50 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CALL SHEET</h2>
            {callSheet && (
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(callSheet.shootingDay.date)}
                {callSheet.shootingDay.dayNumber && ` • Day ${callSheet.shootingDay.dayNumber}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-6 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading call sheet</p>
              <p className="text-sm text-gray-600">{error.message || 'Unknown error occurred'}</p>
            </div>
          ) : callSheet ? (
            <div className="space-y-6 print:space-y-4">
              {/* Call Sheet Title */}
              <div className="text-center mb-6 print:mb-4">
                <h1 className="text-3xl font-bold text-black mb-2 print:text-2xl">{project?.title || 'CALL SHEET'}</h1>
                {callSheet.shootingDay.dayNumber && (
                  <p className="text-lg text-gray-700 print:text-base">
                    Day {callSheet.shootingDay.dayNumber} of {callSheet.shootingDay.totalDays || '?'}
                  </p>
                )}
              </div>

              {/* Key Info Table */}
              <table className="w-full border-collapse border border-black mb-6 print:mb-4">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Shoot Date</td>
                    <td className="border border-black p-2">{formatDateShort(callSheet.shootingDay.date)}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Crew Call</td>
                    <td className="border border-black p-2">{callSheet.shootingDay.callTime ? formatTime(callSheet.shootingDay.callTime) : ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Shoot Call</td>
                    <td className="border border-black p-2">{callSheet.shootingDay.shootCall ? formatTime(callSheet.shootingDay.shootCall) : (callSheet.shootingDay.callTime ? formatTime(callSheet.shootingDay.callTime) : '')}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Breakfast</td>
                    <td className="border border-black p-2">{breakfastTime ? formatTime(breakfastTime) : ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Lunch</td>
                    <td className="border border-black p-2">{lunchTime ? formatTime(lunchTime) : ''}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Total Pages</td>
                    <td className="border border-black p-2">{totalPages.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Key Contacts */}
              <table className="w-full border-collapse border border-black mb-6 print:mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left font-semibold">Role</th>
                    <th className="border border-black p-2 text-left font-semibold">Name</th>
                    <th className="border border-black p-2 text-left font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2">Director</td>
                    <td className="border border-black p-2">{(director as any)?.name || ''}</td>
                    <td className="border border-black p-2">{(director as any)?.phone || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Executive Producer</td>
                    <td className="border border-black p-2">{(executiveProducer as any)?.name || ''}</td>
                    <td className="border border-black p-2">{(executiveProducer as any)?.phone || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Production Coordinator</td>
                    <td className="border border-black p-2">{(productionCoordinator as any)?.name || ''}</td>
                    <td className="border border-black p-2">{(productionCoordinator as any)?.phone || ''}</td>
                  </tr>
                </tbody>
              </table>

              {/* Location Info */}
              <table className="w-full border-collapse border border-black mb-6 print:mb-4">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Basecamp</td>
                    <td className="border border-black p-2">{(basecampLocation as any)?.name || ''}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Crew Park</td>
                    <td className="border border-black p-2">{(crewParkLocation as any)?.name || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Tech Trucks</td>
                    <td className="border border-black p-2">{(techTrucksLocation as any)?.name || ''}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100">BG Holding</td>
                    <td className="border border-black p-2">{(bgHoldingLocation as any)?.name || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-100">BG Parking</td>
                    <td className="border border-black p-2">{(bgParkingLocation as any)?.name || ''}</td>
                    <td className="border border-black p-2 font-semibold bg-gray-100">Nearest Hospital</td>
                    <td className="border border-black p-2">{callSheet.shootingDay.nearestHospital || ''}</td>
                  </tr>
                </tbody>
              </table>

              {/* Important Notes */}
              {callSheet.shootingDay.notes && (
                <div className="mb-6 print:mb-4">
                  <h3 className="text-sm font-bold uppercase mb-2">Important Notes:</h3>
                  <div className="border border-black p-3 bg-gray-50">
                    <p className="text-sm whitespace-pre-wrap">{callSheet.shootingDay.notes}</p>
                  </div>
                </div>
              )}

              {/* Shooting Schedule Table */}
              {callSheet.events.length > 0 && (
                <div className="mb-6 print:mb-4">
                  <h3 className="text-sm font-bold uppercase mb-2">Shooting Schedule</h3>
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left font-semibold">Sc.</th>
                        <th className="border border-black p-1 text-left font-semibold">IIE</th>
                        <th className="border border-black p-1 text-left font-semibold">Setting/Description</th>
                        <th className="border border-black p-1 text-left font-semibold">DIN</th>
                        <th className="border border-black p-1 text-left font-semibold">Pages</th>
                        <th className="border border-black p-1 text-left font-semibold">8ths</th>
                        <th className="border border-black p-1 text-left font-semibold">Duration</th>
                        <th className="border border-black p-1 text-left font-semibold">Cast</th>
                        <th className="border border-black p-1 text-left font-semibold">Location</th>
                        <th className="border border-black p-1 text-left font-semibold">DD</th>
                        <th className="border border-black p-1 text-left font-semibold">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callSheet.events.map((event, idx) => {
                        const scene = callSheet.scenes.find((s: any) => s.id === (event as any).sceneId);
                        const shot = callSheet.shots.find((s: any) => s.id === (event as any).shotId);
                        const eventCast = callSheet.cast.filter((c: any) => (event as any).castIds?.includes(c.id));
                        
                        // Get location - prefer event locationId, then scene locationId, then event.location text
                        const eventLocationId = (event as any).locationId || (scene as any)?.locationId;
                        const location = eventLocationId 
                          ? callSheet.locations.find((l: any) => l.id === eventLocationId)
                          : null;
                        
                        // Get page count - prefer event pageCount, then scene pageCount
                        const pageCount = (event as any).pageCount || (scene as any)?.pageCount || '';
                        
                        // Get description - prefer event description, then scene title/description
                        const description = (event as any).description || (scene as any)?.title || (scene as any)?.description || '';
                        
                        // Format duration
                        const duration = (event as any).duration ? `${(event as any).duration}` : '';
                        
                        return (
                          <tr key={event.id}>
                            <td className="border border-black p-1">{(scene as any)?.sceneNumber || (event as any).sceneNumber || ''}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1">{description}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1">{pageCount}</td>
                            <td className="border border-black p-1">{calculateEighths(pageCount)}</td>
                            <td className="border border-black p-1">{duration}</td>
                            <td className="border border-black p-1">
                              {eventCast.map(c => c.characterName || c.name).filter(Boolean).join(', ')}
                            </td>
                            <td className="border border-black p-1">{(location as any)?.name || (event as any).location || (scene as any)?.locationName || ''}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={11} className="border border-black p-1 font-semibold bg-gray-100">
                          End of Day #{callSheet.shootingDay.dayNumber || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cast Table */}
              {castWithCallTimes.length > 0 && (
                <div className="mb-6 print:mb-4">
                  <h3 className="text-sm font-bold uppercase mb-2">Cast</h3>
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left font-semibold">#</th>
                        <th className="border border-black p-1 text-left font-semibold">Character</th>
                        <th className="border border-black p-1 text-left font-semibold">Artist</th>
                        <th className="border border-black p-1 text-left font-semibold">SWF</th>
                        <th className="border border-black p-1 text-left font-semibold">PU</th>
                        <th className="border border-black p-1 text-left font-semibold">H/M/W</th>
                        <th className="border border-black p-1 text-left font-semibold">Block</th>
                        <th className="border border-black p-1 text-left font-semibold">Set Call</th>
                        <th className="border border-black p-1 text-left font-semibold">Special Instructions, Misc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {castWithCallTimes.map((member, idx) => (
                        <tr key={member.id}>
                          <td className="border border-black p-1">{idx + 1}</td>
                          <td className="border border-black p-1 font-semibold">{(member as any).characterName || ''}</td>
                          <td className="border border-black p-1">{(member as any).actorName || (member as any).name || ''}</td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1">{(member as any).callTime ? formatTime((member as any).callTime) : ''}</td>
                          <td className="border border-black p-1">{(member as any).notes || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transport Notes */}
              <div className="mb-6 print:mb-4">
                <h3 className="text-sm font-bold uppercase mb-2">Transport Notes</h3>
                <div className="border border-black p-3 bg-gray-50 min-h-[60px]">
                  <p className="text-sm"></p>
                </div>
              </div>

              {/* Departmental Notes */}
              <div className="mb-6 print:mb-4">
                <h3 className="text-sm font-bold uppercase mb-2">Departmental Notes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(crewByDepartment).map(([dept, members]) => (
                    <div key={dept} className="border border-black p-2">
                      <div className="font-semibold text-xs mb-1 uppercase">{dept.replace(/_/g, ' ')}</div>
                      <div className="text-xs space-y-1">
                        {members.map((member) => (
                          <div key={member.id}>
                            <span className="font-semibold">{member.name}</span>
                            {member.role && <span className="text-gray-600"> - {member.role}</span>}
                            {member.callTime && member.callTime !== callSheet.shootingDay.callTime && (
                              <span className="text-gray-600"> ({formatTime(member.callTime)})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Breakdown by Department */}
              {Object.keys(crewByDepartment).length > 0 && (
                <div className="mb-6 print:mb-4">
                  <h3 className="text-sm font-bold uppercase mb-2">Crew</h3>
                  <div className="space-y-4">
                    {Object.entries(crewByDepartment).map(([department, members]) => {
                      // Sort members - department heads first
                      const sortedMembers = [...members].sort((a, b) => {
                        return a.name.localeCompare(b.name);
                      });
                      
                      return (
                        <div key={department} className="border border-black">
                          <div className="bg-gray-100 border-b border-black p-2 font-semibold text-sm uppercase">
                            {department.replace(/_/g, ' ')}
                          </div>
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-black p-1 text-left font-semibold">Name</th>
                                <th className="border border-black p-1 text-left font-semibold">Role</th>
                                <th className="border border-black p-1 text-left font-semibold">Call Time</th>
                                <th className="border border-black p-1 text-left font-semibold">Phone</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedMembers.map((member) => (
                                <tr key={member.id}>
                                  <td className="border border-black p-1">{member.name}</td>
                                  <td className="border border-black p-1">{member.role || ''}</td>
                                  <td className="border border-black p-1">{member.callTime ? formatTime(member.callTime) : ''}</td>
                                  <td className="border border-black p-1">{member.phone || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Contacts Footer */}
              {(() => {
                // Find key crew members
                const firstAD = callSheet.crew.find(c => c.role === '1st AD' || c.role?.includes('1st AD'));
                const secondAD = callSheet.crew.find(c => c.role === '2nd AD' || c.role?.includes('2nd AD'));
                const dop = callSheet.crew.find(c => c.role === 'Director of Photography' || c.role === 'DOP' || c.role?.includes('Director of Photography'));
                const transportCaptain = callSheet.crew.find(c => 
                  c.role === 'Transport Captain' || 
                  c.role === 'Transportation Coordinator' ||
                  c.role?.includes('Transport Captain') ||
                  c.role?.includes('Transportation Coordinator')
                );
                
                const formatContact = (name?: string, phone?: string) => {
                  if (!name && !phone) return '';
                  return `${name || ''}${name && phone ? '\n' : ''}${phone || ''}`;
                };
                
                return (
                  <div className="mt-6 print:mt-4">
                    <table className="w-full border-collapse border border-black text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-1 text-left font-semibold">Director</th>
                          <th className="border border-black p-1 text-left font-semibold">1st AD</th>
                          <th className="border border-black p-1 text-left font-semibold">DOP</th>
                          <th className="border border-black p-1 text-left font-semibold">2nd AD</th>
                          <th className="border border-black p-1 text-left font-semibold">Transport Captain</th>
                          <th className="border border-black p-1 text-left font-semibold">Production Coordinator</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(director?.name, director?.phone)}</td>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(firstAD?.name, firstAD?.phone)}</td>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(dop?.name, dop?.phone)}</td>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(secondAD?.name, secondAD?.phone)}</td>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(transportCaptain?.name, transportCaptain?.phone)}</td>
                          <td className="border border-black p-1 whitespace-pre-line">{formatContact(productionCoordinator?.name, productionCoordinator?.phone)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : !callSheet ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Unable to load call sheet data</p>
              {error && (
                <p className="text-sm text-red-600 mt-2">{error.message}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-300 bg-gray-50 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
