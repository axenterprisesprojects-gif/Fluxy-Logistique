import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi } from '../../src/hooks/useApi';
import { showAlert } from '../../src/utils/alert';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import StatusBadge from '../../src/components/StatusBadge';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

export default function MyJobs() {
  const insets = useSafeAreaInsets();
  const { getDriverJobs, confirmPickup, confirmDelivery } = useApi();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');

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
    if (!selectedJob) return;

    try {
      setProcessingId(selectedJob.delivery_id);
      setPhotoModalVisible(false);

      const photoData = `data:image/jpeg;base64,${base64}`;

      if (photoType === 'pickup') {
        await confirmPickup(selectedJob.delivery_id, photoData);
        showAlert('Succès', 'Récupération confirmée !');
      } else {
        await confirmDelivery(selectedJob.delivery_id, photoData);
        showAlert('Succès', 'Livraison confirmée !');
      }

      await loadJobs();
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de confirmer');
    } finally {
      setProcessingId(null);
      setSelectedJob(null);
    }
  };

  const openPhotoModal = (job: any, type: 'pickup' | 'delivery') => {
    setSelectedJob(job);
    setPhotoType(type);
    setPhotoModalVisible(true);
  };

  const renderJobItem = ({ item }: { item: any }) => {
    const isAccepted = item.status === 'accepted';
    const isPickupConfirmed = item.status === 'pickup_confirmed';
    const isDelivered = item.status === 'delivered';

    return (
      <Card style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobType}>{item.item_type}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={COLORS.gray[400]} />
              <Text style={styles.jobDestination}>{item.destination_area}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.routeText}>{item.pickup_address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.routeText}>{item.destination_area}</Text>
          </View>
        </View>

        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>Vos gains</Text>
          <Text style={styles.earningsValue}>{item.driver_earnings.toLocaleString()} F</Text>
        </View>

        {/* Actions based on status */}
        {isAccepted && (
          <Button
            title="Confirmer la récupération"
            onPress={() => openPhotoModal(item, 'pickup')}
            loading={processingId === item.delivery_id}
          />
        )}

        {isPickupConfirmed && (
          <Button
            title="Confirmer la livraison"
            onPress={() => openPhotoModal(item, 'delivery')}
            loading={processingId === item.delivery_id}
            variant="secondary"
          />
        )}

        {isDelivered && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.completedText}>Livraison terminée</Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes courses</Text>
        <Text style={styles.subtitle}>{jobs.length} course(s)</Text>
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
            <Ionicons name="car-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucune course</Text>
            <Text style={styles.emptySubtext}>Acceptez des missions pour commencer</Text>
          </View>
        }
      />

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
              {photoType === 'pickup' ? 'Photo de récupération' : 'Photo de livraison'}
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
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
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
  routeContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.gray[700],
    flex: 1,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
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
