# Scenes & Storyboard Refactor - Implementation Status

> **Plan Mode Active** - This document tracks implementation progress  
> **Total Features:** 12 major features across 4 phases  
> **Estimated Time:** 10-14 weeks for complete implementation

---

## ✅ **Completed Features**

### 1. Stripboard View ✅ (Phase 1)

**Status:** COMPLETE  
**File:** `apps/web/src/features/scenes/components/StripboardView.tsx`

**Features Implemented:**
- ✅ Traditional production board layout with horizontal strips
- ✅ Color-coded by INT/EXT and Day/Night (industry standard colors)
- ✅ Drag and drop to reorder shooting schedule
- ✅ Group by: Location, INT/EXT, Day/Night
- ✅ Sort by: Scene number, Location, Pages
- ✅ Quick stats: Total scenes, pages, INT/EXT counts
- ✅ Cast count indicators
- ✅ Page count per scene
- ✅ Status icons
- ✅ Integrated into ScenesView with toggle button

**User Experience:**
- Directors/ADs can visualize shooting order
- Drag strips to optimize schedule
- See at-a-glance which scenes group together
- Traditional film industry color coding

### 2. Shot Coverage Templates ✅ (Phase 2)

**Status:** COMPLETE (UI + Data)  
**Files:**
- `apps/web/src/features/scenes/templates/shotCoverageTemplates.ts`
- `apps/web/src/features/scenes/components/CoverageTemplateModal.tsx`

**Templates Created:**
1. **Standard Coverage** - Master + 2 mediums + 2 close-ups
2. **Dialogue (2 Person)** - Master + OTS + singles
3. **Action Sequence** - Multi-angle with slow-mo
4. **Interview Setup** - Wide + tight + B-roll
5. **Product Commercial** - Hero + macro + 360° + lifestyle
6. **Minimal Coverage** - Quick master + CU

**Features Implemented:**
- ✅ 6 pre-built coverage patterns
- ✅ Smart recommendations based on scene description
- ✅ Visual template selector with previews
- ✅ Shot breakdown display
- ✅ One-click application
- ✅ Category icons and descriptions
- ✅ Shot count and type breakdown

**Still Needed:**
- ⏳ Integration into ScenesView (add "Apply Coverage" button)
- ⏳ Hook to create shots from template
- ⏳ Auto-numbering (3A, 3B, 3C...)

---

## 🚧 **In Progress**

### 3. Coverage Template Integration (Phase 2)

**Next Steps:**
1. Add "📋 Apply Coverage" button to scene cards
2. Create `useApplyCoverageTemplate` hook
3. Batch create shots from template
4. Auto-number shots based on scene
5. Link shots to master (for coverage grouping)

---

## 📋 **Planned Features (Not Yet Started)**

### Phase 1: Core UX (High Priority)

- [ ] **Enhanced Scene Cards** - Larger thumbnails, inline edit, visual indicators
- [ ] **Improved Storyboard Cards** - Better shot type indicators, coverage badges
- [ ] **Keyboard Shortcuts** - N (new), S (shot), D (duplicate), etc.
- [ ] **Batch Operations** - Multi-select, bulk tagging, bulk scheduling

### Phase 2: Creative Tools (High Priority)

- [ ] **Master/Coverage Grouping** - Visual hierarchy, collapsible groups
- [ ] **Drawing/Annotation Tools** - Sketch mode, arrows, frame guides
- [ ] **Continuity Tracking** - Wardrobe/props catalog, mismatch warnings
- [ ] **Timeline/Story Order View** - Chronological visualization

### Phase 3: Collaboration (Medium Priority)

- [ ] **Comments System** - Scene/shot comments, @mentions, threads
- [ ] **Approval Workflow** - Draft/Review/Approved states
- [ ] **Version History** - Storyboard versions, compare, rollback
- [ ] **Shot List Export** - Professional PDF generation

### Phase 4: Advanced (Low Priority)

- [ ] **Script Import/Breakdown** - PDF/FDX parsing
- [ ] **AI-Assisted Features** - Shot suggestions, coverage analysis
- [ ] **Mobile Optimization** - Touch gestures, offline mode
- [ ] **Integration Features** - Import/export to other tools

---

## 🎯 **Immediate Next Steps**

To make the coverage templates functional, we need to:

### Step 1: Create Hook for Template Application

**File:** `apps/web/src/features/scenes/hooks/useCoverageTemplates.ts`

```typescript
export function useApplyCoverageTemplate(sceneId: string, projectId: string) {
  const { user } = useAuth();
  const { createShot } = useProjectShots(projectId);

  const applyTemplate = async (template: CoverageTemplate) => {
    const scene = await getDoc(doc(db, 'scenes', sceneId));
    const sceneNumber = scene.data()?.sceneNumber || '1';

    for (const shotTemplate of template.shots) {
      const shotNumber = `${sceneNumber}${shotTemplate.shotNumber}`;
      
      await createShot.mutateAsync({
        projectId,
        sceneId,
        shotNumber,
        shotType: shotTemplate.shotType,
        cameraAngle: shotTemplate.cameraAngle,
        lens: shotTemplate.lens,
        movement: shotTemplate.movement,
        description: shotTemplate.description,
        duration: shotTemplate.duration,
        isMaster: shotTemplate.isMaster,
        coverageType: shotTemplate.coverageType,
        status: 'not-shot',
      });
    }
  };

  return { applyTemplate };
}
```

