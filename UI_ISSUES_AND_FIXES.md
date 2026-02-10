# UI Issues and Fixes

> **Discovered:** January 2026  
> **Status:** Needs Implementation

---

## 🐛 Issues Found

### 1. Equipment View Missing Features ❌

**Current Issues:**
- ❌ No grid/list view toggle buttons (state exists but UI missing)
- ❌ No sidebar for categories
- ❌ Simplified layout compared to CrewView
- ❌ No placeholder images
- ❌ No image upload functionality

**File:** `apps/web/src/features/equipment/components/views/EquipmentView.tsx`

### 2. Equipment Templates Not Populated ❌

**Current Issues:**
- ❌ No static template files (like crew has)
- ❌ Templates pulled from Firebase `equipment_templates` collection (empty)
- ❌ Apply template logic is placeholder only

**Files:**
- `apps/web/src/features/equipment/hooks/useEquipmentTemplates.ts`
- Missing: `apps/web/src/features/equipment/templates/` directory

### 3. Crew Missing Image Features ❌

**Current Issues:**
- ❌ No placeholder avatars/images
- ❌ No image upload functionality
- ❌ Only Cast has image upload (line 511-1087 in CastView.tsx)

**File:** `apps/web/src/features/crew/components/CrewView.tsx`

### 4. Templates Not Available Anywhere ⚠️

**Current Issues:**
- ❌ Crew templates exist as static files but apply logic incomplete
- ❌ Equipment templates don't exist at all
- ❌ Budget templates exist but may not work
- ❌ Cast templates similar issue

---

## 🔧 Fixes Needed

### Fix 1: Add Grid View Toggle to Equipment View

