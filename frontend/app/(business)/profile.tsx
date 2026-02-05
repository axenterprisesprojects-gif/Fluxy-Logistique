import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import { showAlert, showDestructiveConfirm } from '../../src/utils/alert';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';
import { COLORS } from '../../src/constants/theme';

export default function BusinessProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { updateBusinessProfile } = useApi();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business_address || '');

  const handleSave = async () => {
    if (!businessName.trim() || !businessAddress.trim()) {
      showAlert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await updateBusinessProfile({
        business_name: businessName.trim(),
        business_address: businessAddress.trim(),
      });
      await refreshUser();
      setEditing(false);
      showAlert('Succès', 'Profil mis à jour');
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
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
            {user?.picture ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="business" size={40} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations entreprise</Text>
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
                label="Nom de l'entreprise"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Ex: Société ABC"
              />
              <Input
                label="Adresse de récupération"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Ex: Zone industrielle, Libreville"
                multiline
                numberOfLines={2}
              />
              <View style={styles.editButtons}>
                <Button
                  title="Annuler"
                  variant="outline"
                  size="small"
                  onPress={() => {
                    setEditing(false);
                    setBusinessName(user?.business_name || '');
                    setBusinessAddress(user?.business_address || '');
                  }}
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
                <Ionicons name="business" size={20} color={COLORS.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nom</Text>
                  <Text style={styles.infoValue}>
                    {user?.business_name || 'Non défini'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={COLORS.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>
                    {user?.business_address || 'Non définie'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Actions */}
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  profileCard: {
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
  actionsContainer: {
    marginTop: 24,
  },
});
