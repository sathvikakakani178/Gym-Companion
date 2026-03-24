import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

function NativeTabLayout({ role }: { role: string }) {
  const isAdmin = role === 'super_admin';
  const isOwner = role === 'gym_owner';
  const isTrainer = role === 'trainer';

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      {(isAdmin || isOwner) && (
        <NativeTabs.Trigger name="leads">
          <Icon sf={{ default: "person.badge.plus", selected: "person.badge.plus.fill" }} />
          <Label>Leads</Label>
        </NativeTabs.Trigger>
      )}
      {(isAdmin || isOwner) && (
        <NativeTabs.Trigger name="members">
          <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
          <Label>Members</Label>
        </NativeTabs.Trigger>
      )}
      {(isAdmin || isOwner || isTrainer) && (
        <NativeTabs.Trigger name="clients">
          <Icon sf={{ default: "figure.strengthtraining.traditional", selected: "figure.strengthtraining.traditional" }} />
          <Label>Clients</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ role }: { role: string }) {
  const isIOS = Platform.OS === 'ios';
  const isAdmin = role === 'super_admin';
  const isOwner = role === 'gym_owner';
  const isTrainer = role === 'trainer';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.tabBar }]} />
          ),
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          href: (isAdmin || isOwner) ? undefined : null,
          title: "Leads",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.badge.plus" tintColor={color} size={22} /> : <Ionicons name="people-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          href: (isAdmin || isOwner) ? undefined : null,
          title: "Members",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: (isAdmin || isOwner || isTrainer) ? undefined : null,
          title: "Clients",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="figure.strengthtraining.traditional" tintColor={color} size={22} /> : <Ionicons name="barbell-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="ellipsis.circle" tintColor={color} size={22} /> : <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (!user) return null;

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout role={user.role} />;
  }
  return <ClassicTabLayout role={user.role} />;
}
