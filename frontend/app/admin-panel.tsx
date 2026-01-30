import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 400: '#9CA3AF', 500: '#6B7280', 700: '#374151', 900: '#111827' },
  white: '#FFFFFF',
};

export default function AdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setLoginLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Erreur de connexion');
      }
      
      await AsyncStorage.setItem('admin_session_token', data.session_token);
      setSessionToken(data.session_token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      loadData(data.session_token);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur de connexion');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadData = async (token: string) => {
    try {
      const [dashRes, delRes, drvRes, prcRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/deliveries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/drivers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/pricing`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      
      if (dashRes.ok) setStats(await dashRes.json());
      if (delRes.ok) setDeliveries(await delRes.json());
      if (drvRes.ok) setDrivers(await drvRes.json());
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
    setSessionToken(null);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
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
    const labels: any = { 'pending': 'En attente', 'accepted': 'Acceptée', 'pickup_confirmed': 'Récupérée', 'delivered': 'Livrée' };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // LOGIN SCREEN
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
            <Ionicons name="shield-checkmark" size={16} color={COLORS.warning} />
            <Text style={styles.adminBadgeText}>Accès administrateur</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@quickhaul.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.loginBtn, loginLoading && styles.loginBtnDisabled]} 
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backLink} onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={16} color={COLORS.gray[500]} />
            <Text style={styles.backLinkText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // DASHBOARD
  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarLogo}>
          <Ionicons name="cube" size={24} color={COLORS.primary} />
          <Text style={styles.sidebarTitle}>QuickHaul</Text>
        </View>
        
        {[
          { id: 'dashboard', icon: 'analytics', label: 'Tableau de bord' },
          { id: 'deliveries', icon: 'cube', label: 'Livraisons' },
          { id: 'drivers', icon: 'people', label: 'Chauffeurs' },
          { id: 'pricing', icon: 'pricetag', label: 'Tarification' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navItem, activeTab === tab.id && styles.navItemActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? COLORS.primary : COLORS.gray[500]} 
            />
            <Text style={[styles.navText, activeTab === tab.id && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            {activeTab === 'dashboard' ? 'Tableau de bord' : 
             activeTab === 'deliveries' ? 'Livraisons' : 
             activeTab === 'drivers' ? 'Chauffeurs' : 'Tarification'}
          </Text>
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{currentUser?.name}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Tab */}
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

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Toutes les livraisons ({deliveries.length})</Text>
            {deliveries.length === 0 ? (
              <Text style={styles.emptyText}>Aucune livraison</Text>
            ) : (
              deliveries.map((d) => (
                <View key={d.delivery_id} style={styles.listItem}>
                  <View style={styles.listItemMain}>
                    <Text style={styles.listItemTitle}>{d.item_type}</Text>
                    <Text style={styles.listItemSub}>{d.business_name} → {d.destination_area}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemPrice}>{d.total_price.toLocaleString()} F</Text>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: d.status === 'delivered' ? '#D1FAE5' : 
                                       d.status === 'pending' ? '#FEF3C7' : '#DBEAFE' 
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: d.status === 'delivered' ? COLORS.secondary : 
                               d.status === 'pending' ? COLORS.warning : COLORS.primary 
                      }]}>
                        {getStatusLabel(d.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chauffeurs ({drivers.length})</Text>
            {drivers.length === 0 ? (
              <Text style={styles.emptyText}>Aucun chauffeur</Text>
            ) : (
              drivers.map((d) => (
                <View key={d.user_id} style={styles.listItem}>
                  <View style={styles.listItemMain}>
                    <Text style={styles.listItemTitle}>{d.name}</Text>
                    <Text style={styles.listItemSub}>{d.phone} • {d.vehicle_brand || 'N/A'} {d.vehicle_type || ''}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    {d.is_validated ? (
                      <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[styles.statusText, { color: COLORS.secondary }]}>Validé</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.validateBtn} onPress={() => validateDriver(d.user_id)}>
                        <Text style={styles.validateBtnText}>Valider</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Commission plateforme</Text>
              <Text style={styles.commissionValue}>{commission}%</Text>
              <View style={styles.commissionForm}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newCommission}
                  onChangeText={setNewCommission}
                  keyboardType="numeric"
                  placeholder="15"
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
  loadingText: { fontSize: 16, color: COLORS.gray[500], marginTop: 12 },
  
  // Login styles
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray[100], padding: 20 },
  loginCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '700', color: COLORS.primary },
  loginSubtitle: { fontSize: 14, color: COLORS.gray[500], marginBottom: 20 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  adminBadgeText: { fontSize: 13, fontWeight: '600', color: COLORS.warning },
  inputContainer: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 6 },
  input: { backgroundColor: COLORS.gray[50], borderWidth: 1, borderColor: COLORS.gray[200], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  loginBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { fontSize: 14, color: COLORS.gray[500] },
  
  // Dashboard styles
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.gray[100] },
  sidebar: { width: 220, backgroundColor: COLORS.white, padding: 20, borderRightWidth: 1, borderRightColor: COLORS.gray[200] },
  sidebarLogo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  sidebarTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  navItemActive: { backgroundColor: '#EEF2FF' },
  navText: { fontSize: 14, color: COLORS.gray[500], fontWeight: '500' },
  navTextActive: { color: COLORS.primary, fontWeight: '600' },
  mainContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: COLORS.gray[900] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  userName: { fontSize: 14, color: COLORS.gray[600] },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  logoutBtnText: { color: COLORS.error, fontWeight: '500', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 140, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  statLabel: { fontSize: 13, color: COLORS.gray[500], marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '700', color: COLORS.gray[900] },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.gray[900], marginBottom: 16 },
  revenueValue: { fontSize: 32, fontWeight: '700', color: COLORS.secondary },
  emptyText: { fontSize: 14, color: COLORS.gray[400], fontStyle: 'italic' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  listItemMain: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray[900] },
  listItemSub: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  listItemRight: { alignItems: 'flex-end' },
  listItemPrice: { fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  validateBtn: { backgroundColor: COLORS.secondary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  validateBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  commissionValue: { fontSize: 48, fontWeight: '700', color: COLORS.warning, marginBottom: 16 },
  commissionForm: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  saveBtnText: { color: COLORS.white, fontWeight: '600' },
  pricingRule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.gray[50], padding: 16, borderRadius: 10, marginBottom: 8 },
  pricingDistance: { fontSize: 15, fontWeight: '600', color: COLORS.gray[700] },
  pricingPrice: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
});
