import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import StatusBadge from '../../src/components/StatusBadge';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAdminDashboard, getAdminDeliveries } = useApi();
  
  const [stats, setStats] = useState<any>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [dashboardData, deliveries] = await Promise.all([
        getAdminDashboard(),
        getAdminDeliveries()
      ]);
      setStats(dashboardData);
      setRecentDeliveries(deliveries.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  if (loading) {
    return <LoadingScreen message="Chargement du tableau de bord..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Administration</Text>
          <Text style={styles.userName}>QuickHaul</Text>
        </View>
        <View style={styles.logoContainer}>
          <Ionicons name="settings" size={32} color={COLORS.warning} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="cube" size={28} color={COLORS.white} />
            <Text style={styles.statNumber}>{stats?.deliveries?.total || 0}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="time" size={28} color={COLORS.white} />
            <Text style={styles.statNumber}>{stats?.deliveries?.pending || 0}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.white} />
            <Text style={styles.statNumber}>{stats?.deliveries?.completed || 0}</Text>
            <Text style={styles.statLabel}>Livrées</Text>
          </View>
          <View style={[styles.statCard, styles.statCardInfo]}>
            <Ionicons name="car" size={28} color={COLORS.white} />
            <Text style={styles.statNumber}>{stats?.drivers?.total || 0}</Text>
            <Text style={styles.statLabel}>Chauffeurs</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <Card style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={24} color={COLORS.secondary} />
            <Text style={styles.revenueTitle}>Revenus (Commissions)</Text>
          </View>
          <Text style={styles.revenueAmount}>
            {(stats?.revenue?.total_commission || 0).toLocaleString()} F
          </Text>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(admin)/drivers')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="person-add" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.quickActionText}>Validations</Text>
            {stats?.drivers?.pending_validation > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats?.drivers?.pending_validation}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(admin)/pricing')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="pricetag" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Tarifs</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraisons récentes</Text>

          {recentDeliveries.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Aucune livraison</Text>
            </Card>
          ) : (
            recentDeliveries.map((delivery) => (
              <Card key={delivery.delivery_id} style={styles.deliveryCard}>
                <View style={styles.deliveryHeader}>
                  <View>
                    <Text style={styles.deliveryType}>{delivery.item_type}</Text>
                    <Text style={styles.deliveryBusiness}>{delivery.business_name}</Text>
                  </View>
                  <StatusBadge status={delivery.status} />
                </View>
                <View style={styles.deliveryFooter}>
                  <Text style={styles.deliveryPrice}>
                    {delivery.total_price.toLocaleString()} F
                  </Text>
                  <Text style={styles.deliveryDate}>
                    {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
  },
  statCardWarning: {
    backgroundColor: COLORS.warning,
  },
  statCardSecondary: {
    backgroundColor: COLORS.secondary,
  },
  statCardInfo: {
    backgroundColor: COLORS.info,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
  },
  revenueCard: {
    marginBottom: 20,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  deliveryCard: {
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  deliveryBusiness: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deliveryDate: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingVertical: 20,
  },
});
