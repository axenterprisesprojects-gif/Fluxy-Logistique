import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import SwipeToAccept from '../../src/components/SwipeToAccept';
import Button from '../../src/components/Button';
import PhotoCapture from '../../src/components/PhotoCapture';
import { COLORS, SHADOWS } from '../../src/constants/theme';

const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'available', label: 'Disponibles' },
  { id: 'mine', label: 'Mes courses' },
];

export default function DriverHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAvailableJobs, getDriverJobs, acceptJob, confirmPickup, confirmDelivery } = useApi();
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('available');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showCurrentDeliveryModal, setShowCurrentDeliveryModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showPickupPhotoModal, setShowPickupPhotoModal] = useState(false);
  const [showDeliveryPhotoModal, setShowDeliveryPhotoModal] = useState(false);

  const loadData = async () => {
    try {
      const [available, mine] = await Promise.all([
        getAvailableJobs(),
        getDriverJobs()
      ]);
      // Sort by creation date (most recent first)
      setAvailableJobs(available.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setMyJobs(mine.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
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

  const handleAcceptJob = async (deliveryId: string) => {
    if (!user?.is_validated) {
      if (Platform.OS === 'web') {
        window.alert('Votre profil doit être validé par un administrateur avant de pouvoir accepter des missions.');
      }
      return;
    }

    try {
      setAcceptingId(deliveryId);
      const acceptedJob = await acceptJob(deliveryId);
      if (Platform.OS === 'web') {
        window.alert('Mission acceptée !');
      }
      await loadData();
      
      // Open the current delivery modal automatically after accepting
      setShowCurrentDeliveryModal(true);
      
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible d\'accepter la mission'));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle pickup confirmation - NO PHOTO REQUIRED
  const handleConfirmPickup = async () => {
    if (!currentActiveJob) return;
    try {
      setProcessingAction(true);
      await confirmPickup(currentActiveJob.delivery_id, '');
      if (Platform.OS === 'web') {
        window.alert('Commande récupérée avec succès !');
      }
      await loadData();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de confirmer'));
      }
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle pickup photo captured (not used anymore, kept for compatibility)
  const handlePickupPhotoCapture = async (photo: string) => {
    // Not used - pickup doesn't require photo
  };

  // Handle delivery confirmation - PHOTO IS OPTIONAL
  const handleConfirmDelivery = async () => {
    // Open photo capture modal with option to skip
    setShowDeliveryPhotoModal(true);
  };

  // Handle delivery WITHOUT photo
  const handleConfirmDeliveryWithoutPhoto = async () => {
    if (!currentActiveJob) return;
    
    setShowDeliveryPhotoModal(false);
    
    try {
      setProcessingAction(true);
      await confirmDelivery(currentActiveJob.delivery_id, '');
      if (Platform.OS === 'web') {
        window.alert('Livraison terminée ! Félicitations !');
      }
      setShowCurrentDeliveryModal(false);
      await loadData();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de confirmer'));
      }
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle delivery photo captured (OPTIONAL)
  const handleDeliveryPhotoCapture = async (photo: string) => {
    if (!currentActiveJob) return;
    
    // Close photo modal FIRST
    setShowDeliveryPhotoModal(false);
    
    try {
      setProcessingAction(true);
      await confirmDelivery(currentActiveJob.delivery_id, photo);
      if (Platform.OS === 'web') {
        window.alert('Livraison terminée ! Félicitations !');
      }
      // Close delivery modal after success
      setShowCurrentDeliveryModal(false);
      await loadData();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de confirmer'));
      }
    } finally {
      setProcessingAction(false);
    }
  };

  // Filter jobs based on selected filter
  const getFilteredJobs = () => {
    if (selectedFilter === 'available') {
      return availableJobs;
    } else if (selectedFilter === 'mine') {
      return myJobs;
    }
    // 'all' - combine both, available first
    return [...availableJobs, ...myJobs];
  };

  const filteredJobs = getFilteredJobs();
  const activeJobs = myJobs.filter(j => ['accepted', 'pickup_confirmed'].includes(j.status));
  const completedJobs = myJobs.filter(j => j.status === 'delivered');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.driver_earnings, 0);

  const needsProfileSetup = !user?.vehicle_type || !user?.vehicle_plate;
  const isValidated = user?.is_validated;
  
  // Check if driver has an active delivery (cannot accept new ones)
  const hasActiveDelivery = activeJobs.length > 0;
  const currentActiveJob = activeJobs[0]; // The current delivery in progress

  const renderMissionItem = ({ item }: { item: any }) => {
    const isMyJob = myJobs.some(j => j.delivery_id === item.delivery_id);
    const isAvailable = availableJobs.some(j => j.delivery_id === item.delivery_id);
    
    // Calculate commission and net earnings
    const commission = item.commission || Math.round(item.total_price * 0.15);
    const netEarnings = item.driver_earnings || (item.total_price - commission);
    
    // Time slot labels
    const timeSlotLabels: Record<string, string> = {
      'asap': 'Dès que possible',
      '1-2h': '1 à 2 heures',
      '2-4h': '2 à 4 heures',
      '4-8h': '4 à 8 heures',
    };
    
    return (
      <Card style={styles.missionCard}>
        {/* Header: Business Name + Price */}
        <View style={styles.missionHeader}>
          <View style={styles.businessRow}>
            <Ionicons name="business" size={18} color={COLORS.primary} />
            <Text style={styles.businessName}>{item.business_name}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceValue}>{item.total_price?.toLocaleString()} F</Text>
          </View>
        </View>

        {/* Time slot */}
        {item.time_slot && (
          <View style={styles.timeSlotRow}>
            <Ionicons name="time" size={14} color={COLORS.warning} />
            <Text style={styles.timeSlotText}>
              {timeSlotLabels[item.time_slot] || item.time_slot}
            </Text>
          </View>
        )}

        {/* Items to transport */}
        {(item.item_description || item.item_type) && (
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Ionicons name="cube" size={16} color={COLORS.gray[500]} />
              <Text style={styles.itemsLabel}>À transporter</Text>
            </View>
            <Text style={styles.itemsText}>{item.item_description || item.item_type}</Text>
          </View>
        )}

        {/* Route: Pickup → Delivery */}
        <View style={styles.routeSection}>
          {/* Pickup */}
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <View style={[styles.routeDot, styles.routeDotPickup]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Récupération</Text>
              <Text style={styles.routeAddress}>{item.pickup_address || 'Adresse de l\'entreprise'}</Text>
            </View>
          </View>

          {/* Line connecting */}
          <View style={styles.routeLine} />

          {/* Delivery */}
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <View style={[styles.routeDot, styles.routeDotDelivery]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Livraison</Text>
              <Text style={styles.routeAddress}>{item.destination_area}</Text>
            </View>
          </View>
        </View>

        {/* Distance + Earnings breakdown */}
        <View style={styles.detailsRow}>
          <View style={styles.distanceBox}>
            <Ionicons name="navigate" size={14} color={COLORS.gray[400]} />
            <Text style={styles.distanceText}>{item.distance_km} km</Text>
          </View>
        </View>

        {/* Financial breakdown for available jobs */}
        {isAvailable && (
          <View style={styles.earningsBreakdown}>
            <View style={styles.earningsLine}>
              <Text style={styles.earningsLineLabel}>Prix total</Text>
              <Text style={styles.earningsLineValue}>{item.total_price?.toLocaleString()} F</Text>
            </View>
            <View style={styles.earningsLine}>
              <Text style={styles.earningsLineLabel}>Commission plateforme (15%)</Text>
              <Text style={styles.earningsLineValueNegative}>-{commission?.toLocaleString()} F</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsLine}>
              <Text style={styles.earningsNetLabel}>Net à percevoir</Text>
              <Text style={styles.earningsNetValue}>{netEarnings?.toLocaleString()} F</Text>
            </View>
          </View>
        )}

        {/* Status for my jobs */}
        {isMyJob && (
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, 
              item.status === 'delivered' && styles.statusDelivered,
              item.status === 'accepted' && styles.statusAccepted,
              item.status === 'pickup_confirmed' && styles.statusPickup
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'accepted' && 'En route vers récupération'}
                {item.status === 'pickup_confirmed' && 'En cours de livraison'}
                {item.status === 'delivered' && 'Livrée'}
              </Text>
            </View>
            <Text style={styles.earningsText}>Gain: {item.driver_earnings?.toLocaleString()} F</Text>
          </View>
        )}

        {/* Swipe to accept for available jobs */}
        {isAvailable && (
          <View style={styles.swipeContainer}>
            {hasActiveDelivery ? (
              <View style={styles.disabledSwipeMessage}>
                <Ionicons name="lock-closed" size={16} color={COLORS.gray[400]} />
                <Text style={styles.disabledSwipeText}>
                  Terminez votre livraison en cours pour accepter
                </Text>
              </View>
            ) : (
              <SwipeToAccept
                onAccept={() => handleAcceptJob(item.delivery_id)}
                disabled={!isValidated}
                loading={acceptingId === item.delivery_id}
              />
            )}
          </View>
        )}
      </Card>
    );
  };

  const ListHeader = () => (
    <>
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

      {/* CURRENT DELIVERY SECTION - Prominent button */}
      {hasActiveDelivery && currentActiveJob && (
        <View style={styles.currentDeliverySection}>
          <View style={styles.currentDeliveryHeader}>
            <View style={styles.currentDeliveryPulse}>
              <View style={styles.currentDeliveryPulseInner} />
            </View>
            <Text style={styles.currentDeliverySectionTitle}>LIVRAISON EN COURS</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.currentDeliveryCard}
            onPress={() => setShowCurrentDeliveryModal(true)}
            activeOpacity={0.9}
          >
            <View style={styles.currentDeliveryTop}>
              <View style={styles.currentDeliveryStatus}>
                <Ionicons 
                  name={currentActiveJob.status === 'accepted' ? 'navigate' : 'bicycle'} 
                  size={20} 
                  color={COLORS.white} 
                />
                <Text style={styles.currentDeliveryStatusText}>
                  {currentActiveJob.status === 'accepted' ? 'En route vers récupération' : 'En cours de livraison'}
                </Text>
              </View>
              <View style={styles.currentDeliveryEarnings}>
                <Text style={styles.currentDeliveryEarningsValue}>
                  {currentActiveJob.driver_earnings?.toLocaleString()} F
                </Text>
              </View>
            </View>

            <View style={styles.currentDeliveryRoute}>
              <View style={styles.currentDeliveryRouteItem}>
                <View style={[styles.currentDeliveryDot, { backgroundColor: COLORS.white }]} />
                <Text style={styles.currentDeliveryRouteText} numberOfLines={1}>
                  {currentActiveJob.pickup_address || 'Pickup'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
              <View style={styles.currentDeliveryRouteItem}>
                <View style={[styles.currentDeliveryDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.currentDeliveryRouteText} numberOfLines={1}>
                  {currentActiveJob.destination_area}
                </Text>
              </View>
            </View>

            <View style={styles.currentDeliveryAction}>
              <Text style={styles.currentDeliveryActionText}>Gérer la livraison</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
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
        <View style={[styles.statCard, styles.deliveredCard]}>
          <Text style={[styles.statNumber, styles.deliveredNumber]}>
            {completedJobs.length}
          </Text>
          <Text style={styles.statLabel}>Livrés</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterTab, selectedFilter === filter.id && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {selectedFilter === 'available' && `${availableJobs.length} mission(s) disponible(s)`}
        {selectedFilter === 'mine' && `${myJobs.length} course(s)`}
        {selectedFilter === 'all' && `${filteredJobs.length} mission(s)`}
      </Text>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color={COLORS.gray[300]} />
      <Text style={styles.emptyText}>
        {selectedFilter === 'available' && 'Aucune mission disponible'}
        {selectedFilter === 'mine' && 'Aucune course en cours'}
        {selectedFilter === 'all' && 'Aucune mission'}
      </Text>
      <Text style={styles.emptySubtext}>Tirez vers le bas pour actualiser</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredJobs}
        renderItem={renderMissionItem}
        keyExtractor={(item) => item.delivery_id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Current Delivery Modal */}
      <Modal
        visible={showCurrentDeliveryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrentDeliveryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentActiveJob && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Livraison en cours</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setShowCurrentDeliveryModal(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                  </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={[
                  styles.modalStatusBadge, 
                  currentActiveJob.status === 'accepted' ? styles.modalStatusPickup : styles.modalStatusDelivery
                ]}>
                  <Ionicons 
                    name={currentActiveJob.status === 'accepted' ? 'navigate' : 'bicycle'} 
                    size={24} 
                    color={COLORS.white} 
                  />
                  <Text style={styles.modalStatusText}>
                    {currentActiveJob.status === 'accepted' ? 'En route vers récupération' : 'En cours de livraison'}
                  </Text>
                </View>

                {/* Earnings Badge */}
                <View style={styles.modalEarningsBadge}>
                  <Text style={styles.modalEarningsLabel}>Vos gains pour cette course</Text>
                  <Text style={styles.modalEarningsValue}>
                    {currentActiveJob.driver_earnings?.toLocaleString()} F
                  </Text>
                </View>

                {/* Business Info */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionRow}>
                    <Ionicons name="business" size={20} color={COLORS.primary} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Boutique</Text>
                      <Text style={styles.modalSectionValue}>{currentActiveJob.business_name}</Text>
                    </View>
                  </View>
                </View>

                {/* Customer Info */}
                {currentActiveJob.customer_name && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionRow}>
                      <Ionicons name="person" size={20} color={COLORS.gray[500]} />
                      <View style={styles.modalSectionContent}>
                        <Text style={styles.modalSectionLabel}>Client</Text>
                        <Text style={styles.modalSectionValue}>{currentActiveJob.customer_name}</Text>
                        {currentActiveJob.customer_phone && (
                          <Text style={styles.modalSectionSubvalue}>{currentActiveJob.customer_phone}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Items */}
                {(currentActiveJob.item_description || currentActiveJob.item_type) && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionRow}>
                      <Ionicons name="cube" size={20} color={COLORS.gray[500]} />
                      <View style={styles.modalSectionContent}>
                        <Text style={styles.modalSectionLabel}>Articles à transporter</Text>
                        <Text style={styles.modalSectionValue}>
                          {currentActiveJob.item_description || currentActiveJob.item_type}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Route */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionRow}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Récupération</Text>
                      <Text style={styles.modalSectionValue}>{currentActiveJob.pickup_address}</Text>
                      {currentActiveJob.status === 'accepted' && (
                        <View style={styles.currentStepBadge}>
                          <Text style={styles.currentStepBadgeText}>Étape actuelle</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[styles.modalSectionRow, { marginTop: 12 }]}>
                    <Ionicons name="flag" size={20} color={COLORS.secondary} />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Livraison</Text>
                      <Text style={styles.modalSectionValue}>{currentActiveJob.destination_area}</Text>
                      {currentActiveJob.status === 'pickup_confirmed' && (
                        <View style={styles.currentStepBadge}>
                          <Text style={styles.currentStepBadgeText}>Étape actuelle</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {currentActiveJob.status === 'accepted' && (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.modalActionBtnPickup]}
                      onPress={handleConfirmPickup}
                      disabled={processingAction}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                      <Text style={styles.modalActionBtnText}>
                        {processingAction ? 'Confirmation...' : 'Commande récupérée'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {currentActiveJob.status === 'pickup_confirmed' && (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.modalActionBtnDelivery]}
                      onPress={handleConfirmDelivery}
                      disabled={processingAction}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="flag" size={24} color={COLORS.white} />
                      <Text style={styles.modalActionBtnText}>
                        {processingAction ? 'Confirmation...' : 'Commande livrée'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowCurrentDeliveryModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Photo Capture Modal - Pickup */}
      <PhotoCapture
        visible={showPickupPhotoModal}
        onClose={() => setShowPickupPhotoModal(false)}
        onCapture={handlePickupPhotoCapture}
        title="Photo de récupération"
        subtitle="Prenez une photo des articles récupérés"
        confirmButtonText="Confirmer la récupération"
        type="pickup"
      />

      {/* Photo Capture Modal - Delivery (OPTIONAL) */}
      <PhotoCapture
        visible={showDeliveryPhotoModal}
        onClose={() => setShowDeliveryPhotoModal(false)}
        onCapture={handleDeliveryPhotoCapture}
        onSkip={handleConfirmDeliveryWithoutPhoto}
        title="Photo de livraison"
        subtitle="La photo est optionnelle mais recommandée"
        confirmButtonText="Confirmer avec photo"
        type="delivery"
      />
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
  deliveredCard: {
    backgroundColor: '#EDE9FE',
  },
  deliveredNumber: {
    color: '#7C3AED',
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: COLORS.white,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  filterTextActive: {
    color: COLORS.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  missionCard: {
    marginBottom: 16,
    padding: 16,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  priceBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemsSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  itemsLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  itemsText: {
    fontSize: 14,
    color: COLORS.gray[800],
    lineHeight: 20,
  },
  routeSection: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeDotPickup: {
    backgroundColor: COLORS.primary,
  },
  routeDotDelivery: {
    backgroundColor: COLORS.secondary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[200],
    marginLeft: 11,
  },
  routeContent: {
    flex: 1,
    paddingLeft: 8,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  statusBadge: {
    backgroundColor: COLORS.info + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAccepted: {
    backgroundColor: COLORS.info + '15',
  },
  statusPickup: {
    backgroundColor: COLORS.warning + '15',
  },
  statusDelivered: {
    backgroundColor: COLORS.secondary + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  swipeContainer: {
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  activeDeliveryCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeDeliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeDeliveryContent: {
    flex: 1,
  },
  activeDeliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  activeDeliveryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activeDeliveryDestination: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 4,
  },
  disabledSwipeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  disabledSwipeText: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  timeSlotText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsBreakdown: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  earningsLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  earningsLineLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  earningsLineValue: {
    fontSize: 13,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  earningsLineValueNegative: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 6,
  },
  earningsNetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  earningsNetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  // Current Delivery Section styles
  currentDeliverySection: {
    marginBottom: 20,
  },
  currentDeliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  currentDeliveryPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDeliveryPulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  currentDeliverySectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  currentDeliveryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.medium,
  },
  currentDeliveryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currentDeliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentDeliveryStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  currentDeliveryEarnings: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentDeliveryEarningsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  currentDeliveryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  currentDeliveryRouteItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentDeliveryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currentDeliveryRouteText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  currentDeliveryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  currentDeliveryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
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
  modalStatusPickup: {
    backgroundColor: COLORS.primary,
  },
  modalStatusDelivery: {
    backgroundColor: COLORS.secondary,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalEarningsBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalEarningsLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  modalEarningsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.secondary,
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
    fontSize: 12,
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
  currentStepBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  currentStepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalActions: {
    marginTop: 8,
    marginBottom: 12,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 14,
  },
  modalActionBtnPickup: {
    backgroundColor: COLORS.primary,
  },
  modalActionBtnDelivery: {
    backgroundColor: COLORS.secondary,
  },
  modalActionBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalCloseButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});
