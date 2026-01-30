import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import StatusBadge from '../../src/components/StatusBadge';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS } from '../../src/constants/theme';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'accepted', label: 'Acceptées' },
  { id: 'delivered', label: 'Livrées' },
];

export default function Deliveries() {
  const insets = useSafeAreaInsets();
  const { getBusinessDeliveries } = useApi();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadDeliveries = async () => {
    try {
      const data = await getBusinessDeliveries();
      setDeliveries(data);
      filterDeliveries(data, selectedFilter);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeliveries = (data: any[], filter: string) => {
    if (filter === 'all') {
      setFilteredDeliveries(data);
    } else {
      setFilteredDeliveries(data.filter(d => d.status === filter));
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries(deliveries, selectedFilter);
  }, [selectedFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, []);

  const renderDeliveryItem = ({ item }: { item: any }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryInfo}>
          <View style={styles.codeContainer}>
            <Text style={styles.deliveryCode}>{item.delivery_code || item.delivery_id}</Text>
          </View>
          {item.customer_name && (
            <Text style={styles.customerName}>{item.customer_name}</Text>
          )}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.gray[400]} />
            <Text style={styles.deliveryDestination}>{item.destination_area}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Items description */}
      {item.item_description && (
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsLabel}>Articles:</Text>
          <Text style={styles.itemsText}>{item.item_description}</Text>
        </View>
      )}

      <View style={styles.deliveryDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{item.distance_km} km</Text>
        </View>
        {item.customer_phone && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Téléphone</Text>
            <Text style={styles.detailValue}>{item.customer_phone}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Prix</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {item.total_price.toLocaleString()} F
          </Text>
        </View>
      </View>

      {item.driver_name && (
        <View style={styles.driverInfo}>
          <Ionicons name="person" size={16} color={COLORS.secondary} />
          <Text style={styles.driverName}>Chauffeur: {item.driver_name}</Text>
        </View>
      )}

      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryDate}>
          Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Chargement des livraisons..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes livraisons</Text>
        <Text style={styles.subtitle}>{deliveries.length} livraison(s)</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.delivery_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucune livraison</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all'
                ? "Vous n'avez pas encore créé de livraison"
                : "Aucune livraison avec ce statut"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  deliveryInfo: {
    flex: 1,
  },
  deliveryType: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  deliveryDestination: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  deliveryDetails: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 2,
  },
  priceValue: {
    color: COLORS.primary,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  driverName: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  deliveryFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  deliveryDate: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginTop: 4,
    textAlign: 'center',
  },
});
