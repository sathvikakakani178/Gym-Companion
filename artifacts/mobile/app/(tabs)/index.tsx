import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import {
  useLeads, useMembers, useTrainers, useGyms,
  useActivityLog, useClientProfiles,
} from '@/lib/hooks';
import { StatCard } from '@/components/StatCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';

// ── Gym Owner / Branch Manager dashboard ──────────────────────────────
function OwnerDashboard() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const { data: leads = [], refetch: refLeads, isRefetching: refL } = useLeads(user?.gym_id);
  const { data: members = [], refetch: refMembers, isRefetching: refM } = useMembers(user?.gym_id);
  const { data: activity = [], refetch: refAct } = useActivityLog(user?.gym_id);

  const enquiries = leads.filter(l => l.status === 'enquiry').length;
  const trialsBooked = leads.filter(l => l.status === 'trial_booked').length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const expiring = members.filter(m => m.status === 'expiring').length;
  const expired = members.filter(m => m.status === 'expired').length;

  const onRefresh = () => { refLeads(); refMembers(); refAct(); };

  const alerts: { msg: string; color: string }[] = [];
  if (expiring > 0) alerts.push({ msg: `${expiring} membership(s) expiring soon`, color: Colors.warning });
  if (expired > 0) alerts.push({ msg: `${expired} membership(s) have expired`, color: Colors.danger });
  if (enquiries > 0) alerts.push({ msg: `${enquiries} new enquiries to follow up`, color: Colors.info });

  return (
    <>
      <ScreenHeader title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}`} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refL || refM} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard label="Enquiries" value={enquiries} color={Colors.info} />
          <StatCard label="Trials Booked" value={trialsBooked} color={Colors.warning} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Active Members" value={activeMembers} color={Colors.primary} />
          <StatCard label="Expiring Soon" value={expiring} color={Colors.danger}
            sub={expired > 0 ? `${expired} expired` : undefined} />
        </View>

        {alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Alerts</Text>
            </View>
            {alerts.map((a, i) => (
              <View key={i} style={styles.alertRow}>
                <View style={[styles.dot, { backgroundColor: a.color }]} />
                <Text style={styles.alertText}>{a.msg}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activity.slice(0, 6).map(a => (
            <View key={a.id} style={styles.activityRow}>
              <Text style={styles.activityText} numberOfLines={1}>
                {a.actor_name}: {a.action}{a.details ? ` — ${a.details}` : ''}
              </Text>
              <Text style={styles.activityDate}>{new Date(a.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
          {activity.length === 0 && <Text style={styles.emptyText}>No recent activity</Text>}
        </View>
      </ScrollView>
    </>
  );
}

// ── Super Admin dashboard ─────────────────────────────────────────────
function AdminDashboard() {
  const tabBarHeight = useBottomTabBarHeight();
  const { data: gyms = [], refetch: refGyms, isRefetching } = useGyms();
  const { data: leads = [], refetch: refLeads } = useLeads();
  const { data: trainers = [], refetch: refTrainers } = useTrainers();
  const { data: activity = [], refetch: refAct } = useActivityLog();

  const activeGyms = gyms.filter((g: any) => g.is_active).length;
  const onRefresh = () => { refGyms(); refLeads(); refTrainers(); refAct(); };

  return (
    <>
      <ScreenHeader title="Platform Overview" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard label="Total Gyms" value={gyms.length} color={Colors.primary} />
          <StatCard label="Active Gyms" value={activeGyms} color={Colors.info} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Total Leads" value={leads.length} color={Colors.warning} />
          <StatCard label="Trainers" value={trainers.length} color={Colors.purple} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activity.slice(0, 8).map(a => (
            <View key={a.id} style={styles.activityRow}>
              <Text style={styles.activityText} numberOfLines={1}>{a.actor_name}: {a.action}</Text>
              <Text style={styles.activityDate}>{new Date(a.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
          {activity.length === 0 && <Text style={styles.emptyText}>No recent activity</Text>}
        </View>
      </ScrollView>
    </>
  );
}

// ── Trainer dashboard ─────────────────────────────────────────────────
function TrainerDashboard() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  // Properly import and use useClientProfiles directly
  const { data: clients = [] } = useClientProfiles(null, user?.id);

  return (
    <>
      <ScreenHeader title="My Dashboard" subtitle={`Hello, ${user?.name?.split(' ')[0]}`} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard label="My Clients" value={clients.length} color={Colors.primary} />
          <StatCard label="Active Plans" value={clients.length} color={Colors.info} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {[
            { label: 'View My Clients', icon: 'people-outline', route: '/(tabs)/clients' },
            { label: 'Manage Diet Plans', icon: 'nutrition-outline', route: '/(tabs)/diet' },
          ].map(item => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            >
              <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

// ── Root screen — picks the right dashboard by role ───────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'super_admin') return <AdminDashboard />;
  if (user.role === 'trainer') return <TrainerDashboard />;
  return <OwnerDashboard />;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  section: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  alertText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text, flex: 1 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  activityText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text, flex: 1, marginRight: 8 },
  activityDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, backgroundColor: Colors.secondary,
  },
  actionLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text, flex: 1 },
});
