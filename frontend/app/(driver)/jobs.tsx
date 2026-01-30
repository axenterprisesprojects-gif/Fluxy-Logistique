import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi } from '../../src/hooks/useApi';
import { showAlert } from '../../src/utils/alert';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function CurrentDelivery() {
  const insets = useSafeAreaInsets();
  const { getDriverJobs, confirmPickup, confirmDelivery } = useApi();
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');

  const loadCurrentJob = async () => {
    try {
      const jobs = await getDriverJobs();
      // Find active job (accepted or pickup_confirmed)
      const active = jobs.find((j: any) => ['accepted', 'pickup_confirmed'].includes(j.status));
      setCurrentJob(active || null);
    } catch (error) {
      console.error('Error loading current job:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentJob();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCurrentJob();
    setRefreshing(false);
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await submitPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await submitPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      showAlert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  const submitPhoto = async (base64: string) => {
    if (!currentJob) return;

    try {
      setProcessing(true);
      setPhotoModalVisible(false);

      const photoData = `data:image/jpeg;base64,${base64}`;

      if (photoType === 'pickup') {
        await confirmPickup(currentJob.delivery_id, photoData);
        if (Platform.OS === 'web') {
          window.alert('Récupération confirmée !');
        }
      } else {
        await confirmDelivery(currentJob.delivery_id, photoData);
        if (Platform.OS === 'web') {
          window.alert('Livraison terminée ! Félicitations !');
        }
      }

      await loadCurrentJob();
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de confirmer');
    } finally {
      setProcessing(false);
    }
  };

  // Quick confirm without photo (for web testing)
  const handleQuickConfirm = async (type: 'pickup' | 'delivery') => {
    if (!currentJob) return;

    try {
      setProcessing(true);
      const dummyPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='; // Minimal placeholder

      if (type === 'pickup') {
        await confirmPickup(currentJob.delivery_id, dummyPhoto);
        if (Platform.OS === 'web') {
          window.alert('Commande récupérée !');
        }
      } else {
        await confirmDelivery(currentJob.delivery_id, dummyPhoto);
        if (Platform.OS === 'web') {
          window.alert('Commande livrée ! Félicitations !');
        }
      }

      await loadCurrentJob();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de confirmer'));
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  const isAccepted = currentJob?.status === 'accepted';
  const isPickupConfirmed = currentJob?.status === 'pickup_confirmed';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Livraison en cours</Text>
        </View>

        {!currentJob ? (
          /* No active delivery */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.secondary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune livraison en cours</Text>
            <Text style={styles.emptySubtext}>
              Acceptez une mission depuis l'accueil pour commencer
            </Text>
          </View>
        ) : (
          /* Active delivery card */
          <Card style={styles.deliveryCard}>
            {/* Status indicator */}
            <View style={[styles.statusBanner, isPickupConfirmed && styles.statusBannerDelivery]}>
              <Ionicons 
                name={isAccepted ? "navigate" : "bicycle"} 
                size={20} 
                color={COLORS.white} 
              />
              <Text style={styles.statusBannerText}>
                {isAccepted ? 'En route vers récupération' : 'En cours de livraison'}
              </Text>
            </View>

            {/* Business info */}
            <View style={styles.section}>
              <View style={styles.businessRow}>
                <Ionicons name="business" size={20} color={COLORS.primary} />
                <Text style={styles.businessName}>{currentJob.business_name}</Text>
              </View>
            </View>

            {/* Customer info */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Client</Text>
              <Text style={styles.customerName}>{currentJob.customer_name || 'Non spécifié'}</Text>
              {currentJob.customer_phone && (
                <TouchableOpacity style={styles.phoneRow}>
                  <Ionicons name="call" size={16} color={COLORS.secondary} />
                  <Text style={styles.phoneText}>{currentJob.customer_phone}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Items */}
            {(currentJob.item_description || currentJob.item_type) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Articles à transporter</Text>
                <View style={styles.itemsBox}>
                  <Ionicons name="cube" size={18} color={COLORS.gray[500]} />
                  <Text style={styles.itemsText}>
                    {currentJob.item_description || currentJob.item_type}
                  </Text>
                </View>
              </View>
            )}

            {/* Route */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Itinéraire</Text>
              <View style={styles.routeContainer}>
                {/* Pickup */}
                <View style={styles.routeItem}>
                  <View style={[styles.routeDot, styles.routeDotPickup]} />
                  <View style={styles.routeContent}>
                    <Text style={styles.routeLabel}>RÉCUPÉRATION</Text>
                    <Text style={styles.routeAddress}>{currentJob.pickup_address}</Text>
                  </View>
                  {isAccepted && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Actuel</Text>
                    </View>
                  )}
                </View>

                <View style={styles.routeLine} />

                {/* Delivery */}
                <View style={styles.routeItem}>
                  <View style={[styles.routeDot, styles.routeDotDelivery]} />
                  <View style={styles.routeContent}>
                    <Text style={styles.routeLabel}>LIVRAISON</Text>
                    <Text style={styles.routeAddress}>{currentJob.destination_area}</Text>
                  </View>
                  {isPickupConfirmed && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Actuel</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Earnings */}
            <View style={styles.earningsSection}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Vos gains pour cette course</Text>
                <Text style={styles.earningsValue}>
                  {currentJob.driver_earnings?.toLocaleString()} F
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              {isAccepted && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPickup]}
                  onPress={() => handleQuickConfirm('pickup')}
                  disabled={processing}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>
                    {processing ? 'Confirmation...' : 'Commande récupérée'}
                  </Text>
                </TouchableOpacity>
              )}

              {isPickupConfirmed && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDelivery]}
                    onPress={() => {
                      setPhotoType('delivery');
                      setPhotoModalVisible(true);
                    }}
                    disabled={processing}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flag" size={24} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>
                      {processing ? 'Confirmation...' : 'Commande livrée'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.skipPhotoLink}
                    onPress={() => handleQuickConfirm('delivery')}
                    disabled={processing}
                  >
                    <Text style={styles.skipPhotoText}>Confirmer sans photo</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Photo option for pickup */}
            {isAccepted && (
              <TouchableOpacity 
                style={styles.photoLink}
                onPress={() => {
                  setPhotoType('pickup');
                  setPhotoModalVisible(true);
                }}
              >
                <Ionicons name="camera" size={16} color={COLORS.gray[500]} />
                <Text style={styles.photoLinkText}>Ajouter une photo (optionnel)</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Photo de {photoType === 'pickup' ? 'récupération' : 'livraison'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Prenez une photo pour confirmer
            </Text>

            <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.photoOptionText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoOption} onPress={handlePickPhoto}>
              <Ionicons name="image" size={24} color={COLORS.primary} />
              <Text style={styles.photoOptionText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>

            <Button
              title="Annuler"
              variant="outline"
              onPress={() => setPhotoModalVisible(false)}
              style={styles.cancelButton}
            />
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
  scrollContent: {
    paddingBottom: 100,
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  deliveryCard: {
    marginHorizontal: 20,
    padding: 0,
    overflow: 'hidden',
  },
  statusBanner: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  statusBannerDelivery: {
    backgroundColor: COLORS.secondary,
  },
  statusBannerText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  itemsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.gray[50],
    padding: 14,
    borderRadius: 10,
  },
  itemsText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[700],
    lineHeight: 22,
  },
  routeContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  routeDotPickup: {
    backgroundColor: COLORS.primary,
  },
  routeDotDelivery: {
    backgroundColor: COLORS.secondary,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.gray[300],
    marginLeft: 6,
    marginVertical: 4,
  },
  routeContent: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 15,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  currentBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  earningsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ECFDF5',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 14,
  },
  actionButtonPickup: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDelivery: {
    backgroundColor: COLORS.secondary,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  photoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  photoLinkText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  photoOptionText: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  cancelButton: {
    marginTop: 12,
  },
});
