import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGyms, useUpdateGym, useInsertActivity } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

const PLANS = ['trial', 'basic', 'pro', 'enterprise'] as const;
const planColors: Record<string, string> = {
  trial: Colors.warning,
  basic: Colors.info,
  pro: Colors.primary,
  enterprise: Colors.purple,
};

export default function GymsScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const { data: gyms = [], isLoading } = useGyms();
  const updateGym = useUpdateGym();
  const insertActivity = useInsertActivity();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', owner_name: '', email: '', phone: '', password: '', plan: 'trial' });
  const [formError, setFormError] = useState('');
  const [pendingToggle, setPendingToggle] = useState<any>(null);

  const filtered = gyms.filter((g: any) => {
    if (planFilter !== 'all' && g.plan !== planFilter) return false;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.owner_name.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    setFormError('');
    if (!form.name || !form.owner_name || !form.email || !form.password) {
      setFormError('Gym name, owner name, email and password are required');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.rpc('create_gym_with_owner' as any, {
      p_gym_name: form.name,
      p_owner_name: form.owner_name,
      p_owner_email: form.email,
      p_owner_password: form.password,
      p_phone: form.phone || null,
      p_plan: form.plan,
    });
    setAdding(false);
    if (error) { setFormError(error.message); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    qc.invalidateQueries({ queryKey: ['gyms'] });
    insertActivity.mutate({
      gym_id: (data as any)?.gym_id || null,
      actor_name: user?.name || 'Admin',
      action: 'Created gym account',
      details: form.name,
    });
    setShowAdd(false);
    setForm({ name: '', owner_name: '', email: '', phone: '', password: '', plan: 'trial' });
  };

  const toggleActive = (gym: any) => { setPendingToggle(gym); };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    updateGym.mutate(
      { id: pendingToggle.id, is_active: !pendingToggle.is_active },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          insertActivity.mutate({
            gym_id: pendingToggle.id,
            actor_name: user?.name || 'Admin',
            action: pendingToggle.is_active ? 'Suspended gym' : 'Reactivated gym',
            details: pendingToggle.name,
          });
          setPendingToggle(null);
        },
      }
    );
  };

  const activeCount = gyms.filter((g: any) => g.is_active).length;
  const suspendedCount = gyms.filter((g: any) => !g.is_active).length;
  const trialCount = gyms.filter((g: any) => g.plan === 'trial').length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gym Accounts" subtitle={`${gyms.length} gyms`} />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderTopColor: Colors.primary }]}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: Colors.danger }]}>
              <Text style={[styles.statValue, { color: Colors.danger }]}>{suspendedCount}</Text>
              <Text style={styles.statLabel}>Suspended</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: Colors.warning }]}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{trialCount}</Text>
              <Text style={styles.statLabel}>Trial</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search gyms..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {['all', ...PLANS].map(p => (
              <Pressable
                key={p}
                style={[styles.filterChip, planFilter === p && styles.filterChipActive]}
                onPress={() => setPlanFilter(p)}
              >
                <Text style={[styles.filterChipText, planFilter === p && styles.filterChipTextActive]}>
                  {p === 'all' ? `All (${gyms.length})` : `${p} (${gyms.filter((g: any) => g.plan === p).length})`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={() => { Haptics.selectionAsync(); setShowAdd(!showAdd); }}
          >
            <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color="#000" />
            <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : 'Add Gym'}</Text>
          </Pressable>

          {showAdd && (
            <View style={styles.formCard}>
              {[
                { field: 'name', label: 'Gym Name *', placeholder: 'FitZone Mumbai', keyboard: 'default' },
                { field: 'owner_name', label: 'Owner Name *', placeholder: 'Rahul Sharma', keyboard: 'default' },
                { field: 'email', label: 'Owner Email *', placeholder: 'owner@gym.com', keyboard: 'email-address' },
                { field: 'phone', label: 'Phone', placeholder: '+91 98765 43210', keyboard: 'phone-pad' },
              ].map(({ field, label, placeholder, keyboard }) => (
                <View key={field} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={(form as any)[field]}
                    onChangeText={(v: string) => setForm(f => ({ ...f, [field]: v }))}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={keyboard as any}
                    autoCapitalize={field === 'email' ? 'none' : 'words'}
                  />
                </View>
              ))}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password *</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={form.password}
                    onChangeText={(v: string) => setForm(f => ({ ...f, password: v }))}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Plan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {PLANS.map(p => (
                    <Pressable
                      key={p}
                      style={[styles.chip, form.plan === p && styles.chipActive]}
                      onPress={() => setForm(f => ({ ...f, plan: p }))}
                    >
                      <Text style={[styles.chipText, form.plan === p && styles.chipTextActive]}>{p}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              {!!formError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              )}
              <Pressable style={[styles.submitBtn, adding && { opacity: 0.6 }]} onPress={handleAdd} disabled={adding}>
                {adding ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Create Gym</Text>}
              </Pressable>
            </View>
          )}

          {filtered.length === 0 && !showAdd && (
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No gyms found</Text>
            </View>
          )}

          {filtered.map((g: any) => (
            <View key={g.id} style={[styles.card, !g.is_active && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={[styles.gymIcon, { backgroundColor: planColors[g.plan] + '22' }]}>
                  <Text style={[styles.gymIconText, { color: planColors[g.plan] }]}>{g.name[0]}</Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.gymName}>{g.name}</Text>
                    {!g.is_active && (
                      <View style={styles.suspendedBadge}>
                        <Text style={styles.suspendedText}>Suspended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.ownerName}>{g.owner_name}</Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: planColors[g.plan] + '22' }]}>
                  <Text style={[styles.planText, { color: planColors[g.plan] }]}>{g.plan}</Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                {g.phone && (
                  <View style={styles.metaItem}>
                    <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{g.phone}</Text>
                  </View>
                )}
                <Pressable
                  style={[styles.toggleBtn, g.is_active ? styles.toggleSuspend : styles.toggleActivate]}
                  onPress={() => toggleActive(g)}
                  disabled={updateGym.isPending}
                >
                  <Ionicons
                    name={g.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={14}
                    color={g.is_active ? Colors.danger : Colors.primary}
                  />
                  <Text style={[styles.toggleText, { color: g.is_active ? Colors.danger : Colors.primary }]}>
                    {g.is_active ? 'Suspend' : 'Reactivate'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <ConfirmModal
        visible={!!pendingToggle}
        title={pendingToggle?.is_active ? 'Suspend Gym' : 'Reactivate Gym'}
        message={`${pendingToggle?.is_active ? 'Suspend' : 'Reactivate'} ${pendingToggle?.name}?`}
        confirmLabel={pendingToggle?.is_active ? 'Suspend' : 'Reactivate'}
        destructive={pendingToggle?.is_active}
        icon={pendingToggle?.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
        loading={updateGym.isPending}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 2,
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary, borderRadius: 10, paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  filterRow: { flexGrow: 0 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  filterChipTextActive: { color: Colors.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, borderRadius: 12, backgroundColor: Colors.primary,
  },
  addBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000' },
  formCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.secondary, borderRadius: 10, height: 44,
    paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.primary },
  submitBtn: {
    height: 44, backgroundColor: Colors.primary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000' },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardInactive: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gymIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  gymIconText: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  ownerName: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'capitalize' },
  suspendedBadge: { backgroundColor: Colors.dangerMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  suspendedText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: Colors.danger },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  toggleSuspend: { borderColor: Colors.danger + '50', backgroundColor: Colors.dangerMuted },
  toggleActivate: { borderColor: Colors.primary + '50', backgroundColor: Colors.primaryMuted },
  toggleText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerMuted, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.danger + '40',
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.danger, flex: 1 },
});
