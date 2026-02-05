import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import { showAlert, showDestructiveConfirm } from '../../src/utils/alert';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';
import { COLORS, SHADOWS } from '../../src/constants/theme';

const VEHICLE_TYPES = [
  { id: 'camionnette', label: 'Camionnette', icon: 'car' },
  { id: 'camion', label: 'Camion', icon: 'bus' },
  { id: 'pickup', label: 'Pick-up', icon: 'car-sport' },
];

const ITEM_TYPES = [
  { id: 'meubles', label: 'Meubles' },
  { id: 'electromenager', label: 'Électroménager' },
  { id: 'materiaux', label: 'Matériaux' },
  { id: 'equipements', label: 'Équipements' },
  { id: 'colis_lourds', label: 'Colis lourds' },
  { id: 'autres', label: 'Autres' },
];

const DOCUMENT_TYPES = [
  { id: 'license', label: 'Permis de conduire', icon: 'id-card' },
  { id: 'insurance', label: 'Assurance', icon: 'shield-checkmark' },
  { id: 'vehicle_registration', label: 'Carte grise', icon: 'document-text' },
];

export default function DriverProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { updateDriverProfile, uploadDriverDocument } = useApi();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicle_type || '');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehicle_plate || '');
  const [vehicleBrand, setVehicleBrand] = useState(user?.vehicle_brand || '');
  const [acceptedTypes, setAcceptedTypes] = useState<string[]>(user?.accepted_item_types || []);

  const handleSave = async () => {
    if (!name.trim() || !vehicleType || !vehiclePlate.trim() || !vehicleBrand.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez remplir tous les champs obligatoires');
      } else {
        showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      }
      return;
    }

    try {
      setLoading(true);
      await updateDriverProfile({
        name: name.trim(),
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate.trim(),
        vehicle_brand: vehicleBrand.trim(),
        accepted_item_types: acceptedTypes,
        refused_item_types: [],
      });
      await refreshUser();
      setEditing(false);
      if (Platform.OS === 'web') {
        window.alert('Profil mis à jour avec succès!');
      } else {
        showAlert('Succès', 'Profil mis à jour');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de mettre à jour'));
      } else {
        showAlert('Erreur', error.message || 'Impossible de mettre à jour');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (docType: string) => {
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
        setLoading(true);
        const photoData = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await uploadDriverDocument({
          document_type: docType,
          document_image: photoData,
        });
        await refreshUser();
        showAlert('Succès', 'Document téléversé');
      }
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de téléverser');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemType = (typeId: string) => {
    if (acceptedTypes.includes(typeId)) {
      setAcceptedTypes(acceptedTypes.filter(t => t !== typeId));
    } else {
      setAcceptedTypes([...acceptedTypes, typeId]);
    }
  };

  const handleLogout = async () => {
    console.log('🔴 LOGOUT: Starting logout...');
    
    try {
      // 1. Clear storage first
      await AsyncStorage.clear();
      
      // 2. Call context logout
      await logout();
      
      console.log('🔴 LOGOUT: Navigating...');
      
      // 3. Navigate with a small delay to ensure state is cleared
      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.location.href = '/';
        } else {
          router.replace('/');
        }
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even on error
      router.replace('/');
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = user?.documents?.find((d: any) => d.document_type === docType);
    return doc ? doc.status : null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top + 16 }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="car" size={40} color={COLORS.white} />
            </View>
            {user?.is_validated && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          {user?.is_validated ? (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.statusText}>Profil validé</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <Ionicons name="time" size={16} color={COLORS.warning} />
              <Text style={[styles.statusText, styles.pendingText]}>En attente de validation</Text>
            </View>
          )}
        </View>

        {/* Profile Info */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations véhicule</Text>
            {!editing && (
              <Button
                title="Modifier"
                variant="outline"
                size="small"
                onPress={() => setEditing(true)}
              />
            )}
          </View>

          {editing ? (
            <>
              <Input
                label="Nom complet"
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
              />

              <Text style={styles.inputLabel}>Type de véhicule</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.vehicleCard,
                      vehicleType === type.id && styles.vehicleCardSelected,
                    ]}
                    onPress={() => setVehicleType(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={vehicleType === type.id ? COLORS.white : COLORS.gray[600]}
                    />
                    <Text
                      style={[
                        styles.vehicleLabel,
                        vehicleType === type.id && styles.vehicleLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Marque du véhicule"
                value={vehicleBrand}
                onChangeText={setVehicleBrand}
                placeholder="Ex: Toyota"
              />

              <Input
                label="Immatriculation"
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
                placeholder="Ex: AB-1234-CD"
              />

              <Text style={styles.inputLabel}>Types d'articles acceptés</Text>
              <View style={styles.itemTypesGrid}>
                {ITEM_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.itemTypeChip,
                      acceptedTypes.includes(type.id) && styles.itemTypeChipSelected,
                    ]}
                    onPress={() => toggleItemType(type.id)}
                  >
                    <Text
                      style={[
                        styles.itemTypeText,
                        acceptedTypes.includes(type.id) && styles.itemTypeTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editButtons}>
                <Button
                  title="Annuler"
                  variant="outline"
                  size="small"
                  onPress={() => setEditing(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Sauvegarder"
                  size="small"
                  onPress={handleSave}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="car" size={20} color={COLORS.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Véhicule</Text>
                  <Text style={styles.infoValue}>
                    {user?.vehicle_brand || 'Non défini'} - {user?.vehicle_type || 'Non défini'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={COLORS.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Immatriculation</Text>
                  <Text style={styles.infoValue}>{user?.vehicle_plate || 'Non définie'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cube" size={20} color={COLORS.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Articles acceptés</Text>
                  <Text style={styles.infoValue}>
                    {user?.accepted_item_types?.length ? user.accepted_item_types.join(', ') : 'Tous'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Documents */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Documents</Text>
          <Text style={styles.cardSubtitle}>Téléversez vos documents pour validation</Text>

          {DOCUMENT_TYPES.map((doc) => {
            const status = getDocumentStatus(doc.id);
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentItem}
                onPress={() => handleUploadDocument(doc.id)}
                disabled={loading}
              >
                <View style={styles.documentIcon}>
                  <Ionicons name={doc.icon as any} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.documentContent}>
                  <Text style={styles.documentLabel}>{doc.label}</Text>
                  <Text style={styles.documentStatus}>
                    {status === 'pending' ? 'En attente' : status === 'approved' ? 'Approuvé' : 'Non téléversé'}
                  </Text>
                </View>
                <Ionicons
                  name={status ? 'checkmark-circle' : 'cloud-upload'}
                  size={24}
                  color={status === 'approved' ? COLORS.secondary : COLORS.gray[400]}
                />
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Logout */}
        <View style={styles.actionsContainer}>
          <Button
            title="Se déconnecter"
            variant="danger"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  pendingText: {
    color: COLORS.warning,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  vehicleLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  vehicleLabelSelected: {
    color: COLORS.white,
  },
  itemTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  itemTypeChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  itemTypeChipSelected: {
    backgroundColor: COLORS.secondary,
  },
  itemTypeText: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  itemTypeTextSelected: {
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.gray[800],
    marginTop: 2,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  documentStatus: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 24,
  },
});
