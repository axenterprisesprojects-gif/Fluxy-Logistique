import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function Finances() {
  const insets = useSafeAreaInsets();
  const { getDriverJobs } = useApi();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Calculate financial stats
  const completedJobs = jobs.filter(j => j.status === 'delivered');
  const activeJobs = jobs.filter(j => ['accepted', 'pickup_confirmed'].includes(j.status));
  
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.driver_earnings || 0), 0);
  const totalCommission = completedJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
  const pendingEarnings = activeJobs.reduce((sum, job) => sum + (job.driver_earnings || 0), 0);
  const avgEarningsPerJob = completedJobs.length > 0 ? Math.round(totalEarnings / completedJobs.length) : 0;

  // Group by day for recent transactions
  const recentCompleted = completedJobs
    .sort((a, b) => new Date(b.delivered_at || b.created_at).getTime() - new Date(a.delivered_at || a.created_at).getTime())
    .slice(0, 20);

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

  const renderTransactionItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => openJobDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionIcon}>
        <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle}>{item.destination_area}</Text>
        <Text style={styles.transactionSubtitle}>{item.business_name}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.delivered_at || item.created_at)}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>+{item.driver_earnings?.toLocaleString()} F</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finances</Text>
        <Text style={styles.subtitle}>Vos gains et statistiques</Text>
      </View>

      {/* Main Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Gains totaux</Text>
        <Text style={styles.balanceValue}>{totalEarnings.toLocaleString()} F</Text>
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatValue}>{completedJobs.length}</Text>
            <Text style={styles.balanceStatLabel}>Courses terminées</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatValue}>{avgEarningsPerJob.toLocaleString()} F</Text>
            <Text style={styles.balanceStatLabel}>Moyenne/course</Text>
          </View>
        </View>
      </Card>

      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        <Card style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="time" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.kpiValue}>{pendingEarnings.toLocaleString()} F</Text>
          <Text style={styles.kpiLabel}>En attente</Text>
          <Text style={styles.kpiSubtext}>{activeJobs.length} course(s) en cours</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: COLORS.error + '20' }]}>
            <Ionicons name="trending-down" size={20} color={COLORS.error} />
          </View>
          <Text style={styles.kpiValue}>{totalCommission.toLocaleString()} F</Text>
          <Text style={styles.kpiLabel}>Commission plateforme</Text>
          <Text style={styles.kpiSubtext}>15% reversés</Text>
        </Card>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryRow}>
            <Ionicons name="cash" size={20} color={COLORS.secondary} />
            <Text style={styles.summaryLabel}>Total brut</Text>
          </View>
          <Text style={styles.summaryValue}>
            {(totalEarnings + totalCommission).toLocaleString()} F
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryRow}>
            <Ionicons name="remove-circle" size={20} color={COLORS.error} />
            <Text style={styles.summaryLabel}>Commission (15%)</Text>
          </View>
          <Text style={[styles.summaryValue, styles.summaryValueNegative]}>
            -{totalCommission.toLocaleString()} F
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryRow}>
            <Ionicons name="wallet" size={20} color={COLORS.secondary} />
            <Text style={styles.summaryLabel}>Net perçu</Text>
          </View>
          <Text style={[styles.summaryValue, styles.summaryValuePositive]}>
            {totalEarnings.toLocaleString()} F
          </Text>
        </View>
      </View>

      {/* Transactions Header */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Historique des gains</Text>
        <Text style={styles.sectionSubtitle}>Cliquez pour voir les détails</Text>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={recentCompleted}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.delivery_id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucune course terminée</Text>
            <Text style={styles.emptySubtext}>Vos gains apparaîtront ici</Text>
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

                {/* Earnings Badge */}
                <View style={styles.earningsBadge}>
                  <Text style={styles.earningsBadgeLabel}>Vos gains</Text>
                  <Text style={styles.earningsBadgeValue}>
                    +{selectedJob.driver_earnings?.toLocaleString()} F
                  </Text>
                </View>

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

                {/* Financial Breakdown */}
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
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.secondary,
    padding: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  kpiLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 4,
    textAlign: 'center',
  },
  kpiSubtext: {
    fontSize: 11,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...SHADOWS.small,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  summaryValuePositive: {
    color: COLORS.secondary,
  },
  summaryValueNegative: {
    color: COLORS.error,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  transactionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
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
