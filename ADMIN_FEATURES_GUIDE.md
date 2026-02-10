# Admin Panel Features Guide

> **Complete guide to team management, department heads, and role requests**

---

## 🎯 Overview

The **Admin Panel** is your command center for managing team members, assigning department heads, reviewing role requests, and configuring project settings.

---

## 📍 How to Access

1. Open any project
2. Click the **"Admin"** tab in the project navigation
3. See 4 tabs: **Team Management**, **Department Heads**, **Role Requests**, **Settings**

---

## 🔐 Permission Levels

### **Owner** (Full Access)
- Manages all team members
- Assigns department heads
- Reviews all role requests
- Modifies project settings
- **Cannot be removed** from project

### **Admin** (Full Management)
- Invites/removes team members
- Assigns department heads
- Reviews all role requests
- Updates project settings
- **Can be demoted** by owner

### **Department Head** (Department Management)
- Reviews role requests **for their department only**
- Can see team list (read-only)
- Cannot modify settings

### **Crew** (Limited Access)
- Can view team list (read-only)
- Cannot access other admin features

---

## 🛠️ Features Breakdown

### 1️⃣ **Team Management** Tab

**What You Can Do:**

#### **Invite Team Members**
1. Click "**+ Invite Team Member**" button
2. Enter email address
3. Select role (Owner, Admin, Department Head, Crew)
4. Send invitation
5. Member receives email invite (if email service configured)
6. They accept invite and join project

#### **View Team Members**
- See all project members with their roles
- View status: Active, Pending, Declined
- See when they joined
- Filter by role or status

#### **Manage Roles**
- Click dropdown next to member name
- Change role: Owner → Admin → Dept Head → Crew
- Changes take effect immediately
- Member's permissions update

#### **Remove Members**
- Click trash icon next to member
- Confirm removal
- Member loses access to project
- **Cannot remove yourself** (owner must transfer first)

#### **Sync Features**
- **"Backfill Crew Cards"** - Auto-invites people from Crew tab who have emails
- **"Invite from Crew"** - Bulk invite multiple crew members
- **"Activate All Pending"** - Bulk activate pending members

---

### 2️⃣ **Department Heads** Tab

**What You Can Do:**

#### **Assign Department Heads**
1. See list of all departments (from Crew tab)
2. For each department:
   - Click "**Assign Head**" button
   - Select from active team members
   - Only team members with accounts can be assigned
3. Department head can now review role requests for their department

#### **Responsibilities of Department Heads**
- Review and approve/deny role requests for their department
- Ensure crew positions are filled
- Coordinate with their team
- Report to admins/owner

#### **Remove Department Heads**
- Click "Remove" next to assigned head
- They lose department head privileges
- Retain their base role (admin/crew)

**Example Departments:**
- Camera - DP as head
- Lighting - Gaffer as head
- Sound - Sound Mixer as head
- Production - Line Producer as head

---

### 3️⃣ **Role Requests** Tab

**What You Can Do:**

#### **For Owners/Admins (All Requests)**

**View Pending Requests:**
- See all incoming role requests
- View requester details (name, email)
- Read their message/qualifications
- See requested role and department

**Review Requests:**
1. Click "**Review**" button
2. Read request details
3. **Approve** - Adds person to project with requested role
4. **Deny** - Rejects request (optional message)
5. Request marked as approved/denied
6. Requester notified (if email configured)

**Filter & Sort:**
- Filter by: Pending, Approved, Denied
- Filter by department
- Sort by date

#### **For Department Heads (Their Department Only)**

**View Department Requests:**
- See requests **only for departments you head**
- If you head Camera dept, see only Camera requests
- Review and approve for your department

**Quick Actions:**
- **Approve Request** - Add to team
- **Deny with Note** - Explain why (optional)
- **Bulk Actions** - Approve/deny multiple at once

#### **Request Workflow**

```
External Person → Fills Request Form → Submits
  ↓
Request Created (Pending Status)
  ↓
Department Head or Admin Reviews
  ↓
Approve → Person Added to Project Team
  OR
Deny → Request Closed, Person Notified
```

---

### 4️⃣ **Settings** Tab

**What You Can Do:**

#### **Project Information**
- Update project title
- Change client name
- Edit description
- Modify start/end dates

#### **Project Type**
- Change type (Film, Commercial, Documentary, etc.)
- Affects available templates
- Changes terminology (scenes vs segments)

#### **Budget Settings**
- Set overall budget
- Enable/disable budget phases
- Configure fringes (payroll taxes)

#### **Custom Fields**
- **Custom Cast Types** - Add beyond Lead, Supporting, Extra
- **Custom Crew Departments** - Add departments not in defaults
- **Custom Roles by Department** - Define specific roles
- **Custom Equipment Categories** - Add specialized categories

#### **Danger Zone**
- **Archive Project** - Hides from active list
- **Delete Project** - Permanently removes (cannot undo!)
- **Transfer Ownership** - Give project to another team member

---

## 🎬 **Nike Demo Project - Admin Features**

When you clone the Nike demo, you get:

### **Team Members (4)**
1. **Sarah Johnson** - Admin (active)
2. **Alex Rivera** - Department Head (active)
3. **Morgan Davis** - Crew (active)
4. **Pending Member** - Crew (pending invitation)

### **Department Heads (2)**
- **Camera Department** - Alex Rivera
- **Lighting Department** - Alex Rivera

