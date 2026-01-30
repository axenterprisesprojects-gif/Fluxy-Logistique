import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import { COLORS } from '../src/constants/theme';

export default function LoginDriver() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsDriver, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    try {
      setLoading(true);
      await loginAsDriver(phone.trim(), name.trim() || undefined);
      router.replace('/(driver)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Impossible de se connecter. Veuillez réessayer.');
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
          <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="car" size={48} color={COLORS.secondary} />
          </View>
          <Text style={styles.title}>Espace Chauffeur</Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour voir et accepter des missions
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.loginContainer}>
          <Input
            label="Numéro de téléphone"
            placeholder="Ex: +225 07 00 00 00 00"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Votre nom (optionnel)"
            placeholder="Ex: Kouamé Jean"
            value={name}
            onChangeText={setName}
          />

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading || isLoading}
            style={styles.loginButton}
          />

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Si c'est votre première connexion, un compte sera créé automatiquement.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Avantages</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Missions en temps réel</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Gains transparents</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.featureText}>Liberté de travail</Text>
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
  loginButton: {
    marginTop: 8,
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
