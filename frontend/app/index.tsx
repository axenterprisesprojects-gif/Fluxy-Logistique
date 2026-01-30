import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';
import Button from '../src/components/Button';
import { COLORS, SHADOWS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on role
      if (user.role === 'business') {
        router.replace('/(business)');
      } else if (user.role === 'driver') {
        router.replace('/(driver)');
      } else if (user.role === 'admin') {
        router.replace('/(admin)');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="cube" size={40} color={COLORS.primary} />
          <Text style={styles.logoText}>QuickHaul</Text>
        </View>
        <Text style={styles.tagline}>Livraison d'articles lourds</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bienvenue</Text>
        <Text style={styles.subtitle}>Choisissez votre profil pour continuer</Text>

        {/* Role Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* Business Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/login-business')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="business" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.roleTitle}>Entreprise</Text>
            <Text style={styles.roleDescription}>
              Créez des demandes de livraison et suivez vos expéditions
            </Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Driver Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/login-driver')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="car" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.roleTitle}>Chauffeur</Text>
            <Text style={styles.roleDescription}>
              Acceptez des missions et gagnez de l'argent
            </Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Admin Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/login-admin')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="settings" size={32} color={COLORS.warning} />
            </View>
            <Text style={styles.roleTitle}>Administrateur</Text>
            <Text style={styles.roleDescription}>
              Gérez la plateforme et les tarifs
            </Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>© 2025 QuickHaul - Tous droits réservés</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  roleDescription: {
    fontSize: 13,
    color: COLORS.gray[500],
    flex: 2,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
});
