import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
 
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { MediaTypeTabs, MediaType } from '../components/MediaTypeTabs';
import { HistoryService, HistoryEntry } from '../services/historyService';
import { getEditMode } from '../constants/editModes';
import { EditMode, EditModeCategory } from '../types/editModes';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { HistoryEntryCard } from '../components/HistoryEntryCard';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

const HistoryScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const scrollBottomPadding = useScrollBottomPadding();
  const styles = createStyles(theme, scrollBottomPadding);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EditMode | 'all'>('all');
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('image');

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

  // Filter entries by media type first, then by selected mode
  const filteredByMediaType = historyEntries.filter(entry => {
    const modeData = getEditMode(entry.editMode);
    if (!modeData) return false;
    
    const isVideoEntry = modeData.category === EditModeCategory.VIDEO;
    
    if (activeMediaType === 'image') {
      return !isVideoEntry; // Show non-video entries
    } else {
      return isVideoEntry; // Show video entries
    }
  });

  // Then filter by selected mode
  const filteredEntries = selectedFilter === 'all'
    ? filteredByMediaType
    : filteredByMediaType.filter(entry => entry.editMode === selectedFilter);

  // Get unique edit modes for filter buttons (filtered by media type)
  const uniqueModes = Array.from(new Set(filteredByMediaType.map(e => e.editMode)));

  // Calculate counts for each filter (using media-type filtered entries)
  const getModeCount = (mode: EditMode | 'all') => {
    if (mode === 'all') {
      return filteredByMediaType.length;
    }
    return filteredByMediaType.filter(entry => entry.editMode === mode).length;
  };

  const renderEntry = (entry: HistoryEntry, index: number) => {
    const isFirstInRow = index % 2 === 0;
    const isLastInRow = index % 2 === 1;

    return (
      <View
        key={entry.id}
        style={[
          {
            marginLeft: isFirstInRow ? 0 : theme.spacing.xs,
            marginRight: isLastInRow ? 0 : theme.spacing.xs,
          }
        ]}
      >
        <HistoryEntryCard
          entry={entry}
          onPress={handleEntryPress}
          onDelete={handleDeleteEntry}
          size={ITEM_SIZE}
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeMediaType === 'image' ? 'images-outline' : 'videocam-outline'} 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.typography.scaled.lg }]}>
        No History Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.scaled.base }]}>
        Your {activeMediaType === 'image' ? 'edited photos' : 'edited videos'} will appear here
      </Text>
    </View>
  );

  const renderFilterButtons = () => {
    if (filteredByMediaType.length === 0) return null;

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
              All ({getModeCount('all')})
            </Text>
          </TouchableOpacity>

          {/* Mode filters */}
          {uniqueModes.map(mode => {
            const modeData = getEditMode(mode);
            const isSelected = selectedFilter === mode;
            const count = getModeCount(mode);
            
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
                  {modeData?.name || mode} ({count})
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
        {/* Media Type Tabs */}
        <MediaTypeTabs activeTab={activeMediaType} onTabChange={(tab) => {
          setActiveMediaType(tab);
          setSelectedFilter('all'); // Reset filter when switching tabs
        }} />

        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* History Entries Grid */}
        {filteredEntries.length > 0 ? (
          <View style={styles.gridContainer}>
            {filteredEntries.map((entry, index) => (
              <View key={entry.id} style={{ marginBottom: theme.spacing.base }}>
                {renderEntry(entry, index)}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


const createStyles = (theme: Theme, scrollBottomPadding: number) =>
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
      // Use proper padding that accounts for floating tab bar
      paddingBottom: scrollBottomPadding,
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

