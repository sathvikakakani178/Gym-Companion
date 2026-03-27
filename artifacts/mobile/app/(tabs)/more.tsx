import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal, Platform, Image,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  useLeads, useMembers, useTrainers, useBranches, useInsertBranch, useUpdateBranch,
  useDeleteBranch, useInsertActivity, useGyms,
  useInvoices, useInsertInvoice, useUpdateInvoice,
  useGymSubscriptions, useInsertGymSubscription, useUpdateGymSubscription, useDeleteGymSubscription,
  useModules, useGymModules, useUpsertGymModule,
  useWhatsappLogs, useInsertWhatsappLog,
  useWhatsappTemplates, useUpdateWhatsappTemplate,
  useGymSubscriptionByGym,
} from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const doSignOut = async () => {
    setShowSignOutConfirm(false);
    setLoggingOut(true);
    try {
      await logout();
    } catch (_) {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/login');
  };

  const handleLogout = () => {
    setShowSignOutConfirm(true);
  };

  const isAdmin = user?.role === 'super_admin';
  const isOwner = user?.role === 'gym_owner';

  const sections: { key: string; label: string; icon: string; color: string }[] = [];

  if (isAdmin) {
    sections.push(
      { key: 'gym_analytics', label: 'Gym Analytics', icon: 'bar-chart-outline', color: Colors.info },
      { key: 'branches', label: 'Branches', icon: 'map-outline', color: Colors.primary },
      { key: 'plans', label: 'Plans', icon: 'layers-outline', color: Colors.purple },
      { key: 'modules', label: 'Modules', icon: 'grid-outline', color: Colors.warning },
      { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
      { key: 'billing', label: 'Billing', icon: 'card-outline', color: Colors.info },
    );
  }

  if (isOwner) {
    sections.push(
      { key: 'analytics', label: 'Analytics', icon: 'bar-chart-outline', color: Colors.info },
      { key: 'whatsapp_owner', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
      { key: 'my_plan', label: 'My Plan', icon: 'layers-outline', color: Colors.purple },
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
      <Modal visible={activeSection === 'plans'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <PlansSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'modules'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <ModulesSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'whatsapp'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <WhatsAppSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'billing'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <BillingSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'whatsapp_owner'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <WhatsAppOwnerSection onClose={() => setActiveSection(null)} />
      </Modal>
      <Modal visible={activeSection === 'my_plan'} animationType="slide" onRequestClose={() => setActiveSection(null)}>
        <MyPlanSection onClose={() => setActiveSection(null)} />
      </Modal>

      {/* Custom sign-out confirmation (replaces Alert.alert which is blocked in iframes on web) */}
      <Modal visible={showSignOutConfirm} transparent animationType="fade" onRequestClose={() => setShowSignOutConfirm(false)}>
        <View style={signOutModal.overlay}>
          <View style={signOutModal.card}>
            <View style={signOutModal.iconWrap}>
              <Ionicons name="log-out-outline" size={28} color={Colors.danger} />
            </View>
            <Text style={signOutModal.title}>Sign Out</Text>
            <Text style={signOutModal.message}>Are you sure you want to sign out of your account?</Text>
            <View style={signOutModal.buttons}>
              <Pressable style={signOutModal.cancelBtn} onPress={() => setShowSignOutConfirm(false)}>
                <Text style={signOutModal.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={signOutModal.confirmBtn} onPress={doSignOut} disabled={loggingOut}>
                {loggingOut
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={signOutModal.confirmText}>Sign Out</Text>}
              </Pressable>
            </View>
          </View>
        </View>
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
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });
  const [editError, setEditError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  const handleAdd = () => {
    setFormError('');
    if (!form.name) { setFormError('Branch name is required'); return; }
    insertBranch.mutate(
      { name: form.name, location: form.location || null, gym_id: user?.gym_id || '' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAdd(false);
          setForm({ name: '', location: '' });
          insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'Owner', action: 'Created branch', details: form.name });
        },
        onError: (e: any) => setFormError(e.message),
      }
    );
  };

  const handleUpdate = () => {
    setEditError('');
    if (!editingId || !editForm.name) return;
    updateBranch.mutate(
      { id: editingId, name: editForm.name, location: editForm.location || null },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditingId(null); },
        onError: (e: any) => setEditError(e.message),
      }
    );
  };

  const handleDelete = (b: any) => {
    const memberCount = members.filter((m: any) => m.branch_id === b.id).length;
    const trainerCount = trainers.filter((t: any) => t.branch_id === b.id).length;
    if (memberCount > 0) { setFormError(`${memberCount} member(s) still assigned to this branch`); return; }
    if (trainerCount > 0) { setFormError(`${trainerCount} trainer(s) still assigned to this branch`); return; }
    setPendingDelete(b);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteBranch.mutate(pendingDelete.id, {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPendingDelete(null); },
    });
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
            {!!formError && (
              <View style={section.errorBox}>
                <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                <Text style={section.errorText}>{formError}</Text>
              </View>
            )}
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
                  {!!editError && (
                    <View style={section.errorBox}>
                      <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                      <Text style={section.errorText}>{editError}</Text>
                    </View>
                  )}
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

      <ConfirmModal
        visible={!!pendingDelete}
        title="Delete Branch"
        message={`Remove ${pendingDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
        loading={deleteBranch.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
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

// ─── helper ───────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; color: string }> }) {
  const s = map[status] ?? { label: status, color: Colors.textMuted };
  return (
    <View style={{ backgroundColor: s.color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: s.color + '55' }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: s.color, textTransform: 'capitalize' }}>{s.label}</Text>
    </View>
  );
}

function GymPicker({ gyms, value, onChange }: { gyms: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = gyms.find(g => g.id === value);
  return (
    <View>
      <Pressable
        style={[section.input, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', height: 44 }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: selected ? Colors.text : Colors.textMuted }}>
          {selected ? selected.name : 'Select Gym *'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={{ backgroundColor: Colors.secondary, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginTop: 4, maxHeight: 180 }}>
          <ScrollView nestedScrollEnabled>
            {gyms.map(g => (
              <Pressable
                key={g.id}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                onPress={() => { onChange(g.id); setOpen(false); }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: g.id === value ? Colors.primary : Colors.text }}>{g.name}</Text>
              </Pressable>
            ))}
            {gyms.length === 0 && <Text style={{ padding: 12, color: Colors.textMuted, fontFamily: 'Inter_400Regular', fontSize: 13 }}>No gyms found</Text>}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── PLANS SECTION ────────────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { value: 'base', label: 'Base', price: '₹999/mo', color: Colors.info },
  { value: 'classic', label: 'Classic', price: '₹1,299/mo', color: Colors.purple },
  { value: 'pro', label: 'Pro', price: '₹1,999/mo', color: Colors.warning },
];

const SUB_STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: Colors.primary },
  expired: { label: 'Expired', color: Colors.danger },
  pending: { label: 'Pending', color: Colors.warning },
  cancelled: { label: 'Cancelled', color: Colors.textMuted },
};

function PlansSection({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: gyms = [] } = useGyms();
  const { data: subs = [], isLoading } = useGymSubscriptions();
  const insertSub = useInsertGymSubscription();
  const updateSub = useUpdateGymSubscription();
  const deleteSub = useDeleteGymSubscription();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ gym_id: '', plan_id: 'base', start_date: '', end_date: '', status: 'active' });
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ plan_id: '', start_date: '', end_date: '', status: '' });
  const [editError, setEditError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const planCounts = PLAN_OPTIONS.reduce<Record<string, number>>((acc, p) => {
    acc[p.value] = subs.filter((s: any) => s.plan_id === p.value).length;
    return acc;
  }, {});

  const filtered = statusFilter === 'all' ? subs : subs.filter((s: any) => s.status === statusFilter);

  const handleAdd = () => {
    setFormError('');
    if (!form.gym_id) { setFormError('Please select a gym'); return; }
    if (!form.start_date || !form.end_date) { setFormError('Start and end dates are required (YYYY-MM-DD)'); return; }
    insertSub.mutate(
      { gym_id: form.gym_id, plan_id: form.plan_id, start_date: form.start_date, end_date: form.end_date, status: form.status },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAdd(false);
          setForm({ gym_id: '', plan_id: 'base', start_date: '', end_date: '', status: 'active' });
        },
        onError: (e: any) => setFormError(e.message),
      }
    );
  };

  const handleUpdate = () => {
    setEditError('');
    if (!editingId) return;
    updateSub.mutate(
      { id: editingId, plan_id: editForm.plan_id, start_date: editForm.start_date, end_date: editForm.end_date, status: editForm.status },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditingId(null); },
        onError: (e: any) => setEditError(e.message),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Plans" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PLAN_OPTIONS.map(p => (
            <View key={p.value} style={[planSt.planCard, { borderTopColor: p.color, flex: 1 }]}>
              <Text style={[planSt.planLabel, { color: p.color }]}>{p.label}</Text>
              <Text style={planSt.planPrice}>{p.price}</Text>
              <Text style={planSt.planCount}>{planCounts[p.value] ?? 0} gyms</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[section.addBtn, showAdd && { backgroundColor: Colors.secondary }]}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color={Colors.purple} />
          <Text style={[section.addBtnText, { color: Colors.purple }]}>{showAdd ? 'Cancel' : 'Add Subscription'}</Text>
        </Pressable>

        {showAdd && (
          <View style={section.formCard}>
            <GymPicker gyms={gyms} value={form.gym_id} onChange={id => setForm(f => ({ ...f, gym_id: id }))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PLAN_OPTIONS.map(p => (
                <Pressable
                  key={p.value}
                  style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: form.plan_id === p.value ? p.color + '22' : Colors.secondary,
                    borderColor: form.plan_id === p.value ? p.color : Colors.border }}
                  onPress={() => setForm(f => ({ ...f, plan_id: p.value }))}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: form.plan_id === p.value ? p.color : Colors.textSecondary }}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={section.input} placeholder="Start Date (YYYY-MM-DD) *" placeholderTextColor={Colors.textMuted} value={form.start_date} onChangeText={v => setForm(f => ({ ...f, start_date: v }))} />
            <TextInput style={section.input} placeholder="End Date (YYYY-MM-DD) *" placeholderTextColor={Colors.textMuted} value={form.end_date} onChangeText={v => setForm(f => ({ ...f, end_date: v }))} />
            {!!formError && (
              <View style={section.errorBox}>
                <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                <Text style={section.errorText}>{formError}</Text>
              </View>
            )}
            <Pressable style={section.submitBtn} onPress={handleAdd} disabled={insertSub.isPending}>
              {insertSub.isPending ? <ActivityIndicator color="#000" /> : <Text style={section.submitBtnText}>Add Subscription</Text>}
            </Pressable>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'active', 'expired', 'pending', 'cancelled'].map(s => (
            <Pressable
              key={s}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                backgroundColor: statusFilter === s ? Colors.purple + '22' : Colors.secondary,
                borderColor: statusFilter === s ? Colors.purple : Colors.border }}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: statusFilter === s ? Colors.purple : Colors.textSecondary, textTransform: 'capitalize' }}>{s}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading && <ActivityIndicator color={Colors.purple} />}
        {filtered.map((sub: any) => {
          const gymName = sub.gym?.name ?? 'Unknown Gym';
          const plan = PLAN_OPTIONS.find(p => p.value === sub.plan_id);
          const isEditing = editingId === sub.id;
          return (
            <View key={sub.id} style={section.card}>
              {isEditing ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PLAN_OPTIONS.map(p => (
                      <Pressable
                        key={p.value}
                        style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: editForm.plan_id === p.value ? p.color + '22' : Colors.secondary,
                          borderColor: editForm.plan_id === p.value ? p.color : Colors.border }}
                        onPress={() => setEditForm(f => ({ ...f, plan_id: p.value }))}
                      >
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: editForm.plan_id === p.value ? p.color : Colors.textSecondary }}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput style={section.input} value={editForm.start_date} onChangeText={v => setEditForm(f => ({ ...f, start_date: v }))} placeholder="Start Date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} />
                  <TextInput style={section.input} value={editForm.end_date} onChangeText={v => setEditForm(f => ({ ...f, end_date: v }))} placeholder="End Date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} />
                  {!!editError && (
                    <View style={section.errorBox}>
                      <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                      <Text style={section.errorText}>{editError}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable style={[section.submitBtn, { flex: 1 }]} onPress={handleUpdate} disabled={updateSub.isPending}>
                      {updateSub.isPending ? <ActivityIndicator color="#000" /> : <Text style={section.submitBtnText}>Update</Text>}
                    </Pressable>
                    <Pressable style={[section.cancelBtn, { flex: 1 }]} onPress={() => setEditingId(null)}>
                      <Text style={section.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="layers-outline" size={18} color={plan?.color ?? Colors.purple} />
                    <Text style={[section.name, { flex: 1 }]} numberOfLines={1}>{gymName}</Text>
                    <StatusBadge status={sub.status ?? 'active'} map={SUB_STATUS_MAP} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: plan?.color ?? Colors.purple }}>{plan?.label ?? sub.plan_id ?? '—'} {plan?.price ? `· ${plan.price}` : ''}</Text>
                      <Text style={section.sub}>{fmtDate(sub.start_date)} → {fmtDate(sub.end_date)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable onPress={() => { setEditingId(sub.id); setEditForm({ plan_id: sub.plan_id ?? 'base', start_date: sub.start_date ?? '', end_date: sub.end_date ?? '', status: sub.status ?? 'active' }); }}>
                        <Ionicons name="pencil-outline" size={17} color={Colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => setPendingDelete(sub)}>
                        <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
        {filtered.length === 0 && !isLoading && <Text style={section.empty}>No subscriptions found</Text>}
      </ScrollView>

      <ConfirmModal
        visible={!!pendingDelete}
        title="Delete Subscription"
        message={`Remove subscription for ${pendingDelete?.gym?.name ?? 'this gym'}?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
        loading={deleteSub.isPending}
        onConfirm={() => pendingDelete && deleteSub.mutate(pendingDelete.id, { onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPendingDelete(null); } })}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

// ─── MODULES SECTION ──────────────────────────────────────────────────────────
function ModulesSection({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: gyms = [] } = useGyms();
  const { data: allModules = [], isLoading: loadingModules } = useModules();
  const [selectedGymId, setSelectedGymId] = useState('');
  const { data: gymModules = [], isLoading: loadingGymModules } = useGymModules(selectedGymId);
  const upsertModule = useUpsertGymModule();
  const [toggling, setToggling] = useState<string | null>(null);

  const enabledIds = new Set(gymModules.filter((gm: any) => gm.is_enabled).map((gm: any) => gm.module_id));

  const handleToggle = async (moduleId: string, currentEnabled: boolean) => {
    if (!selectedGymId) return;
    setToggling(moduleId);
    upsertModule.mutate(
      { gym_id: selectedGymId, module_id: moduleId, is_enabled: !currentEnabled },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setToggling(null); },
        onError: () => setToggling(null),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Modules" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        <View style={section.formCard}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>Select a Gym to Manage Modules</Text>
          <GymPicker gyms={gyms} value={selectedGymId} onChange={setSelectedGymId} />
        </View>

        {loadingModules && <ActivityIndicator color={Colors.warning} />}

        {allModules.length > 0 && (
          <View style={section.card}>
            <Text style={analytics.sectionTitle}>Available Modules</Text>
            {!selectedGymId && (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted }}>Select a gym above to toggle modules</Text>
            )}
            {allModules.map((mod: any) => {
              const isEnabled = enabledIds.has(mod.id);
              const isToggling = toggling === mod.id;
              return (
                <View key={mod.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text }}>{mod.name}</Text>
                    {!!mod.description && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{mod.description}</Text>}
                  </View>
                  {selectedGymId ? (
                    loadingGymModules || isToggling ? (
                      <ActivityIndicator size="small" color={Colors.warning} />
                    ) : (
                      <Pressable
                        onPress={() => handleToggle(mod.id, isEnabled)}
                        style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: isEnabled ? Colors.primary : Colors.secondary, borderWidth: 1, borderColor: isEnabled ? Colors.primary : Colors.border, justifyContent: 'center', paddingHorizontal: 2 }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isEnabled ? '#000' : Colors.textMuted, alignSelf: isEnabled ? 'flex-end' : 'flex-start' }} />
                      </Pressable>
                    )
                  ) : (
                    <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border }} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {allModules.length === 0 && !loadingModules && (
          <Text style={section.empty}>No modules configured</Text>
        )}

        {selectedGymId && !loadingGymModules && (
          <View style={[section.card, { borderTopWidth: 2, borderTopColor: Colors.warning }]}>
            <Text style={analytics.sectionTitle}>Summary for Selected Gym</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary }}>
              {enabledIds.size} of {allModules.length} modules enabled
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {allModules.filter((m: any) => enabledIds.has(m.id)).map((m: any) => (
                <View key={m.id} style={{ backgroundColor: Colors.primary + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary + '55' }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.primary }}>{m.name}</Text>
                </View>
              ))}
              {enabledIds.size === 0 && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted }}>No modules enabled</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── WHATSAPP SECTION ─────────────────────────────────────────────────────────
const WA_STATUS_MAP: Record<string, { label: string; color: string }> = {
  sent: { label: 'Sent', color: Colors.primary },
  delivered: { label: 'Delivered', color: Colors.info },
  failed: { label: 'Failed', color: Colors.danger },
  pending: { label: 'Pending', color: Colors.warning },
  processing: { label: 'Processing', color: Colors.info },
};

const WA_CONN_MAP: Record<string, { label: string; color: string }> = {
  connected: { label: 'Connected', color: Colors.primary },
  connecting: { label: 'Connecting', color: Colors.warning },
  disconnected: { label: 'Disconnected', color: Colors.danger },
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type GymConnStatus = { status: string; phone: string | null; hasQr: boolean };

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function waFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

function WhatsAppSection({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: gyms = [] } = useGyms();
  const { data: logs = [], isLoading: loadingLogs } = useWhatsappLogs();
  const insertLog = useInsertWhatsappLog();

  const [tab, setTab] = useState<'setup' | 'broadcast' | 'logs'>('setup');

  // ── Setup tab state ────────────────────────────────────────────────
  const [gymStatuses, setGymStatuses] = useState<Record<string, GymConnStatus>>({});
  // Per-gym QR data so multiple disconnected gyms show their QR simultaneously
  const [gymQrData, setGymQrData] = useState<Record<string, string | null>>({});
  const [gymQrLoading, setGymQrLoading] = useState<Record<string, boolean>>({});
  const [gymQrError, setGymQrError] = useState<Record<string, string>>({});

  // ── Broadcast tab state ────────────────────────────────────────────
  const [broadcastGymId, setBroadcastGymId] = useState('');
  const [broadcastPhone, setBroadcastPhone] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastError, setBroadcastError] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // ── Logs tab state ─────────────────────────────────────────────────
  const [filterGym, setFilterGym] = useState('');
  const filteredLogs = filterGym ? logs.filter((l: any) => l.gym_id === filterGym) : logs;

  // Fetch status for all gyms and store results in gymStatuses
  const fetchAllStatuses = useCallback(async () => {
    if (gyms.length === 0) return;
    const results: Record<string, GymConnStatus> = {};
    await Promise.all(
      gyms.map(async (gym: any) => {
        try {
          const res = await waFetch(`${API_BASE}/whatsapp/status/${gym.id}`);
          if (res.ok) {
            const data: GymConnStatus & { qr?: string | null } = await res.json();
            results[gym.id] = data;
            if (data.qr) setGymQrData(prev => ({ ...prev, [gym.id]: data.qr ?? null }));
          }
        } catch (err) {
          console.warn('[WA] Status poll failed for gym', gym.id, err);
        }
      })
    );
    setGymStatuses(prev => ({ ...prev, ...results }));
  }, [gyms]);

  // Auto-start sessions for all disconnected gyms when Setup tab is opened,
  // so QR codes appear automatically without requiring a "Scan QR" tap.
  const initDisconnectedGyms = useCallback(async () => {
    const disconnected = gyms.filter((g: any) => {
      const s = gymStatuses[g.id];
      return !s || s.status === 'disconnected';
    });
    for (const gym of disconnected) {
      if (gymQrLoading[gym.id]) continue;
      setGymQrLoading(prev => ({ ...prev, [gym.id]: true }));
      setGymQrError(prev => ({ ...prev, [gym.id]: '' }));
      // Fire in background — status poll will surface the QR within 3s
      waFetch(`${API_BASE}/whatsapp/qr/${gym.id}`)
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            setGymQrError(prev => ({ ...prev, [gym.id]: data.error ?? 'Failed to get QR' }));
            return;
          }
          if (data.status === 'connected') {
            setGymStatuses(prev => ({ ...prev, [gym.id]: { status: 'connected', phone: data.phone, hasQr: false } }));
          } else if (data.qr) {
            setGymQrData(prev => ({ ...prev, [gym.id]: data.qr }));
            setGymStatuses(prev => ({ ...prev, [gym.id]: { ...(prev[gym.id] ?? {}), status: 'connecting', hasQr: true } }));
          }
        })
        .catch(() => {
          setGymQrError(prev => ({ ...prev, [gym.id]: 'Could not initialize session' }));
        })
        .finally(() => {
          setGymQrLoading(prev => ({ ...prev, [gym.id]: false }));
        });
    }
  }, [gyms, gymStatuses, gymQrLoading]);

  useEffect(() => {
    if (tab === 'setup') {
      fetchAllStatuses().then(() => initDisconnectedGyms());
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll ALL non-connected gyms every 3s. The status endpoint returns fresh QR
  // base64 so displayed images update automatically when Baileys regenerates them.
  // If a gym unexpectedly transitions to 'disconnected' during polling, a new
  // session is auto-initiated so the QR reappears without a tab switch.
  useEffect(() => {
    if (tab !== 'setup') return;
    const interval = setInterval(async () => {
      const nonConnectedIds = gyms
        .filter((g: any) => gymStatuses[g.id]?.status !== 'connected')
        .map((g: any) => g.id as string);
      for (const gymId of nonConnectedIds) {
        try {
          const res = await waFetch(`${API_BASE}/whatsapp/status/${gymId}`);
          if (!res.ok) continue;
          const data: GymConnStatus & { qr?: string | null } = await res.json();
          const prevStatus = gymStatuses[gymId]?.status;
          setGymStatuses(prev => ({ ...prev, [gymId]: data }));
          if (data.status === 'connected') {
            setGymQrData(prev => ({ ...prev, [gymId]: null }));
          } else if (data.qr) {
            setGymQrData(prev => ({ ...prev, [gymId]: data.qr ?? null }));
          } else if (data.status === 'disconnected' && prevStatus !== 'disconnected' && !gymQrLoading[gymId]) {
            // Unexpected drop — restart session so QR reappears automatically
            setGymQrLoading(prev => ({ ...prev, [gymId]: true }));
            setGymQrData(prev => ({ ...prev, [gymId]: null }));
            waFetch(`${API_BASE}/whatsapp/qr/${gymId}`)
              .then(async r => {
                const d = await r.json();
                if (d.qr) setGymQrData(prev => ({ ...prev, [gymId]: d.qr }));
              })
              .catch((err) => { console.warn('[WA] QR fetch failed for gym', gymId, err); })
              .finally(() => setGymQrLoading(prev => ({ ...prev, [gymId]: false })));
          }
        } catch (err) {
          console.warn('[WA] Poll interval error for gym', gymId, err);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [tab, gyms, gymStatuses, gymQrLoading]);

  const handleDisconnect = async (gymId: string) => {
    try {
      await waFetch(`${API_BASE}/whatsapp/disconnect/${gymId}`, { method: 'DELETE' });
      setGymStatuses(prev => ({ ...prev, [gymId]: { status: 'disconnected', phone: null, hasQr: false } }));
      setGymQrData(prev => ({ ...prev, [gymId]: null }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Auto-restart a fresh session so a new QR appears without requiring a tab switch
      setGymQrLoading(prev => ({ ...prev, [gymId]: true }));
      setGymQrError(prev => ({ ...prev, [gymId]: '' }));
      waFetch(`${API_BASE}/whatsapp/qr/${gymId}`)
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            setGymQrError(prev => ({ ...prev, [gymId]: data.error ?? 'Failed to restart session' }));
            return;
          }
          if (data.status === 'connected') {
            setGymStatuses(prev => ({ ...prev, [gymId]: { status: 'connected', phone: data.phone, hasQr: false } }));
          } else if (data.qr) {
            setGymQrData(prev => ({ ...prev, [gymId]: data.qr }));
            setGymStatuses(prev => ({ ...prev, [gymId]: { ...(prev[gymId] ?? {}), status: 'connecting', hasQr: true } }));
          }
        })
        .catch((err) => {
          console.warn('[WA] Auto-restart failed for gym', gymId, err);
          setGymQrError(prev => ({ ...prev, [gymId]: 'Could not restart session' }));
        })
        .finally(() => {
          setGymQrLoading(prev => ({ ...prev, [gymId]: false }));
        });
    } catch (err) {
      console.warn('[WA] handleAutoRestart error for gym', gymId, err);
    }
  };

  const handleBroadcast = () => {
    setBroadcastError('');
    setBroadcastSuccess(false);
    if (!broadcastGymId) { setBroadcastError('Please select a gym'); return; }
    if (!broadcastMsg.trim()) { setBroadcastError('Message is required'); return; }
    insertLog.mutate(
      { gym_id: broadcastGymId, message: broadcastMsg.trim(), phone: broadcastPhone.trim() || undefined, status: 'pending' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBroadcastMsg(''); setBroadcastPhone(''); setBroadcastGymId(''); setBroadcastSuccess(true);
        },
        onError: (e: any) => setBroadcastError(e.message),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="WhatsApp" onClose={onClose} />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 6 }}>
        {([
          { key: 'setup', label: 'Setup' },
          { key: 'broadcast', label: 'Broadcast' },
          { key: 'logs', label: 'Logs' },
        ] as const).map(t => (
          <Pressable
            key={t.key}
            style={{ flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
              backgroundColor: tab === t.key ? '#25D36622' : Colors.secondary,
              borderColor: tab === t.key ? '#25D366' : Colors.border }}
            onPress={() => setTab(t.key)}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: tab === t.key ? '#25D366' : Colors.textSecondary }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'setup' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          <View style={[section.card, { backgroundColor: Colors.secondary, borderColor: Colors.border }]}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.info} style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 }}>
                Link each gym's WhatsApp number by scanning its QR code. Messages will be delivered via that gym's number.
              </Text>
            </View>
          </View>

          {gyms.map((gym: any) => {
            const s = gymStatuses[gym.id];
            const connStatus = s?.status ?? 'disconnected';
            const gymQr = gymQrData[gym.id];
            const gymLoading = !!gymQrLoading[gym.id];
            const gymErr = gymQrError[gym.id] ?? '';

            return (
              <View key={gym.id} style={section.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={[section.name, { flex: 1 }]} numberOfLines={1}>{gym.name}</Text>
                  <StatusBadge status={connStatus} map={WA_CONN_MAP} />
                </View>

                {connStatus === 'connected' && s?.phone && (
                  <Text style={[section.sub, { marginTop: 4 }]}>+{s.phone}</Text>
                )}

                {connStatus === 'connected' && (
                  <Pressable
                    style={{ marginTop: 10, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.danger + '66' }}
                    onPress={() => handleDisconnect(gym.id)}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.danger }}>Disconnect</Text>
                  </Pressable>
                )}

                {connStatus !== 'connected' && (
                  <View style={{ marginTop: 12, alignItems: 'center', gap: 8 }}>
                    {gymLoading && <ActivityIndicator color="#25D366" style={{ marginVertical: 20 }} />}
                    {!!gymErr && (
                      <View style={section.errorBox}>
                        <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                        <Text style={section.errorText}>{gymErr}</Text>
                      </View>
                    )}
                    {!gymLoading && gymQr && (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary }}>
                          Open WhatsApp → Linked Devices → Scan
                        </Text>
                        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: '#25D366' }}>
                          <Image source={{ uri: gymQr }} style={{ width: 220, height: 220 }} resizeMode="contain" />
                        </View>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted }}>
                          QR auto-refreshes every ~60 seconds
                        </Text>
                      </View>
                    )}
                    {!gymLoading && !gymQr && !gymErr && (
                      <View style={{ alignItems: 'center', paddingVertical: 10, gap: 6 }}>
                        <ActivityIndicator color="#25D366" />
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary }}>
                          {connStatus === 'connecting' ? 'Waiting for QR...' : 'Initializing session...'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {gyms.length === 0 && <Text style={section.empty}>No gyms found</Text>}
        </ScrollView>
      )}

      {tab === 'broadcast' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          <View style={[section.card, { gap: 10 }]}>
            <Text style={analytics.sectionTitle}>Send Broadcast Message</Text>
            <GymPicker gyms={gyms} value={broadcastGymId} onChange={setBroadcastGymId} />
            <TextInput
              style={section.input}
              placeholder="Phone Number (e.g. 9876543210)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={broadcastPhone}
              onChangeText={setBroadcastPhone}
            />
            <TextInput
              style={[section.input, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="Message *"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
            />
            {!!broadcastError && (
              <View style={section.errorBox}>
                <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                <Text style={section.errorText}>{broadcastError}</Text>
              </View>
            )}
            {broadcastSuccess && (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: Colors.primaryMuted, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.primary + '40' }}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary }}>Queued for delivery!</Text>
              </View>
            )}
            <Pressable
              style={[section.submitBtn, { backgroundColor: '#25D366' }]}
              onPress={handleBroadcast}
              disabled={insertLog.isPending}
            >
              {insertLog.isPending
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={[section.submitBtnText, { color: '#fff' }]}>Send Message</Text>
                  </View>
                )}
            </Pressable>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center' }}>
              Message will be delivered via the gym's linked WhatsApp number
            </Text>
          </View>
        </ScrollView>
      )}

      {tab === 'logs' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          <GymPicker gyms={[{ id: '', name: 'All Gyms' }, ...gyms]} value={filterGym} onChange={setFilterGym} />
          {loadingLogs && <ActivityIndicator color="#25D366" />}
          {filteredLogs.map((log: any) => (
            <View key={log.id} style={section.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={[section.name, { flex: 1 }]} numberOfLines={1}>{log.gym?.name ?? 'Unknown Gym'}</Text>
                <StatusBadge status={log.status ?? 'pending'} map={WA_STATUS_MAP} />
              </View>
              {!!log.phone && <Text style={section.sub}>{log.phone}</Text>}
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>{log.message}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted }}>{fmtDate(log.created_at)}</Text>
            </View>
          ))}
          {filteredLogs.length === 0 && !loadingLogs && <Text style={section.empty}>No WhatsApp logs yet</Text>}
        </ScrollView>
      )}
    </View>
  );
}

