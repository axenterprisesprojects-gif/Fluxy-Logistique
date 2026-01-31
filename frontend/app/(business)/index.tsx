import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import StatusBadge from '../../src/components/StatusBadge';
import { COLORS, SHADOWS } from '../../src/constants/theme';

type FilterType = 'all' | 'pending' | 'in_progress' | 'delivered';

export default function BusinessHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getBusinessDeliveries } = useApi();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  // Filtered counts
  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const inProgressCount = deliveries.filter(d => ['accepted', 'pickup_confirmed'].includes(d.status)).length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  // Filter deliveries based on selection
  const getFilteredDeliveries = () => {
    switch (selectedFilter) {
      case 'pending':
        return deliveries.filter(d => d.status === 'pending');
      case 'in_progress':
        return deliveries.filter(d => ['accepted', 'pickup_confirmed'].includes(d.status));
      case 'delivered':
        return deliveries.filter(d => d.status === 'delivered');
      default:
        return deliveries;
    }
  };

  const filteredDeliveries = getFilteredDeliveries().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'accepted': 'Acceptée',
      'pickup_confirmed': 'Récupérée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  const openDeliveryDetail = (delivery: any) => {
    setSelectedDelivery(delivery);
    setDetailModalVisible(true);
  };

  const renderDeliveryItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => openDeliveryDetail(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.deliveryCard}>
        <View style={styles.deliveryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryCode}>{item.delivery_code || `#${item.delivery_id.slice(-8)}`}</Text>
            {item.customer_name && (
              <Text style={styles.customerName}>{item.customer_name}</Text>
            )}
            <View style={styles.deliveryRoute}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.deliveryRouteText} numberOfLines={1}>
                {item.pickup_address || 'Votre adresse'}
              </Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.gray[400]} />
              <Ionicons name="flag" size={14} color={COLORS.secondary} />
              <Text style={styles.deliveryRouteText} numberOfLines={1}>
                {item.destination_area}
              </Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Items */}
        {(item.item_description || item.item_type) && (
          <View style={styles.itemsRow}>
            <Ionicons name="cube" size={14} color={COLORS.gray[400]} />
            <Text style={styles.itemsText} numberOfLines={1}>
              {item.item_description || item.item_type}
            </Text>
          </View>
        )}

        {/* Driver info for in-progress */}
        {item.driver_name && ['accepted', 'pickup_confirmed'].includes(item.status) && (
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={14} color={COLORS.white} />
            </View>
            <Text style={styles.driverName}>{item.driver_name}</Text>
            <View style={[styles.statusIndicator, 
              item.status === 'accepted' && styles.statusIndicatorAccepted,
              item.status === 'pickup_confirmed' && styles.statusIndicatorPickup
            ]}>
              <Text style={styles.statusIndicatorText}>
                {item.status === 'accepted' ? 'En route' : 'Récupéré'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryPrice}>{item.total_price?.toLocaleString()} F</Text>
          <Text style={styles.deliveryDate}>{formatDate(item.created_at)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.businessName}>{user?.business_name || user?.name || 'Entreprise'}</Text>
        </View>
        <View style={styles.logoContainer}>
          <Ionicons name="cube" size={28} color={COLORS.primary} />
        </View>
      </View>

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

      {/* KPI Cards - Clickable Filters */}
      <View style={styles.kpiContainer}>
        <TouchableOpacity 
          style={[
            styles.kpiCard, 
            styles.kpiPending,
            selectedFilter === 'pending' && styles.kpiCardSelected
          ]}
          onPress={() => setSelectedFilter(selectedFilter === 'pending' ? 'all' : 'pending')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiIconContainer}>
            <Ionicons name="time" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.kpiValue}>{pendingCount}</Text>
          <Text style={styles.kpiLabel}>En attente</Text>
          {selectedFilter === 'pending' && (
            <View style={styles.kpiSelectedIndicator}>
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.kpiCard, 
            styles.kpiProgress,
            selectedFilter === 'in_progress' && styles.kpiCardSelected
          ]}
          onPress={() => setSelectedFilter(selectedFilter === 'in_progress' ? 'all' : 'in_progress')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiIconContainer}>
            <Ionicons name="car" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.kpiValue}>{inProgressCount}</Text>
          <Text style={styles.kpiLabel}>En cours</Text>
          {selectedFilter === 'in_progress' && (
            <View style={[styles.kpiSelectedIndicator, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.kpiCard, 
            styles.kpiDelivered,
            selectedFilter === 'delivered' && styles.kpiCardSelected
          ]}
          onPress={() => setSelectedFilter(selectedFilter === 'delivered' ? 'all' : 'delivered')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
          </View>
          <Text style={styles.kpiValue}>{deliveredCount}</Text>
          <Text style={styles.kpiLabel}>Livrées</Text>
          {selectedFilter === 'delivered' && (
            <View style={[styles.kpiSelectedIndicator, { backgroundColor: COLORS.secondary }]}>
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter indicator */}
      {selectedFilter !== 'all' && (
        <TouchableOpacity 
          style={styles.filterIndicator}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={styles.filterIndicatorText}>
            Filtre actif: {selectedFilter === 'pending' ? 'En attente' : selectedFilter === 'in_progress' ? 'En cours' : 'Livrées'}
          </Text>
          <Ionicons name="close-circle" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedFilter === 'all' ? 'Toutes les livraisons' : 
           selectedFilter === 'pending' ? 'Livraisons en attente' :
           selectedFilter === 'in_progress' ? 'Livraisons en cours' : 'Livraisons terminées'}
        </Text>
        <Text style={styles.sectionCount}>{filteredDeliveries.length}</Text>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.delivery_id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={56} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' ? 'Aucune livraison' :
                 selectedFilter === 'pending' ? 'Aucune livraison en attente' :
                 selectedFilter === 'in_progress' ? 'Aucune livraison en cours' : 'Aucune livraison terminée'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === 'all' ? 'Créez votre première demande de livraison' : 'Changez de filtre pour voir d\'autres livraisons'}
              </Text>
            </View>
          </Card>
        }
      />

      {/* Delivery Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDelivery && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails de la livraison</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                  </TouchableOpacity>
                </View>

                {/* Status Banner */}
                <View style={styles.modalStatusBanner}>
                  <StatusBadge status={selectedDelivery.status} />
                  <Text style={styles.modalDeliveryCode}>
                    {selectedDelivery.delivery_code || `#${selectedDelivery.delivery_id.slice(-8)}`}
                  </Text>
                </View>

                {/* Price */}
                <View style={styles.modalPriceSection}>
                  <Text style={styles.modalPriceLabel}>Montant total</Text>
                  <Text style={styles.modalPriceValue}>
                    {selectedDelivery.total_price?.toLocaleString()} F
                  </Text>
                </View>

                {/* Customer */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionRow}>
                    <Ionicons name="person" size={18} color={COLORS.gray[500]} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Client</Text>
                      <Text style={styles.modalSectionValue}>
                        {selectedDelivery.customer_name || 'Non spécifié'}
                      </Text>
                      {selectedDelivery.customer_phone && (
                        <Text style={styles.modalSectionSubvalue}>
                          {selectedDelivery.customer_phone}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Items */}
                {(selectedDelivery.item_description || selectedDelivery.item_type) && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionRow}>
                      <Ionicons name="cube" size={18} color={COLORS.gray[500]} />
                      <View style={styles.modalSectionContent}>
                        <Text style={styles.modalSectionLabel}>Articles</Text>
                        <Text style={styles.modalSectionValue}>
                          {selectedDelivery.item_description || selectedDelivery.item_type}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Route */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionRow}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Récupération</Text>
                      <Text style={styles.modalSectionValue}>
                        {selectedDelivery.pickup_address || 'Votre adresse'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.modalSectionRow, { marginTop: 12 }]}>
                    <Ionicons name="flag" size={18} color={COLORS.secondary} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Livraison</Text>
                      <Text style={styles.modalSectionValue}>
                        {selectedDelivery.destination_area}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Driver */}
                {selectedDelivery.driver_name && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionRow}>
                      <Ionicons name="car" size={18} color={COLORS.gray[500]} />
                      <View style={styles.modalSectionContent}>
                        <Text style={styles.modalSectionLabel}>Chauffeur assigné</Text>
                        <Text style={styles.modalSectionValue}>
                          {selectedDelivery.driver_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Timeline */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalTimelineTitle}>Chronologie</Text>
                  
                  <View style={styles.modalTimelineRow}>
                    <View style={[styles.modalTimelineDot, { backgroundColor: COLORS.gray[400] }]} />
                    <Text style={styles.modalTimelineLabel}>Créée</Text>
                    <Text style={styles.modalTimelineValue}>{formatFullDate(selectedDelivery.created_at)}</Text>
                  </View>

                  {selectedDelivery.accepted_at && (
                    <View style={styles.modalTimelineRow}>
                      <View style={[styles.modalTimelineDot, { backgroundColor: COLORS.primary }]} />
                      <Text style={styles.modalTimelineLabel}>Acceptée</Text>
                      <Text style={styles.modalTimelineValue}>{formatFullDate(selectedDelivery.accepted_at)}</Text>
                    </View>
                  )}

                  {selectedDelivery.pickup_at && (
                    <View style={styles.modalTimelineRow}>
                      <View style={[styles.modalTimelineDot, { backgroundColor: '#7C3AED' }]} />
                      <Text style={styles.modalTimelineLabel}>Récupérée</Text>
                      <Text style={styles.modalTimelineValue}>{formatFullDate(selectedDelivery.pickup_at)}</Text>
                    </View>
                  )}

                  {selectedDelivery.delivered_at && (
                    <View style={styles.modalTimelineRow}>
                      <View style={[styles.modalTimelineDot, { backgroundColor: COLORS.secondary }]} />
                      <Text style={styles.modalTimelineLabel}>Livrée</Text>
                      <Text style={styles.modalTimelineValue}>{formatFullDate(selectedDelivery.delivered_at)}</Text>
                    </View>
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setDetailModalVisible(false)}
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
  businessName: {
    fontSize: 22,
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
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  kpiCardSelected: {
    borderColor: COLORS.primary,
  },
  kpiPending: {
    backgroundColor: '#FFFBEB',
  },
  kpiProgress: {
    backgroundColor: '#EFF6FF',
  },
  kpiDelivered: {
    backgroundColor: '#ECFDF5',
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...SHADOWS.small,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginTop: 2,
    textAlign: 'center',
  },
  kpiSelectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  filterIndicatorText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.gray[500],
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  deliveryCard: {
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deliveryCode: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  deliveryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deliveryRouteText: {
    fontSize: 12,
    color: COLORS.gray[600],
    maxWidth: 80,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  itemsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[600],
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 10,
  },
  driverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicatorAccepted: {
    backgroundColor: '#DBEAFE',
  },
  statusIndicatorPickup: {
    backgroundColor: '#EDE9FE',
  },
  statusIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deliveryDate: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginTop: 4,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  modalStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDeliveryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  modalPriceSection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPriceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  modalPriceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  modalSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalSectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalSectionContent: {
    marginLeft: 12,
    flex: 1,
  },
  modalSectionLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSectionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginTop: 4,
  },
  modalSectionSubvalue: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  modalTimelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  modalTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  modalTimelineLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    width: 70,
  },
  modalTimelineValue: {
    fontSize: 12,
    color: COLORS.gray[700],
    flex: 1,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});
