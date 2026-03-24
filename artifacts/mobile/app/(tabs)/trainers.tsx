import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTrainers, useMembers, useInsertActivity, useBranches } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function TrainersScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const { data: trainers = [], isLoading } = useTrainers(user?.gym_id);
  const { data: members = [] } = useMembers(user?.gym_id);
  const { data: branches = [] } = useBranches(user?.gym_id);
  const insertActivity = useInsertActivity();
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', specialization: '', branch_id: '',
  });
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', specialization: '', branch_id: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setFormError('');
    if (!form.name || !form.email || !form.phone || !form.password) {
      setFormError('Name, email, phone and password are required');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    setAdding(true);
    const { error } = await supabase.rpc('create_trainer_account' as any, {
      p_branch_id: form.branch_id || null,
      p_name: form.name,
      p_email: form.email,
      p_password: form.password,
      p_phone: form.phone || null,
      p_specialization: form.specialization || null,
    });
    setAdding(false);
    if (error) { setFormError(error.message); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    qc.invalidateQueries({ queryKey: ['trainers'] });
    insertActivity.mutate({
      gym_id: user?.gym_id || null,
      actor_name: user?.name || 'Owner',
      action: 'Added trainer',
      details: form.name,
    });
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', password: '', specialization: '', branch_id: '' });
  };

  const handleDelete = (trainer: any) => {
    const clientCount = members.filter((m: any) => m.trainer_id === trainer.profile_id).length;
    if (clientCount > 0) {
      setFormError(`${clientCount} client(s) still assigned to this trainer`);
      return;
    }
    setPendingDelete(trainer);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    await supabase.from('trainers').delete().eq('id', pendingDelete.id);
    await supabase.from('profiles').delete().eq('id', pendingDelete.profile_id);
    setDeleteLoading(false);
    qc.invalidateQueries({ queryKey: ['trainers'] });
    insertActivity.mutate({
      gym_id: user?.gym_id || null,
      actor_name: user?.name || 'Owner',
      action: 'Removed trainer',
      details: pendingDelete.profile?.name,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingDelete(null);
  };

  const startEdit = (trainer: any) => {
    setEditingTrainer(trainer);
    setEditForm({
      name: trainer.profile?.name || '',
      phone: trainer.profile?.phone || '',
      specialization: trainer.specialization || '',
      branch_id: trainer.branch_id || '',
    });
  };

  const handleEditSave = async () => {
    if (!editingTrainer) return;
    setEditError('');
    setSaving(true);
    const { error: pErr } = await supabase.from('profiles').update({
      name: editForm.name,
      phone: editForm.phone || null,
    }).eq('id', editingTrainer.profile_id);
    if (pErr) { setEditError(pErr.message); setSaving(false); return; }
    const { error: tErr } = await supabase.from('trainers').update({
      specialization: editForm.specialization || null,
      branch_id: editForm.branch_id || null,
    }).eq('id', editingTrainer.id);
    setSaving(false);
    if (tErr) { setEditError(tErr.message); return; }
    qc.invalidateQueries({ queryKey: ['trainers'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingTrainer(null);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Trainers" subtitle={`${trainers.length} trainer${trainers.length !== 1 ? 's' : ''}`} />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={() => { Haptics.selectionAsync(); setShowAdd(!showAdd); }}
          >
            <Ionicons name={showAdd ? 'close-outline' : 'add'} size={18} color="#000" />
            <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : 'Add Trainer'}</Text>
          </Pressable>

          {showAdd && <AddTrainerForm
            form={form}
            setForm={setForm}
            branches={branches}
            showPass={showPass}
            setShowPass={setShowPass}
            onSubmit={handleAdd}
            loading={adding}
            error={formError}
          />}

          {trainers.length === 0 && !showAdd && (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No trainers yet</Text>
              <Text style={styles.emptySub}>Tap "Add Trainer" to create a trainer account</Text>
            </View>
          )}

          {trainers.map((t: any) => {
            const clientCount = members.filter((m: any) => m.trainer_id === t.profile_id).length;
            const branch = branches.find((b: any) => b.id === t.branch_id);
            return (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(t.profile?.name || 'T')[0]}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{t.profile?.name || 'Unknown'}</Text>
                    <Text style={styles.sub}>{t.profile?.email}</Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable style={styles.actionBtn} onPress={() => startEdit(t)}>
                      <Ionicons name="pencil-outline" size={17} color={Colors.primary} />
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleDelete(t)}>
                      <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.meta}>
                  <View style={styles.badge}>
                    <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.badgeText}>{clientCount} clients</Text>
                  </View>
                  {t.specialization && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t.specialization}</Text>
                    </View>
                  )}
                  {branch && (
                    <View style={styles.badge}>
                      <Ionicons name="map-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.badgeText}>{branch.name}</Text>
                    </View>
                  )}
                  {t.profile?.phone && (
                    <View style={styles.badge}>
                      <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.badgeText}>{t.profile.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!editingTrainer} animationType="slide" transparent onRequestClose={() => setEditingTrainer(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Trainer</Text>
              <Pressable onPress={() => setEditingTrainer(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>
            {[
              { field: 'name', label: 'Full Name', placeholder: 'Trainer name' },
              { field: 'phone', label: 'Phone', placeholder: 'Phone number' },
              { field: 'specialization', label: 'Specialization', placeholder: 'e.g. Strength, Yoga' },
            ].map(({ field, label, placeholder }) => (
              <View key={field} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={(editForm as any)[field]}
                  onChangeText={v => setEditForm(f => ({ ...f, [field]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Branch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[{ id: '', name: 'None' }, ...branches].map((b: any) => (
                  <Pressable
                    key={b.id}
                    style={[styles.chip, editForm.branch_id === b.id && styles.chipActive]}
                    onPress={() => setEditForm(f => ({ ...f, branch_id: b.id }))}
                  >
                    <Text style={[styles.chipText, editForm.branch_id === b.id && styles.chipTextActive]}>{b.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {!!editError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            )}
            <Pressable
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleEditSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!pendingDelete}
        title="Remove Trainer"
        message={`Remove ${pendingDelete?.profile?.name}? They will lose access to the app.`}
        confirmLabel="Remove"
        destructive
        icon="trash-outline"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

function AddTrainerForm({ form, setForm, branches, showPass, setShowPass, onSubmit, loading, error }: any) {
  const fields = [
    { field: 'name', label: 'Full Name *', placeholder: 'Trainer name', keyboard: 'default' },
    { field: 'email', label: 'Email *', placeholder: 'trainer@gym.com', keyboard: 'email-address' },
    { field: 'phone', label: 'Phone *', placeholder: '+91 98765 43210', keyboard: 'phone-pad' },
    { field: 'specialization', label: 'Specialization', placeholder: 'e.g. Strength Training', keyboard: 'default' },
  ];

  return (
    <View style={styles.formCard}>
      {fields.map(({ field, label, placeholder, keyboard }) => (
        <View key={field} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.input}
            value={(form as any)[field]}
            onChangeText={(v: string) => setForm((f: any) => ({ ...f, [field]: v }))}
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
            onChangeText={(v: string) => setForm((f: any) => ({ ...f, password: v }))}
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
        <Text style={styles.fieldLabel}>Branch (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[{ id: '', name: 'None' }, ...branches].map((b: any) => (
            <Pressable
              key={b.id}
              style={[styles.chip, form.branch_id === b.id && styles.chipActive]}
              onPress={() => setForm((f: any) => ({ ...f, branch_id: b.id }))}
            >
              <Text style={[styles.chipText, form.branch_id === b.id && styles.chipTextActive]}>{b.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Create Trainer Account</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 10 },
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
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerMuted, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.danger + '40',
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.danger, flex: 1 },
  submitBtn: {
    height: 44, backgroundColor: Colors.primary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000' },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.primary },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: Colors.secondary, borderWidth: 1, borderColor: Colors.border,
  },
  badgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, gap: 14, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text },
});
