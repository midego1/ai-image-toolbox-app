import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
 
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { HistoryService, HistoryEntry } from '../services/historyService';
import { getEditMode } from '../constants/editModes';
import { EditMode } from '../types/editModes';
import { haptic } from '../utils/haptics';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

const HistoryScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EditMode | 'all'>('all');

  const loadHistory = useCallback(async () => {
    try {
      const entries = await HistoryService.getHistoryEntries();
      setHistoryEntries(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Reload history whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleEntryPress = (entry: HistoryEntry) => {
    haptic.light();
    
    // Navigate to Result screen within the Features stack (nested under the Features tab)
    const params = {
      originalImage: entry.originalImageUri,
      transformedImage: entry.transformedImageUri,
      editMode: entry.editMode,
      config: entry.config,
      fromHistory: true,
      createdAt: entry.timestamp,
    } as const;

    // Navigate within the History stack so swipe-back returns to History
    navigation.navigate('Result', params);
  };

  const handleDeleteEntry = async (entry: HistoryEntry) => {
    haptic.medium();
    
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await HistoryService.removeHistoryEntry(entry.id);
              haptic.success();
              await loadHistory(); // Reload history
            } catch (error) {
              haptic.error();
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    haptic.medium();
    
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await HistoryService.clearHistory();
              haptic.success();
              setHistoryEntries([]);
              setSelectedFilter('all');
            } catch (error) {
              haptic.error();
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  // Filter entries by selected mode
  const filteredEntries = selectedFilter === 'all'
    ? historyEntries
    : historyEntries.filter(entry => entry.editMode === selectedFilter);

  // Get unique edit modes for filter buttons
  const uniqueModes = Array.from(new Set(historyEntries.map(e => e.editMode)));

  const renderEntry = (entry: HistoryEntry, index: number) => {
    const isFirstInRow = index % 2 === 0;
    const isLastInRow = index % 2 === 1;

    return (
      <TouchableOpacity
        key={entry.id}
        style={[
          styles.entryContainer,
          {
            marginLeft: isFirstInRow ? 0 : theme.spacing.xs,
            marginRight: isLastInRow ? 0 : theme.spacing.xs,
            marginBottom: theme.spacing.base,
          }
        ]}
        onPress={() => handleEntryPress(entry)}
        activeOpacity={0.8}
      >
        <View style={[styles.imageWrapper, { backgroundColor: theme.colors.surface }]}>
          <Image
            source={{ uri: entry.transformedImageUri }}
            style={styles.entryImage}
            resizeMode="cover"
            onError={(error) => {
              console.warn('[HistoryScreen] Failed to load image:', entry.id, error.nativeEvent.error);
            }}
          />
          
          {/* Edit mode badge */}
          <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
            <Text style={[styles.badgeIcon, { fontSize: 14, color: '#FFFFFF' }]}>{entry.editModeIcon}</Text>
            <Text style={[styles.badgeText, { color: '#FFFFFF', fontSize: theme.typography.scaled.xs }]} numberOfLines={1}>
              {entry.editModeName}
            </Text>
          </View>

          {/* Delete button */}
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteEntry(entry);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Timestamp */}
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {formatTimestamp(entry.timestamp)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.typography.scaled.lg }]}>
        No History Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.scaled.base }]}>
        Your edited photos will appear here
      </Text>
    </View>
  );

  const renderFilterButtons = () => {
    if (historyEntries.length === 0) return null;

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* All filter */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedFilter === 'all' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => {
              haptic.light();
              setSelectedFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedFilter === 'all' ? '#FFFFFF' : theme.colors.text,
                  fontSize: theme.typography.scaled.sm,
                }
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Mode filters */}
          {uniqueModes.map(mode => {
            const modeData = getEditMode(mode);
            const isSelected = selectedFilter === mode;
            
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => {
                  haptic.light();
                  setSelectedFilter(mode);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, marginRight: 4 }}>{modeData?.icon}</Text>
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.text,
                      fontSize: theme.typography.scaled.sm,
                    }
                  ]}
                >
                  {modeData?.name || mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader
        title="History"
        backgroundColor={theme.colors.backgroundSecondary}
        rightAction={
          historyEntries.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearHistory}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* History Entries Grid */}
        {filteredEntries.length > 0 ? (
          <View style={styles.gridContainer}>
            {filteredEntries.map((entry, index) => renderEntry(entry, index))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: theme.spacing.base,
      paddingBottom: theme.spacing['3xl'],
    },
    filterContainer: {
      marginBottom: theme.spacing.base,
    },
    filterScrollContent: {
      paddingHorizontal: theme.spacing.base,
      gap: theme.spacing.xs,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: theme.spacing.xs,
    },
    filterText: {
      fontWeight: theme.typography.weight.semibold,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: theme.spacing.base,
      justifyContent: 'space-between',
    },
    entryContainer: {
      width: ITEM_SIZE,
    },
    imageWrapper: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    entryImage: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    badgeIcon: {
      marginRight: 2,
    },
    badgeText: {
      flex: 1,
      fontWeight: theme.typography.weight.medium,
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      borderRadius: 12,
      padding: 2,
    },
    timestamp: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.scaled.xs,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing['3xl'],
      paddingHorizontal: theme.spacing.base,
    },
    emptyTitle: {
      marginTop: theme.spacing.base,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.xs,
    },
    emptySubtitle: {
      textAlign: 'center',
    },
  });

export default HistoryScreen;

