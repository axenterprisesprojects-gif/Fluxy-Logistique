import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '../constants/theme';

interface PhotoCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photo: string) => void;
  title: string;
  subtitle?: string;
  confirmButtonText?: string;
  type: 'pickup' | 'delivery';
}

export default function PhotoCapture({
  visible,
  onClose,
  onCapture,
  title,
  subtitle,
  confirmButtonText = 'Confirmer',
  type,
}: PhotoCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Permissions requises pour accéder à la caméra et à la galerie');
        }
        return false;
      }
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Image = asset.base64 
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhoto(base64Image);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur lors de la prise de photo');
      }
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Image = asset.base64 
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhoto(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur lors de la sélection de l\'image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (photo) {
      onCapture(photo);
      setPhoto(null);
      onClose();
    }
  };

  const handleClose = () => {
    setPhoto(null);
    onClose();
  };

  const isPickup = type === 'pickup';
  const accentColor = isPickup ? COLORS.primary : COLORS.secondary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: accentColor + '15' }]}>
                <Ionicons 
                  name={isPickup ? 'camera' : 'checkmark-circle'} 
                  size={32} 
                  color={accentColor} 
                />
              </View>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>

          {/* Photo Preview or Buttons */}
          {photo ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photo }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => setPhoto(null)}
              >
                <Ionicons name="refresh" size={20} color={COLORS.white} />
                <Text style={styles.retakeText}>Reprendre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.captureOptions}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={accentColor} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <>
                  {/* Camera Button */}
                  <TouchableOpacity 
                    style={[styles.captureButton, { backgroundColor: accentColor }]}
                    onPress={takePhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={32} color={COLORS.white} />
                    <Text style={styles.captureButtonText}>Prendre une photo</Text>
                  </TouchableOpacity>

                  {/* Gallery Button */}
                  <TouchableOpacity 
                    style={styles.galleryButton}
                    onPress={pickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images" size={24} color={COLORS.gray[600]} />
                    <Text style={styles.galleryButtonText}>Choisir dans la galerie</Text>
                  </TouchableOpacity>

                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    <Ionicons name="information-circle" size={20} color={COLORS.info} />
                    <Text style={styles.instructionsText}>
                      {isPickup 
                        ? 'Prenez une photo des articles récupérés pour confirmer'
                        : 'Prenez une photo de la livraison comme preuve'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Confirm Button */}
          {photo && (
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: accentColor }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
              <Text style={styles.confirmButtonText}>{confirmButtonText}</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    marginBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  captureOptions: {
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  captureButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  galleryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    marginBottom: 20,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
});
