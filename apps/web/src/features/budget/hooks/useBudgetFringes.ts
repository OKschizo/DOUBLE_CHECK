import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState, useMemo, useCallback } from 'react';

// Fringe rate types
export type FringeType = 
  | 'state_tax' 
  | 'federal_tax' 
  | 'union_dues' 
  | 'pension' 
  | 'health_welfare' 
  | 'workers_comp' 
  | 'unemployment'
  | 'general_liability'
  | 'production_fee'
  | 'other';

export interface FringeRate {
  id: string;
  projectId: string;
  name: string;
  type: FringeType;
  rate: number; // Percentage (e.g., 6.2 for 6.2%)
  isPercentage: boolean;
  flatAmount?: number;
  appliesToDepartments: string[]; // Empty = all
  appliesToLabor: boolean; // Does this apply to labor costs?
  appliesToRentals: boolean; // Does this apply to rental costs?
  state?: string; // For state-specific taxes
  enabled: boolean;
}

export interface FringeCalculation {
  baseAmount: number;
  fringes: Array<{
    fringeId: string;
    fringeName: string;
    amount: number;
    rate: number;
  }>;
  totalFringes: number;
  totalWithFringes: number;
}

// Default fringe rates (common US production rates)
export const DEFAULT_FRINGE_PRESETS = [
  { name: 'FICA/Social Security', type: 'federal_tax' as FringeType, rate: 6.2, appliesToLabor: true },
  { name: 'Medicare', type: 'federal_tax' as FringeType, rate: 1.45, appliesToLabor: true },
  { name: 'Federal Unemployment (FUTA)', type: 'unemployment' as FringeType, rate: 0.6, appliesToLabor: true },
  { name: 'State Unemployment (CA)', type: 'unemployment' as FringeType, rate: 3.4, appliesToLabor: true, state: 'CA' },
  { name: 'Workers Comp (Low Risk)', type: 'workers_comp' as FringeType, rate: 3.0, appliesToLabor: true },
  { name: 'DGA Pension', type: 'pension' as FringeType, rate: 8.5, appliesToLabor: true },
  { name: 'DGA Health', type: 'health_welfare' as FringeType, rate: 6.5, appliesToLabor: true },
  { name: 'SAG-AFTRA Pension', type: 'pension' as FringeType, rate: 17.0, appliesToLabor: true },
  { name: 'SAG-AFTRA Health', type: 'health_welfare' as FringeType, rate: 1.0, appliesToLabor: true },
  { name: 'IATSE Pension', type: 'pension' as FringeType, rate: 7.5, appliesToLabor: true },
  { name: 'IATSE Health', type: 'health_welfare' as FringeType, rate: 8.0, appliesToLabor: true },
  { name: 'General Liability Insurance', type: 'general_liability' as FringeType, rate: 1.5, appliesToLabor: true, appliesToRentals: true },
  { name: 'Production Fee', type: 'production_fee' as FringeType, rate: 10.0, appliesToLabor: false, appliesToRentals: false },
];

export function useBudgetFringes(projectId: string) {
  const [fringes, setFringes] = useState<FringeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setFringes([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'budget_fringes'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFringes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FringeRate)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const createFringe = async (data: Omit<FringeRate, 'id' | 'projectId'>) => {
    const docRef = await addDoc(collection(db, 'budget_fringes'), {
      ...data,
      projectId,
      enabled: data.enabled ?? true,
      appliesToDepartments: data.appliesToDepartments || [],
      appliesToLabor: data.appliesToLabor ?? true,
      appliesToRentals: data.appliesToRentals ?? false,
      isPercentage: data.isPercentage ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateFringe = async ({ id, data }: { id: string, data: Partial<FringeRate> }) => {
    await updateDoc(doc(db, 'budget_fringes', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteFringe = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'budget_fringes', id));
  };

  // Add default fringes from a preset
  const addFromPreset = useCallback(async (presetName: string) => {
    const preset = DEFAULT_FRINGE_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    
    await createFringe({
      name: preset.name,
      type: preset.type,
      rate: preset.rate,
      isPercentage: true,
      appliesToDepartments: [],
      appliesToLabor: preset.appliesToLabor ?? true,
      appliesToRentals: preset.appliesToRentals ?? false,
      state: preset.state,
      enabled: true,
    });
  }, [projectId]);

  // Add common fringes for a specific guild
  const addGuildPackage = useCallback(async (guild: 'dga' | 'sag' | 'iatse' | 'payroll') => {
    const packages: Record<string, string[]> = {
      payroll: ['FICA/Social Security', 'Medicare', 'Federal Unemployment (FUTA)', 'State Unemployment (CA)', 'Workers Comp (Low Risk)'],
      dga: ['DGA Pension', 'DGA Health'],
      sag: ['SAG-AFTRA Pension', 'SAG-AFTRA Health'],
      iatse: ['IATSE Pension', 'IATSE Health'],
    };
    
    const presetsToAdd = packages[guild] || [];
    for (const presetName of presetsToAdd) {
      // Check if already exists
      const exists = fringes.some(f => f.name === presetName);
      if (!exists) {
        await addFromPreset(presetName);
      }
    }
  }, [fringes, addFromPreset]);

  // Calculate fringes for a given labor amount
  const calculateFringes = useCallback((laborAmount: number, options?: {
    department?: string;
    isRental?: boolean;
  }): FringeCalculation => {
    const enabledFringes = fringes.filter(f => f.enabled);
    const applicableFringes = enabledFringes.filter(f => {
      // Check if applies to labor/rentals
      if (options?.isRental && !f.appliesToRentals) return false;
      if (!options?.isRental && !f.appliesToLabor) return false;
      
      // Check department filter
      if (f.appliesToDepartments.length > 0 && options?.department) {
        if (!f.appliesToDepartments.includes(options.department)) return false;
      }
      
      return true;
    });

    const breakdown = applicableFringes.map(fringe => {
      const amount = fringe.isPercentage 
        ? (laborAmount * fringe.rate / 100)
        : (fringe.flatAmount || 0);
      
      return {
        fringeId: fringe.id,
        fringeName: fringe.name,
        amount,
        rate: fringe.rate,
      };
    });

    const totalFringes = breakdown.reduce((sum, b) => sum + b.amount, 0);

    return {
      baseAmount: laborAmount,
      fringes: breakdown,
      totalFringes,
      totalWithFringes: laborAmount + totalFringes,
    };
  }, [fringes]);

  // Get total fringe rate (sum of all enabled percentage fringes)
  const totalFringeRate = useMemo(() => {
    return fringes
      .filter(f => f.enabled && f.isPercentage && f.appliesToLabor)
      .reduce((sum, f) => sum + f.rate, 0);
  }, [fringes]);

  return {
    fringes,
    isLoading,
    totalFringeRate,
    createFringe: { mutate: createFringe, mutateAsync: createFringe },
    updateFringe: { mutate: updateFringe, mutateAsync: updateFringe },
    deleteFringe: { mutate: deleteFringe, mutateAsync: deleteFringe },
    addFromPreset: { mutate: addFromPreset, mutateAsync: addFromPreset },
    addGuildPackage: { mutate: addGuildPackage, mutateAsync: addGuildPackage },
    calculateFringes,
    presets: DEFAULT_FRINGE_PRESETS,
  };
}