// ─── BILLING SECTION ──────────────────────────────────────────────────────────
const INV_STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: Colors.primary },
  pending: { label: 'Pending', color: Colors.warning },
  overdue: { label: 'Overdue', color: Colors.danger },
};

function BillingSection({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: gyms = [] } = useGyms();
  const { data: invoices = [], isLoading } = useInvoices();
  const insertInvoice = useInsertInvoice();
  const updateInvoice = useUpdateInvoice();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ gym_id: '', description: '', amount: '', due_date: '', status: 'pending' });
  const [formError, setFormError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterGym, setFilterGym] = useState('');

  const totalPaid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  const totalPending = invoices.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  const overdueCount = invoices.filter((i: any) => i.status === 'overdue').length;
  const thisMonth = invoices.filter((i: any) => {
    if (!i.created_at) return false;
    const d = new Date(i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = invoices
    .filter((i: any) => statusFilter === 'all' || i.status === statusFilter)
    .filter((i: any) => !filterGym || i.gym_id === filterGym);

  const handleAdd = () => {
    setFormError('');
    if (!form.gym_id) { setFormError('Please select a gym'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { setFormError('Enter a valid amount'); return; }
    if (!form.due_date) { setFormError('Due date is required (YYYY-MM-DD)'); return; }
    insertInvoice.mutate(
      { gym_id: form.gym_id, description: form.description || null, amount: Number(form.amount), due_date: form.due_date, status: form.status },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAdd(false);
          setForm({ gym_id: '', description: '', amount: '', due_date: '', status: 'pending' });
        },
        onError: (e: any) => setFormError(e.message),
      }
    );
  };

  const togglePaid = (inv: any) => {
    const newStatus = inv.status === 'paid' ? 'pending' : 'paid';
    const updates: any = { status: newStatus };
    if (newStatus === 'paid') updates.paid_at = new Date().toISOString();
    else updates.paid_at = null;
    updateInvoice.mutate({ id: inv.id, ...updates }, {
      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="Billing" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        <View style={analytics.grid}>
          {[
            { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: Colors.primary },
            { label: 'Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, color: Colors.warning },
            { label: 'Overdue', value: overdueCount, color: Colors.danger },
            { label: 'This Month', value: thisMonth, color: Colors.info },
          ].map(item => (
            <View key={item.label} style={[analytics.card, { borderTopColor: item.color }]}>
              <Text style={analytics.cardLabel}>{item.label}</Text>
              <Text style={[analytics.cardValue, { color: item.color, fontSize: typeof item.value === 'string' ? 16 : 24 }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[section.addBtn, showAdd && { backgroundColor: Colors.secondary }]}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color={Colors.info} />
          <Text style={[section.addBtnText, { color: Colors.info }]}>{showAdd ? 'Cancel' : 'Create Invoice'}</Text>
        </Pressable>

        {showAdd && (
          <View style={section.formCard}>
            <GymPicker gyms={gyms} value={form.gym_id} onChange={id => setForm(f => ({ ...f, gym_id: id }))} />
            <TextInput style={section.input} placeholder="Description (optional)" placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} />
            <TextInput style={section.input} placeholder="Amount (₹) *" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} />
            <TextInput style={section.input} placeholder="Due Date (YYYY-MM-DD) *" placeholderTextColor={Colors.textMuted} value={form.due_date} onChangeText={v => setForm(f => ({ ...f, due_date: v }))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['pending', 'paid', 'overdue'].map(s => (
                <Pressable
                  key={s}
                  style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: form.status === s ? INV_STATUS_MAP[s].color + '22' : Colors.secondary,
                    borderColor: form.status === s ? INV_STATUS_MAP[s].color : Colors.border }}
                  onPress={() => setForm(f => ({ ...f, status: s }))}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: form.status === s ? INV_STATUS_MAP[s].color : Colors.textSecondary, textTransform: 'capitalize' }}>{s}</Text>
                </Pressable>
              ))}
            </View>
            {!!formError && (
              <View style={section.errorBox}>
                <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                <Text style={section.errorText}>{formError}</Text>
              </View>
            )}
            <Pressable style={section.submitBtn} onPress={handleAdd} disabled={insertInvoice.isPending}>
              {insertInvoice.isPending ? <ActivityIndicator color="#000" /> : <Text style={section.submitBtnText}>Create Invoice</Text>}
            </Pressable>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'paid', 'pending', 'overdue'].map(s => (
            <Pressable
              key={s}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                backgroundColor: statusFilter === s ? Colors.info + '22' : Colors.secondary,
                borderColor: statusFilter === s ? Colors.info : Colors.border }}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: statusFilter === s ? Colors.info : Colors.textSecondary, textTransform: 'capitalize' }}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <GymPicker gyms={[{ id: '', name: 'All Gyms' }, ...gyms]} value={filterGym} onChange={setFilterGym} />

        {isLoading && <ActivityIndicator color={Colors.info} />}
        {filtered.map((inv: any) => {
          const gymName = inv.gym?.name ?? 'Unknown Gym';
          const isPaid = inv.status === 'paid';
          return (
            <View key={inv.id} style={section.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="card-outline" size={18} color={INV_STATUS_MAP[inv.status ?? 'pending']?.color ?? Colors.info} />
                <Text style={[section.name, { flex: 1 }]} numberOfLines={1}>{gymName}</Text>
                <StatusBadge status={inv.status ?? 'pending'} map={INV_STATUS_MAP} />
              </View>
              {!!inv.description && <Text style={section.sub}>{inv.description}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text }}>₹{(inv.amount ?? 0).toLocaleString('en-IN')}</Text>
                  <Text style={section.sub}>Due: {fmtDate(inv.due_date)}{isPaid && inv.paid_at ? ` · Paid: ${fmtDate(inv.paid_at)}` : ''}</Text>
                </View>
                <Pressable
                  style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
                    backgroundColor: isPaid ? Colors.secondary : Colors.primaryMuted,
                    borderColor: isPaid ? Colors.border : Colors.primary }}
                  onPress={() => togglePaid(inv)}
                  disabled={updateInvoice.isPending}
                >
                  <Ionicons name={isPaid ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={15} color={isPaid ? Colors.textMuted : Colors.primary} />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: isPaid ? Colors.textMuted : Colors.primary }}>
                    {isPaid ? 'Undo' : 'Mark Paid'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {filtered.length === 0 && !isLoading && <Text style={section.empty}>No invoices found</Text>}
      </ScrollView>
    </View>
  );
}

// ─── WHATSAPP OWNER SECTION ───────────────────────────────────────────────────
const TRIGGER_LABEL: Record<string, { label: string; desc: string; tag: string; tagColor: string }> = {
  '3_days_before': { label: '3 Days Before Expiry', desc: 'Sent automatically at 9 AM, 3 days before membership expires', tag: 'Day -3', tagColor: Colors.info },
  '1_day_before': { label: '1 Day Before Expiry', desc: 'Sent automatically at 9 AM, 1 day before membership expires', tag: 'Day -1', tagColor: Colors.warning },
  'expiry_day': { label: 'On Expiry Day', desc: 'Sent automatically at 9 AM on the expiry date', tag: 'Day 0', tagColor: Colors.danger },
  'day_-3': { label: '3 Days Before Expiry', desc: 'Sent 3 days before membership expires', tag: 'Day -3', tagColor: Colors.info },
  'day_-1': { label: '1 Day Before Expiry', desc: 'Sent 1 day before membership expires', tag: 'Day -1', tagColor: Colors.warning },
  'day_0': { label: 'On Expiry Day', desc: 'Sent on the expiry date', tag: 'Day 0', tagColor: Colors.danger },
};

function getTriggerMeta(type: string) {
  return TRIGGER_LABEL[type] ?? { label: type, desc: 'Automated trigger', tag: type.toUpperCase(), tagColor: Colors.textMuted };
}

function WhatsAppOwnerSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const gymId = user?.gym_id;
  const { data: members = [] } = useMembers(gymId);
  const { data: templates = [], isLoading: loadingTemplates } = useWhatsappTemplates();
  const { data: logs = [], isLoading: loadingLogs } = useWhatsappLogs();
  const updateTemplate = useUpdateWhatsappTemplate();
  const insertLog = useInsertWhatsappLog();

  const [tab, setTab] = useState<'triggers' | 'broadcast' | 'log'>('triggers');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState('');
  const [editError, setEditError] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPhone, setBroadcastPhone] = useState('');
  const [broadcastError, setBroadcastError] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const gymLogs = logs.filter((l: any) => l.gym_id === gymId);

  const handleToggle = (t: any) => {
    updateTemplate.mutate({ id: t.id, is_enabled: !t.is_enabled }, {
      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    });
  };

  const handleSaveEdit = () => {
    setEditError('');
    if (!editMsg.trim()) { setEditError('Message cannot be empty'); return; }
    updateTemplate.mutate({ id: editingId!, message: editMsg.trim() }, {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEditingId(null); },
      onError: (e: any) => setEditError(e.message),
    });
  };

  const handleBroadcast = () => {
    setBroadcastError('');
    setBroadcastSuccess(false);
    if (!broadcastMsg.trim()) { setBroadcastError('Message is required'); return; }
    if (!gymId) { setBroadcastError('Gym not found'); return; }
    insertLog.mutate(
      { gym_id: gymId, message: broadcastMsg.trim(), phone: broadcastPhone.trim() || undefined, status: 'pending' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBroadcastMsg('');
          setBroadcastPhone('');
          setBroadcastSuccess(true);
        },
        onError: (e: any) => setBroadcastError(e.message),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="WhatsApp" onClose={onClose} />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 6 }}>
        {([
          { key: 'triggers', label: 'Triggers' },
          { key: 'broadcast', label: 'Broadcast' },
          { key: 'log', label: 'Message Log' },
        ] as const).map(t => (
          <Pressable
            key={t.key}
            style={{ flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
              backgroundColor: tab === t.key ? '#25D36622' : Colors.secondary,
              borderColor: tab === t.key ? '#25D366' : Colors.border }}
            onPress={() => setTab(t.key)}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: tab === t.key ? '#25D366' : Colors.textSecondary }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'triggers' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
          <View style={[section.card, { backgroundColor: Colors.secondary, borderColor: Colors.border }]}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 }}>
                These messages are sent <Text style={{ fontFamily: 'Inter_600SemiBold', color: Colors.text }}>automatically</Text> via WhatsApp to members before their membership expires. Use variables like <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#25D366' }}>{'{member_name}'}</Text> which are replaced with real data when sent.
              </Text>
            </View>
          </View>

          {loadingTemplates && <ActivityIndicator color="#25D366" />}

          {templates.map((t: any) => {
            const meta = getTriggerMeta(t.trigger_type ?? '');
            const isEditing = editingId === t.id;
            return (
              <View key={t.id} style={section.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ backgroundColor: meta.tagColor + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: meta.tagColor + '55' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: meta.tagColor }}>{meta.tag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={section.name}>{meta.label}</Text>
                    <Text style={[section.sub, { fontSize: 11 }]}>{meta.desc}</Text>
                  </View>
                  {!isEditing && (
                    <Pressable onPress={() => { setEditingId(t.id); setEditMsg(t.message ?? ''); setEditError(''); }}>
                      <Ionicons name="pencil-outline" size={17} color={Colors.primary} style={{ marginRight: 8 }} />
                    </Pressable>
                  )}
                  {updateTemplate.isPending && editingId === null ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Pressable
                      style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: t.is_enabled ? '#25D366' : Colors.secondary, borderWidth: 1, borderColor: t.is_enabled ? '#25D366' : Colors.border, justifyContent: 'center', paddingHorizontal: 2 }}
                      onPress={() => handleToggle(t)}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.is_enabled ? '#000' : Colors.textMuted, alignSelf: t.is_enabled ? 'flex-end' : 'flex-start' }} />
                    </Pressable>
                  )}
                </View>

                {isEditing ? (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      style={[section.input, { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
                      value={editMsg}
                      onChangeText={setEditMsg}
                      multiline
                      placeholder="Enter message template..."
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted }}>
                      Variables: {'{member_name}'}, {'{gym_name}'}, {'{expiry_date}'}
                    </Text>
                    {!!editError && (
                      <View style={section.errorBox}>
                        <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                        <Text style={section.errorText}>{editError}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable style={[section.submitBtn, { flex: 1, backgroundColor: '#25D366' }]} onPress={handleSaveEdit} disabled={updateTemplate.isPending}>
                        {updateTemplate.isPending ? <ActivityIndicator color="#fff" /> : <Text style={[section.submitBtnText, { color: '#fff' }]}>Save</Text>}
                      </Pressable>
                      <Pressable style={[section.cancelBtn, { flex: 1 }]} onPress={() => setEditingId(null)}>
                        <Text style={section.cancelBtnText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ backgroundColor: Colors.secondary, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text, lineHeight: 18 }}>{t.message || '(No message set)'}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {templates.length === 0 && !loadingTemplates && (
            <Text style={section.empty}>No triggers configured for this gym</Text>
          )}
        </ScrollView>
      )}

      {tab === 'broadcast' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          <View style={[section.card, { gap: 10 }]}>
            <Text style={analytics.sectionTitle}>Send Broadcast Message</Text>
            <TextInput
              style={section.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={broadcastPhone}
              onChangeText={setBroadcastPhone}
            />
            <TextInput
              style={[section.input, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder={`Message * (use {member_name}, {gym_name}, {expiry_date})`}
              placeholderTextColor={Colors.textMuted}
              multiline
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
            />
            {!!broadcastError && (
              <View style={section.errorBox}>
                <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                <Text style={section.errorText}>{broadcastError}</Text>
              </View>
            )}
            {broadcastSuccess && (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: Colors.primaryMuted, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.primary + '40' }}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary }}>Message queued for delivery!</Text>
              </View>
            )}
            <Pressable
              style={[section.submitBtn, { backgroundColor: '#25D366' }]}
              onPress={handleBroadcast}
              disabled={insertLog.isPending}
            >
              {insertLog.isPending
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={[section.submitBtnText, { color: '#fff' }]}>Send Broadcast</Text>
                  </View>
                )}
            </Pressable>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center' }}>
              {members.length} members in this gym
            </Text>
          </View>
        </ScrollView>
      )}

      {tab === 'log' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}>
          {loadingLogs && <ActivityIndicator color="#25D366" />}
          {gymLogs.map((log: any) => (
            <View key={log.id} style={section.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={[section.name, { flex: 1 }]}>
                  {log.phone ? log.phone : 'Broadcast'}
                </Text>
                <StatusBadge status={log.status ?? 'pending'} map={WA_STATUS_MAP} />
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>{log.message}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>{fmtDate(log.created_at)}</Text>
            </View>
          ))}
          {gymLogs.length === 0 && !loadingLogs && <Text style={section.empty}>No messages sent yet</Text>}
        </ScrollView>
      )}
    </View>
  );
}

