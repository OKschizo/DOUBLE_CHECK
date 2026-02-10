'use client';

import { useMemo, useRef } from 'react';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useCallSheet } from '@/features/schedule/hooks/useCallSheet';

interface CallSheetModalProps {
  projectId: string;
  shootingDayId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Professional Call Sheet Generator
 * Industry-standard format matching Celtx/Movie Magic style
 */
export function CallSheetModal({ projectId, shootingDayId, isOpen, onClose }: CallSheetModalProps) {
  const { callSheet, isLoading, error } = useCallSheet(projectId, shootingDayId);
  const { data: project } = useProject(projectId);
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate total page count (in 8ths)
  const totalPages = useMemo(() => {
    if (!callSheet?.events) return { eighths: 0, display: '0' };
    let totalEighths = 0;
    
    callSheet.events.forEach((event: any) => {
      const pageCount = event.pageCount;
      if (pageCount) {
        const match = pageCount.match(/^(\d+)?\s*(\d+)\/(\d+)$/);
        if (match) {
          const whole = parseInt(match[1]) || 0;
          const num = parseInt(match[2]) || 0;
          const den = parseInt(match[3]) || 8;
          totalEighths += whole * 8 + Math.round(num * 8 / den);
        } else {
          const plain = parseInt(pageCount);
          if (!isNaN(plain)) {
            totalEighths += plain * 8;
          }
        }
      }
    });
    
    const whole = Math.floor(totalEighths / 8);
    const remainder = totalEighths % 8;
    const display = remainder > 0 ? `${whole > 0 ? whole + ' ' : ''}${remainder}/8` : `${whole}`;
    
    return { eighths: totalEighths, display };
  }, [callSheet?.events]);

  // Get meal times
  const meals = useMemo(() => {
    if (!callSheet) return { breakfast: '', lunch: '', dinner: '' };
    
    const breakfastEvent = callSheet.events.find(
      (e: any) => e.type === 'break' && e.description?.toLowerCase().includes('breakfast')
    );
    const lunchEvent = callSheet.events.find(
      (e: any) => e.type === 'break' && e.description?.toLowerCase().includes('lunch')
    );
    
    return {
      breakfast: callSheet.shootingDay.breakfast || breakfastEvent?.time || '',
      lunch: callSheet.shootingDay.lunch || lunchEvent?.time || '',
    };
  }, [callSheet]);

  // Get key contacts from crew
  const keyContacts = useMemo(() => {
    if (!callSheet?.crew) return {};
    
    const findCrewByRole = (roles: string[]) => {
      for (const role of roles) {
        const found = callSheet.crew.find((c: any) => 
          c.role?.toLowerCase().includes(role.toLowerCase())
        );
        if (found) return found;
      }
      return null;
    };
    
    return {
      director: findCrewByRole(['director']),
      producer: findCrewByRole(['producer', 'ep']),
      lineProducer: findCrewByRole(['line producer']),
      upm: findCrewByRole(['unit production manager', 'upm']),
      firstAD: findCrewByRole(['1st ad', 'first assistant director', '1st assistant']),
      secondAD: findCrewByRole(['2nd ad', 'second assistant director', '2nd assistant']),
      dop: findCrewByRole(['director of photography', 'dop', 'dp', 'cinematographer']),
      productionCoordinator: findCrewByRole(['production coordinator', 'poc']),
    };
  }, [callSheet]);

  // Get locations by ID
  const getLocation = (locationId?: string) => {
    if (!locationId || !callSheet?.locations) return null;
    return callSheet.locations.find((l: any) => l.id === locationId);
  };

  // Get cast with call times and status
  const castWithDetails = useMemo(() => {
    if (!callSheet?.cast) return [];
    
    return callSheet.cast.map((member: any, index: number) => {
      const memberEvents = callSheet.events.filter(
        (e: any) => e.castIds?.includes(member.id)
      );
      
      const memberSceneIds = new Set<string>();
      callSheet.scenes.forEach((scene: any) => {
        if (scene.castMemberIds?.includes(member.id)) {
          memberSceneIds.add(scene.id);
        }
      });
      
      const sceneEvents = callSheet.events.filter(
        (e: any) => e.sceneId && memberSceneIds.has(e.sceneId)
      );
      
      const allMemberEvents = [...memberEvents, ...sceneEvents];
      const earliestEvent = allMemberEvents
        .filter((e: any) => e.time)
        .sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))[0];
      
      return {
        ...member,
        castNumber: index + 1,
        callTime: member.callTime || earliestEvent?.time || callSheet.shootingDay.callTime,
        workStatus: member.workStatus || 'W',
        scenes: Array.from(memberSceneIds),
      };
    }).sort((a: any, b: any) => {
      const typeOrder: Record<string, number> = { 'lead': 0, 'supporting': 1, 'dayplayer': 2, 'background': 3 };
      const aOrder = typeOrder[a.castType?.toLowerCase()] ?? 2;
      const bOrder = typeOrder[b.castType?.toLowerCase()] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.characterName || '').localeCompare(b.characterName || '');
    });
  }, [callSheet]);

  // Separate principal cast from background
  const principalCast = useMemo(() => {
    return castWithDetails.filter((c: any) => c.castType?.toLowerCase() !== 'background');
  }, [castWithDetails]);

  const backgroundCast = useMemo(() => {
    return castWithDetails.filter((c: any) => c.castType?.toLowerCase() === 'background');
  }, [castWithDetails]);

  // Get crew organized by department for the multi-column layout
  const crewByDepartment = useMemo(() => {
    if (!callSheet?.crew) return {};
    
    const departments: Record<string, any[]> = {};
    
    callSheet.crew.forEach((member: any) => {
      const dept = member.department || 'other';
      if (!departments[dept]) departments[dept] = [];
      
      const memberEvents = callSheet.events.filter(
        (e: any) => e.crewIds?.includes(member.id)
      );
      const earliestEvent = memberEvents
        .filter((e: any) => e.time)
        .sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))[0];
      
      departments[dept].push({
        ...member,
        callTime: member.callTime || earliestEvent?.time || callSheet.shootingDay.callTime,
      });
    });
    
    // Sort crew within each department
    Object.keys(departments).forEach(dept => {
      departments[dept].sort((a, b) => {
        if (a.isDepartmentHead && !b.isDepartmentHead) return -1;
        if (!a.isDepartmentHead && b.isDepartmentHead) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    });
    
    return departments;
  }, [callSheet]);

  // Get shooting schedule (scenes for the day)
  const shootingSchedule = useMemo(() => {
    if (!callSheet?.events) return [];
    
    return callSheet.events
      .filter((event: any) => event.type === 'scene' || event.sceneId)
      .map((event: any) => {
        const scene = callSheet.scenes.find((s: any) => s.id === event.sceneId);
        const location = getLocation(event.locationId) || getLocation(scene?.locationId);
        
        const sceneCast = callSheet.cast.filter((c: any) => 
          event.castIds?.includes(c.id) || scene?.castMemberIds?.includes(c.id)
        );
        
        return {
          ...event,
          scene,
          location,
          sceneCast,
          intExt: scene?.intExt || event.intExt || '',
          dayNight: scene?.dayNight || event.dayNight || '',
        };
      });
  }, [callSheet]);

  // Format helpers
  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const formatTimeLarge = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date | string | any) => {
    let dateObj: Date;
    if (date instanceof Date) dateObj = date;
    else if (typeof date === 'string') dateObj = new Date(date);
    else if (date?.toDate) dateObj = date.toDate();
    else dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDeptName = (dept: string) => {
    const names: Record<string, string> = {
      'production': 'PRODUCTION',
      'direction': 'ASSISTANT DIRECTORS',
      'camera': 'CAMERA',
      'lighting_grip': 'ELECTRIC / GRIP',
      'lighting': 'ELECTRIC',
      'grip': 'GRIP',
      'sound': 'SOUND',
      'art': 'ART DEPARTMENT',
      'wardrobe': 'WARDROBE',
      'makeup_hair': 'MAKE-UP',
      'makeup': 'MAKE-UP',
      'hair': 'HAIR',
      'locations': 'LOCATIONS',
      'transportation': 'TRANSPO',
      'catering': 'CATERING',
      'crafty': 'CRAFTY',
      'post_production': 'POST',
      'stunts': 'STUNTS',
      'vfx': 'VISUAL EFFECTS',
      'props': 'PROPERTY',
      'continuity': 'CONTINUITY',
      'other': 'ADDITIONAL LABOR',
    };
    return names[dept.toLowerCase()] || dept.replace(/_/g, ' ').toUpperCase();
  };

  const handlePrint = () => window.print();

  if (!isOpen) return null;

  // Define department column layout for page 2
  const leftColumnDepts = ['production', 'direction', 'camera', 'continuity', 'sound'];
  const middleColumnDepts = ['makeup_hair', 'wardrobe', 'art', 'props'];
  const rightColumnDepts = ['locations', 'transportation', 'catering', 'lighting_grip', 'grip', 'vfx', 'other'];

  const renderDeptSection = (deptKey: string) => {
    const members = crewByDepartment[deptKey];
    if (!members || members.length === 0) return null;
    
    return (
      <div key={deptKey} className="mb-2">
        <div className="bg-gray-200 font-bold text-[9px] px-1 py-0.5 border-b border-black">
          {formatDeptName(deptKey)}
        </div>
        <table className="w-full text-[8px]">
          <tbody>
            {members.map((member: any, idx: number) => (
              <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-1 py-0.5 w-4">{idx + 1}</td>
                <td className="px-1 py-0.5">{member.role || '-'}</td>
                <td className="px-1 py-0.5">{member.name}</td>
                <td className="px-1 py-0.5 w-12 text-right">
                  {member.callTime && member.callTime !== callSheet?.shootingDay.callTime 
                    ? formatTime(member.callTime) 
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto print:bg-white print:p-0">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-[8.5in] max-h-[90vh] overflow-hidden flex flex-col my-8 print:max-w-full print:max-h-full print:my-0 print:rounded-none print:border-none">
        
        {/* Header - Non-print */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-900">📋 Call Sheet Generator</h2>
            {callSheet && (
              <p className="text-sm text-gray-600">
                {formatDate(callSheet.shootingDay.date)} • Day {callSheet.shootingDay.dayNumber || '?'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              🖨️ Print / PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={printRef} className="flex-1 overflow-y-auto bg-white print:overflow-visible">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading call sheet</p>
              <p className="text-sm text-gray-600">{error.message}</p>
            </div>
          ) : callSheet ? (
            <div className="text-black text-[10px] leading-tight">
              
              {/* ==================== PAGE 1 ==================== */}
              <div className="p-4 print:p-3">
                
                {/* Header Row */}
                <div className="flex border-2 border-black mb-2">
                  {/* Left: Logo + Key Contacts */}
                  <div className="w-1/4 border-r-2 border-black p-2">
                    <div className="text-center mb-2">
                      <div className="text-xs font-bold">[Production</div>
                      <div className="text-xs font-bold">Company Logo]</div>
                    </div>
                    <div className="text-[8px] space-y-0.5">
                      <div><span className="font-bold">Director:</span> {keyContacts.director?.name || ''}</div>
                      <div><span className="font-bold">Producer:</span> {keyContacts.producer?.name || ''}</div>
                      <div><span className="font-bold">Line Producer:</span> {keyContacts.lineProducer?.name || ''}</div>
                    </div>
                  </div>
                  
                  {/* Center: Title + Crew Call */}
                  <div className="w-1/2 border-r-2 border-black">
                    <div className="text-center border-b border-black p-1">
                      <div className="text-lg font-bold">{project?.name || '[Title]'}</div>
                    </div>
                    <div className="flex">
                      <div className="flex-1 text-center p-2 border-r border-black">
                        <div className="text-[8px] font-bold">Call Sheet</div>
                        <div className="text-[8px]">GENERAL CREW CALL</div>
                        <div className="text-3xl font-bold text-black mt-1">
                          {formatTimeLarge(callSheet.shootingDay.callTime) || '—:— AM'}
                        </div>
                      </div>
                      <div className="w-1/3 p-1 text-[8px]">
                        <div className="flex justify-between"><span>Courtesy Breakfast</span><span>{formatTime(meals.breakfast) || ''}</span></div>
                        <div className="flex justify-between"><span>Shooting Call</span><span>{formatTime(callSheet.shootingDay.shootCall) || ''}</span></div>
                        <div className="flex justify-between"><span>Lunch</span><span>{formatTime(meals.lunch) || ''}</span></div>
                      </div>
                    </div>
                    <div className="flex border-t border-black text-[8px]">
                      <div className="flex-1 p-1 border-r border-black text-center">
                        <div className="font-bold">NEAREST HOSPITAL</div>
                        <div>{callSheet.shootingDay.nearestHospital || 'TBD'}</div>
                      </div>
                      <div className="flex-1 p-1 border-r border-black text-center">
                        <div className="font-bold">CREW PARKING</div>
                        <div>{getLocation(callSheet.shootingDay.crewParkLocationId)?.name || 'TBD'}</div>
                      </div>
                      <div className="flex-1 p-1 text-center">
                        <div className="font-bold">BASECAMP</div>
                        <div>{getLocation(callSheet.shootingDay.basecampLocationId)?.name || 'TBD'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Date + Weather */}
                  <div className="w-1/4 text-[9px]">
                    <div className="text-center border-b border-black p-1">
                      <div className="font-bold">{formatDate(callSheet.shootingDay.date)}</div>
                      <div className="text-sm font-bold">Day {callSheet.shootingDay.dayNumber || '?'} of {callSheet.shootingDay.totalDays || '?'}</div>
                    </div>
                    <div className="p-1 text-[8px]">
                      <div className="font-bold mb-1">WEATHER</div>
                      <div className="flex justify-between"><span>High</span><span>{callSheet.weather?.high || '—°'}</span></div>
                      <div className="flex justify-between"><span>Low</span><span>{callSheet.weather?.low || '—°'}</span></div>
                      <div className="flex justify-between"><span>Sunrise</span><span>{callSheet.weather?.sunrise || ''}</span></div>
                      <div className="flex justify-between"><span>Sunset</span><span>{callSheet.weather?.sunset || ''}</span></div>
                    </div>
                  </div>
                </div>

                {/* Safety Banner */}
                <div className="bg-yellow-100 border border-black text-center py-1 text-[8px] font-bold mb-2">
                  SAFETY FIRST | NO FORCED CALLS WITHOUT PRIOR APPROVAL OF UPM | NO SMOKING ON SET | NO VISITORS WITHOUT PRIOR APPROVAL OF PRODUCER
                </div>

                {/* Scenes Table */}
                {shootingSchedule.length > 0 && (
                  <div className="border border-black mb-2">
                    <table className="w-full border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border border-black p-1 text-left w-12">SCENES</th>
                          <th className="border border-black p-1 text-left w-12">PAGES</th>
                          <th className="border border-black p-1 text-left">SET &amp; DESCRIPTION</th>
                          <th className="border border-black p-1 text-left w-8">D/N</th>
                          <th className="border border-black p-1 text-left w-24">CAST</th>
                          <th className="border border-black p-1 text-left">NOTES</th>
                          <th className="border border-black p-1 text-left">LOCATIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shootingSchedule.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-black p-1 font-bold">
                              {item.scene?.sceneNumber || item.sceneNumber || '-'}
                            </td>
                            <td className="border border-black p-1">
                              {item.pageCount || item.scene?.pageCount || '-'}
                            </td>
                            <td className="border border-black p-1">
                              <span className="font-semibold">{item.intExt?.toUpperCase()}. </span>
                              {item.scene?.settingName || ''} - {item.description || item.scene?.title || ''}
                            </td>
                            <td className="border border-black p-1 text-center">
                              {item.dayNight?.charAt(0).toUpperCase() || '-'}
                            </td>
                            <td className="border border-black p-1">
                              {item.sceneCast?.map((c: any) => {
                                const castNum = principalCast.findIndex((cd: any) => cd.id === c.id) + 1;
                                return castNum > 0 ? castNum : null;
                              }).filter(Boolean).join(', ') || '-'}
                              {item.sceneCast?.some((c: any) => c.castType?.toLowerCase() === 'background') && ', BG'}
                            </td>
                            <td className="border border-black p-1">{item.notes || ''}</td>
                            <td className="border border-black p-1">{item.location?.name || item.location || ''}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-200 font-bold">
                          <td className="border border-black p-1">TOTAL PAGES</td>
                          <td className="border border-black p-1">{totalPages.display}</td>
                          <td colSpan={5} className="border border-black p-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Cast Table */}
                {principalCast.length > 0 && (
                  <div className="border border-black mb-2">
                    <table className="w-full border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border border-black p-1 text-left w-6">ID</th>
                          <th className="border border-black p-1 text-left">CHARACTER</th>
                          <th className="border border-black p-1 text-left">CAST</th>
                          <th className="border border-black p-1 text-left w-10">STATUS</th>
                          <th className="border border-black p-1 text-left w-14">PICKUP</th>
                          <th className="border border-black p-1 text-left w-14">CALL</th>
                          <th className="border border-black p-1 text-left w-14">BLK/REH</th>
                          <th className="border border-black p-1 text-left w-14">SET</th>
                          <th className="border border-black p-1 text-left">SPECIAL INSTRUCTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {principalCast.map((member: any, idx: number) => (
                          <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-black p-1 font-bold">{idx + 1}</td>
                            <td className="border border-black p-1 font-semibold">{member.characterName || '-'}</td>
                            <td className="border border-black p-1">{member.actorName || member.name || '-'}</td>
                            <td className="border border-black p-1">{member.workStatus || 'W'}</td>
                            <td className="border border-black p-1">{member.pickupTime ? formatTime(member.pickupTime) : ''}</td>
                            <td className="border border-black p-1 font-semibold">{formatTime(member.callTime)}</td>
                            <td className="border border-black p-1">{member.blockTime ? formatTime(member.blockTime) : ''}</td>
                            <td className="border border-black p-1">{member.setTime ? formatTime(member.setTime) : ''}</td>
                            <td className="border border-black p-1">{member.notes || member.specialInstructions || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Background Table */}
                {backgroundCast.length > 0 && (
                  <div className="border border-black mb-2">
                    <div className="bg-yellow-100 font-bold text-[9px] p-1 border-b border-black">
                      BACKGROUND / EXTRAS
                    </div>
                    <table className="w-full border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-1 text-left w-10">QTY</th>
                          <th className="border border-black p-1 text-left">BACKGROUND</th>
                          <th className="border border-black p-1 text-left w-14">CALL</th>
                          <th className="border border-black p-1 text-left">SPECIAL INSTRUCTIONS BY DEPARTMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backgroundCast.map((member: any, idx: number) => (
                          <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-black p-1">{member.quantity || 1}</td>
                            <td className="border border-black p-1">{member.characterName || member.description || '-'}</td>
                            <td className="border border-black p-1">{formatTime(member.callTime)}</td>
                            <td className="border border-black p-1">{member.notes || ''}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-200 font-bold">
                          <td className="border border-black p-1">
                            {backgroundCast.reduce((sum: number, c: any) => sum + (c.quantity || 1), 0)}
                          </td>
                          <td colSpan={3} className="border border-black p-1">TOTAL STANDINGS / BACKGROUND</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Important Notes */}
                {callSheet.shootingDay.notes && (
                  <div className="border border-black mb-2 p-2">
                    <div className="font-bold text-[9px] mb-1">PRODUCTION NOTES:</div>
                    <div className="text-[9px] whitespace-pre-wrap">{callSheet.shootingDay.notes}</div>
                  </div>
                )}
              </div>

              {/* ==================== PAGE 2: CREW ==================== */}
              <div className="page-break-before print:break-before-page p-4 print:p-3">
                <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                  <div className="font-bold text-sm">{project?.name || '[Title]'}</div>
                  <div className="font-bold">Day {callSheet.shootingDay.dayNumber || '?'} of {callSheet.shootingDay.totalDays || '?'}</div>
                </div>
                
                {/* Crew Grid - 3 columns */}
                <div className="flex gap-2">
                  {/* Left Column */}
                  <div className="w-1/3 border border-black">
                    <div className="grid grid-cols-4 text-[8px] bg-gray-800 text-white font-bold">
                      <div className="p-0.5 border-r border-gray-600">#</div>
                      <div className="p-0.5 border-r border-gray-600">TITLE</div>
                      <div className="p-0.5 border-r border-gray-600">NAME</div>
                      <div className="p-0.5">CALL</div>
                    </div>
                    {leftColumnDepts.map(dept => renderDeptSection(dept))}
                  </div>
                  
                  {/* Middle Column */}
                  <div className="w-1/3 border border-black">
                    <div className="grid grid-cols-4 text-[8px] bg-gray-800 text-white font-bold">
                      <div className="p-0.5 border-r border-gray-600">#</div>
                      <div className="p-0.5 border-r border-gray-600">TITLE</div>
                      <div className="p-0.5 border-r border-gray-600">NAME</div>
                      <div className="p-0.5">CALL</div>
                    </div>
                    {middleColumnDepts.map(dept => renderDeptSection(dept))}
                    
                    {/* Special Equipment */}
                    {callSheet.equipment.length > 0 && (
                      <div className="mb-2">
                        <div className="bg-gray-200 font-bold text-[9px] px-1 py-0.5 border-b border-black">
                          SPECIAL EQUIPMENT
                        </div>
                        <div className="text-[8px] p-1">
                          {callSheet.equipment.map((item: any) => (
                            <div key={item.id}>{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column */}
                  <div className="w-1/3 border border-black">
                    <div className="grid grid-cols-4 text-[8px] bg-gray-800 text-white font-bold">
                      <div className="p-0.5 border-r border-gray-600">#</div>
                      <div className="p-0.5 border-r border-gray-600">TITLE</div>
                      <div className="p-0.5 border-r border-gray-600">NAME</div>
                      <div className="p-0.5">CALL</div>
                    </div>
                    {rightColumnDepts.map(dept => renderDeptSection(dept))}
                    
                    {/* Meal Info */}
                    <div className="mb-2">
                      <div className="bg-gray-200 font-bold text-[9px] px-1 py-0.5 border-b border-black">
                        CATERING
                      </div>
                      <div className="text-[8px] p-1">
                        {meals.breakfast && <div>Courtesy Breakfast: {formatTime(meals.breakfast)}</div>}
                        {meals.lunch && <div>Crew Lunch: {formatTime(meals.lunch)}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Walkie Channels Footer */}
                <div className="mt-2 border-t border-black pt-1 text-[8px] text-center">
                  Walkie Channels: 1-Production 2-Open 3-Open 4-Art 5-Open 6-Camera 7-Electric 8-Grip
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[8px] text-gray-500 p-2 border-t border-gray-300">
                Generated by DoubleCheck • {new Date().toLocaleDateString()}
              </div>

            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No data available for this shooting day.</p>
              <p className="text-sm text-gray-500 mt-2">Make sure you have scenes, cast, and crew scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
