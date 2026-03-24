import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLeads, useTrainers, useBranches, useInsertBranch, useDeleteBranch, useInsertActivity, useProfiles, useMembers, useGyms, useActivityLog } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Badge } from '@/components/Badge';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

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
  const isTrainer = user?.role === 'trainer';

  const sections = [];

  if (isAdmin) {
    sections.push(
      { key: 'gyms', label: 'Gym Accounts', icon: 'business-outline', color: Colors.info },
      { key: 'activity', label: 'Activity Log', icon: 'pulse-outline', color: Colors.warning },
    );
  }

  if (isAdmin || isOwner) {
    sections.push(
      { key: 'trainers', label: 'Trainers', icon: 'barbell-outline', color: Colors.purple },
      { key: 'branches', label: 'Branches', icon: 'map-outline', color: Colors.primary },
      { key: 'analytics', label: 'Analytics', icon: 'bar-chart-outline', color: Colors.info },
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="More" subtitle={user?.name} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{(user?.name || 'U')[0]}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
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
          style={({ pressed }) => [styles.menuItem, styles.logoutItem, pressed && { opacity: 0.75 }, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.dangerMuted }]}>
            {loggingOut ? <ActivityIndicator size="small" color={Colors.danger} /> : <Ionicons name="log-out-outline" size={20} color={Colors.danger} />}
          </View>
          <Text style={[styles.menuLabel, { color: Colors.danger }]}>{loggingOut ? 'Signing out...' : 'Sign Out'}</Text>
        </Pressable>
      </ScrollView>

      {/* Sub-screens as modals */}
      <Modal visible={activeSection === 'trainers'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <TrainersSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'branches'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <BranchesSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'gyms'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <GymsSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'activity'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <ActivitySection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'analytics'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <AnalyticsSection onClose={() => setActiveSection(null)} />
      </Modal>
    </View>
  );
}

function SectionHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[sectionStyles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={sectionStyles.headerTitle}>{title}</Text>
      <Pressable onPress={onClose} style={sectionStyles.closeBtn}>
        <Ionicons name="close" size={22} color={Colors.text} />
      </Pressable>
    </View>
  );
}

function TrainersSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: trainers = [], isLoading } = useTrainers(user?.gym_id);
  const { data: members = [] } = useMembers(user?.gym_id);
  const qc = useQueryClient();
  const insertActivity = useInsertActivity();
  const insets = useSafeAreaInsets();

  const handleDelete = (trainer: any) => {
    const clientCount = members.filter((m: any) => m.trainer_id === trainer.profile_id).length;
    if (clientCount > 0) { Alert.alert('Cannot Delete', `${clientCount} member(s) still assigned`); return; }
    Alert.alert('Delete Trainer', `Remove ${trainer.profile?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('trainers').delete().eq('id', trainer.id);
          await supabase.from('profiles').delete().eq('id', trainer.profile_id);
          qc.invalidateQueries({ queryKey: ['trainers'] });
          insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'Owner', action: 'Removed trainer', details: trainer.profile?.name });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Trainers" onClose={onClose} />
      {isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          {trainers.length === 0 && <Text style={sectionStyles.empty}>No trainers added yet</Text>}
          {trainers.map((t: any) => {
            const clientCount = members.filter((m: any) => m.trainer_id === t.profile_id).length;
            return (
              <View key={t.id} style={sectionStyles.card}>
                <View style={sectionStyles.cardTop}>
                  <View style={sectionStyles.avatar}>
                    <Text style={sectionStyles.avatarText}>{(t.profile?.name || 'T')[0]}</Text>
                  </View>
                  <View style={sectionStyles.info}>
                    <Text style={sectionStyles.name}>{t.profile?.name || 'Unknown'}</Text>
                    <Text style={sectionStyles.sub}>{t.profile?.email}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(t)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
                <View style={sectionStyles.metaRow}>
                  <Text style={sectionStyles.metaText}>{clientCount} clients</Text>
                  {t.specialization && <Text style={sectionStyles.metaText}>{t.specialization}</Text>}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function BranchesSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: branches = [], isLoading } = useBranches(user?.gym_id);
  const insertBranch = useInsertBranch();
  const deleteBranch = useDeleteBranch();
  const insertActivity = useInsertActivity();
  const { data: members = [] } = useMembers(user?.gym_id);
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });

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

  const handleDelete = (b: any) => {
    const memberCount = members.filter((m: any) => m.branch_id === b.id).length;
    if (memberCount > 0) { Alert.alert('Cannot Delete', `${memberCount} member(s) still assigned`); return; }
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
          style={[sectionStyles.addBtn, showAdd && { backgroundColor: Colors.secondary }]}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color={Colors.primary} />
          <Text style={sectionStyles.addBtnText}>{showAdd ? 'Cancel' : 'Add Branch'}</Text>
        </Pressable>
        {showAdd && (
          <View style={sectionStyles.formCard}>
            {[
              { field: 'name', placeholder: 'Branch Name' },
              { field: 'location', placeholder: 'Location (optional)' },
            ].map(({ field, placeholder }) => (
              <TextInput
                key={field}
                style={sectionStyles.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                value={(form as any)[field]}
                onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
              />
            ))}
            <Pressable style={sectionStyles.submitBtn} onPress={handleAdd} disabled={insertBranch.isPending}>
              {insertBranch.isPending ? <ActivityIndicator color="#000" /> : <Text style={sectionStyles.submitBtnText}>Save Branch</Text>}
            </Pressable>
          </View>
        )}
        {isLoading ? <ActivityIndicator color={Colors.primary} /> : null}
        {branches.map((b: any) => {
          const memberCount = members.filter((m: any) => m.branch_id === b.id).length;
          return (
            <View key={b.id} style={sectionStyles.card}>
              <View style={sectionStyles.cardTop}>
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
                <View style={sectionStyles.info}>
                  <Text style={sectionStyles.name}>{b.name}</Text>
                  {b.location && <Text style={sectionStyles.sub}>{b.location}</Text>}
                </View>
                <Text style={sectionStyles.count}>{memberCount} members</Text>
                <Pressable onPress={() => handleDelete(b)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            </View>
          );
        })}
        {branches.length === 0 && !isLoading && <Text style={sectionStyles.empty}>No branches yet</Text>}
      </ScrollView>
    </View>
  );
}

function GymsSection({ onClose }: { onClose: () => void }) {
  const { data: gyms = [], isLoading } = useGyms();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Gym Accounts" onClose={onClose} />
      {isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          {gyms.length === 0 && <Text style={sectionStyles.empty}>No gyms registered</Text>}
          {gyms.map((g: any) => (
            <View key={g.id} style={sectionStyles.card}>
              <View style={sectionStyles.cardTop}>
                <View style={[sectionStyles.avatar, { backgroundColor: Colors.infoMuted }]}>
                  <Text style={[sectionStyles.avatarText, { color: Colors.info }]}>{g.name[0]}</Text>
                </View>
                <View style={sectionStyles.info}>
                  <Text style={sectionStyles.name}>{g.name}</Text>
                  <Text style={sectionStyles.sub}>{g.owner_name}</Text>
                </View>
                <Badge label={g.is_active ? 'active' : 'inactive'} variant={g.is_active ? 'active' : 'expired'} />
              </View>
              <View style={sectionStyles.metaRow}>
                <Text style={sectionStyles.metaText}>{g.plan}</Text>
                <Text style={sectionStyles.metaText}>{g.phone || 'No phone'}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ActivitySection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: activity = [], isLoading } = useActivityLog(user?.role === 'super_admin' ? null : user?.gym_id);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Activity Log" onClose={onClose} />
      {isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 20 }}>
          {activity.length === 0 && <Text style={sectionStyles.empty}>No activity yet</Text>}
          {activity.map((a: any) => (
            <View key={a.id} style={sectionStyles.activityCard}>
              <View>
                <Text style={sectionStyles.activityText}>{a.actor_name}: {a.action}</Text>
                {a.details && <Text style={sectionStyles.activityDetail}>{a.details}</Text>}
              </View>
              <Text style={sectionStyles.activityDate}>{new Date(a.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function AnalyticsSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: leads = [] } = useLeads(user?.gym_id);
  const { data: members = [] } = useMembers(user?.gym_id);
  const { data: trainers = [] } = useTrainers(user?.gym_id);
  const insets = useSafeAreaInsets();

  const activeMembers = members.filter((m: any) => m.status === 'active').length;
  const membersCount = leads.filter((l: any) => l.status === 'member').length;
  const convRate = leads.length ? Math.round((membersCount / leads.length) * 100) : 0;

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
        <View style={analyticsStyles.grid}>
          {[
            { label: 'Total Leads', value: leads.length, color: Colors.info },
            { label: 'Active Members', value: activeMembers, color: Colors.primary },
            { label: 'Conversion', value: `${convRate}%`, color: Colors.warning },
            { label: 'Trainers', value: trainers.length, color: Colors.purple },
          ].map(item => (
            <View key={item.label} style={[analyticsStyles.card, { borderTopColor: item.color }]}>
              <Text style={analyticsStyles.cardLabel}>{item.label}</Text>
              <Text style={[analyticsStyles.cardValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={sectionStyles.card}>
          <Text style={analyticsStyles.sectionTitle}>Lead Funnel</Text>
          {funnelData.map(item => (
            <View key={item.stage} style={analyticsStyles.funnelRow}>
              <Text style={analyticsStyles.funnelLabel}>{item.stage}</Text>
              <View style={analyticsStyles.barWrapper}>
                <View style={[analyticsStyles.bar, { width: `${leads.length ? (item.count / leads.length) * 100 : 0}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={[analyticsStyles.funnelCount, { color: item.color }]}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={sectionStyles.card}>
          <Text style={analyticsStyles.sectionTitle}>Member Status</Text>
          {[
            { label: 'Active', value: activeMembers, color: Colors.primary },
            { label: 'Expiring', value: members.filter((m: any) => m.status === 'expiring').length, color: Colors.warning },
            { label: 'Expired', value: members.filter((m: any) => m.status === 'expired').length, color: Colors.danger },
          ].map(item => (
            <View key={item.label} style={analyticsStyles.funnelRow}>
              <Text style={analyticsStyles.funnelLabel}>{item.label}</Text>
              <View style={analyticsStyles.barWrapper}>
                <View style={[analyticsStyles.bar, { width: `${members.length ? (item.value / members.length) * 100 : 0}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={[analyticsStyles.funnelCount, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
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
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.primary },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  userEmail: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  roleBadge: {
    backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  roleText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.primary, textTransform: 'capitalize' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.text, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border },
  logoutItem: {},
});

const sectionStyles = StyleSheet.create({
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
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.primary },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  count: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textMuted },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
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
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  activityCard: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
  },
  activityText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text, flex: 1 },
  activityDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activityDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
});

const analyticsStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%', backgroundColor: Colors.card, borderRadius: 12,
    padding: 14, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border,
  },
  cardLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  cardValue: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text, marginBottom: 10 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  funnelLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, width: 55 },
  barWrapper: { flex: 1, height: 8, backgroundColor: Colors.secondary, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4, minWidth: 2 },
  funnelCount: { fontFamily: 'Inter_600SemiBold', fontSize: 13, width: 28, textAlign: 'right' },
});