// ─── MY PLAN SECTION ──────────────────────────────────────────────────────────
const ALL_PLANS = [
  {
    value: 'base',
    label: 'Base',
    price: '₹999',
    period: '/mo',
    yearlyPrice: '₹9,990/year',
    tagline: 'WhatsApp lead management, trial booking, fee reminders, website replies',
    features: [
      'WhatsApp Lead Management',
      'Trial Booking (3-step)',
      'Fee Reminder Automation',
      'Website Replies Setup',
      'Lead Pipeline (Kanban)',
      'Member Management',
      'Trainer Login',
      'Basic Analytics',
    ],
    color: Colors.info,
  },
  {
    value: 'classic',
    label: 'Classic',
    price: '₹1,299',
    period: '/mo',
    yearlyPrice: '₹12,990/year',
    tagline: 'Everything in Base plus Instagram DM lead capture',
    features: [
      'Everything in Base',
      'Instagram DM Lead Capture',
      'Instagram Auto-Reply',
    ],
    color: Colors.purple,
  },
  {
    value: 'pro',
    label: 'Pro',
    price: '₹1,999',
    period: '/mo',
    yearlyPrice: '₹19,990/year',
    tagline: 'Everything in Classic plus diet, client tracking and WhatsApp bot',
    features: [
      'Everything in Classic',
      'Diet Plan Automation (daily 7 AM)',
      'Client Progress Tracking',
      'Bot WhatsApp Integration',
      'Message limit applies',
    ],
    color: Colors.warning,
  },
];

