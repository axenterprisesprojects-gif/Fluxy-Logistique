import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import { COLORS } from '../src/constants/theme';

export default function LoginBusiness() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsBusiness, registerBusiness } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (!isLogin) {
      if (!name.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre nom');
        return false;
      }
      if (!businessName.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer le nom de votre entreprise');
        return false;
      }
      if (!businessAddress.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer l\'adresse de récupération');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (isLogin) {
        await loginAsBusiness(email.trim(), password);
      } else {
        await registerBusiness({
          email: email.trim(),
          password,
          name: name.trim(),
          business_name: businessName.trim(),
          business_address: businessAddress.trim()
        });
      }
      
      // Navigate to business dashboard
      router.replace('/(business)');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="business" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Espace Entreprise</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte entreprise'}
          </Text>
        </View>

        {/* Toggle Login/Register */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="exemple@entreprise.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={22} 
                color={COLORS.gray[500]} 
              />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <>
              <Input
                label="Votre nom"
                placeholder="Jean Dupont"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Nom de l'entreprise"
                placeholder="Société ABC"
                value={businessName}
                onChangeText={setBusinessName}
              />
              <Input
                label="Adresse de récupération"
                placeholder="Zone industrielle, Libreville"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                multiline
                numberOfLines={2}
              />
            </>
          )}

          <Button
            title={isLogin ? 'Se connecter' : 'Créer mon compte'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              {isLogin 
                ? "Connectez-vous pour créer et suivre vos demandes de livraison."
                : "L'adresse de récupération sera le point de départ de vos livraisons."}
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Avantages</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.featureText}>Création de livraisons rapide</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.featureText}>Suivi en temps réel</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
  },
  submitButton: {
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  featuresContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
});
