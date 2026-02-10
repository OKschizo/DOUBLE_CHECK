'use client';

import { useState } from 'react';
import type { Scene } from '@/lib/schemas';

interface ContinuityPanelProps {
  scene: Scene;
  previousScene?: Scene;
  nextScene?: Scene;
  onUpdateContinuity: (sceneId: string, continuityData: any) => Promise<void>;
}

interface ContinuityNote {
  category: 'wardrobe' | 'props' | 'hair_makeup' | 'time_of_day' | 'weather' | 'other';
  description: string;
  photoUrl?: string;
}

export function ContinuityPanel({
  scene,
  previousScene,
  nextScene,
  onUpdateContinuity,
}: ContinuityPanelProps) {
  const [continuityNotes, setContinuityNotes] = useState<ContinuityNote[]>(
    (scene as any).continuityNotes || []
  );
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState<ContinuityNote>({
    category: 'wardrobe',
    description: '',
  });

  const handleAddNote = () => {
    if (!newNote.description.trim()) return;
    
    const updated = [...continuityNotes, newNote];
    setContinuityNotes(updated);
    onUpdateContinuity(scene.id, { continuityNotes: updated });
    
    setNewNote({ category: 'wardrobe', description: '' });
    setShowAddNote(false);
  };

  const handleRemoveNote = (index: number) => {
    const updated = continuityNotes.filter((_, i) => i !== index);
    setContinuityNotes(updated);
    onUpdateContinuity(scene.id, { continuityNotes: updated });
  };

  // Check for continuity issues
  const checkContinuityIssues = () => {
    const issues: Array<{ type: string; description: string; severity: 'warning' | 'error' }> = [];

    if (previousScene) {
      // Time of day check
      if (scene.dayNight && previousScene.dayNight && scene.dayNight !== previousScene.dayNight) {
        const timeOrder = ['DAWN', 'DAY', 'DUSK', 'NIGHT'];
        const currentIndex = timeOrder.indexOf(scene.dayNight.toUpperCase());
        const prevIndex = timeOrder.indexOf(previousScene.dayNight.toUpperCase());
        
        if (currentIndex < prevIndex) {
          issues.push({
            type: 'Time Jump',
            description: `Time goes from ${previousScene.dayNight} to ${scene.dayNight}`,
            severity: 'warning',
          });
        }
      }

      // Location continuity
      const prevLocation = previousScene.locationNames?.[0] || previousScene.locationName;
      const currLocation = scene.locationNames?.[0] || scene.locationName;
      
      if (prevLocation && currLocation && prevLocation === currLocation) {
        issues.push({
          type: 'Same Location',
          description: `Both scenes at ${currLocation}`,
          severity: 'warning',
        });
      }
    }

    return issues;
  };

  const issues = checkContinuityIssues();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wardrobe': return '👕';
      case 'props': return '🎬';
      case 'hair_makeup': return '💄';
      case 'time_of_day': return '🌅';
      case 'weather': return '🌤';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Continuity Issues */}
      {issues.length > 0 && (
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span>⚠️</span>
            <span>Continuity Checks</span>
          </h3>
          <div className="space-y-2">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm ${
                  issue.severity === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                }`}
              >
                <div className="font-semibold">{issue.type}</div>
                <div className="text-xs mt-1 opacity-90">{issue.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continuity Notes */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">Continuity Notes</h3>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="btn-secondary text-xs"
          >
            + Add Note
          </button>
        </div>

        {/* Add Note Form */}
        {showAddNote && (
          <div className="mb-4 p-4 bg-background-secondary rounded-lg border border-border-default">
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({ ...newNote, category: e.target.value as any })}
              className="input-field mb-2 text-sm"
            >
              <option value="wardrobe">Wardrobe</option>
              <option value="props">Props</option>
              <option value="hair_makeup">Hair & Makeup</option>
              <option value="time_of_day">Time of Day</option>
              <option value="weather">Weather</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={newNote.description}
              onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
              placeholder="Describe continuity detail..."
              className="input-field mb-2 text-sm"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button onClick={handleAddNote} className="btn-primary text-xs">
                Save Note
              </button>
              <button onClick={() => setShowAddNote(false)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-2">
          {continuityNotes.length === 0 ? (
            <p className="text-sm text-text-tertiary italic">No continuity notes yet</p>
          ) : (
            continuityNotes.map((note, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg border border-border-subtle"
              >
                <span className="text-2xl">{getCategoryIcon(note.category)}</span>
                <div className="flex-1">
                  <div className="text-xs text-accent-primary font-semibold capitalize mb-1">
                    {note.category.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-text-primary">{note.description}</div>
                </div>
                <button
                  onClick={() => handleRemoveNote(index)}
                  className="text-text-tertiary hover:text-error"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-text-primary mb-3">Scene Context</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {previousScene && (
            <div className="p-3 bg-background-secondary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">← Previous</div>
              <div className="font-semibold text-text-primary">
                Scene {previousScene.sceneNumber}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {previousScene.dayNight} · {previousScene.locationName}
              </div>
            </div>
          )}
          {nextScene && (
            <div className="p-3 bg-background-secondary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">Next →</div>
              <div className="font-semibold text-text-primary">
                Scene {nextScene.sceneNumber}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {nextScene.dayNight} · {nextScene.locationName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