### Step 2: Add Button to Scene Cards

In `ScenesView.tsx` CreativeLayout, add:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedSceneForCoverage(scene);
    setShowCoverageModal(true);
  }}
  className="btn-secondary text-xs"
>
  📋 Apply Coverage
</button>
```

### Step 3: Wire Up Modal

```tsx
{showCoverageModal && selectedSceneForCoverage && (
  <CoverageTemplateModal
    scene={selectedSceneForCoverage}
    onClose={() => setShowCoverageModal(false)}
    onApply={async (template) => {
      await applyTemplate(template);
    }}
  />
)}
```

---

## 📊 **Implementation Progress**

### Overall: 2 of 12 Features Complete (17%)

**Phase 1 (Core UX):** 1/5 complete (20%)  
**Phase 2 (Creative Tools):** 1/5 complete (20%)  
**Phase 3 (Collaboration):** 0/4 complete (0%)  
**Phase 4 (Advanced):** 0/4 complete (0%)

### Time Estimates

**Completed:** ~1 week  
**Remaining:** ~9-13 weeks

**Phase 1 Remaining:** 2-3 weeks  
**Phase 2 Remaining:** 3-4 weeks  
**Phase 3:** 2-3 weeks  
**Phase 4:** 3-4 weeks

---

## 🎬 **What Users Can Do Now**

### ✅ **Available Today:**

1. **Stripboard View**
   - Toggle to "Stripboard" mode in Scenes tab
   - See traditional production board layout
   - Drag strips to reorder scenes
   - Group by location/time/INT-EXT
   - See total page count and scene stats
   - Industry-standard color coding

2. **Coverage Templates** (UI Ready)
   - 6 professional coverage patterns available
   - Smart recommendations based on scene content
   - Visual template selector
   - Shot breakdown preview
   - (Needs integration to actually create shots)

### ⏳ **Coming Soon:**

- Apply coverage button on scenes
- One-click shot creation from templates
- Master/coverage visual grouping
- Enhanced scene cards with inline editing
- Keyboard shortcuts
- And 8 more major features...

---

## 🚀 **Deployment Status**

**Current Code:**
- ✅ Stripboard view component created
- ✅ Coverage templates defined
- ✅ Coverage modal UI complete
- ⏳ Integration pending
- ⏳ Hooks pending

**To Deploy:**
- Need to complete coverage template integration
- Then build and deploy to Vercel
- Users will see new Stripboard mode immediately

---

## 💡 **Quick Wins (Can Implement Fast)**

These features can be added quickly for immediate impact:

1. **Keyboard Shortcuts** (1-2 days)
   - N for new scene, S for new shot, etc.
   - Big productivity boost

2. **Enhanced Scene Cards** (2-3 days)
   - Larger images, better layout
   - Immediate visual improvement

3. **Shot Count Badges** (1 day)
   - Show shot count on scene cards
   - Helps directors see coverage at a glance

4. **Batch Operations** (2-3 days)
   - Multi-select scenes/shots
   - Bulk assign to shooting day
   - Major time saver

---

## 🎯 **Recommended Prioritization**

Given the scope, recommend focusing on:

### **Must Have (Next 2-3 weeks):**
1. ✅ Stripboard view (DONE)
2. ✅ Coverage templates (DONE - needs integration)
3. ⏳ Coverage template integration (IN PROGRESS)
4. ⏳ Enhanced scene cards
5. ⏳ Keyboard shortcuts
6. ⏳ Batch operations

### **Should Have (Weeks 4-6):**
7. Master/coverage grouping
8. Inline editing
9. Shot list export

### **Nice to Have (Weeks 7+):**
10. Continuity tracking
11. Timeline view
12. Comments system
13. Drawing tools

---

## 📝 **Notes for Continued Implementation**

### Data Model Changes Needed

**Scene Schema:**
- Add: `storyOrder`, `actNumber`, `scriptPageStart/End`, `pageEighths`
- Add: `continuityNotes` object
- Add: `approvalStatus`, `coverageScore`

**Shot Schema:**
- Add: `isMaster`, `masterShotId`, `coverageType`
- Add: `fStop`, `shutterSpeed`, `iso`, `colorTemp`
- Add: `approvalStatus`, `version`, `versions` array

### Performance Considerations

- Virtual scrolling for 100+ shots
- Image lazy loading
- Debounced autosave
- Optimistic updates for drag & drop

### Testing Requirements

- Test with 50+ scenes
- Test with 200+ shots
- Test drag & drop performance
- Test on tablet (on-set use case)

---

**Status:** Actively implementing Phase 1 & 2 features  
**Next:** Complete coverage template integration, then enhance scene cards  
**Timeline:** 2 features done, 10 to go

