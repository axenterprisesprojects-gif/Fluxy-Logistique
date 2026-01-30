import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { COLORS } from '../../src/constants/theme';

export default function AdminSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={COLORS.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.roleContainer}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.warning} />
            <Text style={styles.roleText}>Administrateur</Text>
          </View>
        </Card>

        {/* Settings Options */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Application</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>À propos</Text>
              <Text style={styles.settingValue}>QuickHaul v1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="globe" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Langue</Text>
              <Text style={styles.settingValue}>Français</Text>
            </View>
          </View>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <Text style={styles.dangerText}>
            La déconnexion vous renverra à l'écran d'accueil.
          </Text>
          <Button
            title="Se déconnecter"
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 QuickHaul</Text>
          <Text style={styles.footerText}>Tous droits réservés</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.warning,
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  dangerCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
});
