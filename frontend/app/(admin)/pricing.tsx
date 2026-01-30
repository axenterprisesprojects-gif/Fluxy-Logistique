import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/hooks/useApi';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, SHADOWS } from '../../src/constants/theme';
import { TouchableOpacity } from 'react-native';

export default function AdminPricing() {
  const insets = useSafeAreaInsets();
  const { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, updateCommission } = useApi();
  
  const [rules, setRules] = useState<any[]>([]);
  const [commission, setCommission] = useState(15);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [price, setPrice] = useState('');

  const loadData = async () => {
    try {
      const data = await getPricingRules();
      setRules(data.rules || []);
      setCommission(data.commission_percentage || 15);
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const openModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setMinDistance(rule.min_distance.toString());
      setMaxDistance(rule.max_distance.toString());
      setPrice(rule.price.toString());
    } else {
      setEditingRule(null);
      setMinDistance('');
      setMaxDistance('');
      setPrice('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRule(null);
    setMinDistance('');
    setMaxDistance('');
    setPrice('');
  };

  const handleSaveRule = async () => {
    const min = parseFloat(minDistance);
    const max = parseFloat(maxDistance);
    const p = parseFloat(price);

    if (isNaN(min) || isNaN(max) || isNaN(p) || min < 0 || max <= min || p <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    try {
      setSaving(true);
      if (editingRule) {
        await updatePricingRule(editingRule.rule_id, {
          min_distance: min,
          max_distance: max,
          price: p,
        });
      } else {
        await createPricingRule({
          min_distance: min,
          max_distance: max,
          price: p,
        });
      }
      closeModal();
      await loadData();
      Alert.alert('Succès', editingRule ? 'Règle mise à jour' : 'Règle créée');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette règle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePricingRule(ruleId);
              await loadData();
              Alert.alert('Succès', 'Règle supprimée');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const handleSaveCommission = async () => {
    if (commission < 0 || commission > 100) {
      Alert.alert('Erreur', 'La commission doit être entre 0 et 100%');
      return;
    }

    try {
      setSaving(true);
      await updateCommission(commission);
      Alert.alert('Succès', 'Commission mise à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Chargement des tarifs..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tarification</Text>
        <Text style={styles.subtitle}>Gérez les prix et commissions</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Commission Card */}
        <Card style={styles.commissionCard}>
          <View style={styles.commissionHeader}>
            <Ionicons name="cash" size={24} color={COLORS.warning} />
            <Text style={styles.commissionTitle}>Commission plateforme</Text>
          </View>
          <View style={styles.commissionInputRow}>
            <Input
              value={commission.toString()}
              onChangeText={(text) => setCommission(parseFloat(text) || 0)}
              keyboardType="numeric"
              containerStyle={styles.commissionInput}
            />
            <Text style={styles.percentSign}>%</Text>
          </View>
          <Button
            title="Sauvegarder"
            size="small"
            onPress={handleSaveCommission}
            loading={saving}
            style={styles.saveCommissionButton}
          />
        </Card>

        {/* Pricing Rules */}
        <View style={styles.rulesHeader}>
          <Text style={styles.sectionTitle}>Tranches de distance</Text>
          <Button
            title="Ajouter"
            size="small"
            onPress={() => openModal()}
          />
        </View>

        {rules.length === 0 ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>Aucune règle de tarification</Text>
            </View>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.rule_id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <View style={styles.ruleDistance}>
                  <Ionicons name="navigate" size={20} color={COLORS.primary} />
                  <Text style={styles.ruleDistanceText}>
                    {rule.min_distance} - {rule.max_distance} km
                  </Text>
                </View>
                <Text style={styles.rulePrice}>{rule.price.toLocaleString()} F</Text>
              </View>
              <View style={styles.ruleActions}>
                <TouchableOpacity
                  style={styles.ruleAction}
                  onPress={() => openModal(rule)}
                >
                  <Ionicons name="pencil" size={18} color={COLORS.primary} />
                  <Text style={styles.ruleActionText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ruleAction}
                  onPress={() => handleDeleteRule(rule.rule_id)}
                >
                  <Ionicons name="trash" size={18} color={COLORS.error} />
                  <Text style={[styles.ruleActionText, { color: COLORS.error }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            Le prix affiché correspond au tarif total. Les gains du chauffeur seront calculés en déduisant la commission plateforme.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>

            <Input
              label="Distance minimum (km)"
              value={minDistance}
              onChangeText={setMinDistance}
              keyboardType="numeric"
              placeholder="0"
            />
            <Input
              label="Distance maximum (km)"
              value={maxDistance}
              onChangeText={setMaxDistance}
              keyboardType="numeric"
              placeholder="5"
            />
            <Input
              label="Prix (F)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="20000"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={closeModal}
                style={{ flex: 1 }}
              />
              <Button
                title="Sauvegarder"
                onPress={handleSaveRule}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commissionCard: {
    marginBottom: 24,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  commissionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commissionInput: {
    flex: 1,
    marginBottom: 0,
  },
  percentSign: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  saveCommissionButton: {
    marginTop: 16,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  ruleCard: {
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleDistanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  rulePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  ruleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleActionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
    marginBottom: 100,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
