import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { HistoryService, HistoryEntry } from '../services/historyService';
import { EditMode } from '../types/editModes';
import { haptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { HistoryEntryCard } from './HistoryEntryCard';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

interface ToolHistoryTabProps {
  editMode: EditMode; // The specific tool this history is for
  title?: string;
}

export const ToolHistoryTab: React.FC<ToolHistoryTabProps> = ({
  editMode,
  title = 'Your History',
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<any>();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const entries = await HistoryService.getHistoryEntriesByMode(editMode);
      setHistoryEntries(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, [editMode]);

  // Reload when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleEntryPress = (entry: HistoryEntry) => {
    haptic.light();
    navigation.navigate('Result', {
      originalImage: entry.originalImageUri,
      transformedImage: entry.transformedImageUri,
      editMode: entry.editMode,
      config: entry.config,
      fromHistory: true,
      createdAt: entry.timestamp,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (historyEntries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { padding: spacing.xl }]}>
        <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text, marginTop: spacing.md }]}>
          No History Yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: spacing.xs, paddingHorizontal: spacing.base }]}>
          Your {title.toLowerCase()} will appear here once you create your first result.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text, marginBottom: spacing.md }]}>
        {title} ({historyEntries.length})
      </Text>

      <View style={styles.grid}>
        {historyEntries.map((entry) => (
          <HistoryEntryCard
            key={entry.id}
            entry={entry}
            onPress={handleEntryPress}
            size={ITEM_SIZE}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

