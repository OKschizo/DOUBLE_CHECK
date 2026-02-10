'use client';

import { useState, useRef, useEffect } from 'react';

interface AnnotationToolsProps {
  imageUrl: string;
  onSave: (annotatedImageData: string) => Promise<void>;
  onClose: () => void;
}

type Tool = 'pen' | 'arrow' | 'rectangle' | 'text' | 'eraser';
type AspectRatio = '16:9' | '2.35:1' | '1.85:1' | '4:3' | 'none';

export function AnnotationTools({ imageUrl, onSave, onClose }: AnnotationToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Draw aspect ratio guides if enabled
      if (showGuides && aspectRatio !== 'none') {
        drawAspectRatioGuides(ctx, canvas.width, canvas.height, aspectRatio);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, aspectRatio, showGuides]);

  const drawAspectRatioGuides = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ratio: AspectRatio
  ) => {
    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);

    let guideWidth = width;
    let guideHeight = height;

    if (ratio === '16:9') {
      guideHeight = (width / 16) * 9;
    } else if (ratio === '2.35:1') {
      guideHeight = width / 2.35;
    } else if (ratio === '1.85:1') {
      guideHeight = width / 1.85;
    } else if (ratio === '4:3') {
      guideHeight = (width / 4) * 3;
    }

    const offsetY = (height - guideHeight) / 2;
    ctx.strokeRect(0, offsetY, guideWidth, guideHeight);

    // Rule of thirds
    ctx.strokeStyle = '#FFD700';
    ctx.globalAlpha = 0.5;
    // Vertical thirds
    ctx.beginPath();
    ctx.moveTo(width / 3, offsetY);
    ctx.lineTo(width / 3, offsetY + guideHeight);
    ctx.moveTo((width * 2) / 3, offsetY);
    ctx.lineTo((width * 2) / 3, offsetY + guideHeight);
    // Horizontal thirds
    ctx.moveTo(0, offsetY + guideHeight / 3);
    ctx.lineTo(width, offsetY + guideHeight / 3);
    ctx.moveTo(0, offsetY + (guideHeight * 2) / 3);
    ctx.lineTo(width, offsetY + (guideHeight * 2) / 3);
    ctx.stroke();

    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'arrow') {
      // Draw arrow (simplified)
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x - 10, y - 10);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 10);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await onSave(dataUrl);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (!confirm('Clear all annotations?')) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reload original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Toolbar */}
      <div className="bg-background-primary border-b border-border-default p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded ${tool === 'pen' ? 'bg-accent-primary text-white' : 'hover:bg-background-secondary'}`}
              title="Pen Tool"
            >
              ✏️
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`p-2 rounded ${tool === 'arrow' ? 'bg-accent-primary text-white' : 'hover:bg-background-secondary'}`}
              title="Arrow Tool"
            >
              ↗️
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded ${tool === 'rectangle' ? 'bg-accent-primary text-white' : 'hover:bg-background-secondary'}`}
              title="Rectangle"
            >
              ▭
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded ${tool === 'text' ? 'bg-accent-primary text-white' : 'hover:bg-background-secondary'}`}
              title="Text"
            >
              T
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded ${tool === 'eraser' ? 'bg-accent-primary text-white' : 'hover:bg-background-secondary'}`}
              title="Eraser"
            >
              🧹
            </button>
          </div>

          {/* Color */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />

          {/* Line Width */}
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="input-field py-1 text-sm"
          >
            <option value="1">Thin</option>
            <option value="3">Normal</option>
            <option value="5">Thick</option>
            <option value="10">Very Thick</option>
          </select>

          {/* Aspect Ratio */}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="input-field py-1 text-sm"
          >
            <option value="none">No Guides</option>
            <option value="16:9">16:9</option>
            <option value="2.35:1">2.35:1 (Scope)</option>
            <option value="1.85:1">1.85:1</option>
            <option value="4:3">4:3</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            <span>Rule of Thirds</span>
          </label>

          <button onClick={handleClear} className="btn-secondary text-sm">
            Clear All
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Annotations'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="max-w-full max-h-full border border-border-default shadow-2xl cursor-crosshair"
        />
      </div>
    </div>
  );
}

