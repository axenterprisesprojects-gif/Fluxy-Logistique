import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';
import { COLORS, SHADOWS } from '../../src/constants/theme';
import { TouchableOpacity } from 'react-native';

const ITEM_TYPES = [
  { id: 'meubles', label: 'Meubles', icon: 'bed' },
  { id: 'electromenager', label: 'Électroménager', icon: 'tv' },
  { id: 'materiaux', label: 'Matériaux', icon: 'construct' },
  { id: 'equipements', label: 'Équipements', icon: 'cog' },
  { id: 'colis_lourds', label: 'Colis lourds', icon: 'cube' },
  { id: 'autres', label: 'Autres', icon: 'ellipsis-horizontal' },
];

const TIME_SLOTS = [
  { id: 'asap', label: 'Dès que possible' },
  { id: '1-2h', label: '1 à 2 heures' },
  { id: '2-4h', label: '2 à 4 heures' },
  { id: '4-8h', label: '4 à 8 heures' },
];

export default function NewDelivery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { createDelivery, updateBusinessProfile } = useApi();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Profile form
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business_address || '');
  
  // Delivery form
  const [selectedItemType, setSelectedItemType] = useState('');
  const [destinationArea, setDestinationArea] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  const needsProfileSetup = !user?.business_address;

  const handleSaveProfile = async () => {
    if (!businessName.trim() || !businessAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await updateBusinessProfile({
        business_name: businessName.trim(),
        business_address: businessAddress.trim(),
      });
      await refreshUser();
      setStep(2);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    if (!selectedItemType || !destinationArea.trim() || !selectedTimeSlot) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await createDelivery({
        item_type: selectedItemType,
        destination_area: destinationArea.trim(),
        time_slot: selectedTimeSlot,
      });
      Alert.alert('Succès', 'Votre demande de livraison a été créée', [
        { text: 'OK', onPress: () => router.push('/(business)/deliveries') }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la livraison');
    } finally {
      setLoading(false);
    }
  };

  // Render profile setup step
  if (needsProfileSetup && step === 1) {
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
          <View style={styles.stepHeader}>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepTitle}>Configuration du profil</Text>
            <Text style={styles.stepSubtitle}>Complétez vos informations pour continuer</Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Nom de l'entreprise"
              placeholder="Ex: Société ABC"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <Input
              label="Adresse de récupération"
              placeholder="Ex: Zone industrielle, Abidjan"
              value={businessAddress}
              onChangeText={setBusinessAddress}
              multiline
              numberOfLines={2}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                Cette adresse sera utilisée comme point de départ pour toutes vos livraisons.
              </Text>
            </View>

            <Button
              title="Continuer"
              onPress={handleSaveProfile}
              loading={loading}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
        <View style={styles.stepHeader}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotCompleted]} />
            <View style={[styles.stepLine, styles.stepLineCompleted]} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
          <Text style={styles.stepTitle}>Nouvelle livraison</Text>
          <Text style={styles.stepSubtitle}>Décrivez votre demande</Text>
        </View>

        {/* Pickup Address */}
        <Card style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.addressLabel}>Adresse de récupération</Text>
          </View>
          <Text style={styles.addressText}>{user?.business_address}</Text>
        </Card>

        {/* Item Type Selection */}
        <Text style={styles.sectionTitle}>Type d'article</Text>
        <View style={styles.itemGrid}>
          {ITEM_TYPES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                selectedItemType === item.id && styles.itemCardSelected,
              ]}
              onPress={() => setSelectedItemType(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={selectedItemType === item.id ? COLORS.white : COLORS.gray[600]}
              />
              <Text
                style={[
                  styles.itemLabel,
                  selectedItemType === item.id && styles.itemLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination */}
        <Input
          label="Zone de destination"
          placeholder="Ex: Cocody, Plateau, Yopougon..."
          value={destinationArea}
          onChangeText={setDestinationArea}
        />

        {/* Time Slot */}
        <Text style={styles.sectionTitle}>Créneau souhaité</Text>
        <View style={styles.timeSlotContainer}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlotCard,
                selectedTimeSlot === slot.id && styles.timeSlotCardSelected,
              ]}
              onPress={() => setSelectedTimeSlot(slot.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeSlotLabel,
                  selectedTimeSlot === slot.id && styles.timeSlotLabelSelected,
                ]}
              >
                {slot.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <Button
          title="Créer la demande"
          onPress={handleCreateDelivery}
          loading={loading}
          style={styles.submitButton}
        />
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
    paddingBottom: 40,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray[300],
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.gray[300],
  },
  stepLineCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  formCard: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  addressCard: {
    marginBottom: 20,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  addressText: {
    fontSize: 15,
    color: COLORS.gray[600],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  itemCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  itemCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  itemLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  itemLabelSelected: {
    color: COLORS.white,
  },
  timeSlotContainer: {
    gap: 10,
    marginBottom: 24,
  },
  timeSlotCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  timeSlotCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  timeSlotLabel: {
    fontSize: 15,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  timeSlotLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
});