### **Role Requests (2)**
- **New Member** - Requesting Sound department (pending)
- **Approved Member** - Grip department (approved)

---

## 🧪 **Testing Admin Features**

### **Test Team Management:**
1. Go to Admin tab → Team Management
2. See 4 team members listed
3. Click role dropdown → Change Morgan Davis from Crew to Admin
4. Click "Remove" for Pending Member → Confirm
5. Click "+ Invite Team Member" → Enter email, select role

### **Test Department Heads:**
1. Go to Admin tab → Department Heads
2. See Camera and Lighting have Alex Rivera assigned
3. Click "Assign Head" for Sound department
4. Select from active members dropdown
5. Click "Remove" to unassign a head

### **Test Role Requests:**
1. Go to Admin tab → Role Requests  
2. See 1 pending request (New Member - Sound)
3. Click "Review" button
4. Read their message
5. Click "Approve" → They join as crew member
6. OR Click "Deny" → Add optional note → Reject

### **Test Settings:**
1. Go to Admin tab → Settings
2. Update project title → Save
3. Add custom cast type → "Stunt Double"
4. Add custom department → "VFX"
5. Add custom equipment category → "Drones"

---

## 📊 **Real-World Workflows**

### **Workflow 1: Onboarding New Team Member**

1. Admin invites via email
2. They receive invitation link
3. They sign up or sign in
4. Click "Accept Invite"
5. Added to project with assigned role
6. Can now access project based on permissions

### **Workflow 2: External Freelancer Requests to Join**

1. Freelancer sees project (if public or via link)
2. Clicks "Request to Join"
3. Fills form (role, department, message)
4. Submits request
5. Department head or admin reviews
6. Approved → Added to team
7. Denied → Notified with reason

### **Workflow 3: Promoting Team Member**

1. Crew member proves valuable
2. Admin changes role from Crew → Department Head
3. Admin assigns them to their department
4. They can now review requests for that department
5. Gains additional responsibilities

---

## 🔗 **Integration with Other Features**

### **Crew Tab ↔ Team Management**

- **Crew cards** show people working on project
- **Team members** are people with account access
- **"Sync Crew Cards"** button converts crew → invited team members
- Crew can work without account (contact info only)
- Team members need account for project access

### **Department Heads ↔ Crew**

- Department heads are chosen from crew members
- Must be active team member first
- Typically the key person in that department
- Example: DP is Camera dept head

### **Role Requests ↔ Invitations**

- **Invitations:** You invite them (push)
- **Role Requests:** They request to join (pull)
- Both result in team membership
- Both require approval

---

## ⚙️ **Security Rules**

**Collections:**
- `project_members` - Team membership records
- `department_heads` - Department head assignments
- `role_requests` - Join requests

**Permissions:**
- Read: All authenticated project members
- Write: Owners and admins only
- Department heads: Can review requests for their departments

---

## 📝 **Field Reference**

### **Project Member Document**
```typescript
{
  projectId: string;
  userId: string | null;      // null until they accept invite
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'dept_head' | 'crew';
  status: 'pending' | 'active' | 'declined';
  invitedBy: string;          // userId of inviter
  invitedAt: timestamp;
  joinedAt: timestamp;         // When they accepted
}
```

### **Department Head Document**
```typescript
{
  projectId: string;
  userId: string;              // Team member assigned
  department: string;          // Camera, Lighting, Sound, etc.
  assignedAt: timestamp;
}
```

### **Role Request Document**
```typescript
{
  projectId: string;
  requestedByUserId: string | null;
  requestedByEmail: string;
  requestedByName: string;
  requestedRole: 'crew' | 'dept_head';
  requestedDepartment: string;
  message: string;             // Why they want to join
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewNote?: string;         // Admin's note when reviewing
  reviewedBy?: string;
  createdAt: timestamp;
  reviewedAt?: timestamp;
}
```

---

## 🎯 **Best Practices**

### **Team Structure**

**Recommended Hierarchy:**
```
Owner (1)
  ├── Admins (1-3)
  │   ├── Manage overall project
  │   └── Approve major decisions
  ├── Department Heads (5-10)
  │   ├── Oversee their department
  │   └── Review department-specific requests
  └── Crew (unlimited)
      ├── Work on production
      └── View-only access
```

### **When to Use What Role**

**Owner:**
- Project creator
- Final decision maker
- Can transfer ownership

**Admin:**
- Producers, line producers
- Handle day-to-day management
- Can modify everything except ownership

**Department Head:**
- DP (Camera), Gaffer (Lighting), Sound Mixer, etc.
- Reviews requests for their department
- Coordinates their team

**Crew:**
- Everyone else on the production
- Can view and contribute
- Limited administrative access

---

## 🎉 **All Admin Features Working!**

Your Nike demo project now includes:

✅ **Team Management** - 4 sample members with different roles  
✅ **Department Heads** - 2 departments with assigned heads  
✅ **Role Requests** - 2 sample requests (1 pending, 1 approved)  
✅ **Project Settings** - Full configuration options  
✅ **Permissions System** - Role-based access control  
✅ **Invitation System** - Email invites (when configured)  
✅ **Request Review** - Approve/deny with notes  
✅ **Bulk Actions** - Manage multiple items at once  

**Test them all in your cloned Nike project!** 🚀

---

**Last Updated:** January 5, 2026  
**Status:** ✅ Fully Implemented and Tested

