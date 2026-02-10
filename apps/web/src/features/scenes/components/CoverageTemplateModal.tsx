'use client';

import { useState } from 'react';
import { coverageTemplates, getRecommendedTemplates, type CoverageTemplate } from '../templates/shotCoverageTemplates';
import type { Scene } from '@/lib/schemas';

interface CoverageTemplateModalProps {
  scene: Scene;
  onClose: () => void;
  onApply: (template: CoverageTemplate) => Promise<void>;
}

export function CoverageTemplateModal({ scene, onClose, onApply }: CoverageTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CoverageTemplate | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const recommendedTemplates = getRecommendedTemplates(scene);
  const displayTemplates = showAllTemplates ? coverageTemplates : recommendedTemplates;

  const handleApply = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    try {
      await onApply(selectedTemplate);
      onClose();
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply coverage template');
    } finally {
      setIsApplying(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dialogue': return '💬';
      case 'action': return '⚡';
      case 'interview': return '🎤';
      case 'product': return '📦';
      case 'standard': return '🎬';
      default: return '🎬';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background-primary border border-border-default rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-text-primary">Apply Coverage Template</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-background-secondary rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-text-secondary">
            Scene {scene.sceneNumber}: {scene.title || scene.description}
          </p>
          {!showAllTemplates && (
            <p className="text-sm text-accent-primary mt-2">
              ✨ Showing recommended templates based on your scene
            </p>
          )}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`
                    cursor-pointer rounded-lg border-2 p-4 transition-all
                    ${isSelected 
                      ? 'border-accent-primary bg-accent-primary/10 shadow-lg scale-105' 
                      : 'border-border-default hover:border-accent-primary/50 hover:shadow-md'
                    }
                  `}
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                        <h3 className="font-bold text-text-primary">{template.name}</h3>
                      </div>
                      <p className="text-sm text-text-secondary">{template.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Shot Count */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-background-secondary rounded text-xs font-semibold text-text-primary">
                      {template.shots.length} shots
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {template.shots.filter(s => s.isMaster).length} master · {' '}
                      {template.shots.filter(s => s.coverageType === 'medium').length} medium · {' '}
                      {template.shots.filter(s => s.coverageType === 'closeup').length} CU
                    </span>
                  </div>

                  {/* Shot List Preview */}
                  <div className="space-y-1">
                    {template.shots.slice(0, 3).map((shot, idx) => (
                      <div key={idx} className="text-xs text-text-secondary flex items-center gap-2">
                        <span className="font-mono font-bold text-accent-primary">{shot.shotNumber}</span>
                        <span className="truncate">{shot.shotType} - {shot.cameraAngle}</span>
                      </div>
                    ))}
                    {template.shots.length > 3 && (
                      <div className="text-xs text-text-tertiary italic">
                        +{template.shots.length - 3} more shots...
                      </div>
                    )}
                  </div>

                  {/* Recommended For */}
                  {template.recommendedFor.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <div className="text-xs text-text-tertiary">Best for:</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {template.recommendedFor.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show All Toggle */}
          {!showAllTemplates && recommendedTemplates.length < coverageTemplates.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllTemplates(true)}
                className="text-sm text-accent-primary hover:underline"
              >
                Show all {coverageTemplates.length} templates →
              </button>
            </div>
          )}
        </div>

        {/* Selected Template Details */}
        {selectedTemplate && (
          <div className="border-t border-border-default bg-background-secondary p-6">
            <h4 className="font-semibold text-text-primary mb-3">
              {selectedTemplate.name} - Shot Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-48 overflow-y-auto">
              {selectedTemplate.shots.map((shot, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-background-primary rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center font-bold text-accent-primary text-sm">
                    {shot.shotNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-text-primary">
                      {shot.shotType} - {shot.cameraAngle}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {shot.lens && `${shot.lens} · `}
                      {shot.movement && `${shot.movement} · `}
                      {shot.duration}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-default flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {selectedTemplate ? (
              <>
                Will create <span className="font-bold text-text-primary">{selectedTemplate.shots.length} shots</span> for this scene
              </>
            ) : (
              'Select a template to continue'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTemplate || isApplying}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Shots...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

