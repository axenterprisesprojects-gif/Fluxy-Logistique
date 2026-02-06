import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../../src/utils/alert';
import Card from '../../../src/components/Card';
import Button from '../../../src/components/Button';
import StatusBadge from '../../../src/components/StatusBadge';
import LoadingScreen from '../../../src/components/LoadingScreen';
import { COLORS } from '../../../src/constants/theme';
import { useApi } from '../../../src/hooks/useApi';

export default function DeliveryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getBusinessDeliveries } = useApi();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    try {
      const deliveries = await getBusinessDeliveries();
      const found = deliveries.find((d: any) => d.delivery_id === id);
      if (found) {
        setDelivery(found);
      } else {
        showAlert('Erreur', 'Livraison non trouvée');
        router.back();
      }
    } catch (error) {
      console.error('Error loading delivery:', error);
      showAlert('Erreur', 'Impossible de charger la livraison');
    } finally {
      setLoading(false);
    }
  };

  const callCustomer = () => {
    if (delivery?.customer_phone) {
      const phoneUrl = `tel:${delivery.customer_phone.replace(/\s/g, '')}`;
      Linking.openURL(phoneUrl);
    }
  };

  const callDriver = () => {
    if (delivery?.driver_phone) {
      const phoneUrl = `tel:${delivery.driver_phone.replace(/\s/g, '')}`;
      Linking.openURL(phoneUrl);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente d\'un chauffeur';
      case 'accepted': return 'Chauffeur en route vers récupération';
      case 'pickup_confirmed': return 'Articles récupérés, livraison en cours';
      case 'delivered': return 'Livraison terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!delivery) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail de la livraison</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Code et Statut */}
        <Card style={styles.statusCard}>
          <View style={styles.codeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{delivery.delivery_code || delivery.delivery_id}</Text>
            </View>
            <StatusBadge status={delivery.status} />
          </View>
          <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
        </Card>

        {/* Informations client */}
        <Text style={styles.sectionTitle}>Client</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{delivery.customer_name || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Téléphone</Text>
            <TouchableOpacity onPress={callCustomer} disabled={!delivery.customer_phone}>
              <Text style={[styles.infoValue, delivery.customer_phone && styles.phoneLink]}>
                {delivery.customer_phone || '-'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Détails de la livraison */}
        <Text style={styles.sectionTitle}>Livraison</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="cube" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Articles</Text>
          </View>
          <Text style={styles.itemsText}>{delivery.item_description || delivery.item_type || '-'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Récupération</Text>
          </View>
          <Text style={styles.addressText}>{delivery.pickup_address}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Ionicons name="flag" size={20} color={COLORS.secondary} />
            <Text style={styles.infoLabel}>Destination</Text>
          </View>
          <Text style={styles.addressText}>{delivery.destination_area}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{delivery.distance_km} km</Text>
          </View>
        </Card>

        {/* Chauffeur (si assigné) */}
        {delivery.driver_name && (
          <>
            <Text style={styles.sectionTitle}>Chauffeur</Text>
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color={COLORS.secondary} />
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{delivery.driver_name}</Text>
              </View>
              {delivery.driver_phone && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color={COLORS.gray[500]} />
                    <Text style={styles.infoLabel}>Téléphone</Text>
                    <TouchableOpacity onPress={callDriver}>
                      <Text style={[styles.infoValue, styles.phoneLink]}>
                        {delivery.driver_phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Card>
          </>
        )}

        {/* Prix */}
        <Text style={styles.sectionTitle}>Tarification</Text>
        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.priceValue}>{delivery.total_price?.toLocaleString()} F</Text>
          </View>
        </Card>

        {/* Dates */}
        <Text style={styles.sectionTitle}>Historique</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Créée le</Text>
            <Text style={styles.infoValue}>
              {new Date(delivery.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          {delivery.accepted_at && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.info} />
                <Text style={styles.infoLabel}>Acceptée</Text>
                <Text style={styles.infoValue}>
                  {new Date(delivery.accepted_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </>
          )}
          {delivery.pickup_at && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="cube" size={20} color={COLORS.warning} />
                <Text style={styles.infoLabel}>Récupérée</Text>
                <Text style={styles.infoValue}>
                  {new Date(delivery.pickup_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </>
          )}
          {delivery.delivered_at && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-done-circle" size={20} color={COLORS.secondary} />
                <Text style={styles.infoLabel}>Livrée</Text>
                <Text style={styles.infoValue}>
                  {new Date(delivery.delivered_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Bouton appeler client */}
        {delivery.customer_phone && (
          <Button
            title="Appeler le client"
            onPress={callCustomer}
            variant="outline"
            style={styles.callButton}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 16,
    marginBottom: 20,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  phoneLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: 12,
  },
  itemsText: {
    fontSize: 15,
    color: COLORS.gray[800],
    marginTop: 8,
    lineHeight: 22,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.gray[700],
    marginTop: 4,
    marginLeft: 32,
  },
  priceCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.primary + '08',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  callButton: {
    marginTop: 16,
  },
});