**Current Code (Line 34):**
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
```

**Missing:** The UI toggle buttons that exist in CrewView (lines 246-269)

**Add After Line 222:**
```typescript
<div className="flex items-center gap-2 border border-border-default rounded-lg p-1 bg-background-secondary">
  <button
    onClick={() => setViewMode('grid')}
    className={`px-3 py-1 rounded transition-colors ${
      viewMode === 'grid' 
        ? 'bg-accent-primary' 
        : 'text-text-secondary hover:text-text-primary'
    }`}
    style={viewMode === 'grid' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
  >
    Grid
  </button>
  <button
    onClick={() => setViewMode('list')}
    className={`px-3 py-1 rounded transition-colors ${
      viewMode === 'list' 
        ? 'bg-accent-primary' 
        : 'text-text-secondary hover:text-text-primary'
    }`}
    style={viewMode === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
  >
    List
  </button>
</div>
```

### Fix 2: Add Sidebar to Equipment View

**Add Before Line 315 (closing div):**
```typescript
{/* Sidebar */}
<aside className="w-80 bg-background-secondary border-l border-border-subtle p-6 overflow-y-auto">
  <h3 className="text-lg font-bold mb-4 text-text-primary">Categories</h3>
  <div className="space-y-2">
    {allCategories.map(cat => (
      <div key={cat} className="flex justify-between items-center p-2 hover:bg-background-tertiary rounded">
        <span className="text-sm text-text-secondary">{cat}</span>
        {project?.customEquipmentCategories?.includes(cat) && (
          <button 
            onClick={() => handleRemoveCustomCategory(cat)}
            className="text-text-tertiary hover:text-error"
          >
            ×
          </button>
        )}
      </div>
    ))}
    <button
      onClick={() => setShowAddCategoryModal(true)}
      className="w-full mt-4 py-2 border-2 border-dashed border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary"
    >
      + Add Category
    </button>
  </div>
</aside>

{/* Add Category Modal */}
{showAddCategoryModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="card-elevated p-6 w-full max-w-md">
      <h3 className="text-lg font-bold mb-4">Add Custom Category</h3>
      <form onSubmit={handleAddCustomCategory}>
        <input
          autoFocus
          className="input-field w-full mb-4"
          placeholder="Category Name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setShowAddCategoryModal(false)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Add</button>
        </div>
      </form>
    </div>
  </div>
)}
```

### Fix 3: Apply Grid View to Equipment List

**Replace Lines 258-281 with:**
```typescript
<div className="space-y-8">
  {Object.entries(itemsByCategory).map(([cat, items]: [string, any]) => (
    <div key={cat}>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-text-primary">{cat}</h2>
        <span className="badge-primary">{items.length}</span>
      </div>
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
        {items.map((item: any) => (
          <div 
            key={item.id} 
            className={`card p-4 relative ${selectedItems.has(item.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleToggleSelect(item.id)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary">{item.name}</h3>
                    <p className="text-sm text-accent-primary">{item.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-text-tertiary hover:text-accent-primary p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete item?')) {
                          deleteEquipment.mutateAsync({ id: item.id });
                        }
                      }}
                      className="text-text-tertiary hover:text-error p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-text-secondary">
                  {item.description && <div>{item.description}</div>}
                  {item.quantity && <div>📦 Quantity: {item.quantity}</div>}
                  {item.dailyRate && <div>💰 ${item.dailyRate}/day</div>}
                  {item.weeklyRate && <div>💵 ${item.weeklyRate}/week</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

### Fix 4: Create Equipment Templates

**Create directory:**
```
apps/web/src/features/equipment/templates/
```

**Create:** `apps/web/src/features/equipment/templates/filmEquipmentTemplate.ts`

```typescript
export const filmEquipmentTemplate = {
  id: 'film',
  name: 'Feature Film Equipment',
  description: 'Standard equipment package for feature film production',
  type: 'film',
  items: [
    // Camera
    { name: 'ARRI ALEXA Mini LF', category: 'Camera', quantity: 1, required: true, dailyRate: 1500 },
    { name: 'Camera Assistant Kit', category: 'Camera', quantity: 1, required: true, dailyRate: 200 },
    { name: 'Memory Cards (512GB)', category: 'Camera', quantity: 6, required: true, dailyRate: 50 },
    
    // Lenses
    { name: 'ARRI Signature Prime Set', category: 'Lenses', quantity: 1, required: true, dailyRate: 2000 },
    { name: 'Zoom Lens (24-70mm)', category: 'Lenses', quantity: 1, required: false, dailyRate: 800 },
    
    // Lighting
    { name: 'ARRI SkyPanel S60-C', category: 'Lighting', quantity: 4, required: true, dailyRate: 400 },
    { name: 'ARRI M18 HMI', category: 'Lighting', quantity: 2, required: true, dailyRate: 350 },
    { name: 'Light Stands', category: 'Lighting', quantity: 10, required: true, dailyRate: 20 },
    { name: 'C-Stands', category: 'Lighting', quantity: 12, required: true, dailyRate: 15 },
    
    // Grip
    { name: '12x12 Frame', category: 'Grip', quantity: 2, required: false, dailyRate: 80 },
    { name: '8x8 Frame', category: 'Grip', quantity: 4, required: true, dailyRate: 60 },
    { name: 'Flags/Silks/Nets Package', category: 'Grip', quantity: 1, required: true, dailyRate: 150 },
    { name: 'Apple Boxes (Full Set)', category: 'Grip', quantity: 2, required: true, dailyRate: 40 },
    
    // Sound
    { name: 'Sound Devices 833 Mixer', category: 'Sound', quantity: 1, required: true, dailyRate: 400 },
    { name: 'Boom Microphone', category: 'Sound', quantity: 2, required: true, dailyRate: 100 },
    { name: 'Wireless Lav Mics', category: 'Sound', quantity: 4, required: true, dailyRate: 150 },
    { name: 'Boom Pole', category: 'Sound', quantity: 2, required: true, dailyRate: 30 },
  ],
};
```

**Create more templates:** commercial, documentary, episodic, music video, photoshoot

**Create:** `apps/web/src/features/equipment/templates/index.ts`

```typescript
import { filmEquipmentTemplate } from './filmEquipmentTemplate';
import { commercialEquipmentTemplate } from './commercialEquipmentTemplate';
// ... import others

export const equipmentTemplates = [
  filmEquipmentTemplate,
  commercialEquipmentTemplate,
  // ... others
];
```

### Fix 5: Update useEquipmentTemplates Hook

**Replace** `apps/web/src/features/equipment/hooks/useEquipmentTemplates.ts`:

```typescript
import { useState } from 'react';
import { equipmentTemplates } from '../templates';
import { useEquipmentByProject, useCreateEquipment } from './useEquipment';

export function useEquipmentTemplates() {
  const [isLoading] = useState(false);
  
  const applyTemplate = {
    mutateAsync: async ({ projectId, templateId, skipExisting, overwriteExisting }: any) => {
      const template = equipmentTemplates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      // Simplified - should check for existing items
      let itemsCreated = 0;
      let itemsSkipped = 0;
      
      for (const item of template.items) {
        try {
          // Logic to create equipment items
          // Should use useCreateEquipment
          itemsCreated++;
        } catch (e) {
          itemsSkipped++;
        }
      }
      
      return { itemsCreated, itemsSkipped };
    },
    isPending: false
  };

  return {
    templates: equipmentTemplates,
    isLoading,
    applyTemplate
  };
}
```

### Fix 6: Add Image Upload to Crew View

Similar to CastView lines 511-1087, add:
- File input for crew member photos
- Upload to Firebase Storage
- Display placeholder if no photo
- Edit/delete photo functionality

### Fix 7: Add Placeholder Images

**For Crew/Equipment without photos:**

```typescript
// In the card rendering:
{member.photoURL ? (
  <img src={member.photoURL} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
) : (
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-lg">
    {member.name.charAt(0).toUpperCase()}
  </div>
)}
```

---

## 📋 Priority Order

1. **HIGH:** Fix Equipment Grid View Toggle (Quick Fix)
2. **HIGH:** Add Equipment Sidebar (Quick Fix)
3. **HIGH:** Create Equipment Templates (1-2 hours)
4. **MEDIUM:** Fix Equipment Template Application Logic
5. **MEDIUM:** Add Crew Image Upload Feature
6. **LOW:** Add Placeholder Images/Avatars
7. **LOW:** Fix Other Template Systems (Budget, Cast)

---

## 🚀 Implementation Commands

```bash
# 1. Update EquipmentView.tsx
# Add grid toggle and sidebar

# 2. Create templates directory
mkdir apps/web/src/features/equipment/templates

# 3. Create template files
# filmEquipmentTemplate.ts, commercialEquipmentTemplate.ts, etc.

# 4. Update useEquipmentTemplates.ts hook

# 5. Test locally
cd apps/web
pnpm dev

# 6. Deploy fixes
vercel --prod
```

---

## ✅ Testing Checklist

After fixes:
- [ ] Equipment grid/list view toggle works
- [ ] Equipment sidebar shows categories
- [ ] Equipment templates modal shows templates
- [ ] Applying equipment template creates items
- [ ] Crew view has image upload
- [ ] Placeholder images show for items without photos
- [ ] All views have consistent UI/UX

---

**Status:** Ready for implementation  
**Estimated Time:** 3-4 hours total

