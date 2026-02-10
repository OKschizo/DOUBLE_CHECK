'use client';

import { useState, Fragment } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { useExpenses } from '@/features/budget/hooks/useExpenses';
import { BudgetSummary } from '@/features/budget/components/BudgetSummary';
import { BudgetPhases } from '@/features/budget/components/BudgetPhases';
import { BudgetTemplates } from '@/features/budget/components/BudgetTemplates';
import { ExpenseModal } from '@/features/budget/components/ExpenseModal';
import { ExpenseImport } from '@/features/budget/components/ExpenseImport';
import { BudgetLinkModal } from '@/features/budget/components/BudgetLinkModal';
import { CreateFromModal } from '@/features/budget/components/CreateFromModal';
import { BudgetFringes } from '@/features/budget/components/BudgetFringes';
import { BudgetTopSheet } from '@/features/budget/components/BudgetTopSheet';
import { BudgetExport } from '@/features/budget/components/BudgetExport';
import { BudgetVersions } from '@/features/budget/components/BudgetVersions';
import { BudgetApprovals } from '@/features/budget/components/BudgetApprovals';
import { WeeklyCostReport } from '@/features/budget/components/WeeklyCostReport';
import { useProject } from '@/features/projects/hooks/useProjects';
import type { BudgetItem, BudgetItemStatus, BudgetPhase, BudgetCategory } from '@/lib/schemas';

interface BudgetViewProps {
  projectId: string;
}

