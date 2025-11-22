'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';
import { DEFAULT_ROLES_BY_DEPARTMENT } from '@/features/projects/constants/crewRoles';
import { useRouter } from 'next/navigation';
import { CrewTemplates } from '@/features/crew/components/CrewTemplates';

interface CrewViewProps {
  projectId: string;
}

const DEPARTMENTS = [
  { value: 'camera', label: 'Camera' },
  { value: 'lighting_grip', label: 'Lighting & Grip' },
  { value: 'sound', label: 'Sound' },
  { value: 'art', label: 'Art Department' },
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'makeup_hair', label: 'Makeup & Hair' },
  { value: 'production', label: 'Production' },
  { value: 'post_production', label: 'Post-Production' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'catering', label: 'Catering' },
  { value: 'stunts', label: 'Stunts' },
  { value: 'vfx', label: 'VFX' },
  { value: 'other', label: 'Other' },
] as const;

export function CrewView({ projectId }: CrewViewProps) {
  const { firebaseUser, user: firestoreUser } = useAuth();
  const utils = trpc.useUtils();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showInlineRoleInput, setShowInlineRoleInput] = useState(false);
  const [showInlineRoleInputEdit, setShowInlineRoleInputEdit] = useState(false);
  const [showRequestRoleModal, setShowRequestRoleModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedCrewMembers, setSelectedCrewMembers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inlineRoleName, setInlineRoleName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDepartment, setNewRoleDepartment] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [requestFormData, setRequestFormData] = useState({
    requestedDepartment: '',
    requestedRole: '',
    reason: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set(DEPARTMENTS.map(d => d.value))
  );
  // Track selected roles per department (department -> Set of role names)
  const [selectedRolesByDept, setSelectedRolesByDept] = useState<Record<string, Set<string>>>({});
  // Track expanded/collapsed departments in sidebar
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    role: '',
    photoUrl: '',
    email: '',
    phone: '',
    rate: '' as string | number,
    rateType: 'daily' as 'hourly' | 'daily' | 'weekly' | 'flat',
  });

  // Fetch project data for custom departments
  const { data: project, refetch: refetchProject } = trpc.projects.getById.useQuery({ id: projectId });

  // Fetch crew members from Firestore
  const { data: crewMembers = [], isLoading, error, refetch } = trpc.crew.listByProject.useQuery({ projectId });
  
  // Get user's role and permissions
  const { data: userRole } = trpc.projectMembers.getMyRole.useQuery({ projectId });
  const { data: departmentHeads = [] } = trpc.departmentHeads.listByProject.useQuery({ projectId });
  const canEdit = userRole === 'owner' || userRole === 'admin';

  // Budget mutations
  const createFromCrew = trpc.budget.createFromCrew.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
      alert('Budget items created successfully!');
    },
  });

  // Bulk delete mutation
  const bulkDeleteCrew = trpc.crew.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedCrewMembers(new Set());
    },
  });

  // Handle bulk actions
  const handleBulkCreateBudget = () => {
    if (selectedCrewMembers.size === 0) return;
    const crewMemberIds = Array.from(selectedCrewMembers);
    createFromCrew.mutate({ 
      projectId, 
      crewMemberIds 
    });
    setSelectedCrewMembers(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedCrewMembers.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCrewMembers.size} crew member(s)?`)) return;
    
    // Delete all selected members
    Promise.all(
      Array.from(selectedCrewMembers).map(id => 
        bulkDeleteCrew.mutateAsync({ id })
      )
    ).then(() => {
      setSelectedCrewMembers(new Set());
    });
  };

  const handleSelectAll = () => {
    if (selectedCrewMembers.size === filteredCrewMembers.length) {
      setSelectedCrewMembers(new Set());
    } else {
      setSelectedCrewMembers(new Set(filteredCrewMembers.map(m => m.id)));
    }
  };

  const handleToggleSelect = (memberId: string) => {
    const newSelected = new Set(selectedCrewMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedCrewMembers(newSelected);
  };
  
  // Permission check function
  const canEditCrewMember = (member: any) => {
    if (!firebaseUser) return false;
    
    // Owners and admins can edit anyone
    if (userRole === 'owner' || userRole === 'admin') return true;
    
    // Department heads can edit crew in their department(s)
    if (userRole === 'dept_head') {
      const myDepartments = departmentHeads
        .filter(dh => dh.userId === firebaseUser.uid)
        .map(dh => dh.department);
      return myDepartments.includes(member.department);
    }
    
    // Regular crew can only edit themselves
    return member.userId === firebaseUser.uid;
  };

  // Mutations
  const createCrewMember = trpc.crew.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateCrewMember = trpc.crew.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteCrewMember = trpc.crew.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const addCustomDepartment = trpc.projects.addCustomCrewDepartment.useMutation({
    onSuccess: () => {
      refetchProject();
    },
  });

  const removeCustomDepartment = trpc.projects.removeCustomCrewDepartment.useMutation({
    onSuccess: () => {
      refetchProject();
    },
  });

  const addCustomRole = trpc.projects.addCustomRole.useMutation({
    onSuccess: () => {
      refetchProject();
    },
  });

  const removeCustomRole = trpc.projects.removeCustomRole.useMutation({
    onSuccess: () => {
      refetchProject();
    },
  });

  // Role request mutations
  const { data: myCrewCard } = trpc.crew.getMyCrewCard.useQuery({ projectId });
  const { data: myPendingRequests = [] } = trpc.roleRequests.listByProject.useQuery({ projectId });

  const createRoleRequest = trpc.roleRequests.create.useMutation({
    onSuccess: () => {
      utils.roleRequests.listByProject.invalidate({ projectId });
      setShowRequestRoleModal(false);
      setRequestFormData({ requestedDepartment: '', requestedRole: '', reason: '' });
      alert('Role change request submitted! You will be notified when it is reviewed.');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const cancelRoleRequest = trpc.roleRequests.cancel.useMutation({
    onSuccess: () => {
      utils.roleRequests.listByProject.invalidate({ projectId });
    },
  });

  // Combine default and custom departments
  const customDepartments = project?.customCrewDepartments || [];
  const allDepartments = [
    ...DEPARTMENTS,
    ...customDepartments.map(dept => ({ value: dept, label: dept })),
  ];

  // Explicit role hierarchy order by department (most senior/important first)
  const roleOrderByDepartment: Record<string, Record<string, number>> = {
    production: {
      'Director': 1,
      'Executive Producer': 2,
      'Producer': 3,
      'Showrunner': 4,
      'Supervising Producer': 5,
      'Co-Executive Producer': 6,
      'Co-Producer': 7,
      'Line Producer': 8,
      'Production Manager': 9,
      'Production Supervisor': 10,
      '1st AD': 11,
      '2nd AD': 12,
      '2nd 2nd AD': 13,
      'Production Coordinator': 14,
      'Assistant Production Coordinator': 15,
      'Script Supervisor': 16,
      'Location Manager': 17,
      'Assistant Location Manager': 18,
      'Location Scout': 19,
      'Creative Director': 20,
      'Art Director': 21,
      'Copywriter': 22,
      'Account Executive': 23,
      'Field Producer': 24,
      'Associate Producer': 25,
      'Photographer': 26,
      'Assistant Photographer': 27,
      'Digital Tech': 28,
      'Production Assistant': 29,
      'Set PA': 30,
      'Office PA': 31,
      'Location PA': 32,
      'Agency PA': 33,
      'Photo Assistant': 34,
    },
    camera: {
      'Director of Photography': 1,
      'Camera Operator': 2,
      'B-Camera Operator': 3,
      '1st AC (Focus Puller)': 4,
      '1st AC': 5,
      'B-Camera 1st AC': 6,
      '2nd AC (Clapper Loader)': 7,
      'DIT (Digital Imaging Technician)': 8,
      'DIT': 9,
      'Steadicam Operator': 10,
      'Drone Operator': 11,
      'Camera PA': 12,
    },
    lighting_grip: {
      'Gaffer': 1,
      'Key Grip': 2,
      'Best Boy Electric': 3,
      'Best Boy Grip': 4,
      'Electrician': 5,
      'Grip': 6,
      'Dolly Grip': 7,
      'Board Operator': 8,
      'Swing': 9,
    },
    sound: {
      'Production Sound Mixer': 1,
      'Boom Operator': 2,
      'Sound Utility': 3,
      'Playback Operator': 4,
    },
    art: {
      'Production Designer': 1,
      'Art Director': 2,
      'Assistant Art Director': 3,
      'Set Decorator': 4,
      'Prop Master': 5,
      'Construction Coordinator': 6,
      'Lead Person': 7,
      'Assistant Prop Master': 8,
      'Set Dresser': 9,
      'Prop Builder': 10,
      'Scenic Artist': 11,
      'Carpenter': 12,
      'Painter': 13,
    },
    wardrobe: {
      'Costume Designer': 1,
      'Stylist': 2,
      'Costume Supervisor': 3,
      'Assistant Costume Designer': 4,
      'Assistant Stylist': 5,
      'Key Costumer': 6,
      'Set Costumer': 7,
      'Costume PA': 8,
      'Wardrobe Assistant': 9,
    },
    makeup_hair: {
      'Key Makeup Artist': 1,
      'Key Hairstylist': 2,
      'Makeup Artist': 3,
      'SFX Makeup Artist': 4,
      'Hairstylist': 5,
    },
    post_production: {
      'Editor': 1,
      'Post Production Supervisor': 2,
      'VFX Supervisor': 3,
      'Colorist': 4,
      'Sound Designer': 5,
      'Composer': 6,
      'VFX Producer': 7,
      'Re-recording Mixer': 8,
      'Assistant Editor': 9,
      'Post Production Coordinator': 10,
      'VFX Coordinator': 11,
      'Sound Editor': 12,
      'Dialogue Editor': 13,
      'Foley Artist': 14,
      'Music Supervisor': 15,
    },
    transportation: {
      'Transportation Coordinator': 1,
      'Transportation Captain': 2,
      'Picture Car Coordinator': 3,
      'Driver': 4,
    },
    catering: {
      'Caterer': 1,
      'Craft Service': 2,
    },
    stunts: {
      'Stunt Coordinator': 1,
      'Safety Officer': 2,
      'Stunt Performer': 3,
      'Stunt Rigger': 4,
    },
    vfx: {
      'VFX Supervisor': 1,
      'On-Set VFX Supervisor': 2,
      'VFX Producer': 3,
      'VFX Coordinator': 4,
      'VFX PA': 5,
    },
    other: {
      'Unit Publicist': 1,
      'Still Photographer': 2,
      'BTS Videographer': 3,
      'Choreographer': 4,
      'Dance Captain': 5,
      'Medic': 6,
      'Security': 7,
      'Animal Wrangler': 8,
      'Fixer': 9,
      'Translator': 10,
      'Retoucher': 11,
    },
  };

  // Get role order for hierarchical sorting
  const getRoleOrder = (dept: string, role: string): number => {
    const deptOrder = roleOrderByDepartment[dept];
    if (deptOrder && deptOrder[role] !== undefined) {
      return deptOrder[role];
    }
    // Custom roles come after all default roles (use a high number)
    return 9999;
  };

  // Get all roles for a department (default + custom) in hierarchical order
  const getRolesForDepartment = (dept: string): string[] => {
    const defaultRoles = DEFAULT_ROLES_BY_DEPARTMENT[dept] || [];
    const customRoles = project?.customRolesByDepartment?.[dept] || [];
    const allRoles = [...defaultRoles, ...customRoles];
    
    // Sort by hierarchical order (default roles maintain their order, custom roles sorted alphabetically at end)
    return allRoles.sort((a, b) => {
      const orderA = getRoleOrder(dept, a);
      const orderB = getRoleOrder(dept, b);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If both are custom roles (same order), sort alphabetically
      return a.localeCompare(b);
    });
  };

  // Auto-select custom departments and roles when project data loads
  useEffect(() => {
    if (project && customDepartments.length > 0) {
      // Add custom departments to selected departments if not already selected
      setSelectedDepartments(prev => {
        const newSelected = new Set(prev);
        customDepartments.forEach(dept => newSelected.add(dept));
        return newSelected;
      });
      
      // Auto-select all roles for custom departments
      const newRoleSelections: Record<string, Set<string>> = {};
      customDepartments.forEach(dept => {
        const roles = getRolesForDepartment(dept);
        if (roles.length > 0) {
          newRoleSelections[dept] = new Set(roles);
        }
      });
      
      if (Object.keys(newRoleSelections).length > 0) {
        setSelectedRolesByDept(prev => ({
          ...prev,
          ...newRoleSelections,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, customDepartments.length]);

  // Generate initials for placeholder avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color for each crew member based on their name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Store the file object for later upload
      setPhotoFile(file);
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, photoUrl: previewUrl });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to add crew members');
      return;
    }

    try {
      let finalPhotoUrl = '';

      // Upload photo to Firebase Storage if user selected a file
      if (photoFile) {
        setUploadingImage(true);
        const filename = generateUniqueFilename(photoFile.name);
        const storagePath = `crew/${projectId}/${filename}`;
        finalPhotoUrl = await uploadImage(photoFile, storagePath);
        setUploadingImage(false);
      }
      
      await createCrewMember.mutateAsync({
        projectId,
        name: formData.name,
        department: formData.department,
        role: formData.role,
        photoUrl: finalPhotoUrl,
        email: formData.email,
        phone: formData.phone,
        rate: formData.rate ? Number(formData.rate) : undefined,
        rateType: formData.rateType,
        createdBy: firebaseUser.uid,
      });

      // Reset form
      setShowAddForm(false);
      setPhotoFile(null);
      setShowInlineRoleInput(false);
      setInlineRoleName('');
      setFormData({
        name: '',
        department: '',
        role: '',
        photoUrl: '',
        email: '',
        phone: '',
        rate: '',
        rateType: 'daily',
      });
    } catch (error) {
      console.error('Error adding crew member:', error);
      alert('Failed to add crew member. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleEdit = (member: typeof crewMembers[0]) => {
    setEditingMember(member);
    setPhotoFile(null); // Clear any previous file selection
    setShowInlineRoleInputEdit(false);
    setInlineRoleName('');
    setFormData({
      name: member.name,
      department: member.department,
      role: member.role,
      photoUrl: member.photoUrl || '',
      email: member.email || '',
      phone: member.phone || '',
      rate: member.rate || '',
      rateType: member.rateType || 'daily',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;

    try {
      let finalPhotoUrl = formData.photoUrl;
      const oldPhotoUrl = editingMember.photoUrl;

      // If user selected a new file, upload it
      if (photoFile) {
        setUploadingImage(true);
        const filename = generateUniqueFilename(photoFile.name);
        const storagePath = `crew/${projectId}/${filename}`;
        finalPhotoUrl = await uploadImage(photoFile, storagePath);
        setUploadingImage(false);

        // Delete old photo from storage if it exists and is a Firebase Storage URL
        if (oldPhotoUrl && !isBlobUrl(oldPhotoUrl)) {
          await deleteImage(oldPhotoUrl);
        }
      }
      
      await updateCrewMember.mutateAsync({
        id: editingMember.id,
        data: {
          name: formData.name,
          department: formData.department,
          role: formData.role,
          photoUrl: finalPhotoUrl,
          email: formData.email,
          phone: formData.phone,
          rate: formData.rate ? Number(formData.rate) : undefined,
          rateType: formData.rateType,
        },
      });

      // Reset form and close modal
      setShowEditModal(false);
      setEditingMember(null);
      setPhotoFile(null);
      setShowInlineRoleInputEdit(false);
      setInlineRoleName('');
      setFormData({
        name: '',
        department: '',
        role: '',
        photoUrl: '',
        email: '',
        phone: '',
        rate: '',
        rateType: 'daily',
      });
    } catch (error) {
      console.error('Error updating crew member:', error);
      alert('Failed to update crew member. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleDelete = async (crewId: string) => {
    if (confirm('Remove this crew member?')) {
      try {
        // Find the crew member to get their photo URL
        const member = crewMembers.find(m => m.id === crewId);
        
        // Delete the crew member from Firestore
        await deleteCrewMember.mutateAsync({ id: crewId });
        
        // Delete their photo from Storage if it exists
        if (member?.photoUrl && !isBlobUrl(member.photoUrl)) {
          await deleteImage(member.photoUrl);
        }
      } catch (error) {
        console.error('Error deleting crew member:', error);
        alert('Failed to delete crew member. Please try again.');
      }
    }
  };

  // Filter helpers
  const toggleDepartment = (dept: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(dept)) {
      newSelected.delete(dept);
    } else {
      newSelected.add(dept);
    }
    setSelectedDepartments(newSelected);
  };

  const toggleRole = (dept: string, role: string) => {
    const deptRoles = selectedRolesByDept[dept] || new Set(getRolesForDepartment(dept));
    const newDeptRoles = new Set(deptRoles);
    
    if (newDeptRoles.has(role)) {
      newDeptRoles.delete(role);
    } else {
      newDeptRoles.add(role);
    }
    
    setSelectedRolesByDept({
      ...selectedRolesByDept,
      [dept]: newDeptRoles,
    });
  };

  const toggleDepartmentExpanded = (dept: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(dept)) {
      newExpanded.delete(dept);
    } else {
      newExpanded.add(dept);
    }
    setExpandedDepts(newExpanded);
  };

  const selectAllDepartments = () => {
    setSelectedDepartments(new Set(allDepartments.map(d => d.value)));
    // Also select all roles for all departments
    const allRoles: Record<string, Set<string>> = {};
    allDepartments.forEach(dept => {
      allRoles[dept.value] = new Set(getRolesForDepartment(dept.value));
    });
    setSelectedRolesByDept(allRoles);
  };

  const clearAllDepartments = () => {
    setSelectedDepartments(new Set());
    setSelectedRolesByDept({});
  };

  const expandAll = () => {
    setExpandedDepts(new Set(allDepartments.map(d => d.value)));
  };

  const collapseAll = () => {
    setExpandedDepts(new Set());
  };

  const handleAddCustomDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDeptName.trim()) {
      alert('Please enter a department name');
      return;
    }

    try {
      await addCustomDepartment.mutateAsync({
        projectId,
        department: newDeptName.trim(),
      });
      
      // Add to selected departments
      const newSelected = new Set(selectedDepartments);
      newSelected.add(newDeptName.trim());
      setSelectedDepartments(newSelected);
      
      setShowAddDeptModal(false);
      setNewDeptName('');
    } catch (error: any) {
      alert(error.message || 'Failed to add custom department');
    }
  };

  const handleRemoveCustomDepartment = async (dept: string) => {
    if (confirm(`Remove "${dept}" department? Crew members with this department will keep it, but you won't be able to assign it to new members.`)) {
      try {
        await removeCustomDepartment.mutateAsync({
          projectId,
          department: dept,
        });
        
        // Remove from selected departments
        const newSelected = new Set(selectedDepartments);
        newSelected.delete(dept);
        setSelectedDepartments(newSelected);
      } catch (error: any) {
        alert(error.message || 'Failed to remove custom department');
      }
    }
  };

  const handleAddCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoleName.trim() || !newRoleDepartment) {
      return;
    }

    try {
      await addCustomRole.mutateAsync({
        projectId,
        department: newRoleDepartment,
        role: newRoleName.trim(),
      });
      
      // Auto-select the new role in filters
      const deptRoles = selectedRolesByDept[newRoleDepartment] || new Set(getRolesForDepartment(newRoleDepartment));
      const newDeptRoles = new Set(deptRoles);
      newDeptRoles.add(newRoleName.trim());
      setSelectedRolesByDept({
        ...selectedRolesByDept,
        [newRoleDepartment]: newDeptRoles,
      });
      
      setNewRoleName('');
      setNewRoleDepartment('');
      setShowAddRoleModal(false);
    } catch (error: any) {
      console.error('Error adding custom role:', error);
      alert(error.message || 'Failed to add custom role. Please try again.');
    }
  };

  const handleRemoveCustomRole = async (dept: string, role: string) => {
    if (confirm(`Remove custom role "${role}"? This will not delete crew members with this role.`)) {
      try {
        await removeCustomRole.mutateAsync({ projectId, department: dept, role });
      } catch (error) {
        console.error('Error removing custom role:', error);
        alert('Failed to remove custom role. Please try again.');
      }
    }
  };

  const handleAddInlineRole = async (isEditModal: boolean = false) => {
    if (!inlineRoleName.trim() || !formData.department) {
      return;
    }

    try {
      await addCustomRole.mutateAsync({
        projectId,
        department: formData.department,
        role: inlineRoleName.trim(),
      });
      
      // Automatically select the newly added role in the form
      setFormData({ ...formData, role: inlineRoleName.trim() });
      
      // Also add to filter selections for this department
      const deptRoles = selectedRolesByDept[formData.department] || new Set(getRolesForDepartment(formData.department));
      const newDeptRoles = new Set(deptRoles);
      newDeptRoles.add(inlineRoleName.trim());
      setSelectedRolesByDept({
        ...selectedRolesByDept,
        [formData.department]: newDeptRoles,
      });
      
      setInlineRoleName('');
      if (isEditModal) {
        setShowInlineRoleInputEdit(false);
      } else {
        setShowInlineRoleInput(false);
      }
    } catch (error: any) {
      console.error('Error adding custom role:', error);
      alert(error.message || 'Failed to add custom role. Please try again.');
    }
  };

  // Filter crew members by search query, selected departments, and selected roles
  const filteredCrewMembers = crewMembers.filter(member => {
    // Filter by selected department
    if (!selectedDepartments.has(member.department)) {
      return false;
    }
    
    // Filter by selected roles (if any roles are specified for this department)
    const deptSelectedRoles = selectedRolesByDept[member.department];
    if (deptSelectedRoles && deptSelectedRoles.size > 0) {
      // If department has role selections, check if member's role is selected
      const allDeptRoles = getRolesForDepartment(member.department);
      // Only apply role filter if there are actually roles for this department
      if (allDeptRoles.length > 0) {
        // If not all roles are selected, filter by selected roles
        if (deptSelectedRoles.size < allDeptRoles.length) {
          if (!deptSelectedRoles.has(member.role)) {
            return false;
          }
        }
      }
    }
    
    // Filter by search query (name or role) - only within selected departments/roles
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = member.name.toLowerCase().includes(query);
      const matchesRole = member.role.toLowerCase().includes(query);
      return matchesName || matchesRole;
    }
    
    return true;
  });

  // Department hierarchy order (most important first)
  const departmentOrder: Record<string, number> = {
    production: 1,
    camera: 2,
    lighting_grip: 3,
    sound: 4,
    art: 5,
    wardrobe: 6,
    makeup_hair: 7,
    post_production: 8,
    vfx: 9,
    stunts: 10,
    transportation: 11,
    catering: 12,
    other: 999, // Always last
  };

  // Group filtered crew by department
  const crewByDepartment = filteredCrewMembers.reduce((acc, member) => {
    const dept = member.department;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, typeof crewMembers>);

  // Sort departments by hierarchy
  const sortedDepartmentEntries = Object.entries(crewByDepartment).sort(([deptA], [deptB]) => {
    const orderA = departmentOrder[deptA] ?? 500; // Custom departments go in the middle
    const orderB = departmentOrder[deptB] ?? 500;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // If same order, sort alphabetically
    return deptA.localeCompare(deptB);
  });

  // Get count for each department (from all members, not filtered)
  const getDepartmentCount = (dept: string) => {
    return crewMembers.filter(m => m.department === dept).length;
  };

  const getDepartmentLabel = (value: string) => {
    const dept = allDepartments.find(d => d.value === value);
    return dept?.label || value;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading crew members...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">Error Loading Crew</h3>
          <p className="text-text-secondary mb-4">{error.message}</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Center Content - Crew List */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-text-primary">Crew Management</h1>
              <p className="text-text-secondary">
                {filteredCrewMembers.length} of {crewMembers.length} crew members
                {searchQuery && <span className="text-accent-primary"> • Searching &quot;{searchQuery}&quot;</span>}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Request Role Change button - only for users with crew card */}
              {myCrewCard && (
                <button
                  onClick={() => {
                    setRequestFormData({
                      requestedDepartment: myCrewCard.department,
                      requestedRole: myCrewCard.role,
                      reason: '',
                    });
                    setShowRequestRoleModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-medium"
                >
                  📝 Request Role Change
                  {myPendingRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                      {myPendingRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary"
              >
                + Add Crew Member
              </button>
              {canEdit && (
                <button
                  className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary font-medium"
                  onClick={() => setShowTemplatesModal(true)}
                >
                  📋 Apply Template
                </button>
              )}
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border border-border-default rounded-lg p-1 bg-background-secondary">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-accent-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={viewMode === 'grid' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-accent-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={viewMode === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
            <svg 
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedCrewMembers.size > 0 && (
          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-text-primary">
                {selectedCrewMembers.size} crew member{selectedCrewMembers.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-accent-primary hover:underline"
              >
                {selectedCrewMembers.size === filteredCrewMembers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={handleBulkCreateBudget}
                    className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                    style={{ color: 'rgb(var(--colored-button-text))' }}
                    disabled={createFromCrew.isPending}
                  >
                    {createFromCrew.isPending ? 'Creating...' : '💰 Create Budget Items'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                    disabled={bulkDeleteCrew.isPending}
                  >
                    {bulkDeleteCrew.isPending ? 'Deleting...' : '🗑️ Delete Selected'}
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedCrewMembers(new Set())}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="card-elevated p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Add New Crew Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                  isDragging
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-border-default bg-background-tertiary hover:border-accent-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  {formData.photoUrl ? (
                    <div className="relative">
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/80 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-3xl">
                        📷
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">
                        Drag & drop photo here
                      </p>
                      <p className="text-xs text-text-tertiary mb-3">or</p>
                      <label className="btn-secondary cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., John Doe"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Department <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value, role: '' })}
                  >
                    <option value="">Select department</option>
                    {allDepartments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.department ? (
                  <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Role <span className="text-error">*</span>
                    </label>
                    <select
                      required={!showInlineRoleInput}
                      className="input-field w-full"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={showInlineRoleInput}
                    >
                      <option value="">Select role</option>
                      {getRolesForDepartment(formData.department).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    
                    {!showInlineRoleInput ? (
                      <button
                        type="button"
                        onClick={() => setShowInlineRoleInput(true)}
                        className="text-xs text-accent-primary hover:text-accent-hover font-medium flex items-center gap-1"
                      >
                        <span>+</span> Add custom role to {DEPARTMENTS.find(d => d.value === formData.department)?.label}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom role name"
                          className="input-field flex-1 text-sm"
                          value={inlineRoleName}
                          onChange={(e) => setInlineRoleName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInlineRole(false);
                            } else if (e.key === 'Escape') {
                              setShowInlineRoleInput(false);
                              setInlineRoleName('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddInlineRole(false)}
                          disabled={!inlineRoleName.trim() || addCustomRole.isPending}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {addCustomRole.isPending ? '...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineRoleInput(false);
                            setInlineRoleName('');
                          }}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Select department first"
                    disabled
                    className="input-field col-span-2 opacity-50"
                    value=""
                  />
                )}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rate
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    className="input-field"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rate Type
                  </label>
                  <select
                    className="input-field"
                    value={formData.rateType}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value as any })}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="flat">Flat Rate</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" disabled={uploadingImage}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    'Add Crew Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Crew Grid by Department */}
        {crewMembers.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary">No crew members yet</h3>
            <p className="text-text-secondary">Add your first crew member to get started</p>
          </div>
        )}

        {crewMembers.length > 0 && filteredCrewMembers.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary">No matching crew members</h3>
            <p className="text-text-secondary mb-4">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'Try selecting different departments in the filter'
              }
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                selectAllDepartments();
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {sortedDepartmentEntries.length > 0 && (
          <div className="space-y-8">
            {sortedDepartmentEntries.map(([dept, members]) => (
              <div key={dept}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-text-primary">{getDepartmentLabel(dept)}</h2>
                  <span className="badge-primary">{members.length}</span>
                </div>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div id={`element-${member.id}`} key={member.id} className={`card p-5 hover:border-accent-primary/50 transition-all relative ${selectedCrewMembers.has(member.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}>
                        {/* Selection Checkbox - positioned in layout with proper spacing */}
                        <div className="flex items-start gap-4 mb-4">
                          {canEdit && (
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={selectedCrewMembers.has(member.id)}
                                onChange={() => handleToggleSelect(member.id)}
                                className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer bg-transparent checked:bg-accent-primary"
                                style={{
                                  accentColor: 'rgb(var(--accent-primary))',
                                }}
                              />
                            </div>
                          )}
                        <div className="flex gap-4 flex-1">
                        {/* Photo or Placeholder Avatar */}
                        <div className="flex-shrink-0">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-20 h-20 rounded-xl object-cover shadow-md"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getAvatarColor(member.name)} flex items-center justify-center text-white text-xl font-bold shadow-md ${member.photoUrl ? 'hidden' : ''}`}>
                            {getInitials(member.name)}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-text-primary truncate">{member.name}</h4>
                              <p className="text-sm text-accent-secondary font-medium">{member.role}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              {canEditCrewMember(member) && (
                                <button
                                  onClick={() => handleEdit(member)}
                                  className="flex-shrink-0 text-text-tertiary hover:text-accent-primary transition-colors p-1"
                                  title="Edit crew member"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {canEditCrewMember(member) && (
                                <button
                                  onClick={() => handleDelete(member.id)}
                                  className="flex-shrink-0 text-text-tertiary hover:text-error transition-colors p-1"
                                  title="Delete crew member"
                                >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              )}
                            </div>
                          </div>
                        </div>
                        </div>
                        </div>
                      
                      {/* Contact Details */}
                      <div className="space-y-1 text-xs text-text-secondary mb-3">
                        {member.email && <div className="truncate">📧 {member.email}</div>}
                        {member.phone && <div>📞 {member.phone}</div>}
                        {member.rate && (
                          <div className="text-text-primary font-semibold">
                            💰 ${member.rate.toLocaleString()}/{member.rateType || 'day'}
                          </div>
                        )}
                      </div>

                      {/* Budget Integration */}
                      <CrewMemberBudgetSection 
                        projectId={projectId} 
                        crewMemberId={member.id}
                        canEdit={canEdit}
                        onCreateBudgetItem={() => {
                          createFromCrew.mutate({ 
                            projectId, 
                            crewMemberIds: [member.id] 
                          });
                        }}
                        onViewBudget={() => {
                          // Navigate to budget view using hash
                          window.location.href = `/projects/${projectId}#budget`;
                        }}
                      />
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div 
                        id={`element-${member.id}`}
                        key={member.id} 
                        className={`card p-4 hover:border-accent-primary/50 transition-all flex items-center gap-4 ${selectedCrewMembers.has(member.id) ? 'ring-2 ring-accent-primary border-accent-primary bg-accent-primary/5' : ''}`}
                      >
                        {/* Selection Checkbox */}
                        {canEdit && (
                          <input
                            type="checkbox"
                            checked={selectedCrewMembers.has(member.id)}
                            onChange={() => handleToggleSelect(member.id)}
                            className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary flex-shrink-0 cursor-pointer bg-transparent checked:bg-accent-primary"
                            style={{
                              accentColor: 'rgb(var(--accent-primary))',
                            }}
                          />
                        )}
                        
                        {/* Photo or Avatar */}
                        <div className="flex-shrink-0">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getAvatarColor(member.name)} flex items-center justify-center text-white text-sm font-bold ${member.photoUrl ? 'hidden' : ''}`}>
                            {getInitials(member.name)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <h4 className="font-semibold text-text-primary truncate">{member.name}</h4>
                            <p className="text-sm text-accent-secondary font-medium truncate">{member.role}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-text-tertiary capitalize">{getDepartmentLabel(member.department)}</span>
                          </div>
                          <div className="col-span-3 text-sm text-text-secondary">
                            {member.email && <div className="truncate">📧 {member.email}</div>}
                            {member.phone && <div>📞 {member.phone}</div>}
                          </div>
                          <div className="col-span-2 text-sm text-text-primary font-semibold">
                            {member.rate && `💰 $${member.rate.toLocaleString()}/${member.rateType || 'day'}`}
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            {canEditCrewMember(member) && (
                              <>
                                <button
                                  onClick={() => handleEdit(member)}
                                  className="text-text-tertiary hover:text-accent-primary transition-colors p-1"
                                  title="Edit crew member"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(member.id)}
                                  className="text-text-tertiary hover:text-error transition-colors p-1"
                                  title="Delete crew member"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <CrewMemberBudgetSection 
                              projectId={projectId} 
                              crewMemberId={member.id}
                              canEdit={canEdit}
                              onCreateBudgetItem={() => {
                                createFromCrew.mutate({ 
                                  projectId, 
                                  crewMemberIds: [member.id] 
                                });
                              }}
                              onViewBudget={() => {
                                window.location.href = `/projects/${projectId}#budget`;
                              }}
                              compact={true}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar - Crew Overview & Filters */}
      <aside className="w-80 bg-background-secondary border-l border-border-subtle overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Crew Overview</h3>
        
        {/* Filter by Department & Role */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-secondary">Filter by Department & Role</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllDepartments}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                Select All
              </button>
              <span className="text-text-tertiary">•</span>
              <button
                onClick={clearAllDepartments}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 mb-3">
            <button
              onClick={expandAll}
              className="text-xs text-text-tertiary hover:text-accent-primary transition-colors"
            >
              Expand All
            </button>
            <span className="text-text-tertiary">•</span>
            <button
              onClick={collapseAll}
              className="text-xs text-text-tertiary hover:text-accent-primary transition-colors"
            >
              Collapse All
            </button>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {allDepartments
              .sort((a, b) => {
                const orderA = departmentOrder[a.value] ?? 500;
                const orderB = departmentOrder[b.value] ?? 500;
                if (orderA !== orderB) {
                  return orderA - orderB;
                }
                return a.value.localeCompare(b.value);
              })
              .map((dept) => {
              const count = getDepartmentCount(dept.value);
              const isSelected = selectedDepartments.has(dept.value);
              const isExpanded = expandedDepts.has(dept.value);
              const isCustomDept = customDepartments.includes(dept.value);
              const roles = getRolesForDepartment(dept.value);
              const selectedRoles = selectedRolesByDept[dept.value] || new Set(roles);
              const customRolesForDept = project?.customRolesByDepartment?.[dept.value] || [];
              
              return (
                <div
                  key={dept.value}
                  className={`rounded-lg border transition-all ${
                    isSelected
                      ? 'border-accent-primary/30 bg-background-tertiary'
                      : 'border-border-default bg-background-primary opacity-60'
                  }`}
                >
                  {/* Department Header */}
                  <div className="flex items-center gap-2 p-3">
                    <button
                      onClick={() => toggleDepartmentExpanded(dept.value)}
                      className="text-text-tertiary hover:text-text-primary transition-colors"
                      disabled={roles.length === 0}
                    >
                      {roles.length > 0 ? (
                        <svg 
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDepartment(dept.value)}
                      className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary focus:ring-2"
                    />
                    <span className="text-sm font-medium text-text-primary flex-1">{dept.label}</span>
                    <span className={`badge-primary ${!isSelected && 'opacity-40'}`}>
                      {count}
                    </span>
                    {isCustomDept && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCustomDepartment(dept.value);
                        }}
                        className="text-text-tertiary hover:text-error transition-colors p-1"
                        title="Remove custom department"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Nested Roles */}
                  {isExpanded && roles.length > 0 && (
                    <div className="border-t border-border-subtle px-3 pb-3 pt-2 space-y-1.5">
                      {roles.map((role) => {
                        const isCustomRole = customRolesForDept.includes(role);
                        const isRoleSelected = selectedRoles.has(role);
                        
                        return (
                          <div key={role} className="flex items-center gap-2 pl-6 group">
                            <input
                              type="checkbox"
                              checked={isRoleSelected}
                              onChange={() => toggleRole(dept.value, role)}
                              disabled={!isSelected}
                              className="w-3.5 h-3.5 rounded border-border-default text-accent-secondary focus:ring-accent-secondary focus:ring-1"
                            />
                            <span className={`text-xs flex-1 ${isSelected && isRoleSelected ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                              {role}
                            </span>
                            {isCustomRole && (
                              <button
                                onClick={() => handleRemoveCustomRole(dept.value, role)}
                                className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error transition-all p-0.5"
                                title="Remove custom role"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Add Custom Role for this department */}
                      <button
                        onClick={() => {
                          setNewRoleDepartment(dept.value);
                          setShowAddRoleModal(true);
                        }}
                        className="w-full mt-2 ml-6 py-1.5 px-2 rounded border border-dashed border-border-default hover:border-accent-secondary text-text-tertiary hover:text-accent-secondary transition-colors text-xs font-medium text-left"
                      >
                        + Add Custom Role
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Department Button */}
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="w-full mt-3 py-2 px-3 rounded-lg border-2 border-dashed border-border-default hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors text-sm font-medium"
          >
            + Add Custom Department
          </button>
        </div>

        <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
          <h4 className="text-sm font-semibold mb-2 text-accent-primary">💡 Crew Management Tips</h4>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Keep contact info updated</li>
            <li>• Track start and end dates</li>
            <li>• Maintain rate agreements</li>
            <li>• Document availability clearly</li>
          </ul>
        </div>
      </aside>

      {/* Add Custom Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Add Custom Department</h2>
                <button
                  onClick={() => {
                    setShowAddDeptModal(false);
                    setNewDeptName('');
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddCustomDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Special Effects, Props, etc."
                    required
                    className="input-field w-full"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    This custom department will be available for all team members working on this project.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDeptModal(false);
                      setNewDeptName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={addCustomDepartment.isPending}
                  >
                    {addCustomDepartment.isPending ? 'Adding...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Add Custom Role</h2>
                <button
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setNewRoleName('');
                    setNewRoleDepartment('');
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddCustomRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Department
                  </label>
                  <select
                    required
                    className="input-field w-full"
                    value={newRoleDepartment}
                    onChange={(e) => setNewRoleDepartment(e.target.value)}
                  >
                    <option value="">Select department</option>
                    {allDepartments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Lead Colorist, VFX Artist, etc."
                    required
                    className="input-field w-full"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    This custom role will be available for all team members working on this project.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRoleModal(false);
                      setNewRoleName('');
                      setNewRoleDepartment('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={addCustomRole.isPending}
                  >
                    {addCustomRole.isPending ? 'Adding...' : 'Add Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Edit Crew Member</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {/* Photo Upload - Same as add form */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                    isDragging
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border-default bg-background-tertiary hover:border-accent-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    {formData.photoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-32 h-32 rounded-xl object-cover shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/80 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-3xl">
                          📷
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">
                          Drag & drop photo here
                        </p>
                        <p className="text-xs text-text-tertiary mb-3">or</p>
                        <label className="btn-secondary cursor-pointer inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      required
                      className="input-field"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Department <span className="text-error">*</span>
                      {editingMember && editingMember.userId === firebaseUser?.uid && userRole !== 'owner' && userRole !== 'admin' && (
                        <span className="ml-2 text-xs text-yellow-400">
                          (Submit role request to change)
                        </span>
                      )}
                    </label>
                    <select
                      required
                      className="input-field"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value, role: '' })}
                      disabled={editingMember && editingMember.userId === firebaseUser?.uid && userRole !== 'owner' && userRole !== 'admin'}
                    >
                      <option value="">Select department</option>
                      {allDepartments.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.department ? (
                    <div className="col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Role <span className="text-error">*</span>
                        {editingMember && editingMember.userId === firebaseUser?.uid && userRole !== 'owner' && userRole !== 'admin' && (
                          <span className="ml-2 text-xs text-yellow-400">
                            (Submit role request to change)
                          </span>
                        )}
                      </label>
                      <select
                        required={!showInlineRoleInputEdit}
                        className="input-field w-full"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        disabled={showInlineRoleInputEdit || (editingMember && editingMember.userId === firebaseUser?.uid && userRole !== 'owner' && userRole !== 'admin')}
                      >
                        <option value="">Select role</option>
                        {getRolesForDepartment(formData.department).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      
                      {!showInlineRoleInputEdit && !(editingMember && editingMember.userId === firebaseUser?.uid && userRole !== 'owner' && userRole !== 'admin') ? (
                        <button
                          type="button"
                          onClick={() => setShowInlineRoleInputEdit(true)}
                          className="text-xs text-accent-primary hover:text-accent-hover font-medium flex items-center gap-1"
                        >
                          <span>+</span> Add custom role to {DEPARTMENTS.find(d => d.value === formData.department)?.label}
                        </button>
                      ) : showInlineRoleInputEdit ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter custom role name"
                            className="input-field flex-1 text-sm"
                            value={inlineRoleName}
                            onChange={(e) => setInlineRoleName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInlineRole(true);
                              } else if (e.key === 'Escape') {
                                setShowInlineRoleInputEdit(false);
                                setInlineRoleName('');
                              }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineRole(true)}
                            disabled={!inlineRoleName.trim() || addCustomRole.isPending}
                            className="btn-primary text-sm px-3 py-1"
                          >
                            {addCustomRole.isPending ? '...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineRoleInputEdit(false);
                              setInlineRoleName('');
                            }}
                            className="btn-secondary text-sm px-3 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Select department first"
                      disabled
                      className="input-field col-span-2 opacity-50"
                      value=""
                    />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Rate
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      className="input-field"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Rate Type
                    </label>
                    <select
                      className="input-field"
                      value={formData.rateType}
                      onChange={(e) => setFormData({ ...formData, rateType: e.target.value as any })}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="flat">Flat Rate</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                    }}
                    className="btn-secondary"
                    disabled={uploadingImage}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploadingImage}>
                    {uploadingImage ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      'Update Crew Member'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Role Change Modal */}
      {showTemplatesModal && (
        <CrewTemplates
          projectId={projectId}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
      {showRequestRoleModal && myCrewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Request Role Change</h2>
                <button
                  onClick={() => setShowRequestRoleModal(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current Role Info */}
              <div className="mb-6 p-4 rounded-lg bg-background-secondary border border-border-default">
                <h3 className="text-sm font-semibold text-text-tertiary mb-2">Current Role</h3>
                <div className="text-text-primary">
                  <span className="font-medium">{myCrewCard.role}</span>
                  {' '}in{' '}
                  <span className="font-medium capitalize">{myCrewCard.department.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Pending Requests */}
              {myPendingRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">⏳ Pending Requests</h3>
                  {myPendingRequests
                    .filter(r => r.status === 'pending')
                    .map(request => (
                      <div key={request.id} className="flex justify-between items-center">
                        <div className="text-sm text-text-secondary">
                          Requested: <span className="text-text-primary font-medium">{request.requestedRole}</span> in{' '}
                          <span className="text-text-primary font-medium capitalize">
                            {request.requestedDepartment.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Cancel this request?')) {
                              cancelRoleRequest.mutate({ requestId: request.id });
                            }
                          }}
                          className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!requestFormData.requestedDepartment || !requestFormData.requestedRole) {
                    alert('Please select both department and role');
                    return;
                  }
                  createRoleRequest.mutate({
                    projectId,
                    crewMemberId: myCrewCard.id,
                    requestedDepartment: requestFormData.requestedDepartment,
                    requestedRole: requestFormData.requestedRole,
                    reason: requestFormData.reason,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Requested Department *
                  </label>
                  <select
                    value={requestFormData.requestedDepartment}
                    onChange={(e) => setRequestFormData({ ...requestFormData, requestedDepartment: e.target.value, requestedRole: '' })}
                    className="input-field"
                    required
                  >
                    <option value="">Select department...</option>
                    {allDepartments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Requested Role *
                  </label>
                  <select
                    value={requestFormData.requestedRole}
                    onChange={(e) => setRequestFormData({ ...requestFormData, requestedRole: e.target.value })}
                    className="input-field"
                    required
                    disabled={!requestFormData.requestedDepartment}
                  >
                    <option value="">Select role...</option>
                    {requestFormData.requestedDepartment &&
                      getRolesForDepartment(requestFormData.requestedDepartment).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={requestFormData.reason}
                    onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                    placeholder="Why are you requesting this change?"
                    className="input-field min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestRoleModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createRoleRequest.isPending}
                  >
                    {createRoleRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to show budget items linked to a crew member
function CrewMemberBudgetSection({ 
  projectId, 
  crewMemberId, 
  canEdit,
  onCreateBudgetItem,
  onViewBudget,
  compact = false
}: { 
  projectId: string; 
  crewMemberId: string;
  canEdit: boolean;
  onCreateBudgetItem: () => void;
  onViewBudget: () => void;
  compact?: boolean;
}) {
  const { data: budgetItems = [], isLoading } = trpc.budget.getItemsByCrewMember.useQuery({
    projectId,
    crewMemberId,
  });

  if (isLoading) {
    return <div className="text-xs text-text-tertiary">Loading budget...</div>;
  }

  const totalAmount = budgetItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);

  if (compact) {
    // Compact view for list mode
    if (budgetItems.length === 0) {
      return canEdit ? (
        <button
          onClick={onCreateBudgetItem}
          className="text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
          title="Create Budget Item"
        >
          💰
        </button>
      ) : null;
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary" title={`${budgetItems.length} budget items`}>
          💰 {budgetItems.length}
        </span>
        <button
          onClick={onViewBudget}
          className="text-xs text-accent-primary hover:text-accent-hover"
          title="View Budget"
        >
          →
        </button>
      </div>
    );
  }

  // Full view for grid mode
  if (budgetItems.length === 0) {
    return (
      <div className="pt-2 border-t border-border-default">
        {canEdit && (
          <button
            onClick={onCreateBudgetItem}
            className="w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
          >
            💰 Create Budget Item
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-border-default">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-primary">
          💰 {budgetItems.length} Budget Item{budgetItems.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onViewBudget}
          className="text-xs text-accent-primary hover:text-accent-hover"
        >
          View →
        </button>
      </div>
      <div className="text-xs text-text-secondary">
        Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {canEdit && (
        <button
          onClick={onCreateBudgetItem}
          className="mt-1 w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
        >
          + Add Another
        </button>
      )}
    </div>
  );
}
