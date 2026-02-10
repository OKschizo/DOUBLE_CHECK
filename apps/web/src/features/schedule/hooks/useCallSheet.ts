'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { ShootingDay, ScheduleEvent } from '@/lib/schemas';

interface CallSheetData {
  shootingDay: ShootingDay;
  events: ScheduleEvent[];
  scenes: any[];
  shots: any[];
  cast: any[];
  crew: any[];
  locations: any[];
  equipment: any[];
  weather: {
    high: string;
    low: string;
    conditions: string;
    sunrise: string;
    sunset: string;
  } | null;
}

// Calculate sunrise/sunset based on date and approximate latitude
function getSunTimes(date: Date, latitude = 34.0522) { // Default: Los Angeles
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  const latRad = latitude * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle)));
  
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
}

export function useCallSheet(projectId: string, shootingDayId: string) {
  const [callSheet, setCallSheet] = useState<CallSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId || !shootingDayId) {
      setIsLoading(false);
      return;
    }

    const fetchCallSheetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch the shooting day (collection is 'schedule_days')
        const dayDoc = await getDoc(doc(db, 'schedule_days', shootingDayId));
        if (!dayDoc.exists()) {
          throw new Error('Shooting day not found');
        }
        const shootingDay = {
          id: dayDoc.id,
          ...dayDoc.data(),
          date: dayDoc.data().date?.toDate() || new Date(),
          createdAt: dayDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: dayDoc.data().updatedAt?.toDate() || new Date(),
        } as ShootingDay;

        // 2. Fetch schedule events for this day
        const eventsQuery = query(
          collection(db, 'schedule_events'),
          where('shootingDayId', '==', shootingDayId)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const events = eventsSnap.docs
          .map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || new Date(),
          }))
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as ScheduleEvent[];

        // Collect all IDs from events
        const sceneIds = new Set<string>();
        const shotIds = new Set<string>();
        const castIds = new Set<string>();
        const crewIds = new Set<string>();
        const locationIds = new Set<string>();
        const equipmentIds = new Set<string>();

        events.forEach(event => {
          if (event.sceneId) sceneIds.add(event.sceneId);
          if (event.shotId) shotIds.add(event.shotId);
          if (event.locationId) locationIds.add(event.locationId);
          event.castIds?.forEach(id => castIds.add(id));
          event.crewIds?.forEach(id => crewIds.add(id));
          event.equipmentIds?.forEach(id => equipmentIds.add(id));
        });

        // Also add shooting day locations
        if (shootingDay.locationId) locationIds.add(shootingDay.locationId);
        if (shootingDay.basecampLocationId) locationIds.add(shootingDay.basecampLocationId);
        if (shootingDay.crewParkLocationId) locationIds.add(shootingDay.crewParkLocationId);
        if (shootingDay.techTrucksLocationId) locationIds.add(shootingDay.techTrucksLocationId);
        if (shootingDay.bgHoldingLocationId) locationIds.add(shootingDay.bgHoldingLocationId);
        if (shootingDay.bgParkingLocationId) locationIds.add(shootingDay.bgParkingLocationId);

        // Add shooting day crew contacts
        if (shootingDay.directorCrewId) crewIds.add(shootingDay.directorCrewId);
        if (shootingDay.executiveProducerCrewId) crewIds.add(shootingDay.executiveProducerCrewId);
        if (shootingDay.productionCoordinatorCrewId) crewIds.add(shootingDay.productionCoordinatorCrewId);

        // 3. Fetch all scenes for this project (we need them all for context)
        const scenesQuery = query(
          collection(db, 'scenes'),
          where('projectId', '==', projectId)
        );
        const scenesSnap = await getDocs(scenesQuery);
        const scenes = scenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Fetch shots for the relevant scenes
        const shotsQuery = query(
          collection(db, 'shots'),
          where('projectId', '==', projectId)
        );
        const shotsSnap = await getDocs(shotsQuery);
        const shots = shotsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 5. Fetch ALL cast members for the project (for the call sheet we need all who appear that day)
        const castQuery = query(
          collection(db, 'cast'),
          where('projectId', '==', projectId)
        );
        const castSnap = await getDocs(castQuery);
        const allCast = castSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter to only cast appearing in the day's events
        // But if no castIds in events, get cast from scenes
        let relevantCastIds = new Set(castIds);
        if (relevantCastIds.size === 0) {
          // Get cast from scenes that are scheduled for this day
          events.forEach(event => {
            if (event.sceneId) {
              const scene = scenes.find(s => s.id === event.sceneId) as any;
              scene?.castMemberIds?.forEach((id: string) => relevantCastIds.add(id));
            }
          });
        }
        
        const cast = allCast.filter((c: any) => relevantCastIds.has(c.id) || relevantCastIds.size === 0);

        // 6. Fetch ALL crew members for the project
        const crewQuery = query(
          collection(db, 'crew'),
          where('projectId', '==', projectId)
        );
        const crewSnap = await getDocs(crewQuery);
        const allCrew = crewSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // For call sheets, we typically want all crew
        const crew = allCrew;

        // 7. Fetch locations
        const locationsQuery = query(
          collection(db, 'locations'),
          where('projectId', '==', projectId)
        );
        const locationsSnap = await getDocs(locationsQuery);
        const locations = locationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 8. Fetch equipment
        const equipmentQuery = query(
          collection(db, 'equipment'),
          where('projectId', '==', projectId)
        );
        const equipmentSnap = await getDocs(equipmentQuery);
        const allEquipment = equipmentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const equipment = equipmentIds.size > 0 
          ? allEquipment.filter((e: any) => equipmentIds.has(e.id))
          : [];

        // 9. Calculate weather/sun times
        const sunTimes = getSunTimes(shootingDay.date);
        const weather = {
          high: '', // Would need weather API
          low: '',
          conditions: '',
          ...sunTimes,
        };

        setCallSheet({
          shootingDay,
          events,
          scenes,
          shots,
          cast,
          crew,
          locations,
          equipment,
          weather,
        });
      } catch (err) {
        console.error('Error fetching call sheet data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load call sheet'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallSheetData();
  }, [projectId, shootingDayId]);

  return { callSheet, isLoading, error };
}
