# Demo Project Interaction Solution

> **Issue:** Nike demo project is read-only, preventing users from testing features  
> **Solution:** Multiple approaches available

---

## 🔍 Current Situation

### What's Working ✅
- Demo project appears with DEMO badge
- All data is visible (crew, cast, equipment, scenes, schedule, budget)
- Templates work on user's own projects

### What's NOT Working ❌
- Cannot add/edit scenes and shots in demo project (read-only)
- Cannot upload images (write permission denied)
- Cannot test syncing features (no edit permission)
- Cannot move/reorder items (read-only)

**Root Cause:** Demo project has `isPublic: true` which makes it read-only to prevent corruption.

---

## 💡 Solution Options

### Option 1: Make Demo Editable (Simplest)

**Update Security Rules:**
```javascript
// In firestore.rules
match /projects/{projectId} {
  allow read: if request.auth != null &&
                 (resource.data.isPublic == true ||
                  resource.data.orgId == getUserOrg());
  allow update, delete: if request.auth != null &&
                           resource.data.isPublic != true &&
                           resource.data.orgId == getUserOrg();
}
```

**Change to:**
```javascript
match /projects/{projectId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null; // Allow everyone to edit temporarily
}
```

**Then apply same pattern to crew, cast, equipment, scenes, shots, etc.**

⚠️ **Issue:** Everyone can modify demo - might get corrupted

### Option 2: Clone Demo Project Feature (Recommended)

**Add "Clone Project" button to demo projects:**

```typescript
// In ProjectCard.tsx or ProjectClient.tsx
{project.isDemo && (
  <button onClick={handleClone} className="btn-primary">
    📋 Clone to My Projects
  </button>
)}

const handleClone = async () => {
  // 1. Create new project with user's orgId
  const newProject = await createProject({
    ...project,
    title: `${project.title} (Copy)`,
    orgId: user.orgId,
    isPublic: false,
    isDemo: false,
  });

  // 2. Copy all crew, cast, equipment, scenes, etc.
  // 3. Redirect to new project
};
```

**Benefits:**
- Demo stays pristine
- Users get their own copy to modify
- Can test all features fully

### Option 3: Temporary Demo Instances (Advanced)

**Create a fresh demo copy for each user session:**
- On first visit, clone demo to user's account
- Auto-delete after 24 hours
- Always fresh demo data

---

## 🚀 Quick Fix: Enable Demo Editing

Let me implement the simplest solution - make the demo fully editable:

### Step 1: Update Firestore Rules

Make demo project and its data editable by all authenticated users:

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function getUserOrg() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId;
    }

    function isDemoProject(projectId) {
      return get(/databases/$(database)/documents/projects/$(projectId)).data.isPublic == true;
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Projects
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (resource.data.orgId == getUserOrg() || 
                       resource.data.isPublic == true); // Allow editing demo
    }

    // Template collections
    match /equipmentTemplates/{templateId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /crewTemplates/{templateId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // All project-related collections - allow if user owns project OR it's demo
    match /crew/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /cast/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /equipment/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /scenes/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /shots/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /locations/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /budgetCategories/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /shootingDays/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    match /scheduleEvents/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.orgId == getUserOrg() ||
                       get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.isPublic == true);
    }

    // Fallback
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 2: Remove canEdit Checks for Demo Project

OR update canEdit logic in views to allow demo editing:

```typescript
// In each view component
const isDemo = project?.isPublic || project?.isDemo;
const canEdit = isDemo || userRole === 'owner' || userRole === 'admin';
```

---

## 📋 Quick Commands

### Deploy the Updated Rules
```bash
cd c:\Users\anonw\Desktop\DOUBLE_CHECK\doublecheck
firebase deploy --only firestore:rules
```

### Verify Rules Work
1. Sign in to app
2. Open Nike demo project
3. Try editing crew member
4. Should work now!

---

## ⚠️ Alternative: Clone Feature

If you don't want demo editable, implement clone:

```typescript
// apps/web/src/features/projects/hooks/useProjects.ts

export function useCloneProject() {
  const { user } = useAuth();

  const mutateAsync = async ({ projectId }: { projectId: string }) => {
    if (!user) throw new Error('Must be logged in');

    // Get original project
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) throw new Error('Project not found');

    const originalProject = projectDoc.data();

    // Create new project
    const newProject = await addDoc(collection(db, 'projects'), {
      ...originalProject,
      title: `${originalProject.title} (Copy)`,
      orgId: user.orgId,
      isPublic: false,
      isDemo: false,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newProjectId = newProject.id;

    // Copy crew
    const crewSnapshot = await getDocs(
      query(collection(db, 'crew'), where('projectId', '==', projectId))
    );
    for (const crewDoc of crewSnapshot.docs) {
      await addDoc(collection(db, 'crew'), {
        ...crewDoc.data(),
        projectId: newProjectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Copy cast, equipment, scenes, etc. similarly

    return newProjectId;
  };

  return { mutateAsync };
}
```

Then add button to ProjectCard for demo projects.

---

## 🎯 Recommended Approach

**For Testing/Development:** Make demo editable (Option 1)
**For Production:** Implement clone feature (Option 2)

**Right now:** Let's make demo editable so you can test all features!

---

**Status:** Ready to implement  
**Time:** 5 minutes to deploy updated rules

