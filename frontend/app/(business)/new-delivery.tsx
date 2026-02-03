import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useApi } from '../../src/hooks/useApi';
import { showAlert } from '../../src/utils/alert';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';
import { COLORS, SHADOWS } from '../../src/constants/theme';

// Libreville neighborhoods
const LIBREVILLE_NEIGHBORHOODS = [
  'Akanda', 'Alibandeng', 'Angondjé', 'Awendjé', 'Batterie IV',
  'Belle-Vue', 'Charbonnages', 'Cocotiers', 'Derrière la Prison',
  'Glass', 'Gros-Bouquet', 'IAI', 'Kinguélé', 'La Peyrie',
  'La Sablière', 'Lalala', 'Likouala', 'Louis', 'Malibé 1',
  'Malibé 2', 'Mindoubé', 'Montagne Sainte', 'Mont-Bouët',
  'Nkembo', 'Nombakélé', 'Nzeng-Ayong', 'Okala', 'Oloumi',
  'Ondogo', 'Owendo', 'PK5', 'PK6', 'PK7', 'PK8', 'PK9',
  'PK10', 'PK11', 'PK12', 'Plaine Orety', 'Quaben',
  'Quartier Louis', 'Rio', 'Sibang', 'SNI', 'Sotega',
  'Trois-Quartiers', 'Val Marie', 'Venez-Voir'
].sort();

// Time slots for pickup
const ALL_TIME_SLOTS = [
  { id: '08-09', label: '08h - 09h', startHour: 8, pickup: '08h-09h', delivery: '08h-10h' },
  { id: '09-10', label: '09h - 10h', startHour: 9, pickup: '09h-10h', delivery: '09h-11h' },
  { id: '10-11', label: '10h - 11h', startHour: 10, pickup: '10h-11h', delivery: '10h-12h' },
  { id: '11-12', label: '11h - 12h', startHour: 11, pickup: '11h-12h', delivery: '11h-13h' },
  { id: '12-13', label: '12h - 13h', startHour: 12, pickup: '12h-13h', delivery: '12h-14h' },
  { id: '13-14', label: '13h - 14h', startHour: 13, pickup: '13h-14h', delivery: '13h-15h' },
  { id: '14-15', label: '14h - 15h', startHour: 14, pickup: '14h-15h', delivery: '14h-16h' },
  { id: '15-16', label: '15h - 16h', startHour: 15, pickup: '15h-16h', delivery: '15h-17h' },
  { id: '16-17', label: '16h - 17h', startHour: 16, pickup: '16h-17h', delivery: '16h-18h' },
  { id: '17-18', label: '17h - 18h', startHour: 17, pickup: '17h-18h', delivery: '17h-19h' },
  { id: '18-19', label: '18h - 19h', startHour: 18, pickup: '18h-19h', delivery: '18h-20h' },
];

// Days options
const DAYS_OPTIONS = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'after_tomorrow', label: 'Après-demain' },
];

