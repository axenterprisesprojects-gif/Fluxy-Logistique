import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import SwipeToAccept from '../../src/components/SwipeToAccept';
import { COLORS, SHADOWS } from '../../src/constants/theme';

const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'available', label: 'Disponibles' },
  { id: 'mine', label: 'Mes courses' },
];

export default function DriverHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAvailableJobs, getDriverJobs, acceptJob } = useApi();
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('available');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [available, mine] = await Promise.all([
        getAvailableJobs(),
        getDriverJobs()
      ]);
      // Sort by creation date (most recent first)
      setAvailableJobs(available.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setMyJobs(mine.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleAcceptJob = async (deliveryId: string) => {
    if (!user?.is_validated) {
      if (Platform.OS === 'web') {
        window.alert('Votre profil doit être validé par un administrateur avant de pouvoir accepter des missions.');
      }
      return;
    }

    try {
      setAcceptingId(deliveryId);
      await acceptJob(deliveryId);
      if (Platform.OS === 'web') {
        window.alert('Mission acceptée !');
      }
      await loadData();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible d\'accepter la mission'));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter jobs based on selected filter
  const getFilteredJobs = () => {
    if (selectedFilter === 'available') {
      return availableJobs;
    } else if (selectedFilter === 'mine') {
      return myJobs;
    }
    // 'all' - combine both, available first
    return [...availableJobs, ...myJobs];
  };

  const filteredJobs = getFilteredJobs();
  const activeJobs = myJobs.filter(j => ['accepted', 'pickup_confirmed'].includes(j.status));
  const completedJobs = myJobs.filter(j => j.status === 'delivered');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.driver_earnings, 0);

  const needsProfileSetup = !user?.vehicle_type || !user?.vehicle_plate;
  const isValidated = user?.is_validated;

  const renderMissionItem = ({ item }: { item: any }) => {
    const isMyJob = myJobs.some(j => j.delivery_id === item.delivery_id);
    const isAvailable = availableJobs.some(j => j.delivery_id === item.delivery_id);
    
    return (
      <Card style={styles.missionCard}>
        {/* Header: Business Name + Price */}
        <View style={styles.missionHeader}>
          <View style={styles.businessRow}>
            <Ionicons name="business" size={18} color={COLORS.primary} />
            <Text style={styles.businessName}>{item.business_name}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceValue}>{item.total_price?.toLocaleString()} F</Text>
          </View>
        </View>

        {/* Items to transport */}
        {(item.item_description || item.item_type) && (
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Ionicons name="cube" size={16} color={COLORS.gray[500]} />
              <Text style={styles.itemsLabel}>À transporter</Text>
            </View>
            <Text style={styles.itemsText}>{item.item_description || item.item_type}</Text>
          </View>
        )}

        {/* Route: Pickup → Delivery */}
        <View style={styles.routeSection}>
          {/* Pickup */}
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <View style={[styles.routeDot, styles.routeDotPickup]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Récupération</Text>
              <Text style={styles.routeAddress}>{item.pickup_address || 'Adresse de l\'entreprise'}</Text>
            </View>
          </View>

          {/* Line connecting */}
          <View style={styles.routeLine} />

          {/* Delivery */}
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <View style={[styles.routeDot, styles.routeDotDelivery]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Livraison</Text>
              <Text style={styles.routeAddress}>{item.destination_area}</Text>
            </View>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.distanceRow}>
          <Ionicons name="navigate" size={14} color={COLORS.gray[400]} />
          <Text style={styles.distanceText}>{item.distance_km} km</Text>
        </View>

        {/* Status for my jobs */}
        {isMyJob && (
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, 
              item.status === 'delivered' && styles.statusDelivered,
              item.status === 'accepted' && styles.statusAccepted,
              item.status === 'pickup_confirmed' && styles.statusPickup
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'accepted' && 'En route vers récupération'}
                {item.status === 'pickup_confirmed' && 'En cours de livraison'}
                {item.status === 'delivered' && 'Livrée'}
              </Text>
            </View>
            <Text style={styles.earningsText}>Gain: {item.driver_earnings?.toLocaleString()} F</Text>
          </View>
        )}

        {/* Swipe to accept for available jobs */}
        {isAvailable && (
          <View style={styles.swipeContainer}>
            <SwipeToAccept
              onAccept={() => handleAcceptJob(item.delivery_id)}
              disabled={!isValidated}
              loading={acceptingId === item.delivery_id}
            />
          </View>
        )}
      </Card>
    );
  };

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.name || 'Chauffeur'}</Text>
        </View>
        <View style={styles.logoContainer}>
          <Ionicons name="car" size={32} color={COLORS.secondary} />
        </View>
      </View>

      {/* Alerts */}
      {!isValidated && (
        <View style={styles.alertCard}>
          <Ionicons name="warning" size={24} color={COLORS.warning} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Profil en attente de validation</Text>
            <Text style={styles.alertText}>
              {needsProfileSetup
                ? "Complétez votre profil pour être validé"
                : "Votre profil est en cours d'examen par l'admin"}
            </Text>
          </View>
        </View>
      )}

      {needsProfileSetup && (
        <TouchableOpacity
          style={styles.setupCard}
          onPress={() => router.push('/(driver)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.setupIcon}>
            <Ionicons name="person-add" size={28} color={COLORS.white} />
          </View>
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>Compléter le profil</Text>
            <Text style={styles.setupText}>Ajoutez vos informations véhicule</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{availableJobs.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, styles.earningsCard]}>
          <Text style={[styles.statNumber, styles.earningsNumber]}>
            {totalEarnings.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Gains (F)</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterTab, selectedFilter === filter.id && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {selectedFilter === 'available' && `${availableJobs.length} mission(s) disponible(s)`}
        {selectedFilter === 'mine' && `${myJobs.length} course(s)`}
        {selectedFilter === 'all' && `${filteredJobs.length} mission(s)`}
      </Text>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color={COLORS.gray[300]} />
      <Text style={styles.emptyText}>
        {selectedFilter === 'available' && 'Aucune mission disponible'}
        {selectedFilter === 'mine' && 'Aucune course en cours'}
        {selectedFilter === 'all' && 'Aucune mission'}
      </Text>
      <Text style={styles.emptySubtext}>Tirez vers le bas pour actualiser</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredJobs}
        renderItem={renderMissionItem}
        keyExtractor={(item) => item.delivery_id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
  },
  alertText: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  setupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  setupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  setupText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  earningsCard: {
    backgroundColor: '#ECFDF5',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  earningsNumber: {
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: COLORS.white,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  filterTextActive: {
    color: COLORS.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  missionCard: {
    marginBottom: 16,
    padding: 16,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  priceBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemsSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  itemsLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  itemsText: {
    fontSize: 14,
    color: COLORS.gray[800],
    lineHeight: 20,
  },
  routeSection: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeDotPickup: {
    backgroundColor: COLORS.primary,
  },
  routeDotDelivery: {
    backgroundColor: COLORS.secondary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[200],
    marginLeft: 11,
  },
  routeContent: {
    flex: 1,
    paddingLeft: 8,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  statusBadge: {
    backgroundColor: COLORS.info + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAccepted: {
    backgroundColor: COLORS.info + '15',
  },
  statusPickup: {
    backgroundColor: COLORS.warning + '15',
  },
  statusDelivered: {
    backgroundColor: COLORS.secondary + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  swipeContainer: {
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginTop: 4,
  },
});
