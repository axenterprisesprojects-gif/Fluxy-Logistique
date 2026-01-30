import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function DriverHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAvailableJobs, getDriverJobs } = useApi();
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [available, mine] = await Promise.all([
        getAvailableJobs(),
        getDriverJobs()
      ]);
      setAvailableJobs(available);
      setMyJobs(mine);
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

  const activeJobs = myJobs.filter(j => ['accepted', 'pickup_confirmed'].includes(j.status));
  const completedJobs = myJobs.filter(j => j.status === 'delivered');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.driver_earnings, 0);

  const needsProfileSetup = !user?.vehicle_type || !user?.vehicle_plate;
  const isValidated = user?.is_validated;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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

        {/* Quick Actions */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(driver)/jobs')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="flash" size={28} color={COLORS.white} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Voir les missions</Text>
            <Text style={styles.quickActionSubtitle}>
              {availableJobs.length} mission(s) disponible(s)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
        </TouchableOpacity>

        {/* Active Jobs Preview */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courses en cours</Text>
              <TouchableOpacity onPress={() => router.push('/(driver)/my-jobs')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {activeJobs.slice(0, 2).map((job) => (
              <Card key={job.delivery_id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View>
                    <Text style={styles.jobType}>{job.item_type}</Text>
                    <Text style={styles.jobDestination}>{job.destination_area}</Text>
                  </View>
                  <View style={styles.earningsBadge}>
                    <Text style={styles.earningsValue}>
                      {job.driver_earnings.toLocaleString()} F
                    </Text>
                  </View>
                </View>
                <View style={styles.jobFooter}>
                  <Text style={styles.jobStatus}>
                    {job.status === 'accepted' ? 'En route vers récupération' : 'En cours de livraison'}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
    backgroundColor: COLORS.secondary,
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
    color: COLORS.secondary,
    fontWeight: '600',
  },
  jobCard: {
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  jobDestination: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  earningsBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  jobFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  jobStatus: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