const DEFAULT_PRICE = 25000;
const PRICE_STEP = 5000;
const MIN_PRICE = 10000;
const MAX_PRICE = 100000;

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
  
  // Delivery form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [destinationArea, setDestinationArea] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<typeof ALL_TIME_SLOTS[0] | null>(null);
  const [price, setPrice] = useState(DEFAULT_PRICE);
  
  // Modals
  const [neighborhoodModalVisible, setNeighborhoodModalVisible] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [timeSlotModalVisible, setTimeSlotModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);

  const needsProfileSetup = !user?.business_address;

  // Filter neighborhoods based on search
  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoodSearch.trim()) return LIBREVILLE_NEIGHBORHOODS;
    const search = neighborhoodSearch.toLowerCase();
    return LIBREVILLE_NEIGHBORHOODS.filter(n => n.toLowerCase().includes(search));
  }, [neighborhoodSearch]);

  // Filter time slots based on current time (only for today)
  const availableTimeSlots = useMemo(() => {
    if (selectedDay !== 'today') {
      // For tomorrow or after, all slots are available
      return ALL_TIME_SLOTS;
    }
    // For today, filter out past time slots
    const currentHour = new Date().getHours();
    return ALL_TIME_SLOTS.filter(slot => slot.startHour > currentHour);
  }, [selectedDay]);

  // Get selected day label
  const getSelectedDayLabel = () => {
    const day = DAYS_OPTIONS.find(d => d.id === selectedDay);
    return day?.label || "Aujourd'hui";
  };

  const handleSaveProfile = async () => {
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
      setStep(2);
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de sauvegarder le profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (increment: boolean) => {
    setPrice(prev => {
      const newPrice = increment ? prev + PRICE_STEP : prev - PRICE_STEP;
      return Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
    });
  };

  const handleCreateDelivery = async () => {
    if (!customerName.trim()) {
      showAlert('Erreur', 'Veuillez entrer le nom du client');
      return;
    }
    if (!customerPhone.trim()) {
      showAlert('Erreur', 'Veuillez entrer le numéro du client');
      return;
    }
    if (!itemDescription.trim()) {
      showAlert('Erreur', 'Veuillez décrire les articles à livrer');
      return;
    }
    if (!destinationArea.trim()) {
      showAlert('Erreur', 'Veuillez sélectionner le quartier de livraison');
      return;
    }
    if (!selectedTimeSlot) {
      showAlert('Erreur', 'Veuillez sélectionner une tranche horaire');
      return;
    }

    try {
      setLoading(true);
      const result = await createDelivery({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        item_description: itemDescription.trim(),
        destination_area: destinationArea.trim(),
        pickup_time_slot: selectedTimeSlot.pickup,
        delivery_time_slot: selectedTimeSlot.delivery,
        total_price: price,
      });
      
      if (Platform.OS === 'web') {
        window.alert(`Demande créée avec succès!\n\nCode: ${result.delivery_code}\nPrix: ${price.toLocaleString()} F`);
        router.push('/(business)/');
      } else {
        showAlert('Succès', `Demande créée!\nCode: ${result.delivery_code}`, () => {
          router.push('/(business)/');
        });
      }
    } catch (error: any) {
      showAlert('Erreur', error.message || 'Impossible de créer la livraison');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle livraison</Text>
          <View style={{ width: 40 }} />
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

        {/* Delivery Details */}
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

          {/* Neighborhood Selector */}
          <Text style={styles.inputLabel}>Quartier de livraison</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setNeighborhoodModalVisible(true)}
          >
            <Ionicons name="flag" size={20} color={destinationArea ? COLORS.secondary : COLORS.gray[400]} />
            <Text style={[styles.selectorText, !destinationArea && styles.selectorPlaceholder]}>
              {destinationArea || 'Sélectionner un quartier'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </Card>

        {/* Time Slots */}
        <Text style={styles.sectionTitle}>Jour et horaire de récupération</Text>
        <Card style={styles.formCard}>
          {/* Day Selector */}
          <Text style={styles.inputLabel}>Jour de récupération</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setDayModalVisible(true)}
          >
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.selectorText}>
              {getSelectedDayLabel()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Time Slot Selector */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Tranche horaire</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {
              if (availableTimeSlots.length === 0) {
                showAlert('Information', 'Aucune tranche horaire disponible pour aujourd\'hui. Veuillez sélectionner demain ou après-demain.');
              } else {
                setTimeSlotModalVisible(true);
              }
            }}
          >
            <Ionicons name="time" size={20} color={selectedTimeSlot ? COLORS.warning : COLORS.gray[400]} />
            <Text style={[styles.selectorText, !selectedTimeSlot && styles.selectorPlaceholder]}>
              {selectedTimeSlot ? selectedTimeSlot.label : (availableTimeSlots.length === 0 ? 'Aucune tranche disponible' : 'Sélectionner une tranche horaire')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Info about available slots */}
          {selectedDay === 'today' && availableTimeSlots.length === 0 && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
              <Text style={styles.warningText}>
                Il est trop tard pour planifier une récupération aujourd'hui. Veuillez choisir demain.
              </Text>
            </View>
          )}

          {/* Auto-calculated delivery time */}
          {selectedTimeSlot && (
            <View style={styles.deliveryTimeBox}>
              <Ionicons name="bicycle" size={18} color={COLORS.secondary} />
              <View style={styles.deliveryTimeContent}>
                <Text style={styles.deliveryTimeLabel}>Heure de livraison estimée</Text>
                <Text style={styles.deliveryTimeValue}>{getSelectedDayLabel()} - {selectedTimeSlot.delivery}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Price Selector */}
        <Text style={styles.sectionTitle}>Prix de la livraison</Text>
        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <TouchableOpacity
              style={[styles.priceButton, price <= MIN_PRICE && styles.priceButtonDisabled]}
              onPress={() => handlePriceChange(false)}
              disabled={price <= MIN_PRICE}
            >
              <Ionicons name="remove" size={28} color={price <= MIN_PRICE ? COLORS.gray[300] : COLORS.error} />
            </TouchableOpacity>

            <View style={styles.priceCenter}>
              <Text style={styles.priceValue}>{price.toLocaleString()} F</Text>
              <Text style={styles.priceCurrency}>CFA</Text>
            </View>

            <TouchableOpacity
              style={[styles.priceButton, price >= MAX_PRICE && styles.priceButtonDisabled]}
              onPress={() => handlePriceChange(true)}
              disabled={price >= MAX_PRICE}
            >
              <Ionicons name="add" size={28} color={price >= MAX_PRICE ? COLORS.gray[300] : COLORS.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.priceHint}>Ajustez le prix par tranche de {PRICE_STEP.toLocaleString()} F</Text>
        </Card>

        {/* Submit */}
        <Button
          title="Créer la demande"
          onPress={handleCreateDelivery}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Neighborhood Modal */}
      <Modal
        visible={neighborhoodModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNeighborhoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quartier de livraison</Text>
              <TouchableOpacity onPress={() => setNeighborhoodModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.gray[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un quartier..."
                value={neighborhoodSearch}
                onChangeText={setNeighborhoodSearch}
                autoFocus
              />
              {neighborhoodSearch.length > 0 && (
                <TouchableOpacity onPress={() => setNeighborhoodSearch('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filteredNeighborhoods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.neighborhoodItem, destinationArea === item && styles.neighborhoodItemSelected]}
                  onPress={() => {
                    setDestinationArea(item);
                    setNeighborhoodModalVisible(false);
                    setNeighborhoodSearch('');
                  }}
                >
                  <Text style={[styles.neighborhoodText, destinationArea === item && styles.neighborhoodTextSelected]}>
                    {item}
                  </Text>
                  {destinationArea === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>Aucun quartier trouvé</Text>
                </View>
              }
              style={styles.neighborhoodList}
            />
          </View>
        </View>
      </Modal>

      {/* Time Slot Modal */}
      <Modal
        visible={timeSlotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeSlotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Heure de récupération</Text>
              <TouchableOpacity onPress={() => setTimeSlotModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedDay === 'today' 
                ? `Créneaux disponibles pour aujourd'hui (après ${new Date().getHours()}h)`
                : `Tous les créneaux disponibles pour ${getSelectedDayLabel().toLowerCase()}`}
            </Text>

            <ScrollView style={styles.timeSlotList}>
              {availableTimeSlots.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="time-outline" size={48} color={COLORS.gray[300]} />
                  <Text style={styles.emptyText}>Aucun créneau disponible</Text>
                  <Text style={styles.emptySubtext}>Veuillez sélectionner un autre jour</Text>
                </View>
              ) : (
                availableTimeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.timeSlotItem, selectedTimeSlot?.id === slot.id && styles.timeSlotItemSelected]}
                    onPress={() => {
                      setSelectedTimeSlot(slot);
                      setTimeSlotModalVisible(false);
                    }}
                  >
                    <View style={styles.timeSlotLeft}>
                      <View style={[styles.timeSlotIcon, selectedTimeSlot?.id === slot.id && styles.timeSlotIconSelected]}>
                        <Ionicons name="time" size={18} color={selectedTimeSlot?.id === slot.id ? COLORS.white : COLORS.warning} />
                      </View>
                      <View>
                        <Text style={[styles.timeSlotLabel, selectedTimeSlot?.id === slot.id && styles.timeSlotLabelSelected]}>
                          Récupération: {slot.pickup}
                        </Text>
                        <Text style={styles.timeSlotDelivery}>
                          Livraison: {slot.delivery}
                        </Text>
                      </View>
                    </View>
                    {selectedTimeSlot?.id === slot.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Day Selection Modal */}
      <Modal
        visible={dayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Jour de récupération</Text>
              <TouchableOpacity onPress={() => setDayModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timeSlotList}>
              {DAYS_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.timeSlotItem, selectedDay === day.id && styles.timeSlotItemSelected]}
                  onPress={() => {
                    setSelectedDay(day.id);
                    // Reset time slot when day changes
                    setSelectedTimeSlot(null);
                    setDayModalVisible(false);
                  }}
                >
                  <View style={styles.timeSlotLeft}>
                    <View style={[styles.timeSlotIcon, selectedDay === day.id && styles.timeSlotIconSelected]}>
                      <Ionicons name="calendar" size={18} color={selectedDay === day.id ? COLORS.white : COLORS.primary} />
                    </View>
                    <Text style={[styles.timeSlotLabel, selectedDay === day.id && styles.timeSlotLabelSelected]}>
                      {day.label}
                    </Text>
                  </View>
                  {selectedDay === day.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  selectorPlaceholder: {
    color: COLORS.gray[400],
  },
  deliveryTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  deliveryTimeContent: {
    flex: 1,
  },
  deliveryTimeLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  deliveryTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 2,
  },
  priceCard: {
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  priceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  priceButtonDisabled: {
    opacity: 0.5,
  },
  priceCenter: {
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceCurrency: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  priceHint: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  neighborhoodList: {
    maxHeight: 400,
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  neighborhoodItemSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    marginVertical: 2,
  },
  neighborhoodText: {
    fontSize: 15,
    color: COLORS.gray[700],
  },
  neighborhoodTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[400],
  },
  timeSlotList: {
    maxHeight: 400,
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  timeSlotItemSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginVertical: 4,
    borderBottomWidth: 0,
  },
  timeSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeSlotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotIconSelected: {
    backgroundColor: COLORS.warning,
  },
  timeSlotLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  timeSlotLabelSelected: {
    color: COLORS.primary,
  },
  timeSlotDelivery: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
});
