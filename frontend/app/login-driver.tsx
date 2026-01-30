import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
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
  const { loginAsDriver, registerDriver, isLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez entrer votre numéro de téléphone');
      }
      return;
    }
    if (!password.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez entrer votre mot de passe');
      }
      return;
    }
    if (!isLogin && !name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez entrer votre nom');
      }
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        await loginAsDriver(phone.trim(), password);
      } else {
        await registerDriver(phone.trim(), password, name.trim());
      }
      
      router.replace('/(driver)');
    } catch (error: any) {
      console.error('Auth error:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Une erreur est survenue'));
      }
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
            {isLogin ? 'Connectez-vous pour voir et accepter des missions' : 'Créez votre compte chauffeur'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            label="Numéro de téléphone"
            placeholder="Ex: +241 07 00 00 00"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {!isLogin && (
            <Input
              label="Votre nom"
              placeholder="Ex: Kouamé Jean"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <View style={styles.passwordContainer}>
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={COLORS.gray[400]}
              />
            </TouchableOpacity>
          </View>

          <Button
            title={isLogin ? 'Se connecter' : "S'inscrire"}
            onPress={handleSubmit}
            loading={loading || isLoading}
            style={styles.submitButton}
          />
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
    marginBottom: 24,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  tabTextActive: {
    color: COLORS.secondary,
  },
  formContainer: {
    marginBottom: 32,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 38,
  },
  submitButton: {
    marginTop: 8,
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
