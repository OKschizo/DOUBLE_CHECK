'use client';

import { useState } from 'react';

export interface EventPreset {
  id: string;
  name: string;
  type: 'scene' | 'break' | 'move' | 'prep' | 'wrap' | 'other';
  description: string;
  duration?: number; // in minutes
  icon: string;
  category: 'production' | 'meals' | 'travel' | 'technical' | 'talent' | 'wrap';
}

export const EVENT_PRESETS: EventPreset[] = [
  // Production Events
  { id: 'crew-call', name: 'Crew Call', type: 'prep', description: 'Crew arrival and check-in', duration: 30, icon: '👥', category: 'production' },
  { id: 'production-meeting', name: 'Production Meeting', type: 'prep', description: 'Morning production briefing', duration: 15, icon: '📋', category: 'production' },
  { id: 'safety-meeting', name: 'Safety Meeting', type: 'prep', description: 'Daily safety briefing', duration: 10, icon: '⚠️', category: 'production' },
  { id: 'blocking', name: 'Blocking', type: 'prep', description: 'Scene blocking rehearsal', duration: 30, icon: '🎯', category: 'production' },
  { id: 'rehearsal', name: 'Rehearsal', type: 'prep', description: 'Cast rehearsal', duration: 30, icon: '🎭', category: 'production' },
  { id: 'shoot-scene', name: 'Shoot Scene', type: 'scene', description: 'Principal photography', duration: 60, icon: '🎬', category: 'production' },
  { id: 'pickup-shots', name: 'Pickup Shots', type: 'scene', description: 'Additional coverage/pickups', duration: 30, icon: '📸', category: 'production' },
  { id: 'b-roll', name: 'B-Roll', type: 'scene', description: 'B-roll footage capture', duration: 30, icon: '🎥', category: 'production' },
  { id: 'insert-shots', name: 'Insert Shots', type: 'scene', description: 'Close-up insert shots', duration: 20, icon: '🔍', category: 'production' },
  { id: 'martini-shot', name: 'Martini Shot', type: 'scene', description: 'Final shot of the day', duration: 30, icon: '🍸', category: 'production' },
  
  // Meals & Breaks
  { id: 'breakfast', name: 'Breakfast', type: 'break', description: 'Morning meal', duration: 30, icon: '🍳', category: 'meals' },
  { id: 'lunch', name: 'Lunch', type: 'break', description: 'Midday meal break', duration: 30, icon: '🍽️', category: 'meals' },
  { id: 'second-meal', name: 'Second Meal', type: 'break', description: 'Evening/late meal', duration: 30, icon: '🍴', category: 'meals' },
  { id: 'craft-services', name: 'Craft Services', type: 'break', description: 'Snack/refreshment break', duration: 15, icon: '☕', category: 'meals' },
  { id: 'grace-period', name: 'Grace Period', type: 'break', description: 'Additional break time', duration: 6, icon: '⏰', category: 'meals' },
  { id: 'turnaround', name: 'Turnaround', type: 'break', description: 'Required rest period', duration: 60, icon: '🔄', category: 'meals' },
  
  // Travel & Movement
  { id: 'company-move', name: 'Company Move', type: 'move', description: 'Full crew location change', duration: 60, icon: '🚛', category: 'travel' },
  { id: 'unit-move', name: 'Unit Move', type: 'move', description: 'Partial crew/equipment move', duration: 30, icon: '🚐', category: 'travel' },
  { id: 'travel-time', name: 'Travel Time', type: 'move', description: 'Transit between locations', duration: 45, icon: '🚗', category: 'travel' },
  { id: 'location-scout', name: 'Location Scout', type: 'move', description: 'Pre-shoot location check', duration: 30, icon: '📍', category: 'travel' },
  { id: 'basecamp-move', name: 'Basecamp Setup', type: 'move', description: 'Basecamp relocation', duration: 45, icon: '⛺', category: 'travel' },
  
  // Technical Setup
  { id: 'lighting-setup', name: 'Lighting Setup', type: 'prep', description: 'Lighting rig setup', duration: 45, icon: '💡', category: 'technical' },
  { id: 'camera-setup', name: 'Camera Setup', type: 'prep', description: 'Camera and lens prep', duration: 30, icon: '📷', category: 'technical' },
  { id: 'sound-check', name: 'Sound Check', type: 'prep', description: 'Audio equipment check', duration: 15, icon: '🎙️', category: 'technical' },
  { id: 'lighting-reset', name: 'Lighting Reset', type: 'prep', description: 'Relighting for new setup', duration: 30, icon: '🔆', category: 'technical' },
  { id: 'camera-reset', name: 'Camera Reset', type: 'prep', description: 'Camera repositioning', duration: 15, icon: '🎞️', category: 'technical' },
  { id: 'dolly-track', name: 'Dolly Track Setup', type: 'prep', description: 'Dolly track installation', duration: 30, icon: '🛤️', category: 'technical' },
  { id: 'crane-setup', name: 'Crane/Jib Setup', type: 'prep', description: 'Crane or jib arm setup', duration: 45, icon: '🏗️', category: 'technical' },
  { id: 'steadicam', name: 'Steadicam Setup', type: 'prep', description: 'Steadicam rig preparation', duration: 20, icon: '🎬', category: 'technical' },
  { id: 'drone-flight', name: 'Drone Flight', type: 'scene', description: 'Aerial drone footage', duration: 30, icon: '🚁', category: 'technical' },
  { id: 'vfx-plates', name: 'VFX Plates', type: 'scene', description: 'Visual effects plate capture', duration: 30, icon: '✨', category: 'technical' },
  { id: 'data-wrangling', name: 'Data Wrangling', type: 'other', description: 'Media backup and check', duration: 30, icon: '💾', category: 'technical' },
  
  // Talent Related
  { id: 'talent-call', name: 'Talent Call', type: 'prep', description: 'Cast arrival time', duration: 15, icon: '⭐', category: 'talent' },
  { id: 'hair-makeup', name: 'Hair & Makeup', type: 'prep', description: 'Hair and makeup application', duration: 60, icon: '💄', category: 'talent' },
  { id: 'wardrobe', name: 'Wardrobe', type: 'prep', description: 'Costume fitting/change', duration: 30, icon: '👔', category: 'talent' },
  { id: 'prosthetics', name: 'Prosthetics/SFX Makeup', type: 'prep', description: 'Special effects makeup', duration: 120, icon: '🎭', category: 'talent' },
  { id: 'stunt-rehearsal', name: 'Stunt Rehearsal', type: 'prep', description: 'Stunt coordination practice', duration: 60, icon: '🤸', category: 'talent' },
  { id: 'stunt-setup', name: 'Stunt Setup', type: 'prep', description: 'Stunt rigging and safety', duration: 45, icon: '🦺', category: 'talent' },
  { id: 'cast-break', name: 'Cast Break', type: 'break', description: 'Rest period for talent', duration: 15, icon: '☕', category: 'talent' },
  { id: 'talent-wrap', name: 'Talent Wrap', type: 'wrap', description: 'Cast release', duration: 15, icon: '👋', category: 'talent' },
  
  // Wrap Events
  { id: 'crew-wrap', name: 'Crew Wrap', type: 'wrap', description: 'End of day crew release', duration: 15, icon: '🏁', category: 'wrap' },
  { id: 'equipment-wrap', name: 'Equipment Wrap', type: 'wrap', description: 'Equipment pack and store', duration: 45, icon: '📦', category: 'wrap' },
  { id: 'camera-wrap', name: 'Camera Wrap', type: 'wrap', description: 'Camera equipment pack', duration: 30, icon: '📷', category: 'wrap' },
  { id: 'lighting-wrap', name: 'Lighting Wrap', type: 'wrap', description: 'Lighting equipment pack', duration: 45, icon: '💡', category: 'wrap' },
  { id: 'location-wrap', name: 'Location Wrap', type: 'wrap', description: 'Location cleanup/restore', duration: 30, icon: '🏠', category: 'wrap' },
  { id: 'final-checks', name: 'Final Checks', type: 'wrap', description: 'End of day review', duration: 15, icon: '✅', category: 'wrap' },
];

