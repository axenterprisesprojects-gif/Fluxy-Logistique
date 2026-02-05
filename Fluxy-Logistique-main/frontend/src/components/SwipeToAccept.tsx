import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface SwipeToAcceptProps {
  onAccept: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const BUTTON_WIDTH = Dimensions.get('window').width - 80; // Account for padding
const THUMB_SIZE = 56;
const SWIPE_THRESHOLD = BUTTON_WIDTH - THUMB_SIZE - 20;

export default function SwipeToAccept({ onAccept, disabled = false, loading = false }: SwipeToAcceptProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !loading && !swiped,
      onMoveShouldSetPanResponder: () => !disabled && !loading && !swiped,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= SWIPE_THRESHOLD) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD * 0.8) {
          // Swipe completed
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
          }).start(() => {
            setSwiped(true);
            onAccept();
          });
        } else {
          // Reset
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const opacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [1, 0],
  });

  if (disabled) {
    return (
      <View style={[styles.container, styles.containerDisabled]}>
        <Text style={styles.disabledText}>Profil non validé</Text>
      </View>
    );
  }

  if (loading || swiped) {
    return (
      <View style={[styles.container, styles.containerSuccess]}>
        <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
        <Text style={styles.successText}>{loading ? 'Acceptation...' : 'Accepté !'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background text */}
      <Animated.Text style={[styles.swipeText, { opacity }]}>
        Glisser pour accepter →
      </Animated.Text>
      
      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="chevron-forward" size={28} color={COLORS.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: COLORS.secondary + '20',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  containerDisabled: {
    backgroundColor: COLORS.gray[200],
  },
  containerSuccess: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    gap: 8,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  disabledText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE - 8,
    height: THUMB_SIZE - 8,
    borderRadius: (THUMB_SIZE - 8) / 2,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
