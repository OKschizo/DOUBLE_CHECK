/**
 * Keyboard shortcuts for scenes and storyboard
 * Provides power user productivity features
 */

import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onNewScene?: () => void;
  onNewShot?: () => void;
  onDuplicateShot?: () => void;
  onCreateVariant?: () => void;
  onDeleteSelected?: () => void;
  onToggleSlideshow?: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
  onSelectAll?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true';

      // Cmd/Ctrl modifiers
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Prevent default for our shortcuts
      const preventDefault = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      // Single key shortcuts (only when not typing)
      if (!isTyping) {
        switch (e.key.toLowerCase()) {
          case 'n':
            if (handlers.onNewScene) {
              preventDefault();
              handlers.onNewScene();
            }
            break;
          case 's':
            if (handlers.onNewShot) {
              preventDefault();
              handlers.onNewShot();
            }
            break;
          case 'd':
            if (handlers.onDuplicateShot) {
              preventDefault();
              handlers.onDuplicateShot();
            }
            break;
          case 'v':
            if (handlers.onCreateVariant) {
              preventDefault();
              handlers.onCreateVariant();
            }
            break;
          case 'delete':
          case 'backspace':
            if (e.key === 'Delete' && handlers.onDeleteSelected) {
              preventDefault();
              handlers.onDeleteSelected();
            }
            break;
          case ' ':
            if (handlers.onToggleSlideshow) {
              preventDefault();
              handlers.onToggleSlideshow();
            }
            break;
          case 'arrowleft':
            if (handlers.onNavigatePrev) {
              preventDefault();
              handlers.onNavigatePrev();
            }
            break;
          case 'arrowright':
            if (handlers.onNavigateNext) {
              preventDefault();
              handlers.onNavigateNext();
            }
            break;
          case '/':
            if (handlers.onSearch) {
              preventDefault();
              handlers.onSearch();
            }
            break;
        }
      }

      // Cmd/Ctrl shortcuts (work even when typing in some cases)
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 's':
            if (handlers.onSave) {
              preventDefault();
              handlers.onSave();
            }
            break;
          case 'z':
            if (isShift && handlers.onRedo) {
              preventDefault();
              handlers.onRedo();
            } else if (handlers.onUndo) {
              preventDefault();
              handlers.onUndo();
            }
            break;
          case 'a':
            if (handlers.onSelectAll) {
              preventDefault();
              handlers.onSelectAll();
            }
            break;
        }
      }

      // Escape always works
      if (e.key === 'Escape') {
        // Handled by individual modals/components
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}

