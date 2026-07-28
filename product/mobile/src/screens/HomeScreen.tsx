import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../lib/api';
import { connectLiveSync } from '../lib/liveSync';
import { readSession } from '../lib/session';
import { useAuth } from '../hooks/useAuth';
import type { Circular, DashboardStats, MenuItem, Notification, WorkflowRequest } from '../types';

type Tab = 'overview' | 'notices' | 'requests' | 'profile';

export function HomeScreen() {
  const { user, logout, logoutAll, hasPermission, setBiometrics } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;
    let socket: ReturnType<typeof connectLiveSync> | undefined;
    let active = true;
    readSession().then(({ accessToken }) => {
      if (!active || !accessToken) return;
      socket = connectLiveSync(accessToken, (event) => {
        queryClient.invalidateQueries();
        setToast(`Updated: ${event.replace('.', ' ')}`);
        setTimeout(() => setToast(''), 3500);
      });
      socket.on('connect_error', () => setToast('Live updates are unavailable on this backend'));
    });
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [user, queryClient]);

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data.data as DashboardStats,
    enabled: Boolean(user) && tab === 'overview',
  });
  const circulars = useQuery({
    queryKey: ['circulars'],
    queryFn: async () => (await api.get('/circulars')).data.data as Circular[],
    enabled: Boolean(user) && tab === 'notices',
  });
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data as Notification[],
    enabled: Boolean(user) && tab === 'notices' && hasPermission('notifications:read'),
  });
  const requests = useQuery({
    queryKey: ['workflow-requests'],
    queryFn: async () => (await api.get('/workflows/requests')).data.data as WorkflowRequest[],
    enabled: Boolean(user) && tab === 'requests',
  });

  const menuLabels = useMemo(
    () => (user?.menus || []).map((item: MenuItem) => item.label || item.title || item.name).filter(Boolean).slice(0, 5),
    [user],
  );

  async function refresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }

  if (!user) return null;
  const metrics = dashboard.data?.metrics || {};

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>AEC CAMPUSOS</Text>
          <Text style={styles.greeting}>Good day, {user.firstName}</Text>
          <Text style={styles.role}>{user.role} workspace</Text>
        </View>
        <Pressable onPress={() => setTab('profile')} style={styles.avatar}><Text style={styles.avatarText}>{user.firstName[0]}{user.lastName[0]}</Text></Pressable>
      </View>
      {!!toast && <View style={styles.liveToast}><View style={styles.liveDot} /><Text style={styles.liveText}>{toast}</Text></View>}
      <View style={styles.tabs}>
        {([['overview', 'Home'], ['notices', 'Notices'], ['requests', 'Requests'], ['profile', 'Profile']] as [Tab, string][]).map(([value, label]) => (
          <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'overview' && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#1C6FE8" />} contentContainerStyle={styles.content}>
          <View style={styles.hero}><Text style={styles.heroEyebrow}>YOUR INSTITUTION</Text><Text style={styles.heroTitle}>{String(metrics.collegeName || 'CampusOS')}</Text><Text style={styles.heroSub}>{String(metrics.collegeAddress || 'Connected to the existing institutional platform')}</Text></View>
          <Text style={styles.sectionTitle}>Live at a glance</Text>
          <View style={styles.metrics}>
            {([['Students', metrics.totalStudents], ['Faculty', metrics.totalFaculty], ['Departments', metrics.totalDepartments], ['Active users', metrics.totalActiveUsers]] as [string, unknown][]).map(([label, value]) => <View key={label} style={styles.metric}><Text style={styles.metricValue}>{typeof value === 'number' ? value.toLocaleString() : '—'}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}
          </View>
          <Text style={styles.sectionTitle}>Your access</Text>
          <View style={styles.accessCard}>{menuLabels.length ? menuLabels.map((label) => <View key={label} style={styles.accessRow}><View style={styles.accessIcon}><Text>✓</Text></View><Text style={styles.accessLabel}>{label}</Text></View>) : <Text style={styles.empty}>No modules are assigned to this account.</Text>}</View>
        </ScrollView>
      )}
      {tab === 'notices' && <NoticeView circulars={circulars.data || []} notifications={notifications.data || []} loading={circulars.isLoading || notifications.isLoading} error={circulars.error || notifications.error} />}
      {tab === 'requests' && <RequestView requests={requests.data || []} loading={requests.isLoading} error={requests.error} />}
      {tab === 'profile' && <ProfileView user={user} onBiometric={async () => setToast((await setBiometrics(true)) ? 'Biometric unlock enabled' : 'Biometrics are not available on this device')} onLogout={logout} onLogoutAll={logoutAll} />}
    </View>
  );
}

