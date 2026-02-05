import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

type Status = 'pending' | 'accepted' | 'pickup_confirmed' | 'delivered' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: 'En attente',
    color: COLORS.warning,
    bgColor: '#FEF3C7',
  },
  accepted: {
    label: 'Acceptée',
    color: COLORS.info,
    bgColor: '#DBEAFE',
  },
  pickup_confirmed: {
    label: 'Récupérée',
    color: COLORS.primary,
    bgColor: '#E0E7FF',
  },
  delivered: {
    label: 'Livrée',
    color: COLORS.success,
    bgColor: '#D1FAE5',
  },
  cancelled: {
    label: 'Annulée',
    color: COLORS.error,
    bgColor: '#FEE2E2',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