export function BudgetView({ projectId }: BudgetViewProps) {
  const { 
    budget, 
    isLoading,
    error,
    createCategory, 
    updateCategory, 
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    createFromCrew,
    createFromEquipment,
    createFromLocations,
    createFromCast,
  } = useBudget(projectId);

  const { expenses } = useExpenses(projectId);
  const { data: myRole } = useMyRole(projectId);
  const { data: project } = useProject(projectId);
  const canEdit = myRole === 'owner' || myRole === 'admin';

  const [selectedPhase, setSelectedPhase] = useState<BudgetPhase | 'all'>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseImport, setShowExpenseImport] = useState(false);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState<string | undefined>();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingItem, setLinkingItem] = useState<BudgetItem | null>(null);
  const [showCreateFromModal, setShowCreateFromModal] = useState(false);
  const [isCreatingFrom, setIsCreatingFrom] = useState(false);
  const [showFringesModal, setShowFringesModal] = useState(false);
  const [showTopSheet, setShowTopSheet] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [showCostReportModal, setShowCostReportModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Filter categories and items by phase
  const filteredCategories = budget?.categories.filter((cat: any) => 
    selectedPhase === 'all' || !cat.phase || cat.phase === selectedPhase
  ) || [];

  const filteredItems = budget?.items.filter((item: any) => {
    const category = budget?.categories.find((c: any) => c.id === item.categoryId);
    return selectedPhase === 'all' || !category?.phase || category.phase === selectedPhase;
  }) || [];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    await createCategory.mutateAsync({
      name: newCategoryName,
      phase: selectedPhase !== 'all' ? selectedPhase : undefined,
    });
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">Error Loading Budget</h3>
          <p className="text-text-secondary mb-4">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">No Budget Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Budget</h1>
          {/* Mobile action menu toggle */}
          {canEdit && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Desktop Actions - View-only features (available to all users) */}
        <div className="hidden md:flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTopSheet(true)}
            className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium"
          >
            📊 Top Sheet
          </button>
          <button
            onClick={() => setShowCostReportModal(true)}
            className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium"
          >
            📈 Cost Report
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
          >
            📥 Export
          </button>
          <button
            onClick={() => setShowVersionsModal(true)}
            className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
          >
            📜 Versions
          </button>
          <button
            onClick={() => setShowApprovalsModal(true)}
            className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
          >
            ✅ Approvals
          </button>
          {/* Edit features (require canEdit permission) */}
          {canEdit && (
            <>
              <button
                onClick={() => setShowCreateFromModal(true)}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
              >
                🔗 Create from...
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
              >
                📋 Template
              </button>
              <button
                onClick={() => setShowFringesModal(true)}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
              >
                💰 Fringes
              </button>
              <button
                onClick={() => setShowExpenseImport(true)}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
              >
                📥 Import
              </button>
              <button
                onClick={() => {
                  setSelectedBudgetItemId(undefined);
                  setShowExpenseModal(true);
                }}
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                + Add Expense
              </button>
            </>
          )}
        </div>
        
        {/* Mobile Action Buttons (horizontally scrollable) - view buttons available to all */}
        <div className="flex md:hidden overflow-x-auto scrollbar-hide gap-2 -mx-4 px-4">
          <button
            onClick={() => setShowTopSheet(true)}
            className="flex-shrink-0 px-3 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-lg text-sm font-medium whitespace-nowrap"
          >
            📊 Top Sheet
          </button>
          <button
            onClick={() => setShowCostReportModal(true)}
            className="flex-shrink-0 px-3 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-lg text-sm font-medium whitespace-nowrap"
          >
            📈 Reports
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
          >
            📥 Export
          </button>
          <button
            onClick={() => setShowVersionsModal(true)}
            className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
          >
            📜 Versions
          </button>
          <button
            onClick={() => setShowApprovalsModal(true)}
            className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
          >
            ✅ Approvals
          </button>
          {/* Edit features require canEdit */}
          {canEdit && (
            <>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
              >
                📋 Template
              </button>
              <button
                onClick={() => setShowFringesModal(true)}
                className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
              >
                💰 Fringes
              </button>
              <button
                onClick={() => setShowCreateFromModal(true)}
                className="flex-shrink-0 px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-sm font-medium whitespace-nowrap"
              >
                🔗 Create From...
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile overflow menu - only for canEdit users */}
      {canEdit && showMobileMenu && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed right-4 top-20 z-50 bg-background-secondary border border-border-default rounded-lg shadow-lg p-2 w-56 md:hidden animate-in fade-in slide-in-from-right duration-200">
            <button
              onClick={() => { setShowExpenseImport(true); setShowMobileMenu(false); }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-background-tertiary transition-colors text-sm"
            >
              📥 Import Expenses
            </button>
            <button
              onClick={() => { setShowExpenseModal(true); setShowMobileMenu(false); }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-background-tertiary transition-colors text-sm"
            >
              + Add New Expense
            </button>
          </div>
        </>
      )}

      {/* Summary Cards */}
      <BudgetSummary 
        categories={filteredCategories} 
        items={filteredItems} 
        totalBudget={project?.budget}
      />

      {/* Phase Filter */}
      <BudgetPhases selectedPhase={selectedPhase} onPhaseChange={setSelectedPhase} />

      {/* Bulk Actions Bar - Desktop */}
      {canEdit && selectedItems.size > 0 && (
        <div className="hidden md:flex bg-background-tertiary border border-border-default rounded-lg p-4 items-center justify-between">
          <div className="text-sm font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedItems.size} selected item(s)?`)) {
                  selectedItems.forEach(id => deleteItem.mutate({ id }));
                  setSelectedItems(new Set());
                }
              }}
              className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar - Mobile (sticky bottom) */}
      {canEdit && selectedItems.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border-default p-4 z-30 safe-area-bottom animate-in slide-in-from-bottom fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{selectedItems.size} selected</span>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-sm text-text-tertiary"
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedItems.size} selected item(s)?`)) {
                selectedItems.forEach(id => deleteItem.mutate({ id }));
                setSelectedItems(new Set());
              }
            }}
            className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Budget Table */}
      <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-tertiary border-b border-border-default">
              <tr>
                {canEdit && (
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(filteredItems.map((item: any) => item.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold w-1/3">Category / Item</th>
                <th className="px-4 py-3 text-right font-semibold">Estimated</th>
                <th className="px-4 py-3 text-right font-semibold">Actual</th>
                <th className="px-4 py-3 text-right font-semibold">Variance</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredCategories.map((category: any) => {
                const categoryItems = filteredItems.filter((item: any) => item.categoryId === category.id);
                const categoryEst = categoryItems.reduce((sum: number, item: any) => sum + (item.estimatedAmount || 0), 0);
                const categoryAct = categoryItems.reduce((sum: number, item: any) => sum + (item.actualAmount || 0), 0);
                const categoryVar = categoryEst - categoryAct;

                return (
                  <Fragment key={category.id}>
                    {/* Category Header */}
                    <tr className="bg-background-tertiary/50 hover:bg-background-tertiary transition-colors">
                      {canEdit && <td className="px-4 py-3"></td>}
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          {category.department && (
                            <span className="text-xs text-text-tertiary px-2 py-0.5 bg-background-secondary rounded">
                              {category.department}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${categoryEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${categoryAct.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${categoryVar >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {categoryVar >= 0 ? '+' : ''}${categoryVar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3"></td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Delete this category and all its items?')) {
                                deleteCategory.mutate({ id: category.id });
                              }
                            }}
                            className="text-red-500 hover:text-red-400 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Category Items */}
                    {categoryItems.map((item: any) => {
                      const itemVar = (item.estimatedAmount || 0) - (item.actualAmount || 0);
                      const itemExpenses = expenses.filter(e => e.budgetItemId === item.id);
                      const expensesTotal = itemExpenses.reduce((sum, e) => sum + e.amount, 0);

                      return (
                        <BudgetItemRow
                          key={item.id}
                          item={item}
                          category={category}
                          canEdit={canEdit}
                          expensesCount={itemExpenses.length}
                          isSelected={selectedItems.has(item.id)}
                          onSelect={(selected) => {
                            const newSelected = new Set(selectedItems);
                            if (selected) {
                              newSelected.add(item.id);
                            } else {
                              newSelected.delete(item.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                          onUpdate={(data) => updateItem.mutate({ id: item.id, data })}
                          onDelete={() => deleteItem.mutate({ id: item.id })}
                          onAddExpense={() => {
                            setSelectedBudgetItemId(item.id);
                            setShowExpenseModal(true);
                          }}
                          onLink={() => {
                            setLinkingItem(item);
                            setShowLinkModal(true);
                          }}
                          isEditing={editingItemId === item.id}
                          onEdit={() => setEditingItemId(item.id)}
                          onCancelEdit={() => setEditingItemId(null)}
                        />
                      );
                    })}

                    {/* Add Item Row */}
                    {canEdit && (
                      <NewBudgetItemRow
                        projectId={projectId}
                        categoryId={category.id}
                        onCreate={(data) => {
                          createItem.mutate(data);
                        }}
                      />
                    )}
                  </Fragment>
                );
              })}

              {/* Add Category Row */}
              {canEdit && !isAddingCategory && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-text-secondary">
                    <button
                      onClick={() => setIsAddingCategory(true)}
                      className="text-accent-primary hover:underline"
                    >
                      + Create your first category
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isAddingCategory && (
          <div className="p-4 bg-background-tertiary border-t border-border-default">
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Camera Dept)"
                className="flex-1 px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium"
              style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateFromModal && (
        <CreateFromModal
          projectId={projectId}
          onClose={() => setShowCreateFromModal(false)}
          onCreateFromCrew={async (ids) => {
            setIsCreatingFrom(true);
            try {
              const result = await createFromCrew.mutateAsync({ crewMemberIds: ids, phase: selectedPhase !== 'all' ? selectedPhase : undefined });
              alert(`Created ${result.itemsCreated} budget items from crew members!`);
              setShowCreateFromModal(false);
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            } finally {
              setIsCreatingFrom(false);
            }
          }}
          onCreateFromEquipment={async (ids) => {
            setIsCreatingFrom(true);
            try {
              const result = await createFromEquipment.mutateAsync({ equipmentIds: ids, phase: selectedPhase !== 'all' ? selectedPhase : undefined });
              alert(`Created ${result.itemsCreated} budget items from equipment!`);
              setShowCreateFromModal(false);
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            } finally {
              setIsCreatingFrom(false);
            }
          }}
          onCreateFromLocations={async (ids) => {
            setIsCreatingFrom(true);
            try {
              const result = await createFromLocations.mutateAsync({ locationIds: ids, phase: selectedPhase !== 'all' ? selectedPhase : undefined });
              alert(`Created ${result.itemsCreated} budget items from locations!`);
              setShowCreateFromModal(false);
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            } finally {
              setIsCreatingFrom(false);
            }
          }}
          onCreateFromCast={async (ids) => {
            setIsCreatingFrom(true);
            try {
              const result = await createFromCast.mutateAsync({ castMemberIds: ids, phase: selectedPhase !== 'all' ? selectedPhase : undefined });
              alert(`Created ${result.itemsCreated} budget items from cast members!`);
              setShowCreateFromModal(false);
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            } finally {
              setIsCreatingFrom(false);
            }
          }}
        />
      )}
      {showTemplateModal && (
        <BudgetTemplates projectId={projectId} onClose={() => setShowTemplateModal(false)} />
      )}
      {showExpenseModal && (
        <ExpenseModal
          projectId={projectId}
          budgetItemId={selectedBudgetItemId}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedBudgetItemId(undefined);
          }}
        />
      )}
      {showExpenseImport && (
        <ExpenseImport projectId={projectId} onClose={() => setShowExpenseImport(false)} />
      )}
      {showLinkModal && linkingItem && (
        <BudgetLinkModal
          projectId={projectId}
          budgetItem={linkingItem}
          onClose={() => {
            setShowLinkModal(false);
            setLinkingItem(null);
          }}
          onLink={(linkData) => {
            updateItem.mutate({ id: linkingItem.id, data: linkData });
            setShowLinkModal(false);
            setLinkingItem(null);
          }}
        />
      )}
      {showFringesModal && (
        <BudgetFringes
          projectId={projectId}
          onClose={() => setShowFringesModal(false)}
          laborTotal={filteredItems.reduce((sum: number, item: any) => {
            // Sum items that are likely labor (linked to crew or cast)
            if (item.linkedCrewMemberId || item.linkedCastMemberId) {
              return sum + (item.estimatedAmount || 0);
            }
            return sum;
          }, 0)}
        />
      )}
      {showTopSheet && (
        <BudgetTopSheet
          projectId={projectId}
          categories={filteredCategories}
          items={filteredItems}
          totalBudget={project?.budget}
          projectName={project?.name}
          onClose={() => setShowTopSheet(false)}
        />
      )}
      {showExportModal && (
        <BudgetExport
          projectId={projectId}
          projectName={project?.name}
          categories={filteredCategories}
          items={filteredItems}
          totalBudget={project?.budget}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showVersionsModal && (
        <BudgetVersions
          projectId={projectId}
          categories={filteredCategories}
          items={filteredItems}
          onClose={() => setShowVersionsModal(false)}
        />
      )}
      {showApprovalsModal && (
        <BudgetApprovals
          projectId={projectId}
          categories={filteredCategories}
          items={filteredItems}
          canApprove={canEdit}
          onClose={() => setShowApprovalsModal(false)}
        />
      )}
      {showCostReportModal && (
        <WeeklyCostReport
          projectId={projectId}
          categories={filteredCategories}
          items={filteredItems}
          totalBudget={project?.budget}
          projectStartDate={project?.startDate ? new Date(project.startDate) : undefined}
          projectEndDate={project?.endDate ? new Date(project.endDate) : undefined}
          onClose={() => setShowCostReportModal(false)}
        />
      )}
      
      {/* Mobile FAB for adding expense */}
      {canEdit && selectedItems.size === 0 && (
        <button
          onClick={() => {
            setSelectedBudgetItemId(undefined);
            setShowExpenseModal(true);
          }}
          className="md:hidden fixed right-4 bottom-4 z-30 w-14 h-14 bg-accent-primary rounded-full shadow-lg flex items-center justify-center safe-area-bottom"
          style={{ color: 'rgb(var(--colored-button-text))' }}
          aria-label="Add expense"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}

function BudgetItemRow({
  item,
  category,
  canEdit,
  expensesCount,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onAddExpense,
  onLink,
  isEditing,
  onEdit,
  onCancelEdit,
}: {
  item: BudgetItem;
  category: BudgetCategory;
  canEdit: boolean;
  expensesCount: number;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onAddExpense: () => void;
  onLink: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [editData, setEditData] = useState({
    description: item.description,
    estimatedAmount: item.estimatedAmount || 0,
    actualAmount: item.actualAmount || 0,
    status: item.status,
    unit: item.unit || '',
    quantity: item.quantity || 1,
    unitRate: item.unitRate || 0,
  });

  const calculatedEstimated = editData.unitRate > 0 && editData.quantity > 0
    ? editData.unitRate * editData.quantity
    : editData.estimatedAmount;

  const itemVar = (item.estimatedAmount || 0) - (item.actualAmount || 0);

  if (isEditing) {
    return (
      <tr className="bg-background-tertiary/30">
        {canEdit && (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </td>
        )}
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </td>
        <td className="px-4 py-3">
          <div className="space-y-2">
            <div className="flex gap-1 p-1 bg-background-tertiary rounded-lg w-fit">
              <button
                type="button"
                onClick={() => {
                  if (editData.unitRate > 0) {
                    setEditData({ ...editData, unitRate: 0, estimatedAmount: calculatedEstimated });
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  editData.unitRate === 0
                    ? 'bg-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={editData.unitRate === 0 ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                Fixed Amount
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editData.unitRate === 0) {
                    setEditData({ ...editData, unitRate: editData.estimatedAmount / editData.quantity || 0 });
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  editData.unitRate > 0
                    ? 'bg-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={editData.unitRate > 0 ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                Rate × Quantity
              </button>
            </div>

            {editData.unitRate > 0 ? (
              <div className="space-y-2 bg-background-tertiary/50 p-3 rounded-lg border border-border-default">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-xs text-text-tertiary mb-1 block">Unit</label>
                    <input
                      type="text"
                      value={editData.unit}
                      onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                      placeholder="e.g., days, weeks"
                      className="w-full px-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary mb-1 block">Rate per Unit</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.unitRate}
                        onChange={(e) => {
                          const newUnitRate = Number(e.target.value);
                          setEditData({ ...editData, unitRate: newUnitRate, estimatedAmount: newUnitRate * editData.quantity });
                        }}
                        placeholder="0.00"
                        className="w-full pl-6 pr-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm text-right"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary mb-1 block">Quantity</label>
                    <select
                      value={editData.quantity}
                      onChange={(e) => {
                        const newQuantity = Number(e.target.value);
                        setEditData({ ...editData, quantity: newQuantity, estimatedAmount: editData.unitRate * newQuantity });
                      }}
                      className="w-full px-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                    >
                      {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-2 border-t border-border-default">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Total:</span>
                    <span className="font-semibold text-text-primary">
                      ${calculatedEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.estimatedAmount}
                    onChange={(e) => setEditData({ ...editData, estimatedAmount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm text-right"
                  />
                </div>
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <input
            type="number"
            step="0.01"
            value={editData.actualAmount}
            onChange={(e) => setEditData({ ...editData, actualAmount: Number(e.target.value) })}
            className="w-32 px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-right"
          />
        </td>
        <td className="px-4 py-3 text-right text-text-secondary">
          {itemVar >= 0 ? '+' : ''}${itemVar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td className="px-4 py-3 text-center">
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value as BudgetItemStatus })}
            className="px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-xs"
          >
            <option value="estimated">Estimated</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </td>
        {canEdit && (
          <td className="px-4 py-3 text-right space-x-2">
            <button
              onClick={() => {
                onUpdate({
                  ...editData,
                  estimatedAmount: calculatedEstimated,
                });
                onCancelEdit();
              }}
              className="text-green-500 hover:text-green-400 text-xs"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="text-text-secondary hover:text-text-primary text-xs"
            >
              Cancel
            </button>
          </td>
        )}
      </tr>
    );
  }

  const statusColors: Record<BudgetItemStatus, string> = {
    estimated: 'bg-gray-500',
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    approved: 'bg-blue-500',
    rejected: 'bg-red-500',
  };

  const displayEstimated = item.unitRate && item.quantity
    ? item.unitRate * item.quantity
    : (item.estimatedAmount || 0);

  return (
    <tr className={`hover:bg-background-tertiary/30 transition-colors group ${isSelected ? 'bg-accent-primary/10' : ''}`}>
      {canEdit && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-text-secondary">└─</span>
          <span>{item.description}</span>
          {item.unitRate && item.quantity && (
            <span className="text-xs text-text-tertiary">
              (${item.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity} {item.unit || 'units'})
            </span>
          )}
          {item.linkedCrewMemberId && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded" title="Linked to crew member">
              👤 Crew
            </span>
          )}
          {item.linkedEquipmentId && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded" title="Linked to equipment">
              📦 Equipment
            </span>
          )}
          {item.linkedLocationId && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded" title="Linked to location">
              📍 Location
            </span>
          )}
          {item.linkedCastMemberId && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded" title="Linked to cast member">
              🎭 Cast
            </span>
          )}
          {expensesCount > 0 && (
            <button
              onClick={onAddExpense}
              className="text-xs text-accent-primary hover:underline"
              title={`${expensesCount} expense(s)`}
            >
              💰 {expensesCount}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right text-text-secondary">
        ${displayEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right text-text-secondary">
        ${(item.actualAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={`px-4 py-3 text-right ${itemVar >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {itemVar >= 0 ? '+' : ''}${itemVar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
          {item.status}
        </span>
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onLink}
              className="text-accent-primary hover:text-accent-hover text-xs"
              title="Link to crew/equipment/location/cast"
            >
              🔗
            </button>
            <button
              onClick={onAddExpense}
              className="text-accent-primary hover:text-accent-hover text-xs"
              title="Add expense"
            >
              💰
            </button>
            <button
              onClick={onEdit}
              className="text-accent-primary hover:text-accent-hover text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this item?')) onDelete();
              }}
              className="text-red-500 hover:text-red-400 text-xs"
            >
              Delete
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

