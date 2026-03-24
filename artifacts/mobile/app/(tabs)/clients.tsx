import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
  TextInput, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  useClientProfiles, useWeightHistory, useDietPlans,
  useUpdateClientProfile, useUpsertDietPlan, useDeleteDietPlan,
} from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_SLOTS = [
  { key: 'Breakfast', emoji: 'sunny-outline', time: '7–8 AM' },
  { key: 'Mid-morning', emoji: 'cafe-outline', time: '10–11 AM' },
  { key: 'Lunch', emoji: 'restaurant-outline', time: '1–2 PM' },
  { key: 'Evening', emoji: 'beer-outline', time: '4–5 PM' },
  { key: 'Dinner', emoji: 'moon-outline', time: '7–8 PM' },
];

export default function ClientsScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const { data: profiles = [], isLoading } = useClientProfiles(
    user?.role === 'trainer' ? null : user?.gym_id,
    user?.role === 'trainer' ? user?.id : null,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'profile' | 'diet'>('profile');

  const selected = selectedId ? profiles.find(p => p.id === selectedId) : profiles[0];

  if (isLoading) return (
    <View style={styles.container}>
      <ScreenHeader title="Client Profiles" />
      <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
    </View>
  );

  if (profiles.length === 0) return (
    <View style={styles.container}>
      <ScreenHeader title="Client Profiles" />
      <View style={styles.empty}>
        <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No clients assigned</Text>
        <Text style={styles.emptySub}>Clients appear here once they are assigned to you</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Client Profiles" subtitle={`${profiles.length} clients`} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
        {profiles.map((p: any) => (
          <Pressable
            key={p.id}
            style={[styles.chip, (selected?.id === p.id) && styles.chipActive]}
            onPress={() => { setSelectedId(p.id); Haptics.selectionAsync(); }}
          >
            <View style={[styles.chipAvatar, selected?.id === p.id && styles.chipAvatarActive]}>
              <Text style={styles.chipAvatarText}>{(p.member?.name || '?')[0]}</Text>
            </View>
            <Text style={[styles.chipText, selected?.id === p.id && styles.chipTextActive]}>
              {p.member?.name || 'Client'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.tabRow}>
        {(['profile', 'diet'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'profile' ? 'Profile' : 'Diet Plan'}
            </Text>
          </Pressable>
        ))}
      </View>

      {selected && tab === 'profile' && <ClientProfileSection profile={selected} tabBarHeight={tabBarHeight} />}
      {selected && tab === 'diet' && <DietPlanSection profileId={selected.id} tabBarHeight={tabBarHeight} />}
    </View>
  );
}

function ClientProfileSection({ profile, tabBarHeight }: { profile: any; tabBarHeight: number }) {
  const updateProfile = useUpdateClientProfile();
  const { data: weightHistory = [] } = useWeightHistory(profile.id);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    weight_kg: String(profile.weight_kg || ''),
    target_weight: String(profile.target_weight || ''),
    height_cm: String(profile.height_cm || ''),
    goal: profile.goal || '',
    dietary: profile.dietary || '',
    medical: profile.medical || '',
    trainer_notes: profile.trainer_notes || '',
  });

  const handleSave = () => {
    updateProfile.mutate({
      id: profile.id,
      weight_kg: parseFloat(editForm.weight_kg) || null,
      target_weight: parseFloat(editForm.target_weight) || null,
      height_cm: parseFloat(editForm.height_cm) || null,
      goal: editForm.goal || null,
      dietary: editForm.dietary || null,
      medical: editForm.medical || null,
      trainer_notes: editForm.trainer_notes || null,
    }, {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditing(false); },
      onError: (e: any) => Alert.alert('Error', e.message),
    });
  };

  const fields = [
    { label: 'Weight (kg)', field: 'weight_kg', keyboard: 'decimal-pad' },
    { label: 'Target Weight (kg)', field: 'target_weight', keyboard: 'decimal-pad' },
    { label: 'Height (cm)', field: 'height_cm', keyboard: 'decimal-pad' },
    { label: 'Goal', field: 'goal', keyboard: 'default' },
    { label: 'Dietary', field: 'dietary', keyboard: 'default' },
    { label: 'Medical Notes', field: 'medical', keyboard: 'default' },
    { label: 'Trainer Notes', field: 'trainer_notes', keyboard: 'default' },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.profileContent, { paddingBottom: tabBarHeight + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Stats</Text>
          <Pressable onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={18} color={Colors.primary} />
          </Pressable>
        </View>
        {editing ? (
          <>
            {fields.map(({ label, field, keyboard }) => (
              <View key={field} style={styles.editField}>
                <Text style={styles.editLabel}>{label}</Text>
                <TextInput
                  style={styles.editInput}
                  value={(editForm as any)[field]}
                  onChangeText={v => setEditForm(f => ({ ...f, [field]: v }))}
                  keyboardType={keyboard as any}
                  placeholderTextColor={Colors.textMuted}
                  multiline={field === 'trainer_notes' || field === 'medical'}
                />
              </View>
            ))}
            <Pressable style={[styles.saveBtn, updateProfile.isPending && { opacity: 0.6 }]} onPress={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>
          </>
        ) : (
          <View style={styles.statsGrid}>
            {[
              { label: 'Weight', value: profile.weight_kg ? `${profile.weight_kg} kg` : '—' },
              { label: 'Target', value: profile.target_weight ? `${profile.target_weight} kg` : '—' },
              { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : '—' },
              { label: 'BMI', value: profile.bmi ? String(profile.bmi) : '—' },
              { label: 'Goal', value: profile.goal || '—' },
              { label: 'Dietary', value: profile.dietary || '—' },
            ].map(row => (
              <View key={row.label} style={styles.statCell}>
                <Text style={styles.statLabel}>{row.label}</Text>
                <Text style={styles.statValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
        {!editing && profile.trainer_notes && (
          <View style={styles.noteBox}>
            <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
            <Text style={styles.noteText}>{profile.trainer_notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight History</Text>
        {weightHistory.length === 0 ? (
          <Text style={styles.emptyMini}>No weight entries yet</Text>
        ) : (
          weightHistory.slice(-5).map((w: any, i) => (
            <View key={w.id || i} style={styles.weightRow}>
              <Text style={styles.weightDate}>{new Date(w.recorded_at).toLocaleDateString()}</Text>
              <Text style={styles.weightVal}>{w.weight_kg} kg</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function DietPlanSection({ profileId, tabBarHeight }: { profileId: string; tabBarHeight: number }) {
  const { data: plans = [] } = useDietPlans(profileId);
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const upsertPlan = useUpsertDietPlan();
  const deletePlan = useDeleteDietPlan();
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const dayPlans = plans.filter((p: any) => p.day_of_week === activeDay);

  const getPlanForSlot = (slot: string) => dayPlans.find((p: any) => p.meal_slot === slot);

  const handleSaveSlot = (slot: string) => {
    if (!editText.trim()) return;
    upsertPlan.mutate({
      client_profile_id: profileId,
      day_of_week: activeDay,
      meal_slot: slot,
      items: editText.trim(),
    }, {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditingSlot(null); },
    });
  };

  const handleDeleteSlot = (plan: any) => {
    deletePlan.mutate(plan.id, {
      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.dietContent, { paddingBottom: tabBarHeight + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow} contentContainerStyle={styles.dayContent}>
        {DAY_NAMES.map((day, i) => (
          <Pressable
            key={day}
            style={[styles.dayBtn, activeDay === i && styles.dayBtnActive]}
            onPress={() => { setActiveDay(i); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.dayBtnText, activeDay === i && styles.dayBtnTextActive]}>{day}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {MEAL_SLOTS.map(slot => {
        const plan = getPlanForSlot(slot.key);
        const isEditing = editingSlot === slot.key;
        return (
          <View key={slot.key} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleRow}>
                <Ionicons name={slot.emoji as any} size={16} color={Colors.primary} />
                <Text style={styles.mealTitle}>{slot.key}</Text>
                <Text style={styles.mealTime}>{slot.time}</Text>
              </View>
              <View style={styles.mealActions}>
                {plan && (
                  <Pressable onPress={() => handleDeleteSlot(plan)}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </Pressable>
                )}
                <Pressable onPress={() => {
                  setEditingSlot(isEditing ? null : slot.key);
                  setEditText(plan?.items || '');
                }}>
                  <Ionicons name={isEditing ? 'close-outline' : (plan ? 'pencil-outline' : 'add-circle-outline')} size={18} color={Colors.primary} />
                </Pressable>
              </View>
            </View>
            {isEditing ? (
              <View style={styles.mealEdit}>
                <TextInput
                  style={styles.mealInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="e.g. Oats, banana, black coffee"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <Pressable style={styles.mealSaveBtn} onPress={() => handleSaveSlot(slot.key)}>
                  <Text style={styles.mealSaveBtnText}>Save</Text>
                </Pressable>
              </View>
            ) : plan ? (
              <Text style={styles.mealItems}>{plan.items}</Text>
            ) : (
              <Text style={styles.mealEmpty}>No meal planned</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chipRow: { flexGrow: 0, marginTop: 12 },
  chipContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  chipAvatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  chipAvatarActive: { backgroundColor: Colors.primary },
  chipAvatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: Colors.text },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 10, backgroundColor: Colors.card, borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.secondary },
  tabBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textMuted },
  tabBtnTextActive: { color: Colors.text },
  profileContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: { width: '47%', backgroundColor: Colors.secondary, borderRadius: 10, padding: 10 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: Colors.primaryMuted, padding: 10, borderRadius: 8 },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text, flex: 1 },
  editField: { gap: 4, marginBottom: 10 },
  editLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase' },
  editInput: {
    backgroundColor: Colors.secondary, borderRadius: 8, padding: 10,
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, minHeight: 40,
  },
  saveBtn: {
    height: 44, backgroundColor: Colors.primary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000' },
  weightRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  weightDate: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  weightVal: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  emptyMini: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted },
  dietContent: { padding: 16, gap: 10 },
  dayRow: { flexGrow: 0, marginBottom: 4 },
  dayContent: { gap: 8, paddingBottom: 8 },
  dayBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  dayBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  dayBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  dayBtnTextActive: { color: Colors.primary },
  mealCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  mealTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealItems: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  mealEmpty: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  mealEdit: { gap: 8 },
  mealInput: {
    backgroundColor: Colors.secondary, borderRadius: 8, padding: 10,
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, minHeight: 60,
  },
  mealSaveBtn: {
    height: 36, backgroundColor: Colors.primary, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  mealSaveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#000' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 30 },
});
