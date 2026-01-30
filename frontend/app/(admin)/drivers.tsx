import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'validated', label: 'Validés' },
];

export default function AdminDrivers() {
  const insets = useSafeAreaInsets();
  const { getAdminDrivers, validateDriver } = useApi();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const loadDrivers = async () => {
    try {
      const data = await getAdminDrivers();
      setDrivers(data);
      applyFilter(data, filter);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (data: any[], filterValue: string) => {
    if (filterValue === 'all') {
      setFilteredDrivers(data);
    } else if (filterValue === 'pending') {
      setFilteredDrivers(data.filter(d => !d.is_validated));
    } else {
      setFilteredDrivers(data.filter(d => d.is_validated));
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    applyFilter(drivers, filter);
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  }, []);

  const handleValidateDriver = async (driver: any) => {
    Alert.alert(
      'Valider le chauffeur',
      `Voulez-vous valider ${driver.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              setValidating(true);
              await validateDriver(driver.user_id);
              Alert.alert('Succès', 'Chauffeur validé');
              setSelectedDriver(null);
              await loadDrivers();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de valider');
            } finally {
              setValidating(false);
            }
          },
        },
      ]
    );
  };

  const renderDriverItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => setSelectedDriver(item)}
      activeOpacity={0.8}
    >
      <Card style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={24} color={COLORS.white} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.name}</Text>
            <Text style={styles.driverPhone}>{item.phone}</Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: item.is_validated ? COLORS.secondary : COLORS.warning }
          ]} />
        </View>

        <View style={styles.driverDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="car" size={16} color={COLORS.gray[400]} />
            <Text style={styles.detailText}>
              {item.vehicle_brand || 'N/A'} - {item.vehicle_type || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="document-text" size={16} color={COLORS.gray[400]} />
            <Text style={styles.detailText}>
              {item.documents?.length || 0} document(s)
            </Text>
          </View>
        </View>

        {!item.is_validated && (
          <Button
            title="Valider"
            size="small"
            onPress={() => handleValidateDriver(item)}
            style={styles.validateButton}
          />
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Chargement des chauffeurs..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chauffeurs</Text>
        <Text style={styles.subtitle}>{drivers.length} chauffeur(s)</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              filter === option.id && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(option.id)}
          >
            <Text
              style={[
                styles.filterText,
                filter === option.id && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredDrivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucun chauffeur</Text>
          </View>
        }
      />

      {/* Driver Detail Modal */}
      <Modal
        visible={!!selectedDriver}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDriver(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails du chauffeur</Text>
              <TouchableOpacity onPress={() => setSelectedDriver(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.driverProfile}>
                  <View style={styles.largeAvatar}>
                    <Ionicons name="person" size={40} color={COLORS.white} />
                  </View>
                  <Text style={styles.profileName}>{selectedDriver.name}</Text>
                  <Text style={styles.profilePhone}>{selectedDriver.phone}</Text>
                  {selectedDriver.is_validated ? (
                    <View style={[styles.statusBadge, styles.validatedBadge]}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      <Text style={[styles.statusBadgeText, { color: COLORS.secondary }]}>Validé</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.pendingBadge]}>
                      <Ionicons name="time" size={16} color={COLORS.warning} />
                      <Text style={[styles.statusBadgeText, { color: COLORS.warning }]}>En attente</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Véhicule</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{selectedDriver.vehicle_type || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Marque</Text>
                    <Text style={styles.infoValue}>{selectedDriver.vehicle_brand || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Immatriculation</Text>
                    <Text style={styles.infoValue}>{selectedDriver.vehicle_plate || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Documents ({selectedDriver.documents?.length || 0})</Text>
                  {selectedDriver.documents?.length > 0 ? (
                    selectedDriver.documents.map((doc: any, index: number) => (
                      <View key={index} style={styles.documentRow}>
                        <Ionicons name="document-text" size={20} color={COLORS.primary} />
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentType}>{doc.document_type}</Text>
                          <Text style={styles.documentStatus}>{doc.status}</Text>
                        </View>
                        {doc.document_image && (
                          <Image 
                            source={{ uri: doc.document_image }} 
                            style={styles.documentThumb}
                          />
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDocuments}>Aucun document téléversé</Text>
                  )}
                </View>

                {!selectedDriver.is_validated && (
                  <Button
                    title="Valider ce chauffeur"
                    onPress={() => handleValidateDriver(selectedDriver)}
                    loading={validating}
                    style={styles.modalValidateButton}
                  />
                )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },
  filterButtonActive: {
    backgroundColor: COLORS.warning,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  driverCard: {
    marginBottom: 12,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  driverPhone: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  driverDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  validateButton: {
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  modalScroll: {
    padding: 20,
  },
  driverProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  validatedBadge: {
    backgroundColor: '#ECFDF5',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  documentStatus: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  documentThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  noDocuments: {
    fontSize: 14,
    color: COLORS.gray[400],
    fontStyle: 'italic',
  },
  modalValidateButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
