import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useActivityLog } from '@/lib/hooks';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';

export default function ActivityScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const gymId = user?.role === 'super_admin' ? null : user?.gym_id;
  const { data: activity = [], isLoading, refetch, isRefetching } = useActivityLog(gymId);
  const [search, setSearch] = useState('');

  const filtered = search
    ? activity.filter((a: any) =>
        a.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.action?.toLowerCase().includes(search.toLowerCase()) ||
        a.details?.toLowerCase().includes(search.toLowerCase())
      )
    : activity;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  const actionColors: Record<string, string> = {
    Added: Colors.primary,
    Created: Colors.primary,
    Removed: Colors.danger,
    Deleted: Colors.danger,
    Updated: Colors.info,
    Suspended: Colors.warning,
    Reactivated: Colors.primary,
  };

  function getActionColor(action: string) {
    const key = Object.keys(actionColors).find(k => action.startsWith(k));
    return key ? actionColors[key] : Colors.textMuted;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Activity Log" subtitle={`${activity.length} events`} />

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activity..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} onPress={() => setSearch('')} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="pulse-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>{search ? 'No results' : 'No activity yet'}</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View style={styles.card}>
              <View style={[styles.dot, { backgroundColor: getActionColor(item.action) }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.actor}>{item.actor_name}</Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.action, { color: getActionColor(item.action) }]}>{item.action}</Text>
                {item.details && <Text style={styles.details}>{item.details}</Text>}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: Colors.secondary, borderRadius: 10, paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  list: { padding: 16, gap: 8 },
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  cardContent: { flex: 1, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actor: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  date: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  action: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  details: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
});
