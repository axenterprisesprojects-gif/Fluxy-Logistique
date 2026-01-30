import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../src/constants/theme';

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
          <View style={styles.logoIcon}>
            <Ionicons name="cube" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>QuickHaul</Text>
        </View>
        <Text style={styles.tagline}>Livraison d'articles lourds</Text>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeText}>Bienvenue</Text>
        <Text style={styles.subtitle}>Choisissez votre profil pour continuer</Text>

        {/* Business Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/login-business')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="business" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.roleTitle}>Entreprise</Text>
            <Text style={styles.roleDescription}>
              Créez des demandes de livraison et suivez vos expéditions en temps réel
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </View>
        </TouchableOpacity>

        {/* Driver Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/login-driver')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="car" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.roleTitle}>Chauffeur</Text>
            <Text style={styles.roleDescription}>
              Acceptez des missions de livraison et gagnez de l'argent
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </View>
        </TouchableOpacity>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Pourquoi QuickHaul ?</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureLabel}>Rapide</Text>
              <Text style={styles.featureText}>Livraison en quelques heures</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureLabel}>Sécurisé</Text>
              <Text style={styles.featureText}>Chauffeurs vérifiés</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pricetag" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureLabel}>Transparent</Text>
              <Text style={styles.featureText}>Tarification claire</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresSection: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.small,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    marginLeft: 12,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  featureText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.gray[400],
  },
});
