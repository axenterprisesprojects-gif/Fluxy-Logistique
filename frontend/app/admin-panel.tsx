import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: { 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280', 700: '#374151', 900: '#111827' },
  white: '#FFFFFF',
};

export default function AdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [commission, setCommission] = useState(15);
  const [newCommission, setNewCommission] = useState('15');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_session_token');
      if (token) {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          if (user.role === 'admin') {
            setSessionToken(token);
            setCurrentUser(user);
            setIsAuthenticated(true);
            loadData(token);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (token: string) => {
    try {
      // Load dashboard
      const dashRes = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dashRes.ok) setStats(await dashRes.json());

      // Load deliveries
      const delRes = await fetch(`${BACKEND_URL}/api/admin/deliveries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (delRes.ok) setDeliveries(await delRes.json());

      // Load drivers
      const drvRes = await fetch(`${BACKEND_URL}/api/admin/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (drvRes.ok) setDrivers(await drvRes.json());

      // Load pricing
      const prcRes = await fetch(`${BACKEND_URL}/api/admin/pricing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (prcRes.ok) {
        const data = await prcRes.json();
        setPricingRules(data.rules || []);
        setCommission(data.commission_percentage || 15);
        setNewCommission(String(data.commission_percentage || 15));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleLogin = async () => {
    await AsyncStorage.setItem('pending_admin_auth', 'true');
    const redirectUrl = Platform.OS === 'web' 
      ? `${window.location.origin}/admin-panel`
      : 'quickhaul://admin-panel';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // Handle callback in URL
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleCallback = async () => {
        const hash = window.location.hash;
        const search = window.location.search;
        let sessionId = null;
        
        if (hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0];
        } else if (search.includes('session_id=')) {
          sessionId = new URLSearchParams(search).get('session_id');
        }
        
        const isPending = await AsyncStorage.getItem('pending_admin_auth');
        
        if (sessionId && isPending) {
          try {
            const res = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId, role: 'admin' })
            });
            
            if (res.ok) {
              const data = await res.json();
              await AsyncStorage.setItem('admin_session_token', data.session_token);
              await AsyncStorage.removeItem('pending_admin_auth');
              setSessionToken(data.session_token);
              setCurrentUser(data.user);
              
              if (data.user.role === 'admin') {
                setIsAuthenticated(true);
                loadData(data.session_token);
                window.history.replaceState({}, '', '/admin-panel');
              } else {
                Alert.alert('Erreur', 'Accès réservé aux administrateurs');
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      };
      handleCallback();
    }
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
    setSessionToken(null);
    setCurrentUser(null);
  };

  const validateDriver = async (userId: string) => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/validate-driver/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        loadData(sessionToken);
        Alert.alert('Succès', 'Chauffeur validé');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateCommissionValue = async () => {
    if (!sessionToken) return;
    const value = parseFloat(newCommission);
    if (isNaN(value) || value < 0 || value > 100) {
      Alert.alert('Erreur', 'Valeur invalide (0-100)');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/commission?commission_percentage=${value}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        setCommission(value);
        Alert.alert('Succès', 'Commission mise à jour');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      'pending': 'En attente',
      'accepted': 'Acceptée',
      'pickup_confirmed': 'Récupérée',
      'delivered': 'Livrée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="cube" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.logoText}>QuickHaul</Text>
          </View>
          <Text style={styles.loginSubtitle}>Panneau d'administration</Text>
          
          <View style={styles.adminBadge}>
            <Ionicons name="settings" size={16} color={COLORS.warning} />
            <Text style={styles.adminBadgeText}>Administration</Text>
          </View>
          
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Text style={styles.googleBtnText}>Continuer avec Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backLink} onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={16} color={COLORS.gray[500]} />
            <Text style={styles.backLinkText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarLogo}>
          <Ionicons name="cube" size={24} color={COLORS.primary} />
          <Text style={styles.sidebarTitle}>QuickHaul</Text>
        </View>
        
        {['dashboard', 'deliveries', 'drivers', 'pricing'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.navItem, activeTab === tab && styles.navItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'dashboard' ? 'analytics' : tab === 'deliveries' ? 'cube' : tab === 'drivers' ? 'people' : 'pricetag'} 
              size={20} 
              color={activeTab === tab ? COLORS.primary : COLORS.gray[500]} 
            />
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
              {tab === 'dashboard' ? 'Tableau de bord' : tab === 'deliveries' ? 'Livraisons' : tab === 'drivers' ? 'Chauffeurs' : 'Tarification'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            {activeTab === 'dashboard' ? 'Tableau de bord' : activeTab === 'deliveries' ? 'Livraisons' : activeTab === 'drivers' ? 'Chauffeurs' : 'Tarification'}
          </Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'dashboard' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.statLabel}>Total livraisons</Text>
                <Text style={styles.statValue}>{stats?.deliveries?.total || 0}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
                <Text style={styles.statLabel}>En attente</Text>
                <Text style={styles.statValue}>{stats?.deliveries?.pending || 0}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
                <Text style={styles.statLabel}>Livrées</Text>
                <Text style={styles.statValue}>{stats?.deliveries?.completed || 0}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
                <Text style={styles.statLabel}>Chauffeurs</Text>
                <Text style={styles.statValue}>{stats?.drivers?.total || 0}</Text>
              </View>
            </View>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Revenus (Commissions)</Text>
              <Text style={styles.revenueValue}>{(stats?.revenue?.total_commission || 0).toLocaleString()} F</Text>
            </View>
          </View>
        )}

        {activeTab === 'deliveries' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Toutes les livraisons</Text>
            {deliveries.map((d) => (
              <View key={d.delivery_id} style={styles.listItem}>
                <View style={styles.listItemMain}>
                  <Text style={styles.listItemTitle}>{d.item_type}</Text>
                  <Text style={styles.listItemSub}>{d.business_name} → {d.destination_area}</Text>
                </View>
                <View>
                  <Text style={styles.listItemPrice}>{d.total_price.toLocaleString()} F</Text>
                  <View style={[styles.statusBadge, { backgroundColor: d.status === 'delivered' ? '#D1FAE5' : d.status === 'pending' ? '#FEF3C7' : '#DBEAFE' }]}>
                    <Text style={[styles.statusText, { color: d.status === 'delivered' ? COLORS.secondary : d.status === 'pending' ? COLORS.warning : COLORS.primary }]}>
                      {getStatusLabel(d.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'drivers' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chauffeurs</Text>
            {drivers.map((d) => (
              <View key={d.user_id} style={styles.listItem}>
                <View style={styles.listItemMain}>
                  <Text style={styles.listItemTitle}>{d.name}</Text>
                  <Text style={styles.listItemSub}>{d.phone} • {d.vehicle_brand || 'N/A'} {d.vehicle_type || ''}</Text>
                </View>
                <View style={styles.listItemActions}>
                  {d.is_validated ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.statusText, { color: COLORS.secondary }]}>Validé</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.validateBtn}
                      onPress={() => validateDriver(d.user_id)}
                    >
                      <Text style={styles.validateBtnText}>Valider</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'pricing' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Commission plateforme</Text>
              <Text style={styles.commissionValue}>{commission}%</Text>
              <View style={styles.commissionForm}>
                <TextInput
                  style={styles.input}
                  value={newCommission}
                  onChangeText={setNewCommission}
                  keyboardType="numeric"
                  placeholder="Nouvelle commission"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={updateCommissionValue}>
                  <Text style={styles.saveBtnText}>Mettre à jour</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tranches de distance</Text>
              {pricingRules.map((r) => (
                <View key={r.rule_id} style={styles.pricingRule}>
                  <Text style={styles.pricingDistance}>{r.min_distance} - {r.max_distance} km</Text>
                  <Text style={styles.pricingPrice}>{r.price.toLocaleString()} F</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray[100] },
  loadingText: { fontSize: 16, color: COLORS.gray[500] },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray[100], padding: 20 },
  loginCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '700', color: COLORS.primary },
  loginSubtitle: { fontSize: 14, color: COLORS.gray[500], marginBottom: 24 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
  adminBadgeText: { fontSize: 13, fontWeight: '500', color: COLORS.warning },
  googleBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16 },
  googleBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { fontSize: 14, color: COLORS.gray[500] },
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.gray[100] },
  sidebar: { width: 240, backgroundColor: COLORS.white, padding: 20, borderRightWidth: 1, borderRightColor: COLORS.gray[200] },
  sidebarLogo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  sidebarTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  navItemActive: { backgroundColor: '#EEF2FF' },
  navText: { fontSize: 14, color: COLORS.gray[500], fontWeight: '500' },
  navTextActive: { color: COLORS.primary },
  mainContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.gray[900] },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  logoutBtnText: { color: COLORS.error, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 150, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  statLabel: { fontSize: 13, color: COLORS.gray[500], marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '700', color: COLORS.gray[900] },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900], marginBottom: 16 },
  revenueValue: { fontSize: 32, fontWeight: '700', color: COLORS.secondary },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  listItemMain: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray[900] },
  listItemSub: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  listItemPrice: { fontSize: 15, fontWeight: '600', color: COLORS.primary, textAlign: 'right' },
  listItemActions: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  validateBtn: { backgroundColor: COLORS.secondary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  validateBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '500' },
  commissionValue: { fontSize: 48, fontWeight: '700', color: COLORS.warning, marginBottom: 16 },
  commissionForm: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.gray[200], borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  saveBtnText: { color: COLORS.white, fontWeight: '500' },
  pricingRule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.gray[100], padding: 16, borderRadius: 10, marginBottom: 8 },
  pricingDistance: { fontSize: 15, fontWeight: '600', color: COLORS.gray[700] },
  pricingPrice: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
});
