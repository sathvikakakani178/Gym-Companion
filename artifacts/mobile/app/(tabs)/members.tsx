import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useMembers, useProfiles, useInsertMember, useUpdateMember, useDeleteMember, useInsertActivity, useBranches } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Badge } from '@/components/Badge';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const PLANS = ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly'];
const PLAN_DAYS: Record<string, number> = { Monthly: 30, Quarterly: 90, 'Half-yearly': 180, Yearly: 365 };

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function MembersScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { data: members = [], isLoading } = useMembers(user?.gym_id);
  const { data: trainers = [] } = useProfiles(user?.gym_id);
  const { data: branches = [] } = useBranches(user?.gym_id);
  const insertMember = useInsertMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const insertActivity = useInsertActivity();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', plan: 'Monthly', trainer_id: '', branch_id: '' });

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (filter !== 'all' && m.status !== filter) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [members, filter, search]);

  const handleAdd = () => {
    if (!form.name || !form.phone) { Alert.alert('Error', 'Name and phone are required'); return; }
    const joiningDate = new Date().toISOString().split('T')[0];
    const expiryDate = addDays(PLAN_DAYS[form.plan] || 30);
    insertMember.mutate({
      name: form.name, phone: form.phone, plan: form.plan,
      joining_date: joiningDate, expiry_date: expiryDate,
      trainer_id: form.trainer_id || null,
      branch_id: form.branch_id || null,
      gym_id: user?.gym_id || null,
    }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAdd(false);
        setForm({ name: '', phone: '', plan: 'Monthly', trainer_id: '', branch_id: '' });
        insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'Owner', action: 'Added member', details: form.name });
      },
      onError: (e: any) => Alert.alert('Error', e.message),
    });
  };

  const handleRenew = (m: any) => {
    const joiningDate = new Date().toISOString().split('T')[0];
    const newExpiry = addDays(PLAN_DAYS[m.plan] || 30);
    updateMember.mutate({ id: m.id, joining_date: joiningDate, expiry_date: newExpiry }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelected(null);
        insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'Owner', action: 'Renewed membership', details: `${m.name} → ${newExpiry}` });
      },
    });
  };

  const handleDelete = (m: any) => {
    Alert.alert('Delete Member', `Remove ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteMember.mutate(m.id, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelected(null);
            },
          });
        },
      },
    ]);
  };

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
    { key: 'expiring', label: 'Expiring' }, { key: 'expired', label: 'Expired' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Members"
        subtitle={`${members.length} members`}
        rightAction={{
          icon: <Ionicons name="add" size={20} color={Colors.primary} />,
          onPress: () => { Haptics.selectionAsync(); setShowAdd(true); },
        }}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {filterBtns.map(b => (
          <Pressable
            key={b.key}
            style={[styles.filterChip, filter === b.key && styles.filterChipActive]}
            onPress={() => setFilter(b.key)}
          >
            <Text style={[styles.filterChipText, filter === b.key && styles.filterChipTextActive]}>{b.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{search ? 'No members found' : 'No members yet'}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000);
            return (
              <Pressable
                style={({ pressed }) => [styles.memberCard, pressed && { opacity: 0.85 }]}
                onPress={() => { Haptics.selectionAsync(); setSelected(item); }}
              >
                <View style={styles.memberTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberPhone}>{item.phone}</Text>
                  </View>
                  <Badge label={item.status} variant={item.status as any} />
                </View>
                <View style={styles.memberMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="card-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.plan}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={[styles.metaText, daysLeft < 0 && { color: Colors.danger }, daysLeft >= 0 && daysLeft <= 7 && { color: Colors.warning }]}>
                      {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                    </Text>
                  </View>
                  {item.trainer?.name && (
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{item.trainer.name}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Member detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Profile</Text>
              <Pressable onPress={() => setSelected(null)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
            </View>
            <View style={styles.detailAvatar}>
              <Text style={styles.detailAvatarText}>{selected.name[0]}</Text>
            </View>
            <Text style={styles.detailName}>{selected.name}</Text>
            <Text style={styles.detailPhone}>{selected.phone}</Text>
            <View style={styles.detailGrid}>
              {[
                { label: 'Plan', value: selected.plan },
                { label: 'Trainer', value: selected.trainer?.name || 'Unassigned' },
                { label: 'Joined', value: selected.joining_date },
                { label: 'Expires', value: selected.expiry_date },
              ].map(row => (
                <View key={row.label} style={styles.detailCell}>
                  <Text style={styles.detailCellLabel}>{row.label}</Text>
                  <Text style={styles.detailCellValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={[styles.renewBtn, updateMember.isPending && { opacity: 0.6 }]}
              onPress={() => handleRenew(selected)}
              disabled={updateMember.isPending}
            >
              {updateMember.isPending ? <ActivityIndicator color="#000" /> : (
                <>
                  <Ionicons name="refresh-circle" size={18} color="#000" />
                  <Text style={styles.renewBtnText}>Renew Membership</Text>
                </>
              )}
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(selected)}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete Member</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Add member modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <Pressable onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
          </View>
          {[
            { field: 'name', label: 'Full Name', placeholder: 'Rahul Sharma', keyboard: 'default' },
            { field: 'phone', label: 'Phone', placeholder: '+91 98765 43210', keyboard: 'phone-pad' },
          ].map(({ field, label, placeholder, keyboard }) => (
            <View key={field} style={styles.formField}>
              <Text style={styles.formLabel}>{label}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                value={(form as any)[field]}
                onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                keyboardType={keyboard as any}
              />
            </View>
          ))}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Plan</Text>
            <View style={styles.planRow}>
              {PLANS.map(p => (
                <Pressable
                  key={p}
                  style={[styles.planChip, form.plan === p && styles.planChipActive]}
                  onPress={() => setForm(f => ({ ...f, plan: p }))}
                >
                  <Text style={[styles.planChipText, form.plan === p && { color: Colors.primary }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            style={[styles.submitBtn, insertMember.isPending && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={insertMember.isPending}
          >
            {insertMember.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Add Member</Text>}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: Colors.border, height: 42,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },
  memberCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.primary },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  memberPhone: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  memberMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  detailAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 8,
  },
  detailAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 26, color: Colors.primary },
  detailName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text, textAlign: 'center' },
  detailPhone: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  detailCell: { width: '47%', backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  detailCellLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  detailCellValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  renewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, backgroundColor: Colors.primary, borderRadius: 12, marginBottom: 10,
  },
  renewBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#000' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, borderWidth: 1, borderColor: Colors.danger, borderRadius: 12,
  },
  deleteBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.danger },
  formField: { gap: 6, marginBottom: 16 },
  formLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: {
    backgroundColor: Colors.card, borderRadius: 12, height: 46,
    paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  planChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  planChipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  submitBtn: {
    height: 50, backgroundColor: Colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#000' },
});
