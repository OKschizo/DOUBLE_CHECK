'use client';

/**
 * Keyboard shortcuts legend modal
 */
export function KeyboardShortcutsLegend({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background-primary border border-border-default rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Keyboard Shortcuts</h2>
          {onClose && (
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <ShortcutRow shortcut="N" description="New scene" />
          <ShortcutRow shortcut="S" description="New shot" />
          <ShortcutRow shortcut="D" description="Duplicate shot" />
          <ShortcutRow shortcut="V" description="Create variant" />
          <ShortcutRow shortcut="Delete" description="Delete selected" />
          <ShortcutRow shortcut="Space" description="Toggle slideshow" />
          <ShortcutRow shortcut="← →" description="Navigate shots" />
          <ShortcutRow shortcut="/" description="Search" />
          <ShortcutRow shortcut="Cmd/Ctrl + S" description="Save" />
          <ShortcutRow shortcut="Cmd/Ctrl + Z" description="Undo" />
          <ShortcutRow shortcut="Cmd/Ctrl + Shift + Z" description="Redo" />
          <ShortcutRow shortcut="Cmd/Ctrl + A" description="Select all" />
          <ShortcutRow shortcut="Esc" description="Close modal" />
          <ShortcutRow shortcut="?" description="Show shortcuts" />
        </div>

        <div className="mt-6 pt-6 border-t border-border-subtle text-center">
          <p className="text-sm text-text-secondary">
            Shortcuts are disabled when typing in text fields
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-text-secondary">{description}</span>
      <kbd className="px-3 py-1 bg-background-secondary border border-border-default rounded text-xs font-mono font-semibold text-text-primary">
        {shortcut}
      </kbd>
    </div>
  );
}

