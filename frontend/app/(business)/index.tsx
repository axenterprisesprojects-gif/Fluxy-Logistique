import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import StatusBadge from '../../src/components/StatusBadge';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function BusinessHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getBusinessDeliveries } = useApi();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    try {
      const data = await getBusinessDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, []);

  const activeDeliveries = deliveries.filter(d => ['pending', 'accepted', 'pickup_confirmed'].includes(d.status));
  const completedCount = deliveries.filter(d => d.status === 'delivered').length;
  const pendingCount = deliveries.filter(d => d.status === 'pending').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.business_name || user?.name || 'Entreprise'}</Text>
        </View>
        <View style={styles.logoContainer}>
          <Ionicons name="cube" size={32} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Action */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(business)/new-delivery')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="add" size={28} color={COLORS.white} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Nouvelle livraison</Text>
            <Text style={styles.quickActionSubtitle}>Créer une demande de livraison</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeDeliveries.length}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Livrées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{deliveries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Livraisons récentes</Text>
            <TouchableOpacity onPress={() => router.push('/(business)/deliveries')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Card>
              <Text style={styles.emptyText}>Chargement...</Text>
            </Card>
          ) : deliveries.length === 0 ? (
            <Card>
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={COLORS.gray[300]} />
                <Text style={styles.emptyText}>Aucune livraison</Text>
                <Text style={styles.emptySubtext}>Créez votre première demande de livraison</Text>
              </View>
            </Card>
          ) : (
            deliveries.slice(0, 5).map((delivery) => (
              <Card key={delivery.delivery_id} style={styles.deliveryCard}>
                <View style={styles.deliveryHeader}>
                  <View>
                    <Text style={styles.deliveryType}>{delivery.item_type}</Text>
                    <Text style={styles.deliveryDestination}>{delivery.destination_area}</Text>
                  </View>
                  <StatusBadge status={delivery.status} />
                </View>
                <View style={styles.deliveryFooter}>
                  <Text style={styles.deliveryPrice}>{delivery.total_price.toLocaleString()} F</Text>
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickAction: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
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
  deliveryDestination: {
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
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
