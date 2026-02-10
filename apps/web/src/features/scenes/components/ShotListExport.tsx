'use client';

import { useState } from 'react';
import type { Scene } from '@/lib/schemas';

interface ShotListExportProps {
  scenes: Scene[];
  shots: any[];
  shootingDays: any[];
  castMembers: any[];
  equipment: any[];
  projectTitle: string;
  onClose: () => void;
}

export function ShotListExport({
  scenes,
  shots,
  shootingDays,
  castMembers,
  equipment,
  projectTitle,
  onClose,
}: ShotListExportProps) {
  const [groupBy, setGroupBy] = useState<'scene' | 'day' | 'location'>('day');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    // This will be implemented with a PDF library like jsPDF or react-pdf
    // For now, generate HTML that can be printed
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate shot list');
      setIsGenerating(false);
      return;
    }

    const html = generateShotListHTML();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    
    setIsGenerating(false);
  };

  const generateShotListHTML = () => {
    let content = '';
    
    if (groupBy === 'day') {
      // Group by shooting day
      shootingDays.forEach((day: any) => {
        const dayShots = shots.filter((shot: any) => 
          shot.shootingDayIds?.includes(day.id)
        );
        
        if (dayShots.length === 0) return;
        
        content += `
          <div class="page-break">
            <h2>Day ${day.dayNumber} - ${new Date(day.date).toLocaleDateString()}</h2>
            <p><strong>Location:</strong> ${day.location || 'TBD'}</p>
            <p><strong>Call Time:</strong> ${day.callTime || 'TBD'}</p>
            <table>
              <thead>
                <tr>
                  <th>Shot</th>
                  <th>Scene</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Setup</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${dayShots.map((shot: any) => {
                  const scene = scenes.find(s => s.id === shot.sceneId);
                  return `
                    <tr>
                      <td><strong>${shot.shotNumber}</strong></td>
                      <td>${scene?.sceneNumber || ''}</td>
                      <td>${shot.shotType || ''}</td>
                      <td>${shot.description || shot.actionDescription || ''}</td>
                      <td>${shot.lens || ''} ${shot.movement ? '· ' + shot.movement : ''}</td>
                      <td>${shot.duration || ''}s</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      });
    } else if (groupBy === 'scene') {
      // Group by scene
      scenes.forEach((scene) => {
        const sceneShots = shots.filter((shot: any) => shot.sceneId === scene.id);
        
        if (sceneShots.length === 0) return;
        
        content += `
          <div class="scene-section">
            <h2>Scene ${scene.sceneNumber}: ${scene.title || scene.description || ''}</h2>
            <p><strong>${scene.intExt}. ${scene.locationName || ''} - ${scene.dayNight}</strong></p>
            <table>
              <thead>
                <tr>
                  <th>Shot</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Camera</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${sceneShots.map((shot: any) => `
                  <tr>
                    <td><strong>${shot.shotNumber}</strong></td>
                    <td>${shot.shotType || ''}</td>
                    <td>${shot.description || shot.actionDescription || ''}</td>
                    <td>${shot.cameraAngle || ''}<br/>${shot.lens || ''}</td>
                    <td>${shot.duration || ''}s</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${projectTitle} - Shot List</title>
        <style>
          @media print {
            .page-break { page-break-after: always; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            margin-top: 30px;
            margin-bottom: 15px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .scene-section {
            margin-bottom: 40px;
          }
        </style>
      </head>
      <body>
        <h1>${projectTitle} - SHOT LIST</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        ${content}
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background-primary border border-border-default rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Export Shot List</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Group By
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="input-field"
            >
              <option value="day">Shooting Day</option>
              <option value="scene">Scene Number</option>
              <option value="location">Location</option>
            </select>
          </div>

          <div className="p-4 bg-background-secondary rounded-lg border border-border-default">
            <h3 className="font-semibold text-text-primary mb-2">Shot List Preview</h3>
            <div className="text-sm text-text-secondary space-y-1">
              <p>• {scenes.length} scenes</p>
              <p>• {shots.length} shots</p>
              <p>• Grouped by {groupBy}</p>
              <p>• Professional print format</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="btn-primary flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Generate & Print</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