function NewBudgetItemRow({
  projectId,
  categoryId,
  onCreate,
}: {
  projectId: string;
  categoryId: string;
  onCreate: (data: any) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [useMultiplier, setUseMultiplier] = useState(false);
  const [newData, setNewData] = useState({
    description: '',
    estimatedAmount: 0,
    actualAmount: 0,
    status: 'estimated' as BudgetItemStatus,
    unit: '',
    quantity: 1,
    unitRate: 0,
  });

  if (!isCreating) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-3 text-center">
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-semibold flex items-center gap-2 mx-auto"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            <span>+</span>
            <span>Add Item</span>
          </button>
        </td>
      </tr>
    );
  }

  const calculatedAmount = useMultiplier && newData.unitRate > 0 && newData.quantity > 0
    ? newData.unitRate * newData.quantity
    : newData.estimatedAmount;

  return (
    <tr className="bg-background-tertiary/30">
      <td className="px-4 py-3">
        <input
          type="text"
          value={newData.description}
          onChange={(e) => setNewData({ ...newData, description: e.target.value })}
          placeholder="Description"
          className="w-full px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
          autoFocus
        />
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex gap-1 p-1 bg-background-tertiary rounded-lg w-fit">
            <button
              type="button"
              onClick={() => {
                if (useMultiplier) {
                  setUseMultiplier(false);
                  setNewData({ ...newData, estimatedAmount: calculatedAmount });
                }
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !useMultiplier
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={!useMultiplier ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => {
                if (!useMultiplier) {
                  setUseMultiplier(true);
                  if (newData.estimatedAmount > 0) {
                    setNewData({ ...newData, unitRate: newData.estimatedAmount / newData.quantity });
                  }
                }
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                useMultiplier
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={useMultiplier ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              Rate × Quantity
            </button>
          </div>

          {useMultiplier ? (
            <div className="space-y-2 bg-background-tertiary/50 p-3 rounded-lg border border-border-default">
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Unit</label>
                  <input
                    type="text"
                    value={newData.unit}
                    onChange={(e) => setNewData({ ...newData, unit: e.target.value })}
                    placeholder="e.g., days, weeks"
                    className="w-full px-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Rate per Unit</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newData.unitRate}
                      onChange={(e) => {
                        const newUnitRate = Number(e.target.value);
                        setNewData({ ...newData, unitRate: newUnitRate, estimatedAmount: newUnitRate * newData.quantity });
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm text-right"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Quantity</label>
                  <select
                    value={newData.quantity}
                    onChange={(e) => {
                      const newQuantity = Number(e.target.value);
                      setNewData({ ...newData, quantity: newQuantity, estimatedAmount: newData.unitRate * newQuantity });
                    }}
                    className="w-full px-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                  >
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2 border-t border-border-default">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Total:</span>
                  <span className="font-semibold text-text-primary">
                    ${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Amount</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={newData.estimatedAmount}
                  onChange={(e) => setNewData({ ...newData, estimatedAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full pl-6 pr-2 py-1.5 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm text-right"
                />
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="number"
          step="0.01"
          value={newData.actualAmount}
          onChange={(e) => setNewData({ ...newData, actualAmount: Number(e.target.value) })}
          className="w-32 px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-right"
        />
      </td>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3 text-center">
        <select
          value={newData.status}
          onChange={(e) => setNewData({ ...newData, status: e.target.value as BudgetItemStatus })}
          className="px-2 py-1 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-xs"
        >
          <option value="estimated">Estimated</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button
          onClick={() => {
            if (newData.description) {
              onCreate({
                projectId,
                categoryId,
                ...newData,
                estimatedAmount: calculatedAmount,
                unit: useMultiplier ? newData.unit : undefined,
                quantity: useMultiplier ? newData.quantity : undefined,
                unitRate: useMultiplier ? newData.unitRate : undefined,
              });
              setNewData({
                description: '',
                estimatedAmount: 0,
                actualAmount: 0,
                status: 'estimated',
                unit: '',
                quantity: 1,
                unitRate: 0,
              });
              setUseMultiplier(false);
              setIsCreating(false);
            }
          }}
          className="text-green-500 hover:text-green-400 text-xs"
        >
          Add
        </button>
        <button
          onClick={() => setIsCreating(false)}
          className="text-text-secondary hover:text-text-primary text-xs"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}
