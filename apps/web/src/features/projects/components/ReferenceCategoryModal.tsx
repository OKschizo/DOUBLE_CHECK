'use client';

import React from 'react';

interface ReferenceCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: 'wardrobe' | 'camera' | 'location' | 'character' | 'other') => void;
  imageUrl: string;
}

export function ReferenceCategoryModal({ isOpen, onClose, onSelectCategory, imageUrl }: ReferenceCategoryModalProps) {
  if (!isOpen) return null;

  const categories = [
    { id: 'wardrobe', label: 'Wardrobe', icon: '👕' },
    { id: 'camera', label: 'Camera', icon: '🎥' },
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'character', label: 'Character', icon: '👤' },
    { id: 'other', label: 'Other', icon: '🔖' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background-primary rounded-xl shadow-xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-text-primary mb-2">Add Reference Image</h3>
          <p className="text-sm text-text-secondary mb-6">
            Select a category for this reference image.
          </p>

          <div className="mb-6 rounded-lg overflow-hidden border border-border-default aspect-video relative">
            {/* Simple preview */}
            <img src={imageUrl} alt="Reference Preview" className="object-cover w-full h-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border-default hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-medium text-text-primary">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 bg-background-secondary border-t border-border-default flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