// Category labels and colors
export const EVENT_CATEGORIES = {
  production: { label: 'Production', color: 'bg-blue-500/20 text-blue-400' },
  meals: { label: 'Meals & Breaks', color: 'bg-yellow-500/20 text-yellow-400' },
  travel: { label: 'Travel & Movement', color: 'bg-purple-500/20 text-purple-400' },
  technical: { label: 'Technical', color: 'bg-green-500/20 text-green-400' },
  talent: { label: 'Talent', color: 'bg-pink-500/20 text-pink-400' },
  wrap: { label: 'Wrap', color: 'bg-red-500/20 text-red-400' },
};

interface EventPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preset: EventPreset, time: string) => void;
}

export function EventPresetsModal({ isOpen, onClose, onSelect }: EventPresetsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredPresets = EVENT_PRESETS.filter(preset => {
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedPresets = filteredPresets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, EventPreset[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Add Event from Presets</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">✕</button>
        </div>

        {/* Time Selection */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border-default">
          <label className="text-sm font-medium text-text-secondary">Start Time:</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          />
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(EVENT_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedPresets).map(([category, presets]) => (
            <div key={category} className="mb-6">
              <h3 className={`text-sm font-semibold mb-3 px-2 py-1 rounded inline-block ${EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]?.color || ''}`}>
                {EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]?.label || category}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSelect(preset, selectedTime)}
                    className="p-3 bg-background-secondary border border-border-default rounded-lg hover:border-accent-primary hover:bg-accent-primary/5 text-left transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary text-sm group-hover:text-accent-primary truncate">
                          {preset.name}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">{preset.description}</p>
                        {preset.duration && (
                          <p className="text-xs text-text-secondary mt-1">{preset.duration} min</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border-default flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to get default events for a template
export function getTemplateEvents(templateId: string): { preset: EventPreset; time: string }[] {
  switch (templateId) {
    case 'standard':
      return [
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-call')!, time: '07:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'production-meeting')!, time: '07:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'safety-meeting')!, time: '07:45' },
        { preset: EVENT_PRESETS.find(p => p.id === 'talent-call')!, time: '08:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'hair-makeup')!, time: '08:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'lunch')!, time: '13:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'martini-shot')!, time: '18:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-wrap')!, time: '19:00' },
      ].filter(e => e.preset);
    case 'early-call':
      return [
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-call')!, time: '05:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'safety-meeting')!, time: '05:15' },
        { preset: EVENT_PRESETS.find(p => p.id === 'talent-call')!, time: '05:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'lunch')!, time: '11:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-wrap')!, time: '17:00' },
      ].filter(e => e.preset);
    case 'night-shoot':
      return [
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-call')!, time: '18:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'production-meeting')!, time: '18:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'talent-call')!, time: '19:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'second-meal')!, time: '00:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-wrap')!, time: '06:00' },
      ].filter(e => e.preset);
    case 'half-day':
      return [
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-call')!, time: '08:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'safety-meeting')!, time: '08:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'talent-call')!, time: '09:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-wrap')!, time: '15:00' },
      ].filter(e => e.preset);
    case 'company-move':
      return [
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-call')!, time: '06:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'company-move')!, time: '12:00' },
        { preset: EVENT_PRESETS.find(p => p.id === 'lunch')!, time: '12:30' },
        { preset: EVENT_PRESETS.find(p => p.id === 'crew-wrap')!, time: '18:00' },
      ].filter(e => e.preset);
    default:
      return [];
  }
}
