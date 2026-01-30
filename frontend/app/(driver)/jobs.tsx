import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS } from '../../src/constants/theme';

export default function AvailableJobs() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAvailableJobs, acceptJob } = useApi();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const data = await getAvailableJobs();
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

  const handleAcceptJob = async (deliveryId: string) => {
    if (!user?.is_validated) {
      Alert.alert(
        'Profil non validé',
        'Votre profil doit être validé par un administrateur avant de pouvoir accepter des missions.'
      );
      return;
    }

    Alert.alert(
      'Accepter la mission',
      'Êtes-vous sûr de vouloir accepter cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              setAcceptingId(deliveryId);
              await acceptJob(deliveryId);
              Alert.alert('Succès', 'Mission acceptée !');
              await loadJobs();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible d\'accepter la mission');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <Card style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.delivery_code || item.delivery_id}</Text>
          </View>
          {item.customer_name && (
            <Text style={styles.customerName}>{item.customer_name}</Text>
          )}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.gray[400]} />
            <Text style={styles.jobDestination}>{item.destination_area}</Text>
          </View>
        </View>
      </View>

      {/* Items description */}
      {item.item_description && (
        <View style={styles.itemsBox}>
          <Text style={styles.itemsLabel}>Articles à livrer:</Text>
          <Text style={styles.itemsText}>{item.item_description}</Text>
        </View>
      )}

      <View style={styles.jobDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="navigate" size={16} color={COLORS.gray[400]} />
          <Text style={styles.detailText}>{item.distance_km} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="business" size={16} color={COLORS.gray[400]} />
          <Text style={styles.detailText}>{item.business_name}</Text>
        </View>
        {item.customer_phone && (
          <View style={styles.detailItem}>
            <Ionicons name="call" size={16} color={COLORS.gray[400]} />
            <Text style={styles.detailText}>{item.customer_phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix total</Text>
          <Text style={styles.priceValue}>{item.total_price.toLocaleString()} F</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Commission plateforme</Text>
          <Text style={styles.commissionValue}>-{item.commission.toLocaleString()} F</Text>
        </View>
        <View style={[styles.priceRow, styles.earningsRow]}>
          <Text style={styles.earningsLabel}>Vos gains</Text>
          <Text style={styles.earningsValue}>{item.driver_earnings.toLocaleString()} F</Text>
        </View>
      </View>

      <Button
        title={user?.is_validated ? "Accepter la mission" : "Profil non validé"}
        onPress={() => handleAcceptJob(item.delivery_id)}
        loading={acceptingId === item.delivery_id}
        disabled={!user?.is_validated}
        variant={user?.is_validated ? 'secondary' : 'outline'}
      />
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Chargement des missions..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Missions disponibles</Text>
        <Text style={styles.subtitle}>{jobs.length} mission(s)</Text>
      </View>

      {/* List */}
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.delivery_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucune mission disponible</Text>
            <Text style={styles.emptySubtext}>De nouvelles missions seront bientôt publiées</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  jobCard: {
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  codeBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  jobType: {
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
  jobDestination: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  itemsBox: {
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  timeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  priceContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  commissionValue: {
    fontSize: 14,
    color: COLORS.error,
  },
  earningsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: 8,
    paddingTop: 8,
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary,
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
