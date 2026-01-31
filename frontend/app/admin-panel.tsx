import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#7C3AED',
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
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [commission, setCommission] = useState(15);
  const [newCommission, setNewCommission] = useState('15');
  
  // Business detail modal
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [businessDetail, setBusinessDetail] = useState<any>(null);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [loadingBusinessDetail, setLoadingBusinessDetail] = useState(false);
  
  // Delivery detail modal
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);

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
      const [dashRes, delRes, drvRes, bizRes, prcRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/deliveries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/drivers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/businesses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/pricing`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      
      if (dashRes.ok) setStats(await dashRes.json());
      if (delRes.ok) setDeliveries(await delRes.json());
      if (drvRes.ok) setDrivers(await drvRes.json());
      if (bizRes.ok) setBusinesses(await bizRes.json());
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

  const loadBusinessDetail = async (businessId: string) => {
    if (!sessionToken) return;
    try {
      setLoadingBusinessDetail(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/businesses/${businessId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBusinessDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBusinessDetail(false);
    }
  };

  const openBusinessDetail = (business: any) => {
    setSelectedBusiness(business);
    setBusinessModalVisible(true);
    loadBusinessDetail(business.user_id);
  };

  const openDeliveryDetail = (delivery: any) => {
    setSelectedDelivery(delivery);
    setDeliveryModalVisible(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: any = { 
      'pending': 'En attente', 
      'accepted': 'Acceptée', 
      'pickup_confirmed': 'Récupérée', 
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': { bg: '#FEF3C7', text: COLORS.warning },
      'accepted': { bg: '#DBEAFE', text: COLORS.primary },
      'pickup_confirmed': { bg: '#E0E7FF', text: COLORS.purple },
      'delivered': { bg: '#D1FAE5', text: COLORS.secondary },
      'cancelled': { bg: '#FEE2E2', text: COLORS.error }
    };
    return colors[status] || { bg: COLORS.gray[100], text: COLORS.gray[500] };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
            <Text style={styles.logoText}>Fluxy Logistique</Text>
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
          <Text style={styles.sidebarTitle}>Fluxy Logistique</Text>
        </View>
        
        {[
          { id: 'dashboard', icon: 'analytics', label: 'Tableau de bord' },
          { id: 'businesses', icon: 'storefront', label: 'Boutiques' },
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
             activeTab === 'businesses' ? 'Boutiques partenaires' :
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
              <View style={[styles.statCard, { borderLeftColor: COLORS.purple }]}>
                <Text style={styles.statLabel}>Boutiques</Text>
                <Text style={styles.statValue}>{businesses.length}</Text>
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

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          <View>
            {/* Business Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.purple }]}>
                <Text style={styles.statLabel}>Total boutiques</Text>
                <Text style={styles.statValue}>{businesses.length}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
                <Text style={styles.statLabel}>Livraisons commandées</Text>
                <Text style={styles.statValue}>
                  {businesses.reduce((sum, b) => sum + (b.stats?.total_deliveries || 0), 0)}
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.statLabel}>Volume total</Text>
                <Text style={styles.statValue}>
                  {businesses.reduce((sum, b) => sum + (b.stats?.total_spent || 0), 0).toLocaleString()} F
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Liste des boutiques ({businesses.length})</Text>
              {businesses.length === 0 ? (
                <Text style={styles.emptyText}>Aucune boutique enregistrée</Text>
              ) : (
                businesses.map((b) => (
                  <TouchableOpacity 
                    key={b.user_id} 
                    style={styles.businessItem}
                    onPress={() => openBusinessDetail(b)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.businessIcon}>
                      <Ionicons name="storefront" size={24} color={COLORS.purple} />
                    </View>
                    <View style={styles.businessInfo}>
                      <Text style={styles.businessName}>{b.business_name || b.name}</Text>
                      <Text style={styles.businessEmail}>{b.email}</Text>
                      <Text style={styles.businessAddress}>{b.business_address || 'Adresse non renseignée'}</Text>
                    </View>
                    <View style={styles.businessStats}>
                      <View style={styles.businessStatItem}>
                        <Text style={styles.businessStatValue}>{b.stats?.total_deliveries || 0}</Text>
                        <Text style={styles.businessStatLabel}>Commandes</Text>
                      </View>
                      <View style={styles.businessStatItem}>
                        <Text style={styles.businessStatValue}>{b.stats?.completed || 0}</Text>
                        <Text style={styles.businessStatLabel}>Livrées</Text>
                      </View>
                      <View style={styles.businessStatItem}>
                        <Text style={[styles.businessStatValue, { color: COLORS.secondary }]}>
                          {(b.stats?.total_spent || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.businessStatLabel}>F dépensés</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                ))
              )}
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
                <TouchableOpacity 
                  key={d.delivery_id} 
                  style={styles.listItem}
                  onPress={() => openDeliveryDetail(d)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listItemMain}>
                    <Text style={styles.listItemTitle}>{d.item_description || d.item_type}</Text>
                    <Text style={styles.listItemSub}>{d.business_name} → {d.destination_area}</Text>
                    <Text style={styles.listItemDate}>{formatDate(d.created_at)}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemPrice}>{d.total_price?.toLocaleString()} F</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(d.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(d.status).text }]}>
                        {getStatusLabel(d.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
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

      {/* Business Detail Modal */}
      <Modal
        visible={businessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBusinessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la boutique</Text>
              <TouchableOpacity onPress={() => setBusinessModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            {loadingBusinessDetail ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : businessDetail ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Business Info */}
                <View style={styles.modalBusinessHeader}>
                  <View style={styles.modalBusinessIcon}>
                    <Ionicons name="storefront" size={32} color={COLORS.white} />
                  </View>
                  <View style={styles.modalBusinessInfo}>
                    <Text style={styles.modalBusinessName}>
                      {businessDetail.business?.business_name || businessDetail.business?.name}
                    </Text>
                    <Text style={styles.modalBusinessEmail}>{businessDetail.business?.email}</Text>
                    <Text style={styles.modalBusinessAddress}>
                      {businessDetail.business?.business_address || 'Adresse non renseignée'}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>{businessDetail.stats?.total_deliveries || 0}</Text>
                    <Text style={styles.modalStatLabel}>Total commandes</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: COLORS.warning }]}>
                      {businessDetail.stats?.pending || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>En attente</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: COLORS.primary }]}>
                      {businessDetail.stats?.in_progress || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>En cours</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: COLORS.secondary }]}>
                      {businessDetail.stats?.completed || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>Livrées</Text>
                  </View>
                </View>

                {/* Total Spent */}
                <View style={styles.modalTotalSpent}>
                  <Text style={styles.modalTotalSpentLabel}>Total dépensé</Text>
                  <Text style={styles.modalTotalSpentValue}>
                    {(businessDetail.stats?.total_spent || 0).toLocaleString()} F
                  </Text>
                </View>

                {/* Deliveries List */}
                <Text style={styles.modalSectionTitle}>
                  Historique des livraisons ({businessDetail.deliveries?.length || 0})
                </Text>
                
                {businessDetail.deliveries?.length === 0 ? (
                  <Text style={styles.emptyText}>Aucune livraison</Text>
                ) : (
                  businessDetail.deliveries?.map((d: any) => (
                    <TouchableOpacity 
                      key={d.delivery_id} 
                      style={styles.modalDeliveryItem}
                      onPress={() => {
                        setBusinessModalVisible(false);
                        setTimeout(() => openDeliveryDetail(d), 300);
                      }}
                    >
                      <View style={styles.modalDeliveryMain}>
                        <Text style={styles.modalDeliveryTitle}>
                          {d.item_description || d.item_type}
                        </Text>
                        <Text style={styles.modalDeliverySub}>
                          {d.customer_name} • {d.destination_area}
                        </Text>
                        <Text style={styles.modalDeliveryDate}>{formatDate(d.created_at)}</Text>
                      </View>
                      <View style={styles.modalDeliveryRight}>
                        <Text style={styles.modalDeliveryPrice}>{d.total_price?.toLocaleString()} F</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(d.status).bg }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(d.status).text }]}>
                            {getStatusLabel(d.status)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Delivery Detail Modal */}
      <Modal
        visible={deliveryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeliveryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la livraison</Text>
              <TouchableOpacity onPress={() => setDeliveryModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            {selectedDelivery && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View style={[styles.deliveryStatusBanner, { backgroundColor: getStatusColor(selectedDelivery.status).bg }]}>
                  <Text style={[styles.deliveryStatusText, { color: getStatusColor(selectedDelivery.status).text }]}>
                    {getStatusLabel(selectedDelivery.status)}
                  </Text>
                </View>

                {/* Price */}
                <View style={styles.deliveryPriceSection}>
                  <Text style={styles.deliveryPriceLabel}>Prix total</Text>
                  <Text style={styles.deliveryPriceValue}>
                    {selectedDelivery.total_price?.toLocaleString()} F
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.deliveryDetailSection}>
                  <View style={styles.deliveryDetailRow}>
                    <Ionicons name="storefront" size={18} color={COLORS.purple} />
                    <View style={styles.deliveryDetailContent}>
                      <Text style={styles.deliveryDetailLabel}>Boutique</Text>
                      <Text style={styles.deliveryDetailValue}>{selectedDelivery.business_name}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.deliveryDetailSection}>
                  <View style={styles.deliveryDetailRow}>
                    <Ionicons name="person" size={18} color={COLORS.gray[500]} />
                    <View style={styles.deliveryDetailContent}>
                      <Text style={styles.deliveryDetailLabel}>Client</Text>
                      <Text style={styles.deliveryDetailValue}>{selectedDelivery.customer_name}</Text>
                      {selectedDelivery.customer_phone && (
                        <Text style={styles.deliveryDetailSub}>{selectedDelivery.customer_phone}</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.deliveryDetailSection}>
                  <View style={styles.deliveryDetailRow}>
                    <Ionicons name="cube" size={18} color={COLORS.gray[500]} />
                    <View style={styles.deliveryDetailContent}>
                      <Text style={styles.deliveryDetailLabel}>Articles</Text>
                      <Text style={styles.deliveryDetailValue}>
                        {selectedDelivery.item_description || selectedDelivery.item_type}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.deliveryDetailSection}>
                  <View style={styles.deliveryDetailRow}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                    <View style={styles.deliveryDetailContent}>
                      <Text style={styles.deliveryDetailLabel}>Récupération</Text>
                      <Text style={styles.deliveryDetailValue}>{selectedDelivery.pickup_address}</Text>
                    </View>
                  </View>
                  <View style={[styles.deliveryDetailRow, { marginTop: 12 }]}>
                    <Ionicons name="flag" size={18} color={COLORS.secondary} />
                    <View style={styles.deliveryDetailContent}>
                      <Text style={styles.deliveryDetailLabel}>Livraison</Text>
                      <Text style={styles.deliveryDetailValue}>{selectedDelivery.destination_area}</Text>
                    </View>
                  </View>
                </View>

                {selectedDelivery.driver_name && (
                  <View style={styles.deliveryDetailSection}>
                    <View style={styles.deliveryDetailRow}>
                      <Ionicons name="car" size={18} color={COLORS.gray[500]} />
                      <View style={styles.deliveryDetailContent}>
                        <Text style={styles.deliveryDetailLabel}>Chauffeur</Text>
                        <Text style={styles.deliveryDetailValue}>{selectedDelivery.driver_name}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Timestamps */}
                <View style={styles.deliveryDetailSection}>
                  <Text style={styles.deliveryTimestampTitle}>Chronologie</Text>
                  <View style={styles.deliveryTimestampRow}>
                    <View style={[styles.deliveryTimestampDot, { backgroundColor: COLORS.gray[400] }]} />
                    <Text style={styles.deliveryTimestampLabel}>Créée:</Text>
                    <Text style={styles.deliveryTimestampValue}>{formatDate(selectedDelivery.created_at)}</Text>
                  </View>
                  {selectedDelivery.accepted_at && (
                    <View style={styles.deliveryTimestampRow}>
                      <View style={[styles.deliveryTimestampDot, { backgroundColor: COLORS.primary }]} />
                      <Text style={styles.deliveryTimestampLabel}>Acceptée:</Text>
                      <Text style={styles.deliveryTimestampValue}>{formatDate(selectedDelivery.accepted_at)}</Text>
                    </View>
                  )}
                  {selectedDelivery.pickup_at && (
                    <View style={styles.deliveryTimestampRow}>
                      <View style={[styles.deliveryTimestampDot, { backgroundColor: COLORS.purple }]} />
                      <Text style={styles.deliveryTimestampLabel}>Récupérée:</Text>
                      <Text style={styles.deliveryTimestampValue}>{formatDate(selectedDelivery.pickup_at)}</Text>
                    </View>
                  )}
                  {selectedDelivery.delivered_at && (
                    <View style={styles.deliveryTimestampRow}>
                      <View style={[styles.deliveryTimestampDot, { backgroundColor: COLORS.secondary }]} />
                      <Text style={styles.deliveryTimestampLabel}>Livrée:</Text>
                      <Text style={styles.deliveryTimestampValue}>{formatDate(selectedDelivery.delivered_at)}</Text>
                    </View>
                  )}
                </View>

                {/* Financial Breakdown */}
                <View style={styles.deliveryFinancialSection}>
                  <Text style={styles.deliveryFinancialTitle}>Détail financier</Text>
                  <View style={styles.deliveryFinancialRow}>
                    <Text style={styles.deliveryFinancialLabel}>Prix total</Text>
                    <Text style={styles.deliveryFinancialValue}>{selectedDelivery.total_price?.toLocaleString()} F</Text>
                  </View>
                  <View style={styles.deliveryFinancialRow}>
                    <Text style={styles.deliveryFinancialLabel}>Commission ({selectedDelivery.commission_percentage || 15}%)</Text>
                    <Text style={styles.deliveryFinancialValue}>{selectedDelivery.commission?.toLocaleString()} F</Text>
                  </View>
                  <View style={styles.deliveryFinancialRow}>
                    <Text style={styles.deliveryFinancialLabel}>Gains chauffeur</Text>
                    <Text style={[styles.deliveryFinancialValue, { color: COLORS.secondary }]}>
                      {selectedDelivery.driver_earnings?.toLocaleString()} F
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setDeliveryModalVisible(false)}
                >
                  <Text style={styles.modalCloseBtnText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  listItemDate: { fontSize: 12, color: COLORS.gray[400], marginTop: 4 },
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
  
  // Business styles
  businessItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  businessIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  businessEmail: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  businessAddress: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  businessStats: { flexDirection: 'row', gap: 16, marginRight: 12 },
  businessStatItem: { alignItems: 'center' },
  businessStatValue: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  businessStatLabel: { fontSize: 10, color: COLORS.gray[500], marginTop: 2 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray[900] },
  modalLoading: { padding: 40, alignItems: 'center' },
  modalBusinessHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalBusinessIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  modalBusinessInfo: { flex: 1 },
  modalBusinessName: { fontSize: 20, fontWeight: '700', color: COLORS.gray[900] },
  modalBusinessEmail: { fontSize: 14, color: COLORS.gray[500], marginTop: 4 },
  modalBusinessAddress: { fontSize: 13, color: COLORS.gray[400], marginTop: 2 },
  modalStatsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modalStatCard: { flex: 1, backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 16, alignItems: 'center' },
  modalStatValue: { fontSize: 24, fontWeight: '700', color: COLORS.gray[900] },
  modalStatLabel: { fontSize: 11, color: COLORS.gray[500], marginTop: 4, textAlign: 'center' },
  modalTotalSpent: { backgroundColor: '#ECFDF5', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  modalTotalSpentLabel: { fontSize: 14, color: COLORS.gray[600] },
  modalTotalSpentValue: { fontSize: 32, fontWeight: '700', color: COLORS.secondary, marginTop: 4 },
  modalSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[800], marginBottom: 12 },
  modalDeliveryItem: { flexDirection: 'row', backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 14, marginBottom: 10 },
  modalDeliveryMain: { flex: 1 },
  modalDeliveryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  modalDeliverySub: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  modalDeliveryDate: { fontSize: 11, color: COLORS.gray[400], marginTop: 4 },
  modalDeliveryRight: { alignItems: 'flex-end', justifyContent: 'center' },
  modalDeliveryPrice: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  
  // Delivery detail modal
  deliveryStatusBanner: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  deliveryStatusText: { fontSize: 16, fontWeight: '600' },
  deliveryPriceSection: { backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  deliveryPriceLabel: { fontSize: 14, color: COLORS.gray[500] },
  deliveryPriceValue: { fontSize: 32, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  deliveryDetailSection: { backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 16, marginBottom: 12 },
  deliveryDetailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  deliveryDetailContent: { marginLeft: 12, flex: 1 },
  deliveryDetailLabel: { fontSize: 11, color: COLORS.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  deliveryDetailValue: { fontSize: 14, fontWeight: '600', color: COLORS.gray[800], marginTop: 2 },
  deliveryDetailSub: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  deliveryTimestampTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700], marginBottom: 12 },
  deliveryTimestampRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  deliveryTimestampDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  deliveryTimestampLabel: { fontSize: 12, color: COLORS.gray[500], width: 80 },
  deliveryTimestampValue: { fontSize: 12, color: COLORS.gray[700], flex: 1 },
  deliveryFinancialSection: { backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 16, marginBottom: 16 },
  deliveryFinancialTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700], marginBottom: 12 },
  deliveryFinancialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  deliveryFinancialLabel: { fontSize: 13, color: COLORS.gray[600] },
  deliveryFinancialValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800] },
  modalCloseBtn: { backgroundColor: COLORS.gray[100], borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  modalCloseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.gray[700] },
});