function NoticeView({ circulars, notifications, loading, error }: { circulars: Circular[]; notifications: Notification[]; loading: boolean; error: unknown }) {
  if (loading) return <Loading />;
  if (error) return <ErrorState message={getApiErrorMessage(error, 'Could not load notices')} />;
  return <FlatList data={circulars} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<Text style={styles.sectionTitle}>Circulars & notices</Text>} ListEmptyComponent={<Text style={styles.empty}>No Data Available</Text>} renderItem={({ item }) => <View style={styles.listCard}><View style={styles.badge}><Text style={styles.badgeText}>{item.priority || 'NORMAL'}</Text></View><Text style={styles.listTitle}>{item.title}</Text><Text style={styles.listBody}>{item.description || item.content || 'No additional details.'}</Text><Text style={styles.listMeta}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Unpublished'}</Text></View>} ListFooterComponent={notifications.length ? <><Text style={styles.sectionTitle}>System notifications</Text>{notifications.slice(0, 8).map((item) => <View style={styles.notification} key={item.id}><Text style={styles.notificationTitle}>{item.title}</Text><Text style={styles.listBody}>{item.content}</Text></View>)}</> : null} />;
}

function RequestView({ requests, loading, error }: { requests: WorkflowRequest[]; loading: boolean; error: unknown }) {
  if (loading) return <Loading />;
  if (error) return <ErrorState message={getApiErrorMessage(error, 'Could not load requests')} />;
  return <FlatList data={requests} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<Text style={styles.sectionTitle}>Leave & workflow requests</Text>} ListEmptyComponent={<Text style={styles.empty}>No Data Available</Text>} renderItem={({ item }) => <View style={styles.listCard}><View style={styles.requestTop}><Text style={styles.badgeText}>{item.type || 'REQUEST'}</Text><Text style={styles.status}>{item.status || 'PENDING'}</Text></View><Text style={styles.listTitle}>{item.title || 'Untitled request'}</Text><Text style={styles.listBody}>{item.reason || 'No reason provided.'}</Text></View>} />;
}

function ProfileView({ user, onBiometric, onLogout, onLogoutAll }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; onBiometric: () => void; onLogout: () => void; onLogoutAll: () => void }) {
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.sectionTitle}>Profile & security</Text><View style={styles.profileCard}><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{user.firstName[0]}{user.lastName[0]}</Text></View><Text style={styles.profileName}>{user.firstName} {user.lastName}</Text><Text style={styles.profileEmail}>{user.email}</Text><Text style={styles.profileRole}>{user.role}</Text></View><View style={styles.securityCard}><Text style={styles.cardHeading}>Session security</Text><Text style={styles.securityBody}>Your tokens are stored in the device’s secure keychain and refreshed through the existing CampusOS API.</Text><Pressable onPress={onBiometric} style={styles.secondaryButton}><Text style={styles.secondaryText}>Enable biometric unlock</Text></Pressable><Pressable onPress={onLogout} style={styles.secondaryButton}><Text style={styles.secondaryText}>Log out this device</Text></Pressable><Pressable onPress={onLogoutAll} style={[styles.secondaryButton, styles.dangerButton]}><Text style={styles.dangerText}>Log out all devices</Text></Pressable></View></ScrollView>;
}

