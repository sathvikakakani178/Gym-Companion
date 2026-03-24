import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

function TabIcon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  if (Platform.OS === "ios") {
    return <SymbolView name={name} tintColor={color} size={size} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "super_admin";
  const isOwner = user.role === "gym_owner";
  const isTrainer = user.role === "trainer";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : Colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.tabBar }]} />
          ),
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
      }}
    >
      {/* ── Dashboard — all roles ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "house" : "home-outline"} color={color} />
          ),
        }}
      />

      {/* ── Leads — gym_owner only ── */}
      <Tabs.Screen
        name="leads"
        options={{
          href: isOwner ? undefined : null,
          title: "Leads",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "person.badge.plus" : "people-outline"} color={color} />
          ),
        }}
      />

      {/* ── Members — gym_owner only ── */}
      <Tabs.Screen
        name="members"
        options={{
          href: isOwner ? undefined : null,
          title: "Members",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "person.2" : "person-outline"} color={color} />
          ),
        }}
      />

      {/* ── Trainers — gym_owner only ── */}
      <Tabs.Screen
        name="trainers"
        options={{
          href: isOwner ? undefined : null,
          title: "Trainers",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "figure.strengthtraining.traditional" : "barbell-outline"} color={color} />
          ),
        }}
      />

      {/* ── Gym Accounts — super_admin only ── */}
      <Tabs.Screen
        name="gyms"
        options={{
          href: isAdmin ? undefined : null,
          title: "Gyms",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "building.2" : "business-outline"} color={color} />
          ),
        }}
      />

      {/* ── Activity Log — super_admin only ── */}
      <Tabs.Screen
        name="activity"
        options={{
          href: isAdmin ? undefined : null,
          title: "Activity",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "chart.line.uptrend.xyaxis" : "pulse-outline"} color={color} />
          ),
        }}
      />

      {/* ── My Clients — trainer only ── */}
      <Tabs.Screen
        name="clients"
        options={{
          href: isTrainer ? undefined : null,
          title: "My Clients",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "person.2" : "people-outline"} color={color} />
          ),
        }}
      />

      {/* ── Diet Plans — trainer only ── */}
      <Tabs.Screen
        name="diet"
        options={{
          href: isTrainer ? undefined : null,
          title: "Diet Plans",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "fork.knife" : "nutrition-outline"} color={color} />
          ),
        }}
      />

      {/* ── More — all roles ── */}
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <TabIcon name={Platform.OS === "ios" ? "ellipsis.circle" : "ellipsis-horizontal-circle-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
