import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { ClothingItem } from '../services/processors/virtualTryOnProcessor';
import { CLOTHING_TYPES } from '../constants/clothingTypes';

interface OutfitSummaryCardProps {
  items: ClothingItem[];
}

export const OutfitSummaryCard: React.FC<OutfitSummaryCardProps> = ({ items }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      padding: spacing.base,
      borderRadius: 12,
      borderWidth: 1,
    }]}>
      <Text style={[styles.title, {
        color: colors.text,
        fontSize: typography.scaled.base,
        fontWeight: typography.weight.bold,
        marginBottom: spacing.md,
      }]}>
        Outfit Components
      </Text>
      
      <View style={styles.itemsList}>
        {items.map((item, index) => {
          const typeData = CLOTHING_TYPES[item.type];
          // Safety check - if type doesn't exist, use fallback
          if (!typeData) {
            console.warn('[OutfitSummaryCard] Unknown clothing type:', item.type);
            return null;
          }
          return (
            <View key={index} style={[styles.itemRow, {
              paddingVertical: spacing.xs,
            }]}>
              <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
                {typeData.icon}
              </Text>
              <Text style={[styles.itemText, {
                color: colors.text,
                fontSize: typography.scaled.sm,
              }]}>
                {typeData.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Dynamic styles applied inline
  },
  title: {
    // Dynamic styles applied inline
  },
  itemsList: {
    // Dynamic styles applied inline
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    // Dynamic styles applied inline
  },
});

