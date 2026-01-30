import React, { useState } from 'react';
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
  
  // Delivery form - New fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [destinationArea, setDestinationArea] = useState('');

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
    // Validate all required fields
    if (!customerName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du client');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le numéro du client');
      return;
    }
    if (!itemDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire les articles à livrer');
      return;
    }
    if (!destinationArea.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le quartier de livraison');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating delivery...');
      const result = await createDelivery({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        item_description: itemDescription.trim(),
        destination_area: destinationArea.trim(),
      });
      
      console.log('Delivery created:', result);
      
      // Show success and navigate
      if (Platform.OS === 'web') {
        window.alert(`Demande créée avec succès!\n\nCode de livraison: ${result.delivery_code}`);
        router.push('/(business)/deliveries');
      } else {
        Alert.alert(
          'Succès', 
          `Demande créée avec succès!\n\nCode de livraison: ${result.delivery_code}`, 
          [{ text: 'OK', onPress: () => router.push('/(business)/deliveries') }]
        );
      }
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Impossible de créer la livraison');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de créer la livraison');
      }
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
              placeholder="Ex: Zone industrielle, Libreville"
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
          <Text style={styles.stepSubtitle}>Remplissez les informations de livraison</Text>
        </View>

        {/* Pickup Address */}
        <Card style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.addressLabel}>Adresse de récupération</Text>
          </View>
          <Text style={styles.addressText}>{user?.business_address}</Text>
        </Card>

        {/* Customer Information */}
        <Text style={styles.sectionTitle}>Informations client</Text>
        <Card style={styles.formCard}>
          <Input
            label="Nom du client"
            placeholder="Ex: Jean Dupont"
            value={customerName}
            onChangeText={setCustomerName}
            autoCapitalize="words"
          />
          <Input
            label="Numéro du client"
            placeholder="Ex: +241 07 00 00 00"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </Card>

        {/* Delivery Information */}
        <Text style={styles.sectionTitle}>Détails de la livraison</Text>
        <Card style={styles.formCard}>
          <Input
            label="Articles à livrer"
            placeholder="Ex: 2 canapés, 1 table basse, 3 chaises"
            value={itemDescription}
            onChangeText={setItemDescription}
            multiline
            numberOfLines={3}
          />
          <Input
            label="Quartier de livraison"
            placeholder="Ex: Akanda, Libreville"
            value={destinationArea}
            onChangeText={setDestinationArea}
          />
        </Card>

        {/* Info Box */}
        <View style={styles.infoBoxBottom}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            Un code de livraison unique sera généré après la création de la demande.
          </Text>
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
    padding: 16,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  infoBoxBottom: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
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
  submitButton: {
    marginTop: 8,
  },
});
