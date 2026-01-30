import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
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
    .slice(0, 10);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const renderTransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle}>{item.destination_area}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.delivered_at || item.created_at)}</Text>
      </View>
      <Text style={styles.transactionAmount}>+{item.driver_earnings?.toLocaleString()} F</Text>
    </View>
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
      <Text style={styles.sectionTitle}>Historique des gains</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    paddingHorizontal: 20,
    marginBottom: 12,
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
  transactionDate: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
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
});
