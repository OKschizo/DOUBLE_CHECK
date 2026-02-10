'use client';

import { useState, useMemo } from 'react';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';
import { useBudgetFringes } from '../hooks/useBudgetFringes';

interface BudgetExportProps {
  projectId: string;
  projectName?: string;
  categories: BudgetCategory[];
  items: BudgetItem[];
  totalBudget?: number;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';
type ExportScope = 'full' | 'summary' | 'categories' | 'items';

export function BudgetExport({ 
  projectId,
  projectName = 'Budget',
  categories, 
  items, 
  totalBudget,
  onClose 
}: BudgetExportProps) {
  const { fringes, totalFringeRate, calculateFringes } = useBudgetFringes(projectId);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('full');
  const [includeFringes, setIncludeFringes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    const laborTotal = items
      .filter(item => item.linkedCrewMemberId || item.linkedCastMemberId)
      .reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const fringeCalculation = calculateFringes(laborTotal);
    
    return {
      totalEstimated,
      totalActual,
      variance: totalEstimated - totalActual,
      laborTotal,
      fringeTotal: fringeCalculation.totalFringes,
      grandTotal: totalEstimated + fringeCalculation.totalFringes,
    };
  }, [items, calculateFringes]);

  // Generate CSV content
  const generateCSV = (): string => {
    const lines: string[] = [];
    const formatCurrency = (n: number) => n.toFixed(2);
    
    // Header
    lines.push(`"${projectName} - Budget Export"`);
    lines.push(`"Generated: ${new Date().toLocaleString()}"`);
    lines.push('');
    
    if (scope === 'full' || scope === 'summary') {
      // Summary section
      lines.push('"BUDGET SUMMARY"');
      lines.push(`"Total Approved Budget","$${formatCurrency(totalBudget || 0)}"`);
      lines.push(`"Total Estimated","$${formatCurrency(totals.totalEstimated)}"`);
      lines.push(`"Total Actual","$${formatCurrency(totals.totalActual)}"`);
      lines.push(`"Variance","$${formatCurrency(totals.variance)}"`);
      if (includeFringes && fringes.length > 0) {
        lines.push(`"Labor Total","$${formatCurrency(totals.laborTotal)}"`);
        lines.push(`"Fringe Rate","${totalFringeRate.toFixed(2)}%"`);
        lines.push(`"Total Fringes","$${formatCurrency(totals.fringeTotal)}"`);
        lines.push(`"Grand Total (with Fringes)","$${formatCurrency(totals.grandTotal)}"`);
      }
      lines.push('');
    }
    
    if (scope === 'full' || scope === 'categories') {
      // Categories section
      lines.push('"CATEGORIES"');
      lines.push('"Category","Estimated","Actual","Variance","Item Count"');
      categories.forEach(cat => {
        const categoryItems = items.filter(item => item.categoryId === cat.id);
        const estimated = categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
        const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
        lines.push(`"${cat.name}","$${formatCurrency(estimated)}","$${formatCurrency(actual)}","$${formatCurrency(estimated - actual)}","${categoryItems.length}"`);
      });
      lines.push('');
    }
    
    if (scope === 'full' || scope === 'items') {
      // Items section
      lines.push('"LINE ITEMS"');
      lines.push('"Category","Description","Estimated","Actual","Variance","Status","Unit","Quantity","Unit Rate"');
      items.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        lines.push(
          `"${category?.name || 'Uncategorized'}",` +
          `"${item.description}",` +
          `"$${formatCurrency(item.estimatedAmount || 0)}",` +
          `"$${formatCurrency(item.actualAmount || 0)}",` +
          `"$${formatCurrency((item.estimatedAmount || 0) - (item.actualAmount || 0))}",` +
          `"${item.status || 'estimated'}",` +
          `"${item.unit || ''}",` +
          `"${item.quantity || 1}",` +
          `"$${formatCurrency(item.unitRate || 0)}"`
        );
      });
      lines.push('');
    }
    
    if (includeFringes && fringes.length > 0 && (scope === 'full' || scope === 'summary')) {
      // Fringes section
      lines.push('"FRINGE RATES"');
      lines.push('"Name","Type","Rate","Enabled"');
      fringes.forEach(fringe => {
        lines.push(`"${fringe.name}","${fringe.type}","${fringe.rate}%","${fringe.enabled ? 'Yes' : 'No'}"`);
      });
    }
    
    return lines.join('\n');
  };

  // Generate Excel XML (simple SpreadsheetML)
  const generateExcelXML = (): string => {
    const formatCurrency = (n: number) => n.toFixed(2);
    
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="Header">
<Font ss:Bold="1"/>
<Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="Currency">
<NumberFormat ss:Format="$#,##0.00"/>
</Style>
<Style ss:ID="Title">
<Font ss:Size="14" ss:Bold="1"/>
</Style>
</Styles>
<Worksheet ss:Name="Budget Summary">
<Table>
<Row><Cell ss:StyleID="Title"><Data ss:Type="String">${projectName} - Budget</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString()}</Data></Cell></Row>
<Row></Row>
<Row><Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Total Approved Budget</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalBudget || 0}</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Total Estimated</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.totalEstimated}</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Total Actual</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.totalActual}</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Variance</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.variance}</Data></Cell></Row>
${includeFringes && fringes.length > 0 ? `
<Row><Cell><Data ss:Type="String">Labor Total</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.laborTotal}</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Fringe Rate</Data></Cell><Cell><Data ss:Type="String">${totalFringeRate.toFixed(2)}%</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Total Fringes</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.fringeTotal}</Data></Cell></Row>
<Row><Cell><Data ss:Type="String">Grand Total (with Fringes)</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${totals.grandTotal}</Data></Cell></Row>
` : ''}
</Table>
</Worksheet>
<Worksheet ss:Name="Categories">
<Table>
<Row>
<Cell ss:StyleID="Header"><Data ss:Type="String">Category</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Estimated</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Actual</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Variance</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Items</Data></Cell>
</Row>
${categories.map(cat => {
  const categoryItems = items.filter(item => item.categoryId === cat.id);
  const estimated = categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
  const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  return `<Row>
<Cell><Data ss:Type="String">${cat.name}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${estimated}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${actual}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${estimated - actual}</Data></Cell>
<Cell><Data ss:Type="Number">${categoryItems.length}</Data></Cell>
</Row>`;
}).join('\n')}
</Table>
</Worksheet>
<Worksheet ss:Name="Line Items">
<Table>
<Row>
<Cell ss:StyleID="Header"><Data ss:Type="String">Category</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Description</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Estimated</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Actual</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Variance</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Unit</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Quantity</Data></Cell>
<Cell ss:StyleID="Header"><Data ss:Type="String">Unit Rate</Data></Cell>
</Row>
${items.map(item => {
  const category = categories.find(c => c.id === item.categoryId);
  return `<Row>
<Cell><Data ss:Type="String">${category?.name || 'Uncategorized'}</Data></Cell>
<Cell><Data ss:Type="String">${item.description}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.estimatedAmount || 0}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.actualAmount || 0}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${(item.estimatedAmount || 0) - (item.actualAmount || 0)}</Data></Cell>
<Cell><Data ss:Type="String">${item.status || 'estimated'}</Data></Cell>
<Cell><Data ss:Type="String">${item.unit || ''}</Data></Cell>
<Cell><Data ss:Type="Number">${item.quantity || 1}</Data></Cell>
<Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.unitRate || 0}</Data></Cell>
</Row>`;
}).join('\n')}
</Table>
</Worksheet>
</Workbook>`;
    
    return xml;
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let filename: string;
      let mimeType: string;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const safeProjectName = (projectName || 'Budget').replace(/[^a-zA-Z0-9]/g, '_');
      
      switch (format) {
        case 'csv':
          content = generateCSV();
          filename = `${safeProjectName}_Budget_${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
        case 'excel':
          content = generateExcelXML();
          filename = `${safeProjectName}_Budget_${timestamp}.xls`;
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'pdf':
          // For PDF, we'll trigger the browser's print dialog with the top sheet
          window.print();
          setIsExporting(false);
          return;
        default:
          throw new Error('Unsupported format');
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Export Budget</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'csv', label: 'CSV', icon: '📄' },
                { value: 'excel', label: 'Excel', icon: '📊' },
                { value: 'pdf', label: 'PDF', icon: '📑' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value as ExportFormat)}
                  className={`p-3 text-center rounded-lg border transition-colors ${
                    format === option.value
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-border-default hover:bg-background-secondary'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection (not for PDF) */}
          {format !== 'pdf' && (
            <div>
              <label className="block text-sm font-medium mb-2">What to Include</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as ExportScope)}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded"
              >
                <option value="full">Full Budget (Summary + Categories + Items)</option>
                <option value="summary">Summary Only</option>
                <option value="categories">Categories Only</option>
                <option value="items">Line Items Only</option>
              </select>
            </div>
          )}

          {/* Options */}
          {fringes.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeFringes"
                checked={includeFringes}
                onChange={(e) => setIncludeFringes(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeFringes" className="text-sm">
                Include fringe rates and calculations
              </label>
            </div>
          )}

          {/* Preview Info */}
          <div className="p-4 bg-background-secondary rounded-lg border border-border-default">
            <div className="text-sm text-text-secondary">
              <div className="flex justify-between mb-1">
                <span>Categories:</span>
                <span className="font-medium">{categories.length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Line Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Estimated:</span>
                <span className="font-medium">${totals.totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {includeFringes && fringes.length > 0 && (
                <div className="flex justify-between mt-1 pt-1 border-t border-border-default">
                  <span>Grand Total (w/ Fringes):</span>
                  <span className="font-medium">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
              style={{ color: 'rgb(var(--colored-button-text))' }}
            >
              {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
