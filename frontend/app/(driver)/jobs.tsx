import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

type FilterType = 'all' | 'delivered' | 'cancelled';

export default function DeliveryHistory() {
  const insets = useSafeAreaInsets();
  const { getDriverJobs } = useApi();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadJobs = async () => {
    try {
      const data = await getDriverJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }, []);

  // Filter jobs - only completed ones (delivered or cancelled)
  const completedJobs = jobs.filter(j => ['delivered', 'cancelled'].includes(j.status));
  
  const filteredJobs = completedJobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  }).sort((a, b) => new Date(b.delivered_at || b.created_at).getTime() - new Date(a.delivered_at || a.created_at).getTime());

  // Stats
  const deliveredCount = completedJobs.filter(j => j.status === 'delivered').length;
  const cancelledCount = completedJobs.filter(j => j.status === 'cancelled').length;
  const totalEarnings = completedJobs.filter(j => j.status === 'delivered').reduce((sum, j) => sum + (j.driver_earnings || 0), 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openJobDetail = (job: any) => {
    setSelectedJob(job);
    setDetailModalVisible(true);
  };

  const renderJobItem = ({ item }: { item: any }) => {
    const isDelivered = item.status === 'delivered';
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => openJobDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.jobCardHeader}>
          <View style={[styles.statusBadge, isDelivered ? styles.statusDelivered : styles.statusCancelled]}>
            <Ionicons 
              name={isDelivered ? "checkmark-circle" : "close-circle"} 
              size={14} 
              color={COLORS.white} 
            />
            <Text style={styles.statusBadgeText}>
              {isDelivered ? 'Livrée' : 'Annulée'}
            </Text>
          </View>
          <Text style={styles.jobDate}>{formatDate(item.delivered_at || item.created_at)}</Text>
        </View>

        <View style={styles.jobCardBody}>
          <View style={styles.jobRoute}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || 'Pickup'}</Text>
            </View>
            <View style={styles.routeArrow}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.gray[400]} />
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.routeText} numberOfLines={1}>{item.destination_area}</Text>
            </View>
          </View>

          <View style={styles.jobDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="business" size={14} color={COLORS.gray[400]} />
              <Text style={styles.detailText}>{item.business_name}</Text>
            </View>
            {(item.item_description || item.item_type) && (
              <View style={styles.detailItem}>
                <Ionicons name="cube" size={14} color={COLORS.gray[400]} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.item_description || item.item_type}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.jobCardFooter}>
          {isDelivered && (
            <Text style={styles.earningsText}>+{item.driver_earnings?.toLocaleString()} F</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>Vos livraisons passées</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
          <Text style={styles.statValue}>{deliveredCount}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
          <Text style={styles.statValue}>{cancelledCount}</Text>
          <Text style={styles.statLabel}>Annulées</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardEarnings]}>
          <Ionicons name="cash" size={24} color={COLORS.white} />
          <Text style={[styles.statValue, styles.statValueWhite]}>{totalEarnings.toLocaleString()}</Text>
          <Text style={[styles.statLabel, styles.statLabelWhite]}>Gains (F)</Text>
        </Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Toutes ({completedJobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'delivered' && styles.filterTabActive]}
          onPress={() => setFilter('delivered')}
        >
          <Text style={[styles.filterText, filter === 'delivered' && styles.filterTextActive]}>
            Livrées ({deliveredCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
            Annulées ({cancelledCount})
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.delivery_id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={56} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Aucune livraison</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? "Vous n'avez pas encore terminé de livraison"
                : filter === 'delivered' 
                  ? "Aucune livraison complétée"
                  : "Aucune livraison annulée"}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedJob && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails de la livraison</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                  </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={[
                  styles.modalStatusBadge, 
                  selectedJob.status === 'delivered' ? styles.modalStatusDelivered : styles.modalStatusCancelled
                ]}>
                  <Ionicons 
                    name={selectedJob.status === 'delivered' ? "checkmark-circle" : "close-circle"} 
                    size={24} 
                    color={COLORS.white} 
                  />
                  <Text style={styles.modalStatusText}>
                    {selectedJob.status === 'delivered' ? 'Livraison terminée' : 'Livraison annulée'}
                  </Text>
                </View>

                {/* Earnings (if delivered) */}
                {selectedJob.status === 'delivered' && (
                  <View style={styles.earningsBadge}>
                    <Text style={styles.earningsBadgeLabel}>Vos gains</Text>
                    <Text style={styles.earningsBadgeValue}>
                      +{selectedJob.driver_earnings?.toLocaleString()} F
                    </Text>
                  </View>
                )}

                {/* Business Info */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="business" size={20} color={COLORS.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Boutique</Text>
                      <Text style={styles.detailValue}>{selectedJob.business_name}</Text>
                    </View>
                  </View>
                </View>

                {/* Customer Info */}
                {selectedJob.customer_name && (
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={20} color={COLORS.gray[500]} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Client</Text>
                        <Text style={styles.detailValue}>{selectedJob.customer_name}</Text>
                        {selectedJob.customer_phone && (
                          <Text style={styles.detailSubvalue}>{selectedJob.customer_phone}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Items */}
                {(selectedJob.item_description || selectedJob.item_type) && (
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Ionicons name="cube" size={20} color={COLORS.gray[500]} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Articles transportés</Text>
                        <Text style={styles.detailValue}>
                          {selectedJob.item_description || selectedJob.item_type}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Route */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Récupération</Text>
                      <Text style={styles.detailValue}>{selectedJob.pickup_address}</Text>
                    </View>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 12 }]}>
                    <Ionicons name="flag" size={20} color={COLORS.secondary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Livraison</Text>
                      <Text style={styles.detailValue}>{selectedJob.destination_area}</Text>
                    </View>
                  </View>
                </View>

                {/* Timestamps */}
                <View style={styles.detailSection}>
                  <Text style={styles.timestampTitle}>Chronologie</Text>
                  
                  <View style={styles.timestampRow}>
                    <View style={[styles.timestampDot, { backgroundColor: COLORS.gray[400] }]} />
                    <View style={styles.timestampContent}>
                      <Text style={styles.timestampLabel}>Commande créée</Text>
                      <Text style={styles.timestampValue}>{formatFullDate(selectedJob.created_at)}</Text>
                    </View>
                  </View>

                  {selectedJob.accepted_at && (
                    <View style={styles.timestampRow}>
                      <View style={[styles.timestampDot, { backgroundColor: COLORS.info }]} />
                      <View style={styles.timestampContent}>
                        <Text style={styles.timestampLabel}>Acceptée</Text>
                        <Text style={styles.timestampValue}>{formatFullDate(selectedJob.accepted_at)}</Text>
                      </View>
                    </View>
                  )}

                  {selectedJob.pickup_at && (
                    <View style={styles.timestampRow}>
                      <View style={[styles.timestampDot, { backgroundColor: COLORS.primary }]} />
                      <View style={styles.timestampContent}>
                        <Text style={styles.timestampLabel}>Récupérée</Text>
                        <Text style={styles.timestampValue}>{formatFullDate(selectedJob.pickup_at)}</Text>
                      </View>
                    </View>
                  )}

                  {selectedJob.delivered_at && (
                    <View style={styles.timestampRow}>
                      <View style={[styles.timestampDot, { backgroundColor: COLORS.secondary }]} />
                      <View style={styles.timestampContent}>
                        <Text style={styles.timestampLabel}>Livrée</Text>
                        <Text style={styles.timestampValue}>{formatFullDate(selectedJob.delivered_at)}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Financial Breakdown (if delivered) */}
                {selectedJob.status === 'delivered' && (
                  <View style={styles.financialSection}>
                    <Text style={styles.financialTitle}>Détail financier</Text>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabel}>Prix total</Text>
                      <Text style={styles.financialValue}>{selectedJob.total_price?.toLocaleString()} F</Text>
                    </View>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabel}>Commission plateforme (15%)</Text>
                      <Text style={styles.financialValueNegative}>-{selectedJob.commission?.toLocaleString()} F</Text>
                    </View>
                    <View style={styles.financialDivider} />
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabelBold}>Net perçu</Text>
                      <Text style={styles.financialValueBold}>{selectedJob.driver_earnings?.toLocaleString()} F</Text>
                    </View>
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
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
  listContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
  },
  statCardEarnings: {
    backgroundColor: COLORS.secondary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginTop: 6,
  },
  statValueWhite: {
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statLabelWhite: {
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  filterTextActive: {
    color: COLORS.white,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDelivered: {
    backgroundColor: COLORS.secondary,
  },
  statusCancelled: {
    backgroundColor: COLORS.error,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  jobDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  jobCardBody: {
    marginBottom: 12,
  },
  jobRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  routeArrow: {
    paddingHorizontal: 8,
  },
  jobDetails: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray[600],
    flex: 1,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  earningsText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 8,
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
  modalCloseBtn: {
    padding: 4,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalStatusDelivered: {
    backgroundColor: COLORS.secondary,
  },
  modalStatusCancelled: {
    backgroundColor: COLORS.error,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  earningsBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsBadgeLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  earningsBadgeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  detailSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginTop: 4,
  },
  detailSubvalue: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  timestampTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 16,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timestampDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timestampContent: {
    marginLeft: 12,
    flex: 1,
  },
  timestampLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  timestampValue: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  financialSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  financialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  financialLabelBold: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  financialValue: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  financialValueNegative: {
    fontSize: 14,
    color: COLORS.error,
  },
  financialValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  financialDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  closeButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});