function MyPlanSection({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const gymId = user?.gym_id;
  const { data: gyms = [] } = useGyms();
  const { data: subscription } = useGymSubscriptionByGym(gymId);

  const gym = gyms.find((g: any) => g.id === gymId);
  const currentPlan = gym?.plan ?? 'base';
  const currentPlanInfo = ALL_PLANS.find(p => p.value === currentPlan) ?? ALL_PLANS[0];

  const daysLeft = subscription?.end_date
    ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionHeader title="My Plan" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}>
        {(isExpiringSoon || isExpired) && (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.warningMuted, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.warning + '55' }}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} style={{ marginTop: 1 }} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.warning, flex: 1, lineHeight: 18 }}>
              {isExpired
                ? 'Your subscription has expired. Contact the platform team to renew.'
                : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Contact the platform team to renew.`}
            </Text>
          </View>
        )}

        <View style={[section.card, { borderTopWidth: 2, borderTopColor: currentPlanInfo.color }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ backgroundColor: currentPlanInfo.color + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: currentPlanInfo.color + '55' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: currentPlanInfo.color }}>Current Plan</Text>
            </View>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text }}>{currentPlanInfo.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: currentPlanInfo.color }}>{currentPlanInfo.price}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary }}>{currentPlanInfo.period}</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted }}>{currentPlanInfo.yearlyPrice}</Text>
          {subscription?.end_date && (
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: daysLeft !== null && daysLeft <= 30 ? Colors.warning : Colors.textSecondary, marginTop: 4 }}>
              {isExpired ? 'Expired' : `Renews ${fmtDate(subscription.end_date)}`}
              {daysLeft !== null && daysLeft > 0 ? ` · ${daysLeft}d left` : ''}
            </Text>
          )}
          <View style={{ marginTop: 8, gap: 4 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>INCLUDED FEATURES</Text>
            {currentPlanInfo.features.map(f => (
              <View key={f} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={15} color={currentPlanInfo.color} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginTop: 4 }}>Available Plans</Text>

        {ALL_PLANS.map(plan => {
          const isCurrent = plan.value === currentPlan;
          return (
            <View key={plan.value} style={[section.card, isCurrent && { borderColor: plan.color, borderWidth: 2 }]}>
              {isCurrent && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: plan.color }}>Current Plan</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text }}>{plan.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: plan.color }}>{plan.price}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary }}>{plan.period}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted }}>{plan.yearlyPrice}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{plan.tagline}</Text>
              <View style={{ marginTop: 8, gap: 4 }}>
                {plan.features.map(f => (
                  <View key={f} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Ionicons name="checkmark" size={14} color={plan.color} />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text }}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ backgroundColor: Colors.secondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4 }}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
            To change your plan, contact the platform team.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const planSt = StyleSheet.create({
  planCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 2, alignItems: 'center', gap: 2,
  },
  planLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  planPrice: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary },
  planCount: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
});

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
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerMuted, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.danger + '40',
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.danger, flex: 1 },
});

const signOutModal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 340, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.dangerMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  message: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textSecondary },
  confirmBtn: {
    flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.danger,
  },
  confirmText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
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