function Loading() { return <View style={styles.centerState}><ActivityIndicator color="#1C6FE8" size="large" /><Text style={styles.empty}>Loading live data…</Text></View>; }
function ErrorState({ message }: { message: string }) { return <View style={styles.centerState}><Text style={styles.errorTitle}>Couldn’t load this module</Text><Text style={styles.empty}>{message}</Text></View>; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { backgroundColor: '#0B1020', paddingTop: 58, paddingHorizontal: 22, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: '#8DA7D7', letterSpacing: 2, fontSize: 10, fontWeight: '800' },
  greeting: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 5 },
  role: { color: '#AEBBD6', fontSize: 13, marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#9BD8FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#0B1020', fontWeight: '900' },
  liveToast: { backgroundColor: '#E8F5EE', padding: 11, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D9D63', marginRight: 8 },
  liveText: { color: '#267749', fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#E8ECF3' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1C6FE8' },
  tabText: { color: '#8993A8', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#1C6FE8' },
  content: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: '#1C6FE8', borderRadius: 22, padding: 22, marginBottom: 24 },
  heroEyebrow: { color: '#BDE8FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '800', marginTop: 7 },
  heroSub: { color: '#D8EEFF', fontSize: 12, lineHeight: 18, marginTop: 8 },
  sectionTitle: { color: '#172139', fontSize: 18, fontWeight: '800', marginBottom: 13, marginTop: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  metric: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 17, padding: 17, marginBottom: 10, borderWidth: 1, borderColor: '#E8ECF3' },
  metricValue: { color: '#172139', fontSize: 24, fontWeight: '800' },
  metricLabel: { color: '#78849B', fontSize: 12, marginTop: 4 },
  accessCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 8, borderWidth: 1, borderColor: '#E8ECF3' },
  accessRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  accessIcon: { width: 26, height: 26, backgroundColor: '#E8F5EE', borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  accessLabel: { color: '#303B54', fontSize: 14, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 50 },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17, marginBottom: 12, borderWidth: 1, borderColor: '#E8ECF3' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#EDF4FF', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 9 },
  badgeText: { color: '#2467C2', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  listTitle: { color: '#172139', fontSize: 16, fontWeight: '800', lineHeight: 21 },
  listBody: { color: '#69758C', fontSize: 13, lineHeight: 19, marginTop: 7 },
  listMeta: { color: '#9AA4B7', fontSize: 11, marginTop: 12 },
  notification: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#E8ECF3', marginBottom: 10 },
  notificationTitle: { color: '#172139', fontSize: 14, fontWeight: '800' },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  status: { color: '#B97919', fontSize: 10, fontWeight: '800' },
  empty: { color: '#8993A8', fontSize: 13, lineHeight: 20, textAlign: 'center', padding: 22 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { color: '#C23B52', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E8ECF3' },
  profileAvatar: { width: 74, height: 74, borderRadius: 25, backgroundColor: '#DDF1FF', justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: '#1C6FE8', fontSize: 23, fontWeight: '900' },
  profileName: { color: '#172139', fontSize: 21, fontWeight: '800', marginTop: 14 },
  profileEmail: { color: '#78849B', fontSize: 13, marginTop: 5 },
  profileRole: { color: '#1C6FE8', fontSize: 12, fontWeight: '800', marginTop: 10 },
  securityCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 14, borderWidth: 1, borderColor: '#E8ECF3' },
  cardHeading: { color: '#172139', fontSize: 16, fontWeight: '800' },
  securityBody: { color: '#69758C', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 11 },
  secondaryButton: { borderWidth: 1, borderColor: '#DCE3EF', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 9 },
  secondaryText: { color: '#2A5EAC', fontWeight: '800', fontSize: 13 },
  dangerButton: { borderColor: '#F2CFD6' },
  dangerText: { color: '#C23B52', fontWeight: '800', fontSize: 13 },
});