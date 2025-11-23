'use client';

import React from 'react';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';
import type { ReferenceImage } from '@/lib/schemas';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';

interface ReferenceImageModalProps {
  reference: ReferenceImage;
  projectId: string;
  onClose: () => void;
  onViewShot?: (shotId: string, sceneId: string) => void;
}

export function ReferenceImageModal({
  reference,
  projectId,
  onClose,
  onViewShot,
}: ReferenceImageModalProps) {
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: shots = [], isLoading } = trpc.referenceImages.getShotsByReference.useQuery({
    referenceId: reference.id,
    projectId,
  });
  const terminology = getProjectTerminology(project?.projectType);

  const categoryLabels: Record<string, string> = {
    wardrobe: 'Wardrobe',
    camera: 'Camera',
    location: 'Location',
    character: 'Character',
    other: 'Other',
  };

  const handleShotClick = (shotId: string, sceneId: string) => {
    if (onViewShot) {
      onViewShot(shotId, sceneId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary mb-2">{reference.name}</h2>
            {reference.category && (
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded capitalize bg-background-tertiary text-text-secondary">
                {categoryLabels[reference.category] || reference.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative w-full aspect-square bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <Image
                src={reference.url}
                alt={reference.name}
                fill
                className="object-contain"
                unoptimized={isFirebaseStorageUrl(reference.url)}
              />
            </div>

            {/* Shots List */}
            <div>
              <h3 className="text-lg font-semibold text-accent-primary mb-4">
                Used in {terminology.shots.plural} ({shots.length})
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
                  </div>
                </div>
              ) : shots.length === 0 ? (
                <div className="text-center py-8 text-sm text-text-tertiary">
                  This reference is not currently used in any {terminology.shots.plural.toLowerCase()}.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {shots.map((shot) => (
                    <button
                      key={shot.id}
                      onClick={() => handleShotClick(shot.id, shot.sceneId)}
                      className="w-full text-left p-3 bg-background-secondary hover:bg-background-tertiary rounded-lg border border-border-default hover:border-accent-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-text-primary">
                              {terminology.shots.singular} {shot.shotNumber}
                            </span>
                            {shot.title && (
                              <span className="text-sm text-text-secondary">- {shot.title}</span>
                            )}
                          </div>
                          {shot.description && (
                            <p className="text-sm text-text-tertiary line-clamp-2 mt-1">
                              {shot.description}
                            </p>
                          )}
                          {shot.shotType && (
                            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-background-tertiary rounded capitalize text-text-secondary">
                              {shot.shotType.replace('-', ' ')}
                            </span>
                          )}
                        </div>
                        <svg 
                          className="w-5 h-5 text-text-tertiary group-hover:text-accent-primary transition-colors flex-shrink-0 ml-2" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {reference.tags && reference.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border-default">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {reference.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-background-tertiary rounded text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

