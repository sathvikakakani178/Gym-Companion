import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  FlatList, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLeads, useInsertLead, useUpdateLead, useDeleteLead, useInsertActivity, useBranches } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Badge } from '@/components/Badge';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

type LeadStatus = 'enquiry' | 'trial_booked' | 'visited' | 'member' | 'churned';

const STATUS_ORDER: LeadStatus[] = ['enquiry', 'trial_booked', 'visited', 'member', 'churned'];
const STATUS_LABELS: Record<LeadStatus, string> = {
  enquiry: 'Enquiry',
  trial_booked: 'Trial Booked',
  visited: 'Visited',
  member: 'Member',
  churned: 'Churned',
};
const SOURCE_ICONS: Record<string, string> = {
  whatsapp: 'logo-whatsapp',
  instagram: 'logo-instagram',
  website: 'globe-outline',
  missed_call: 'call-outline',
};

export default function LeadsScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { data: leads = [], isLoading } = useLeads(user?.gym_id);
  const { data: branches = [] } = useBranches(user?.gym_id);
  const insertLead = useInsertLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const insertActivity = useInsertActivity();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', source: 'whatsapp', goal: '' });

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filter !== 'all' && l.status !== filter) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [leads, filter, search]);

  const moveLeadRight = (lead: any) => {
    const idx = STATUS_ORDER.indexOf(lead.status as LeadStatus);
    if (idx < STATUS_ORDER.length - 1) {
      const newStatus = STATUS_ORDER[idx + 1];
      updateLead.mutate({ id: lead.id, status: newStatus }, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'System', action: 'Lead advanced', details: `${lead.name} → ${STATUS_LABELS[newStatus]}` });
        },
      });
    }
  };

  const handleDelete = (lead: any) => {
    Alert.alert('Delete Lead', `Remove ${lead.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteLead.mutate(lead.id, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'System', action: 'Deleted lead', details: lead.name });
            },
          });
        },
      },
    ]);
  };

  const handleAdd = () => {
    if (!form.name || !form.phone) { Alert.alert('Error', 'Name and phone are required'); return; }
    insertLead.mutate({
      name: form.name, phone: form.phone,
      source: form.source, goal: form.goal,
      gym_id: user?.gym_id || null,
      branch_id: user?.branch_id || null,
      status: 'enquiry',
    }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAdd(false);
        setForm({ name: '', phone: '', source: 'whatsapp', goal: '' });
        insertActivity.mutate({ gym_id: user?.gym_id || null, actor_name: user?.name || 'System', action: 'Added new lead', details: form.name });
      },
      onError: (e: any) => Alert.alert('Error', e.message),
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Lead Pipeline"
        subtitle={`${leads.length} leads`}
        rightAction={{
          icon: <Ionicons name="add" size={20} color={Colors.primary} />,
          onPress: () => { Haptics.selectionAsync(); setShowAdd(true); },
        }}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={Colors.textMuted} /></Pressable>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {(['all', ...STATUS_ORDER] as const).map(s => (
          <Pressable
            key={s}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => { setFilter(s); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{search ? 'No leads found' : 'No leads yet'}</Text>
              {!search && <Text style={styles.emptySub}>Add your first lead to get started</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.leadCard}>
              <View style={styles.leadTop}>
                <Text style={styles.leadName}>{item.name}</Text>
                <Badge label={STATUS_LABELS[item.status as LeadStatus]} variant={item.status as any} />
              </View>
              <View style={styles.leadMeta}>
                <Ionicons name={SOURCE_ICONS[item.source] as any || 'ellipse-outline'} size={14} color={Colors.textMuted} />
                <Text style={styles.leadPhone}>{item.phone}</Text>
                {item.goal ? <Text style={styles.leadGoal}>{item.goal}</Text> : null}
              </View>
              <View style={styles.leadActions}>
                <Pressable
                  style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => moveLeadRight(item)}
                  disabled={item.status === 'churned'}
                >
                  <Ionicons name="arrow-forward-circle" size={16} color={item.status === 'churned' ? Colors.textMuted : Colors.primary} />
                  <Text style={[styles.advanceBtnText, item.status === 'churned' && { color: Colors.textMuted }]}>Advance</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Lead</Text>
            <Pressable onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
          </View>
          {(['name', 'phone'] as const).map(field => (
            <View key={field} style={styles.formField}>
              <Text style={styles.formLabel}>{field === 'name' ? 'Full Name' : 'Phone Number'}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={field === 'name' ? 'Rahul Sharma' : '+91 98765 43210'}
                placeholderTextColor={Colors.textMuted}
                value={form[field]}
                onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
              />
            </View>
          ))}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Goal</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Weight loss, Muscle gain..."
              placeholderTextColor={Colors.textMuted}
              value={form.goal}
              onChangeText={v => setForm(f => ({ ...f, goal: v }))}
            />
          </View>
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Source</Text>
            <View style={styles.sourceRow}>
              {(['whatsapp', 'instagram', 'website', 'missed_call'] as const).map(s => (
                <Pressable
                  key={s}
                  style={[styles.sourceChip, form.source === s && styles.sourceChipActive]}
                  onPress={() => setForm(f => ({ ...f, source: s }))}
                >
                  <Ionicons name={SOURCE_ICONS[s] as any} size={14} color={form.source === s ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.sourceChipText, form.source === s && { color: Colors.primary }]}>{s.replace('_', ' ')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, insertLead.isPending && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={insertLead.isPending}
          >
            {insertLead.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Add Lead</Text>}
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
  filterRow: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },
  leadCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  leadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leadName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  leadMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadPhone: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  leadGoal: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted,
    backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  leadActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  advanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  advanceBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  formField: { gap: 6, marginBottom: 16 },
  formLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: {
    backgroundColor: Colors.card, borderRadius: 12, height: 46,
    paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  sourceChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  sourceChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  submitBtn: {
    height: 50, backgroundColor: Colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#000' },
});
