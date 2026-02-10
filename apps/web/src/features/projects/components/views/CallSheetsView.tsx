'use client';

import { useState } from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { CallSheetModal } from './CallSheetModal';
import { useProject } from '@/features/projects/hooks/useProjects';

interface CallSheetsViewProps {
  projectId: string;
}

export function CallSheetsView({ projectId }: CallSheetsViewProps) {
  const { schedule, isLoading } = useSchedule(projectId);
  const { data: project } = useProject(projectId);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showCallSheet, setShowCallSheet] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Call Sheets</h1>
        <p className="text-text-secondary">
          View and manage call sheets for all shooting days
        </p>
      </div>

      {schedule?.days.length === 0 ? (
        <div className="text-center py-12 bg-background-primary border border-border-default rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">No Shooting Days Scheduled</h3>
          <p className="text-text-secondary mb-4">
            Create shooting days in the Schedule tab to generate call sheets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedule?.days.map((day, index) => {
            const dayEvents = schedule.events.filter((e) => e.shootingDayId === day.id);
            const sceneCount = new Set(dayEvents.map((e) => e.sceneId).filter(Boolean)).size;
            
            return (
              <div
                key={day.id}
                className="bg-background-primary border border-border-default rounded-lg p-6 hover:border-accent-primary transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedDayId(day.id);
                  setShowCallSheet(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-accent-primary uppercase tracking-wider mb-1">
                      Day {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      {formatDate(day.date)}
                    </h3>
                    {day.callTime && (
                      <p className="text-sm text-text-secondary">
                        Call Time: {day.callTime}
                      </p>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</span>
                  </div>
                  {sceneCount > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>{sceneCount} scene{sceneCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {day.location && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{day.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border-default">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayId(day.id);
                      setShowCallSheet(true);
                    }}
                    className="w-full px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium flex items-center justify-center gap-2"
                    style={{ color: 'rgb(var(--colored-button-text))' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Call Sheet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Call Sheet Modal */}
      {selectedDayId && (
        <CallSheetModal
          projectId={projectId}
          shootingDayId={selectedDayId}
          isOpen={showCallSheet}
          onClose={() => {
            setShowCallSheet(false);
            setSelectedDayId(null);
          }}
        />
      )}
    </div>
  );
}

