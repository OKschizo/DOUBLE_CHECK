# Firebase Setup Guide - Templates & Demo Project

> **Purpose:** Document Firebase collections needed for templates and demo Nike project

---

## 🔥 Required Firebase Collections

### 1. Equipment Templates (`equipmentTemplates`)

**Collection:** `equipmentTemplates`

**Sample Document Structure:**
```json
{
  "id": "film-equipment",
  "name": "Feature Film Equipment",
  "description": "Standard equipment package for feature film production",
  "type": "film",
  "items": [
    {
      "name": "ARRI ALEXA Mini LF",
      "category": "Camera",
      "quantity": 1,
      "required": true,
      "dailyRate": 1500,
      "description": "Professional cinema camera"
    },
    // ... more items
  ]
}
```

### 2. Crew Templates (`crewTemplates`)

**Collection:** `crewTemplates`

**Sample Document Structure:**
```json
{
  "id": "film-crew",
  "name": "Feature Film Crew",
  "description": "Standard crew for feature film production",
  "type": "film",
  "positions": [
    {
      "name": "Director",
      "department": "Direction",
      "role": "Director",
      "required": true
    },
    // ... more positions
  ]
}
```

### 3. Budget Templates (`budgetTemplates`)

Already exists - verify structure matches code

### 4. Cast Templates (`castTemplates`)

**Collection:** `castTemplates`

---

## 🎬 Demo Nike Project

### Collection: `projects`

**Create a demo document with:**
- `id`: "demo-nike-project"
- `title`: "Nike Commercial - Demo Project"
- `client`: "Nike Inc."
- `description`: "Sample project showcasing DOUBLEcheck features"
- `status`: "production"
- `projectType`: "commercial"
- `isTemplate`: true
- `isPublic`: true
- `orgId`: "public-demo" (special orgId for demo projects)

### Associated Collections

**Equipment for Nike Demo:**
- Collection: `equipment`
- Where: `projectId == "demo-nike-project"`

**Crew for Nike Demo:**
- Collection: `crew`
- Where: `projectId == "demo-nike-project"`

**Budget for Nike Demo:**
- Collection: `budgetCategories`
- Where: `projectId == "demo-nike-project"`

---

## 🔧 Implementation Changes Needed

### 1. Update `useProjects` Hook

**File:** `apps/web/src/features/projects/hooks/useProjects.ts`

**Add demo project fetching:**
```typescript
export function useProjects(status?: ProjectStatus) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.orgId) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    // Fetch user's projects
    const userQuery = query(
      collection(db, 'projects'),
      where('orgId', '==', user.orgId),
      orderBy('createdAt', 'desc')
    );

    // Fetch demo/public projects
    const demoQuery = query(
      collection(db, 'projects'),
      where('isPublic', '==', true)
    );

    // Combine both queries
    const unsubscribe1 = onSnapshot(userQuery, (snapshot) => {
      const userProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      // Fetch demo projects
      onSnapshot(demoQuery, (demoSnapshot) => {
        const demoProjects = demoSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isDemo: true // Flag for UI
        })) as Project[];
        
        setProjects([...demoProjects, ...userProjects]);
        setIsLoading(false);
      });
    });

    return () => unsubscribe1();
  }, [user?.orgId]);

  return { data: projects, isLoading };
}
```

### 2. Update Template Hooks to Use Firebase

**Equipment Templates:**
```typescript
// apps/web/src/features/equipment/hooks/useEquipmentTemplates.ts
export function useEquipmentTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'equipmentTemplates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setTemplates(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply template logic
  const applyTemplate = {
    mutateAsync: async ({ projectId, templateId, skipExisting }: any) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      let itemsCreated = 0;
      let itemsSkipped = 0;
      
      // Get existing equipment to check for duplicates
      const existingQuery = query(
        collection(db, 'equipment'),
        where('projectId', '==', projectId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingNames = new Set(
        existingSnapshot.docs.map(doc => doc.data().name)
      );
      
      // Create equipment items from template
      for (const item of template.items) {
        if (skipExisting && existingNames.has(item.name)) {
          itemsSkipped++;
          continue;
        }
        
        await addDoc(collection(db, 'equipment'), {
          projectId,
          name: item.name,
          category: item.category,
          quantity: item.quantity || 1,
          dailyRate: item.dailyRate,
          weeklyRate: item.weeklyRate,
          description: item.description || '',
          required: item.required || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        itemsCreated++;
      }
      
      return { itemsCreated, itemsSkipped };
    },
    isPending: false
  };

  return { templates, isLoading, applyTemplate };
}
```

**Crew Templates:**
```typescript
// Similar implementation for crew templates
// Collection: 'crewTemplates'
```

### 3. Add Demo Project Badge to UI

**File:** `apps/web/src/features/projects/components/ProjectCard.tsx`

```typescript
{project.isDemo && (
  <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
    DEMO
  </span>
)}
```

### 4. Prevent Editing Demo Projects

```typescript
// In any mutation hooks, add check:
if (project.isDemo) {
  throw new Error('Cannot modify demo project. Clone it to make changes.');
}
```

---

## 📋 Setup Checklist

### Firebase Console Steps

1. **Go to Firestore Database**
   - URL: https://console.firebase.google.com/project/doublecheck-9f8c1/firestore

2. **Create Collections:**
   - [ ] `equipmentTemplates` - Add 6 templates (film, commercial, doc, episodic, music video, photoshoot)
   - [ ] `crewTemplates` - Add 6 templates
   - [ ] `castTemplates` - Add 6 templates
   - [ ] Verify `budgetTemplates` exists

3. **Create Nike Demo Project:**
   - [ ] In `projects` collection, add document with ID: `demo-nike-project`
   - [ ] Set `isPublic: true` and `isTemplate: true`
   - [ ] Add sample equipment items linked to this project
   - [ ] Add sample crew members
   - [ ] Add sample budget categories

4. **Update Firestore Rules:**
```javascript
// Allow reading public/demo projects
match /projects/{projectId} {
  allow read: if resource.data.isPublic == true || 
                 (request.auth != null && 
                  resource.data.orgId == getUserOrg());
  allow write: if request.auth != null && 
                  resource.data.isPublic != true && 
                  isOrgMember(resource.data.orgId);
}

// Template collections are public read
match /equipmentTemplates/{templateId} {
  allow read: if request.auth != null;
  allow write: if false; // Only admins via console
}

match /crewTemplates/{templateId} {
  allow read: if request.auth != null;
  allow write: if false;
}
```

---

## 🚀 Code Changes Summary

1. ✅ Update `useProjects` to fetch demo projects
2. ✅ Update template hooks to use Firebase collections
3. ✅ Implement proper template application logic
4. ✅ Add demo project badges to UI
5. ✅ Prevent editing demo projects
6. ✅ Update Firestore security rules

---

## 🧪 Testing

After setup:
1. **Login to app**
2. **Verify Nike demo project appears** in project list
3. **Open Nike project** - should be read-only
4. **Go to Equipment** - click "Apply Template"
5. **Select a template** - should show items from Firebase
6. **Apply template** - should create equipment items
7. **Repeat for Crew, Budget, Cast**

---

**Status:** Ready for Firebase setup + code implementation  
**Next:** Populate Firebase with templates and demo data

