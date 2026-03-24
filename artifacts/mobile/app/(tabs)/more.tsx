import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  useLeads, useMembers, useTrainers, useBranches, useInsertBranch, useUpdateBranch,
  useDeleteBranch, useInsertActivity, useGyms,
} from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const isAdmin = user?.role === 'super_admin';
  const isOwner = user?.role === 'gym_owner';

  const sections: { key: string; label: string; icon: string; color: string }[] = [];

  if (isAdmin) {
    sections.push(
      { key: 'gym_analytics', label: 'Gym Analytics', icon: 'bar-chart-outline', color: Colors.info },
      { key: 'branches', label: 'Branches', icon: 'map-outline', color: Colors.primary },
    );
  }

  if (isOwner) {
    sections.push(
      { key: 'analytics', label: 'Analytics', icon: 'bar-chart-outline', color: Colors.info },
      { key: 'branches', label: 'Branches', icon: 'map-outline', color: Colors.primary },
    );
  }

  const roleLabel =
    user?.role === 'super_admin' ? 'Super Admin'
    : user?.role === 'gym_owner' ? 'Gym Owner'
    : 'Trainer';

  const roleColor =
    user?.role === 'super_admin' ? Colors.purple
    : user?.role === 'gym_owner' ? Colors.primary
    : Colors.warning;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="More" subtitle={user?.name} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <View style={[styles.userAvatar, { backgroundColor: roleColor + '22' }]}>
            <Text style={[styles.userAvatarText, { color: roleColor }]}>{(user?.name || 'U')[0]}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '15', borderColor: roleColor + '40' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>

        {sections.map(section => (
          <Pressable
            key={section.key}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.75 }]}
            onPress={() => { Haptics.selectionAsync(); setActiveSection(section.key); }}
          >
            <View style={[styles.menuIcon, { backgroundColor: section.color + '20' }]}>
              <Ionicons name={section.icon as any} size={20} color={section.color} />
            </View>
            <Text style={styles.menuLabel}>{section.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.75 }, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.dangerMuted }]}>
            {loggingOut
              ? <ActivityIndicator size="small" color={Colors.danger} />
              : <Ionicons name="log-out-outline" size={20} color={Colors.danger} />}
          </View>
          <Text style={[styles.menuLabel, { color: Colors.danger }]}>
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={activeSection === 'branches'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <BranchesSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'analytics'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <AnalyticsSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'gym_analytics'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <GymAnalyticsSection onClose={() => setActiveSection(null)} />
      </Modal>
    </View>
  );
}

function SectionHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[section.header, { paddingTop: insets.top + 12 }]}>
      <Text style={section.headerTitle}>{title}</Text>
      <Pressable onPress={onClose} style={section.closeBtn}>
        <Ionicons name="close" size={22} color={Colors.text} />
      </Pressable>
    </View>
  );
}

function BranchesSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: branches = [], isLoading } = useBranches(user?.gym_id);
  const { data: members = [] } = useMembers(user?.gym_id);
  const { data: trainers = [] } = useTrainers(user?.gym_id);
  const insertBranch = useInsertBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const insertActivity = useInsertActivity();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });

  const handleAdd = () => {
    if (!form.name) { Alert.alert('Error', 'Branch name is required'); return; }
    insertBranch.mutate(
      { name: form.name, location: form.location || null, gym_id: user?.gym_id || '' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAdd(false);
          setForm({ name: '', location: '' });
          insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'Owner', action: 'Created branch', details: form.name });
        },
        onError: (e: any) => Alert.alert('Error', e.message),
      }
    );
  };

  const handleUpdate = () => {
    if (!editingId || !editForm.name) return;
    updateBranch.mutate(
      { id: editingId, name: editForm.name, location: editForm.location || null },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditingId(null); },
        onError: (e: any) => Alert.alert('Error', e.message),
      }
    );
  };

  const handleDelete = (b: any) => {
    const memberCount = members.filter((m: any) => m.branch_id === b.id).length;
    const trainerCount = trainers.filter((t: any) => t.branch_id === b.id).length;
    if (memberCount > 0) { Alert.alert('Cannot Delete', `${memberCount} member(s) still assigned`); return; }
    if (trainerCount > 0) { Alert.alert('Cannot Delete', `${trainerCount} trainer(s) still assigned`); return; }
    Alert.alert('Delete Branch', `Remove ${b.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBranch.mutate(b.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Branches" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
        <Pressable
          style={[section.addBtn, showAdd && { backgroundColor: Colors.secondary }]}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color={Colors.primary} />
          <Text style={section.addBtnText}>{showAdd ? 'Cancel' : 'Add Branch'}</Text>
        </Pressable>
        {showAdd && (
          <View style={section.formCard}>
            {[{ field: 'name', placeholder: 'Branch Name *' }, { field: 'location', placeholder: 'Location (optional)' }].map(({ field, placeholder }) => (
              <TextInput
                key={field}
                style={section.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                value={(form as any)[field]}
                onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
              />
            ))}
            <Pressable style={section.submitBtn} onPress={handleAdd} disabled={insertBranch.isPending}>
              {insertBranch.isPending ? <ActivityIndicator color="#000" /> : <Text style={section.submitBtnText}>Save Branch</Text>}
            </Pressable>
          </View>
        )}
        {isLoading && <ActivityIndicator color={Colors.primary} />}
        {branches.map((b: any) => {
          const memberCount = members.filter((m: any) => m.branch_id === b.id).length;
          const isEditing = editingId === b.id;
          return (
            <View key={b.id} style={section.card}>
              {isEditing ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    style={section.input}
                    value={editForm.name}
                    onChangeText={v => setEditForm(f => ({ ...f, name: v }))}
                    placeholder="Branch Name"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TextInput
                    style={section.input}
                    value={editForm.location}
                    onChangeText={v => setEditForm(f => ({ ...f, location: v }))}
                    placeholder="Location"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable style={[section.submitBtn, { flex: 1 }]} onPress={handleUpdate} disabled={updateBranch.isPending}>
                      {updateBranch.isPending ? <ActivityIndicator color="#000" /> : <Text style={section.submitBtnText}>Update</Text>}
                    </Pressable>
                    <Pressable style={[section.cancelBtn, { flex: 1 }]} onPress={() => setEditingId(null)}>
                      <Text style={section.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={section.cardTop}>
                  <Ionicons name="map-outline" size={20} color={Colors.primary} />
                  <View style={section.info}>
                    <Text style={section.name}>{b.name}</Text>
                    {b.location && <Text style={section.sub}>{b.location}</Text>}
                  </View>
                  <Text style={section.count}>{memberCount} members</Text>
                  <Pressable onPress={() => { setEditingId(b.id); setEditForm({ name: b.name, location: b.location || '' }); }}>
                    <Ionicons name="pencil-outline" size={17} color={Colors.primary} style={{ marginRight: 10 }} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(b)}>
                    <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
        {branches.length === 0 && !isLoading && <Text style={section.empty}>No branches yet</Text>}
      </ScrollView>
    </View>
  );
}

function AnalyticsSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: leads = [] } = useLeads(user?.gym_id);
  const { data: members = [] } = useMembers(user?.gym_id);
  const { data: trainers = [] } = useTrainers(user?.gym_id);

  const activeMembers = members.filter((m: any) => m.status === 'active').length;
  const convCount = leads.filter((l: any) => l.status === 'member').length;
  const convRate = leads.length ? Math.round((convCount / leads.length) * 100) : 0;

  const funnelData = [
    { stage: 'Enquiry', count: leads.filter((l: any) => l.status === 'enquiry').length, color: Colors.info },
    { stage: 'Trial', count: leads.filter((l: any) => l.status === 'trial_booked').length, color: Colors.warning },
    { stage: 'Visited', count: leads.filter((l: any) => l.status === 'visited').length, color: Colors.purple },
    { stage: 'Member', count: leads.filter((l: any) => l.status === 'member').length, color: Colors.primary },
    { stage: 'Churned', count: leads.filter((l: any) => l.status === 'churned').length, color: Colors.danger },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Analytics" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        <View style={analytics.grid}>
          {[
            { label: 'Total Leads', value: leads.length, color: Colors.info },
            { label: 'Active Members', value: activeMembers, color: Colors.primary },
            { label: 'Conversion', value: `${convRate}%`, color: Colors.warning },
            { label: 'Trainers', value: trainers.length, color: Colors.purple },
          ].map(item => (
            <View key={item.label} style={[analytics.card, { borderTopColor: item.color }]}>
              <Text style={analytics.cardLabel}>{item.label}</Text>
              <Text style={[analytics.cardValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={section.card}>
          <Text style={analytics.sectionTitle}>Lead Funnel</Text>
          {funnelData.map(item => (
            <View key={item.stage} style={analytics.funnelRow}>
              <Text style={analytics.funnelLabel}>{item.stage}</Text>
              <View style={analytics.barWrapper}>
                <View style={[analytics.bar, {
                  width: `${leads.length ? (item.count / leads.length) * 100 : 0}%`,
                  backgroundColor: item.color,
                }]} />
              </View>
              <Text style={[analytics.funnelCount, { color: item.color }]}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={section.card}>
          <Text style={analytics.sectionTitle}>Member Status</Text>
          {[
            { label: 'Active', value: activeMembers, color: Colors.primary },
            { label: 'Expiring', value: members.filter((m: any) => m.status === 'expiring').length, color: Colors.warning },
            { label: 'Expired', value: members.filter((m: any) => m.status === 'expired').length, color: Colors.danger },
          ].map(item => (
            <View key={item.label} style={analytics.funnelRow}>
              <Text style={analytics.funnelLabel}>{item.label}</Text>
              <View style={analytics.barWrapper}>
                <View style={[analytics.bar, {
                  width: `${members.length ? (item.value / members.length) * 100 : 0}%`,
                  backgroundColor: item.color,
                }]} />
              </View>
              <Text style={[analytics.funnelCount, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function GymAnalyticsSection({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: gyms = [] } = useGyms();
  const { data: allMembers = [] } = useMembers();
  const { data: allLeads = [] } = useLeads();
  const { data: allTrainers = [] } = useTrainers();

  const activeGyms = gyms.filter((g: any) => g.is_active).length;
  const planCounts: Record<string, number> = {};
  gyms.forEach((g: any) => { planCounts[g.plan] = (planCounts[g.plan] || 0) + 1; });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Gym Analytics" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        <View style={analytics.grid}>
          {[
            { label: 'Total Gyms', value: gyms.length, color: Colors.primary },
            { label: 'Active Gyms', value: activeGyms, color: Colors.info },
            { label: 'Total Members', value: allMembers.length, color: Colors.warning },
            { label: 'Total Leads', value: allLeads.length, color: Colors.purple },
          ].map(item => (
            <View key={item.label} style={[analytics.card, { borderTopColor: item.color }]}>
              <Text style={analytics.cardLabel}>{item.label}</Text>
              <Text style={[analytics.cardValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={section.card}>
          <Text style={analytics.sectionTitle}>Gyms by Plan</Text>
          {Object.entries(planCounts).map(([plan, count]) => (
            <View key={plan} style={analytics.funnelRow}>
              <Text style={[analytics.funnelLabel, { textTransform: 'capitalize' }]}>{plan}</Text>
              <View style={analytics.barWrapper}>
                <View style={[analytics.bar, {
                  width: `${gyms.length ? (count / gyms.length) * 100 : 0}%`,
                  backgroundColor: Colors.primary,
                }]} />
              </View>
              <Text style={[analytics.funnelCount, { color: Colors.primary }]}>{count}</Text>
            </View>
          ))}
          {Object.keys(planCounts).length === 0 && (
            <Text style={section.empty}>No gyms yet</Text>
          )}
        </View>

        <View style={section.card}>
          <Text style={analytics.sectionTitle}>Members per Gym</Text>
          {gyms.slice(0, 10).map((g: any) => {
            const cnt = allMembers.filter((m: any) => m.gym_id === g.id).length;
            const max = Math.max(...gyms.map((gym: any) => allMembers.filter((m: any) => m.gym_id === gym.id).length), 1);
            return (
              <View key={g.id} style={analytics.funnelRow}>
                <Text style={analytics.funnelLabel} numberOfLines={1}>{g.name}</Text>
                <View style={analytics.barWrapper}>
                  <View style={[analytics.bar, { width: `${(cnt / max) * 100}%`, backgroundColor: Colors.info }]} />
                </View>
                <Text style={[analytics.funnelCount, { color: Colors.info }]}>{cnt}</Text>
              </View>
            );
          })}
          {gyms.length === 0 && <Text style={section.empty}>No gyms yet</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  userEmail: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleText: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'capitalize' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.text, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border },
});

const section = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background,
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  count: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textMuted },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, borderRadius: 12, backgroundColor: Colors.primaryMuted,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  addBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.primary },
  formCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  input: {
    backgroundColor: Colors.secondary, borderRadius: 10, height: 44,
    paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  submitBtn: {
    height: 44, backgroundColor: Colors.primary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000' },
  cancelBtn: {
    height: 44, backgroundColor: Colors.secondary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textSecondary },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});

const analytics = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 2,
  },
  cardLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardValue: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 8 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  funnelLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, width: 60 },
  barWrapper: { flex: 1, height: 8, backgroundColor: Colors.secondary, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4, minWidth: 4 },
  funnelCount: { fontFamily: 'Inter_600SemiBold', fontSize: 12, width: 28, textAlign: 'right' },
});
