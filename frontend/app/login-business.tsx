import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/contexts/AuthContext';
import Button from '../src/components/Button';
import { COLORS } from '../src/constants/theme';

export default function LoginBusiness() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithGoogle, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Store pending role for callback
      await AsyncStorage.setItem('pending_auth_role', 'business');
      await loginWithGoogle('business');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <Button
          title="Retour"
          variant="outline"
          size="small"
          onPress={() => router.back()}
          style={styles.backButton}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="business" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Espace Entreprise</Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour créer des demandes de livraison
          </Text>
        </View>

        {/* Login Options */}
        <View style={styles.loginContainer}>
          <Button
            title="Continuer avec Google"
            onPress={handleGoogleLogin}
            loading={loading || isLoading}
            style={styles.googleButton}
          />

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              En vous connectant, vous pourrez créer des demandes de livraison et suivre leur statut en temps réel.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Avantages</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Création de livraisons rapide</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Suivi en temps réel</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Tarification transparente</Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loginContainer: {
    marginBottom: 32,
  },
  googleButton: {
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.gray[700],
  },
});
