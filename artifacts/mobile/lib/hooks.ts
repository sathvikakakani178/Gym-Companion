import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from '@/context/AuthContext';

// ── GYMS ──────────────────────────────────────────────────────────────
export function useGyms() {
  return useQuery({
    queryKey: ['gyms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateGym() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('gyms').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gyms'] }),
  });
}

// ── BRANCHES ──────────────────────────────────────────────────────────
export function useBranches(gymId?: string | null) {
  return useQuery({
    queryKey: ['branches', gymId],
    queryFn: async () => {
      let q = supabase.from('branches').select('*').order('name');
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (branch: { name: string; location?: string | null; gym_id: string }) => {
      const { data, error } = await supabase.from('branches').insert(branch).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('branches').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}

// ── LEADS ──────────────────────────────────────────────────────────────
export function useLeads(gymId?: string | null) {
  return useQuery({
    queryKey: ['leads', gymId],
    queryFn: async () => {
      let q = supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: any) => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('leads').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

// ── MEMBERS ───────────────────────────────────────────────────────────
export function useMembers(gymId?: string | null) {
  return useQuery({
    queryKey: ['members', gymId],
    queryFn: async () => {
      let q = supabase
        .from('members')
        .select('*, trainer:profiles!members_trainer_id_fkey(id, name, phone)')
        .order('name');
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      const today = new Date();
      return (data ?? []).map((m: any) => {
        const expiry = new Date(m.expiry_date);
        const diff = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
        const status = diff < 0 ? 'expired' : diff <= 7 ? 'expiring' : 'active';
        return { ...m, status };
      });
    },
  });
}

export function useInsertMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (member: any) => {
      const { data, error } = await supabase.from('members').insert(member).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('members').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

// ── TRAINERS ──────────────────────────────────────────────────────────
export function useTrainers(gymId?: string | null) {
  return useQuery({
    queryKey: ['trainers', gymId],
    queryFn: async () => {
      let q = supabase.from('trainers').select('*, profile:profiles!trainers_profile_id_fkey(id, name, email, phone)').order('created_at', { ascending: false });
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── PROFILES ──────────────────────────────────────────────────────────
export function useProfiles(gymId?: string | null) {
  return useQuery({
    queryKey: ['profiles', gymId],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('name');
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── CLIENT PROFILES ───────────────────────────────────────────────────
export function useClientProfiles(gymId?: string | null, trainerId?: string | null) {
  return useQuery({
    queryKey: ['client_profiles', gymId, trainerId],
    queryFn: async () => {
      let q = supabase.from('client_profiles').select('*, member:members!client_profiles_member_id_fkey(id, name, phone, gym_id, trainer_id)');
      if (gymId) q = q.eq('member.gym_id', gymId);
      if (trainerId) q = q.eq('member.trainer_id', trainerId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).filter((p: any) => p.member !== null);
    },
  });
}

export function useUpdateClientProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('client_profiles').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_profiles'] }),
  });
}

// ── DIET PLANS ────────────────────────────────────────────────────────
export function useDietPlans(profileId?: string | null) {
  return useQuery({
    queryKey: ['diet_plans', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase.from('diet_plans').select('*').eq('client_profile_id', profileId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertDietPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: any) => {
      const { data, error } = await supabase.from('diet_plans').upsert(plan, { onConflict: 'client_profile_id,day_of_week,meal_slot' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet_plans'] }),
  });
}

export function useDeleteDietPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diet_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet_plans'] }),
  });
}

// ── WEIGHT HISTORY ────────────────────────────────────────────────────
export function useWeightHistory(profileId?: string | null) {
  return useQuery({
    queryKey: ['weight_history', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase.from('weight_history').select('*').eq('client_profile_id', profileId!).order('recorded_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────────
export function useActivityLog(gymId?: string | null) {
  return useQuery({
    queryKey: ['activity_log', gymId],
    queryFn: async () => {
      let q = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50);
      if (gymId) q = q.eq('gym_id', gymId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertActivity() {
  return useMutation({
    mutationFn: async (activity: { gym_id?: string | null; actor_name: string; action: string; details?: string | null }) => {
      const { error } = await supabase.from('activity_log').insert(activity);
      if (error) throw error;
    },
  });
}
