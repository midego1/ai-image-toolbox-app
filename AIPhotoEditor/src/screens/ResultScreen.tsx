import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions, Share, Alert, ScrollView, Text, TouchableOpacity, Animated, ViewStyle, Modal, Pressable, Easing, FlatList, ViewToken, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { OutfitSummaryCard } from '../components/OutfitSummaryCard';
import { ZoomableImage } from '../components/ZoomableImage';
import { OptionsUsed } from '../components/OptionsUsed';
import { getOptionsSchema } from '../components/optionsSchemas';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { ClothingItem } from '../services/processors/virtualTryOnProcessor';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { HistoryService, HistoryEntry } from '../services/historyService';
import { AnalyticsService } from '../services/analyticsService';
import { formatCreditCostText } from '../utils/creditCost';

const { width, height } = Dimensions.get('window');

const ResultScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scrollBottomPadding = useScrollBottomPadding();
  const insets = useSafeAreaInsets();
  const IMAGE_HEIGHT = height * 0.38; // Reduced from 0.5 to 0.45 for better balance
  const navigation = useNavigation<NavigationProp<'MainTabs'>>();
  const route = useRoute<RouteProp<'Result'>>();

  // Calculate proper spacing for thumbnail strip to sit above tab bar
  // Match exact floating tab bar positioning from NativeFloatingTabBar.tsx
  // Tab bar bottom position: 20 + Math.max(insets.bottom - 8, 0)
  // Tab bar height: 52px (minHeight)
  const TAB_BAR_HEIGHT = 52;
  const TAB_BAR_BOTTOM_OFFSET = 20 + Math.max(insets.bottom - 8, 0);
  const basePadding = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + spacing.xs;
  const thumbnailStripPadding = basePadding * 0.55; // Tighter spacing - closer to tab bar
  
  // Extract route params reactively using useMemo so they update when route changes
  const routeParams = React.useMemo(() => {
    try {
      const params = route.params;
      if (!params) {
        return {
          originalImage: '',
          transformedImage: '',
          editMode: EditMode.TRANSFORM,
          config: undefined,
          fromHistory: false,
          createdAt: undefined,
          creationId: undefined,
        };
      }
      const result = {
        originalImage: params.originalImage || '',
        transformedImage: params.transformedImage || '',
        editMode: params.editMode || EditMode.TRANSFORM,
        config: params.config,
        fromHistory: params.fromHistory || false,
        createdAt: params.createdAt,
        creationId: params.creationId,
      };
      console.log('[ResultScreen] Route params extracted:', {
        hasOriginalImage: !!result.originalImage,
        hasTransformedImage: !!result.transformedImage,
        editMode: result.editMode,
        hasConfig: !!result.config,
        fromHistory: result.fromHistory,
        hasCreatedAt: !!result.createdAt,
        hasCreationId: !!result.creationId,
        creationId: result.creationId,
      });
      return result;
    } catch (error: any) {
      console.error('[ResultScreen] Error reading route params:', error);
      return {
        originalImage: '',
        transformedImage: '',
        editMode: EditMode.TRANSFORM,
        config: undefined,
        fromHistory: false,
        createdAt: undefined,
        creationId: undefined,
      };
    }
  }, [route.params]);

  const { originalImage, transformedImage, editMode, config, fromHistory, createdAt, creationId } = routeParams;
  
  const modeData = getEditMode(editMode);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
  } | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [itemFileSizes, setItemFileSizes] = useState<Map<string, number>>(new Map());
  const isFree = transformedImage.includes('base64');

  // Before/After slider state
  const [sliderPosition, setSliderPosition] = useState(1.0); // 0 = original, 1 = result (default shows result)
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  // History carousel state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'current'>('all');
  const [entryFoundInHistory, setEntryFoundInHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const thumbnailListRef = useRef<FlatList>(null);
  const currentEntryIdRef = useRef<string | null>(null);

  // Current entry data (derived from currentIndex or route params)
  // IMPORTANT: Only use history entry if we actually found it in history, otherwise use route params
  const currentEntry = entryFoundInHistory && filteredEntries.length > 0 && currentIndex >= 0 && currentIndex < filteredEntries.length
    ? filteredEntries[currentIndex]
    : null;

  // Use current entry data if available, otherwise fall back to route params
  const displayOriginalImage = currentEntry?.originalImageUri || originalImage;
  const displayTransformedImage = currentEntry?.transformedImageUri || transformedImage;
  const displayEditMode = currentEntry?.editMode || editMode;
  const displayConfig = currentEntry?.config || config;
  const displayCreatedAt = currentEntry?.timestamp || createdAt;
  const displayModeData = getEditMode(displayEditMode);
  const displayIsFree = displayTransformedImage.includes('base64');

  // Debug logging
  console.log('[ResultScreen] Display state:', {
    entryFoundInHistory,
    hasCurrentEntry: !!currentEntry,
    currentIndex,
    filteredEntriesCount: filteredEntries.length,
    usingHistoryImage: !!currentEntry,
    transformedImageSource: currentEntry ? 'history' : 'route params',
    displayTransformedImage: displayTransformedImage?.substring(0, 50) + '...',
    routeTransformedImage: transformedImage?.substring(0, 50) + '...',
  });
  
  // Virtual Try-On specific data (from current entry if available)
  const displayIsVirtualTryOn = displayEditMode === EditMode.VIRTUAL_TRY_ON;
  const displayClothingItems = displayConfig?.clothingItems as ClothingItem[] | undefined;

  // Animated gentle wobble (tilt) for diamond icon only
  const wobbleValue = useRef(new Animated.Value(0)).current;
  const diamondRotate = wobbleValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '8deg', '0deg'] });

  React.useEffect(() => {
    // Only animate when there is a cost (e.g., "1 cost")
    if (getCreditCostText()) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wobbleValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wobbleValue, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        wobbleValue.setValue(0);
      };
    }
  }, [modeData]);

  // Load image dimensions to calculate dynamic aspect ratio
  React.useEffect(() => {
    const loadImageDimensions = async () => {
      const imageUri = showOriginal ? displayOriginalImage : displayTransformedImage;
      if (!imageUri) {
        setImageDimensions(null);
        return;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          Image.getSize(
            imageUri,
            (width, height) => {
              if (width > 0 && height > 0) {
                const aspectRatio = width / height;
                setImageDimensions({ width, height, aspectRatio });
                console.log('[ResultScreen] Loaded image dimensions:', { width, height, aspectRatio });
              } else {
                console.warn('[ResultScreen] Invalid image dimensions:', { width, height });
                setImageDimensions({ width: 4, height: 3, aspectRatio: 4 / 3 });
              }
              resolve();
            },
            (error) => {
              console.error('[ResultScreen] Error loading image dimensions:', error);
              // Fallback to default 4:3 if loading fails
              setImageDimensions({ width: 4, height: 3, aspectRatio: 4 / 3 });
              resolve(); // Don't reject, just use fallback
            }
          );
        });
      } catch (error) {
        console.error('[ResultScreen] Error in loadImageDimensions:', error);
        // Fallback to default 4:3
        setImageDimensions({ width: 4, height: 3, aspectRatio: 4 / 3 });
      }
    };

    loadImageDimensions();
  }, [displayOriginalImage, displayTransformedImage, showOriginal]);

  // Load file size for the transformed image
  React.useEffect(() => {
    const loadFileSize = async () => {
      const imageUri = displayTransformedImage;
      if (!imageUri) {
        setFileSize(null);
        return;
      }

      try {
        // Handle base64 images - estimate size from base64 string length
        if (imageUri.includes('base64')) {
          const base64Data = imageUri.split(',')[1] || '';
          // Base64 encoding increases size by ~33%, so decode length * 0.75 gives approximate original size
          const estimatedSize = Math.floor(base64Data.length * 0.75);
          setFileSize(estimatedSize);
          return;
        }

        // Handle file:// URIs
        if (imageUri.startsWith('file://') || !imageUri.startsWith('http')) {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (fileInfo.exists && fileInfo.size !== undefined) {
            setFileSize(fileInfo.size);
          } else {
            setFileSize(null);
          }
          return;
        }

        // For remote URLs, we can't easily get file size without downloading
        // Set to null for now
        setFileSize(null);
      } catch (error) {
        console.error('[ResultScreen] Error loading file size:', error);
        setFileSize(null);
      }
    };

    loadFileSize();
  }, [displayTransformedImage]);

  // Save to history when result screen loads (only once, and not if coming from history)
  React.useEffect(() => {
    if (!fromHistory && !historySaved && originalImage && transformedImage && modeData) {
      HistoryService.addHistoryEntry(
        originalImage,
        transformedImage,
        editMode,
        modeData.name,
        modeData.icon,
        config,
        createdAt,
        creationId
      ).then(async () => {
        setHistorySaved(true);
        console.log('[ResultScreen] Saved to history, reloading history entries...');

        // Reload history to include the newly saved entry
        try {
          const updatedEntries = await HistoryService.getHistoryEntries();
          setHistoryEntries(updatedEntries);

          // Find the newly saved entry by unique creationId (most reliable!)
          let newEntryIndex = -1;

          if (creationId) {
            // Search by unique creation ID - this is 100% accurate
            newEntryIndex = updatedEntries.findIndex(entry =>
              entry.creationId === creationId
            );
            console.log('[ResultScreen] Search by creationId:', creationId, '- found at index:', newEntryIndex);
          } else {
            // Fallback: search by transformedImageUri (for backwards compatibility)
            // When searching by URI, prefer the most recent match (entries are sorted newest first)
            // Also prefer matches with similar timestamps if createdAt is available
            if (createdAt) {
              // Find matches with similar timestamp (within 5 seconds) - prefer the closest match
              const matchingEntries = updatedEntries
                .map((entry, index) => ({ entry, index }))
                .filter(({ entry }) => entry.transformedImageUri === transformedImage)
                .map(({ entry, index }) => ({
                  index,
                  timeDiff: Math.abs(entry.timestamp - createdAt)
                }))
                .sort((a, b) => a.timeDiff - b.timeDiff); // Sort by time difference (closest first)
              
              if (matchingEntries.length > 0) {
                newEntryIndex = matchingEntries[0].index;
                console.log('[ResultScreen] No creationId, fallback search by transformedImageUri with timestamp matching - found at index:', newEntryIndex);
              } else {
                // No timestamp match, find all matches and select the most recent one (highest timestamp)
                const allMatches = updatedEntries
                  .map((entry, index) => ({ entry, index }))
                  .filter(({ entry }) => entry.transformedImageUri === transformedImage)
                  .sort((a, b) => b.entry.timestamp - a.entry.timestamp); // Sort by timestamp descending (newest first)
                
                if (allMatches.length > 0) {
                  newEntryIndex = allMatches[0].index;
                  console.log('[ResultScreen] No creationId, fallback search by transformedImageUri (no timestamp match) - found', allMatches.length, 'matches, selected most recent at index:', newEntryIndex);
                }
              }
            } else {
              // No createdAt available, find all matches and select the most recent one (highest timestamp)
              const allMatches = updatedEntries
                .map((entry, index) => ({ entry, index }))
                .filter(({ entry }) => entry.transformedImageUri === transformedImage)
                .sort((a, b) => b.entry.timestamp - a.entry.timestamp); // Sort by timestamp descending (newest first)
              
              if (allMatches.length > 0) {
                newEntryIndex = allMatches[0].index;
                console.log('[ResultScreen] No creationId, fallback search by transformedImageUri - found', allMatches.length, 'matches, selected most recent at index:', newEntryIndex);
              }
            }
          }

          if (newEntryIndex >= 0) {
            setCurrentIndex(newEntryIndex);
            setEntryFoundInHistory(true);
            currentEntryIdRef.current = updatedEntries[newEntryIndex].id;
            console.log('[ResultScreen] Found newly saved entry at index:', newEntryIndex, 'with ID:', updatedEntries[newEntryIndex].id);
          } else {
            console.warn('[ResultScreen] Could not find newly saved entry in history!');
          }
        } catch (error) {
          console.error('[ResultScreen] Failed to reload history after save:', error);
        }
      }).catch(error => {
        console.error('[ResultScreen] Failed to save to history:', error);
        // Non-critical, don't block UI
      });
    }
  }, [fromHistory, historySaved, originalImage, transformedImage, editMode, modeData, config, createdAt, creationId]);

  // Reset entryFoundInHistory when route params change (fresh completion)
  useEffect(() => {
    // When route params change (especially creationId or transformedImage), reset state to use route params
    // This ensures fresh completions always show the current result, not a previous one
    setEntryFoundInHistory(false);
    console.log('[ResultScreen] Route params changed, resetting entryFoundInHistory to false');
  }, [creationId, transformedImage]);

  // Load history entries and find current position
  // Skip if we just saved to history (save effect handles it)
  useEffect(() => {
    if (historySaved) {
      console.log('[ResultScreen] Skipping initial history load - save effect already handled it');
      return;
    }

    const loadHistoryAndFindIndex = async () => {
      try {
        setIsLoadingHistory(true);
        const entries = await HistoryService.getHistoryEntries();
        setHistoryEntries(entries);
        
        // Find the current entry's index - prioritize creationId, then newest by timestamp
        const currentCreationId = creationId;
        const currentTransformed = transformedImage;
        const currentCreatedAt = createdAt;

        let foundIndex = -1;

        // First try to find by creationId (most reliable - ensures we get the exact match)
        if (currentCreationId && entries.length > 0) {
          foundIndex = entries.findIndex(entry => entry.creationId === currentCreationId);
          console.log('[ResultScreen] Initial load search by creationId:', currentCreationId, '- found at index:', foundIndex);
        }

        // Fallback: search by transformed image URI (for backwards compatibility)
        // CRITICAL: When searching by URI, ALWAYS prefer the most recent match by timestamp
        // This ensures we don't show old completions when multiple entries share the same URI
        if (foundIndex < 0 && currentTransformed && entries.length > 0) {
          // Find all entries with matching URI and creationId (if available) or just matching URI
          let candidateEntries = entries
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => entry.transformedImageUri === currentTransformed);

          // If we have a creationId, prioritize entries that DON'T match it (to avoid old entries)
          // But if no creationId match found, we'll use the most recent by timestamp
          if (currentCreationId) {
            // First try entries that match creationId (shouldn't happen if we got here, but double-check)
            const creationIdMatch = candidateEntries.find(({ entry }) => entry.creationId === currentCreationId);
            if (creationIdMatch) {
              foundIndex = creationIdMatch.index;
              console.log('[ResultScreen] Found match by creationId in URI candidates at index:', foundIndex);
            }
          }

          // If still no match, use timestamp to find the most recent entry
          if (foundIndex < 0 && candidateEntries.length > 0) {
            if (currentCreatedAt) {
              // Prefer entries with similar timestamp (within 10 seconds) and closest match
              // This helps when the same image is processed multiple times
              const matchingEntries = candidateEntries
                .map(({ entry, index }) => ({
                  index,
                  timeDiff: Math.abs(entry.timestamp - currentCreatedAt),
                  timestamp: entry.timestamp
                }))
                .sort((a, b) => {
                  // First sort by time difference (closest first)
                  // But if time difference is similar (within 10s), prefer higher timestamp (newer)
                  if (Math.abs(a.timeDiff - b.timeDiff) < 10) {
                    return b.timestamp - a.timestamp; // Newer first if time diff is similar
                  }
                  return a.timeDiff - b.timeDiff; // Closest timestamp first
                });
              
              if (matchingEntries.length > 0 && matchingEntries[0].timeDiff <= 10) {
                // Only use if timestamp is close (within 10 seconds)
                foundIndex = matchingEntries[0].index;
                console.log('[ResultScreen] Initial load fallback search by transformedImageUri with timestamp matching - found at index:', foundIndex, 'timeDiff:', matchingEntries[0].timeDiff);
              } else if (matchingEntries.length > 0) {
                // No close timestamp match, just use the newest one
                const newestMatch = candidateEntries
                  .sort((a, b) => b.entry.timestamp - a.entry.timestamp)[0];
                foundIndex = newestMatch.index;
                console.log('[ResultScreen] Initial load fallback search by transformedImageUri (no close timestamp match) - selected newest at index:', foundIndex);
              }
            } else {
              // No createdAt available, find all matches and select the most recent one (highest timestamp)
              const newestMatch = candidateEntries
                .sort((a, b) => b.entry.timestamp - a.entry.timestamp)[0];
              foundIndex = newestMatch.index;
              console.log('[ResultScreen] Initial load fallback search by transformedImageUri - found', candidateEntries.length, 'matches, selected newest at index:', foundIndex);
            }
          }
        }
        
        if (foundIndex >= 0) {
          setCurrentIndex(foundIndex);
          setEntryFoundInHistory(true);
          // Initialize the ref with the found entry
          if (entries[foundIndex]) {
            currentEntryIdRef.current = entries[foundIndex].id;
          }
        } else {
          // If not found in history, we'll add it as a new entry (handled by save effect)
          // Don't use history entries until the new entry is saved
          setCurrentIndex(0);
          setEntryFoundInHistory(false);
        }
      } catch (error) {
        console.error('[ResultScreen] Failed to load history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadHistoryAndFindIndex();
  }, [creationId, transformedImage, originalImage, createdAt, historySaved]);

  // Update current entry ID ref when index changes
  useEffect(() => {
    if (filteredEntries.length > 0 && currentIndex >= 0 && currentIndex < filteredEntries.length) {
      currentEntryIdRef.current = filteredEntries[currentIndex].id;
    }
  }, [filteredEntries, currentIndex]);

  // Calculate file sizes for all filtered entries
  useEffect(() => {
    const calculateFileSizes = async () => {
      const newFileSizes = new Map<string, number>();
      
      await Promise.all(
        filteredEntries.map(async (entry) => {
          try {
            const imageUri = entry.transformedImageUri;
            if (!imageUri) return;

            // Handle base64 images
            if (imageUri.includes('base64')) {
              const base64Data = imageUri.split(',')[1] || '';
              const estimatedSize = Math.floor(base64Data.length * 0.75);
              newFileSizes.set(entry.id, estimatedSize);
              return;
            }

            // Handle file:// URIs
            if (imageUri.startsWith('file://') || !imageUri.startsWith('http')) {
              const fileInfo = await FileSystem.getInfoAsync(imageUri);
              if (fileInfo.exists && fileInfo.size !== undefined) {
                newFileSizes.set(entry.id, fileInfo.size);
              }
              return;
            }

            // Remote URLs - skip for now
          } catch (error) {
            console.error(`[ResultScreen] Error calculating file size for entry ${entry.id}:`, error);
          }
        })
      );

      setItemFileSizes(newFileSizes);
    };

    if (filteredEntries.length > 0) {
      calculateFileSizes();
    } else {
      setItemFileSizes(new Map());
    }
  }, [filteredEntries]);

  // Apply filter based on filterMode
  useEffect(() => {
    console.log('[ResultScreen] Filter effect running:', {
      historyEntriesCount: historyEntries.length,
      filterMode,
      editMode,
    });

    if (historyEntries.length === 0) {
      console.log('[ResultScreen] No history entries, setting entryFoundInHistory = false');
      setFilteredEntries([]);
      setEntryFoundInHistory(false);
      return;
    }

    if (filterMode === 'current') {
      // Filter to only show entries with the same editMode
      const filtered = historyEntries.filter(entry => entry.editMode === editMode);
      setFilteredEntries(filtered);

      if (filtered.length === 0) {
        console.log('[ResultScreen] No filtered entries, setting entryFoundInHistory = false');
        setCurrentIndex(0);
        setEntryFoundInHistory(false);
        return;
      }

      // Try to preserve the currently displayed entry if it's in the filtered list
      if (currentEntryIdRef.current) {
        const preservedIndex = filtered.findIndex(e => e.id === currentEntryIdRef.current);
        if (preservedIndex >= 0) {
          console.log('[ResultScreen] Found entry by currentEntryIdRef at index:', preservedIndex, '- setting entryFoundInHistory = true');
          setCurrentIndex(preservedIndex);
          setEntryFoundInHistory(true);
          return;
        }
      }

      // Fallback: try to find by route params
      const currentTransformed = route.params?.transformedImage;
      const currentCreatedAt = route.params?.createdAt;
      const currentCreationId = route.params?.creationId;
      
      if (currentTransformed && filtered.length > 0) {
        let index = -1;
        
        // First try by creationId if available
        if (currentCreationId) {
          index = filtered.findIndex(e => e.creationId === currentCreationId);
        }
        
        // Fallback to transformedImageUri with timestamp matching if available
        if (index < 0 && currentCreatedAt) {
          const matchingEntries = filtered
            .map((entry, idx) => ({ entry, index: idx }))
            .filter(({ entry }) => entry.transformedImageUri === currentTransformed)
            .map(({ entry, index: idx }) => ({
              index: idx,
              timeDiff: Math.abs(entry.timestamp - currentCreatedAt)
            }))
            .sort((a, b) => a.timeDiff - b.timeDiff);
          
          if (matchingEntries.length > 0) {
            index = matchingEntries[0].index;
          }
        }
        
        // Final fallback: find all matches and select the most recent one (highest timestamp)
        // This ensures we always show the latest result even if multiple entries share the same URI
        if (index < 0) {
          const allMatches = filtered
            .map((entry, idx) => ({ entry, index: idx }))
            .filter(({ entry }) => entry.transformedImageUri === currentTransformed)
            .sort((a, b) => b.entry.timestamp - a.entry.timestamp); // Sort by timestamp descending (newest first)
          
          if (allMatches.length > 0) {
            index = allMatches[0].index;
            console.log('[ResultScreen] Found', allMatches.length, 'matches by transformedImageUri, selected most recent at index:', index);
          }
        }
        
        if (index >= 0) {
          console.log('[ResultScreen] Found entry by route params at index:', index, '- setting entryFoundInHistory = true');
          setCurrentIndex(index);
          setEntryFoundInHistory(true);
        } else {
          console.log('[ResultScreen] Entry NOT in filtered list - setting entryFoundInHistory = false');
          // Current entry NOT in filtered list - use route params, not history
          setCurrentIndex(0);
          setEntryFoundInHistory(false);
        }
      } else {
        console.log('[ResultScreen] No route params to match - setting entryFoundInHistory = false');
        // No route params to match - don't assume we should use history
        setEntryFoundInHistory(false);
      }
    } else {
      // Show all entries
      setFilteredEntries(historyEntries);

      // Try to preserve the currently displayed entry if it exists in all entries
      if (currentEntryIdRef.current) {
        const preservedIndex = historyEntries.findIndex(e => e.id === currentEntryIdRef.current);
        if (preservedIndex >= 0) {
          console.log('[ResultScreen] Found entry by currentEntryIdRef at index:', preservedIndex, '- setting entryFoundInHistory = true');
          setCurrentIndex(preservedIndex);
          setEntryFoundInHistory(true);
          return;
        }
      }

      // Fallback: find by route params
      const currentTransformed = route.params?.transformedImage;
      const currentCreatedAt = route.params?.createdAt;
      const currentCreationId = route.params?.creationId;
      
      if (currentTransformed && historyEntries.length > 0) {
        let index = -1;
        
        // First try by creationId if available
        if (currentCreationId) {
          index = historyEntries.findIndex(e => e.creationId === currentCreationId);
        }
        
        // Fallback to transformedImageUri with timestamp matching if available
        if (index < 0 && currentCreatedAt) {
          const matchingEntries = historyEntries
            .map((entry, idx) => ({ entry, index: idx }))
            .filter(({ entry }) => entry.transformedImageUri === currentTransformed)
            .map(({ entry, index: idx }) => ({
              index: idx,
              timeDiff: Math.abs(entry.timestamp - currentCreatedAt)
            }))
            .sort((a, b) => a.timeDiff - b.timeDiff);
          
          if (matchingEntries.length > 0) {
            index = matchingEntries[0].index;
          }
        }
        
        // Final fallback: find all matches and select the most recent one (highest timestamp)
        // This ensures we always show the latest result even if multiple entries share the same URI
        if (index < 0) {
          const allMatches = historyEntries
            .map((entry, idx) => ({ entry, index: idx }))
            .filter(({ entry }) => entry.transformedImageUri === currentTransformed)
            .sort((a, b) => b.entry.timestamp - a.entry.timestamp); // Sort by timestamp descending (newest first)
          
          if (allMatches.length > 0) {
            index = allMatches[0].index;
            console.log('[ResultScreen] Found', allMatches.length, 'matches by transformedImageUri, selected most recent at index:', index);
          }
        }
        
        if (index >= 0) {
          console.log('[ResultScreen] Found entry by route params at index:', index, '- setting entryFoundInHistory = true');
          setCurrentIndex(index);
          setEntryFoundInHistory(true);
        } else {
          console.log('[ResultScreen] Entry NOT in history - setting entryFoundInHistory = false');
          // Entry NOT in history - use route params
          setEntryFoundInHistory(false);
        }
      } else {
        console.log('[ResultScreen] No route params to match - setting entryFoundInHistory = false');
        // No route params to match - don't assume we should use history
        setEntryFoundInHistory(false);
      }
    }
  }, [historyEntries, filterMode, editMode]);

  // Scroll to current index when filtered entries change (only on filter change or initial load)
  const prevFilteredLengthRef = useRef(filteredEntries.length);
  const prevFilterModeRef = useRef(filterMode);
  const prevCurrentIndexRef = useRef(currentIndex);
  const isInitialMountRef = useRef(true);
  
  useEffect(() => {
    // Only scroll if:
    // 1. We have entries
    // 2. The filter mode changed (user clicked filter button) AND the index actually changed
    // 3. OR initial mount (first load)
    // 4. OR the filtered entries length changed significantly (major filter change)
    const filterModeChanged = prevFilterModeRef.current !== filterMode;
    const indexChanged = prevCurrentIndexRef.current !== currentIndex;
    const significantLengthChange = Math.abs(prevFilteredLengthRef.current - filteredEntries.length) > 1;
    const isInitialMount = isInitialMountRef.current;
    
    if (filteredEntries.length > 0 && currentIndex >= 0 && currentIndex < filteredEntries.length) {
      // Scroll if filter changed and index changed, OR initial mount, OR significant length change
      if ((filterModeChanged && indexChanged) || isInitialMount || (significantLengthChange && indexChanged)) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ 
            index: currentIndex, 
            animated: false,
            viewPosition: 0.5,
          });
        }, 200);
      }
    }
    
    prevFilteredLengthRef.current = filteredEntries.length;
    prevFilterModeRef.current = filterMode;
    prevCurrentIndexRef.current = currentIndex;
    isInitialMountRef.current = false;
  }, [filteredEntries.length, currentIndex, filterMode]);

  // Handle viewable items change for pagination
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      if (newIndex >= 0 && newIndex < filteredEntries.length && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        haptic.light();
        
        // Sync thumbnail scroll
        setTimeout(() => {
          thumbnailListRef.current?.scrollToIndex({ 
            index: newIndex, 
            animated: true,
            viewPosition: 0.5,
          });
        }, 100);
      }
    }
  }, [currentIndex, filteredEntries.length]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  // Determine if we should show carousel (show if we have multiple filtered entries)
  const shouldShowCarousel = !isLoadingHistory && filteredEntries.length > 1;


  const formatTimestamp = (ts?: number) => {
    try {
      const date = ts ? new Date(ts) : new Date();
      return date.toLocaleString();
    } catch {
      return '';
    }
  };

  const formatBytes = (size: number): string => {
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${(size / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  // Enhanced title for virtual try-on
  const getHeaderTitle = () => {
    try {
      if (displayIsVirtualTryOn && displayClothingItems && displayClothingItems.length > 0) {
        const itemCount = displayClothingItems.length;
        const itemText = itemCount === 1 ? 'item' : 'items';
        return `Virtual Try-On (${itemCount} ${itemText})`;
      }
    } catch (error) {
      console.error('[ResultScreen] Error in getHeaderTitle:', error);
    }
    return displayModeData?.name || 'Result';
  };

  const saveImage = async () => {
    if (isSaving) return;
    
    try {
      haptic.light();
      setIsSaving(true);
      
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        haptic.error();
        Alert.alert('Permission Required', 'Please allow access to save photos');
        setIsSaving(false);
        return;
      }
      
      // Use current entry's image if in carousel mode, otherwise use display image
      const imageToSave = shouldShowCarousel && filteredEntries[currentIndex]
        ? filteredEntries[currentIndex].transformedImageUri
        : displayTransformedImage;
      
      if (imageToSave.includes('base64')) {
        try {
          // Extract base64 data from data URI
          const base64Match = imageToSave.match(/data:image\/[^;]+;base64,(.+)/);
          if (!base64Match || !base64Match[1]) {
            throw new Error('Invalid base64 data URI');
          }
          
          // Save to temp file
          const tempUri = `${FileSystem.cacheDirectory}transformed_${Date.now()}.jpg`;
          await FileSystem.writeAsStringAsync(tempUri, base64Match[1], {
            encoding: 'base64'
          });
          
          await MediaLibrary.saveToLibraryAsync(tempUri);
          setHasSaved(true);
          haptic.success();
          try { await AnalyticsService.increment('image_saved'); } catch {}
          
          // Clean up temp file
          try {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        } catch (fetchError) {
          try {
            await MediaLibrary.saveToLibraryAsync(imageToSave);
            setHasSaved(true);
            haptic.success();
            try { await AnalyticsService.increment('image_saved'); } catch {}
          } catch (fallbackError) {
            throw new Error('Unable to save image');
          }
        }
      } else {
        await MediaLibrary.saveToLibraryAsync(imageToSave);
        setHasSaved(true);
        haptic.success();
        try { await AnalyticsService.increment('image_saved'); } catch {}
      }
    } catch (error) {
      console.error('Error saving image:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to save image to gallery');
      try { await AnalyticsService.increment('errors'); } catch {}
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      haptic.light();
      setIsSharing(true);
      
      // Use current entry's image if in carousel mode, otherwise use display image
      const imageToShare = shouldShowCarousel && filteredEntries[currentIndex]
        ? filteredEntries[currentIndex].transformedImageUri
        : displayTransformedImage;
      
      try {
        const result = await Share.share({
          message: `Check out my ${displayModeData?.name || 'edited'} image!`,
          url: imageToShare,
        });
        
        // Handle share result
        if (result.action === Share.sharedAction || result.action === Share.dismissedAction) {
          haptic.success();
          try { await AnalyticsService.increment('image_shared'); } catch {}
        }
      } catch (shareError) {
        // Share was cancelled or failed
        console.log('Share cancelled or failed:', shareError);
      }
      
      // Add a cooldown period after share sheet dismisses to prevent accidental image taps
      // This handles the case where user taps outside share sheet and then taps image
      setTimeout(() => {
        setIsSharing(false);
      }, 600); // 600ms cooldown to prevent accidental taps after dismissing share sheet
      
    } catch (error) {
      console.error('Error sharing image:', error);
      haptic.error();
      setIsSharing(false);
    }
  };

  const upgradeApp = () => {
    haptic.medium();
    Alert.alert(
      'Upgrade to Pro',
      'Get unlimited transformations, no watermarks, and premium effects!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {
          haptic.success();
          console.log('Upgrade pressed');
        }},
      ]
    );
  };

  const createNew = () => {
    haptic.medium();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const changeStyle = () => {
    haptic.medium();
    
    if (displayEditMode === EditMode.TRANSFORM) {
      // Navigate back to genre selection with the original image
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('GenreSelection', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.TRANSFORM 
        });
      } else {
        navigation.navigate('GenreSelection', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.TRANSFORM 
        });
      }
    } else if (displayEditMode === EditMode.REPLACE_BACKGROUND) {
      // Navigate back to image preview with the original image for Replace Background
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.REPLACE_BACKGROUND 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.REPLACE_BACKGROUND 
        });
      }
    } else if (displayEditMode === EditMode.REMOVE_OBJECT) {
      // Navigate back to image preview with the original image for Remove Object
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.REMOVE_OBJECT 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.REMOVE_OBJECT 
        });
      }
    } else if ((displayEditMode as any) === EditMode.PROFESSIONAL_HEADSHOTS) {
      // Navigate back to image preview with the original image for Professional Headshots
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      }
    } else if (displayEditMode === EditMode.PROFESSIONAL_HEADSHOTS) {
      // Navigate back to image preview with the original image for Professional Headshots
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: displayOriginalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      }
    } else if (displayEditMode === EditMode.PIXEL_ART_GAMER) {
      // Navigate back to PixelArtGamerScreen with the original image and current config
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('PixelArtGamer', { 
          imageUri: displayOriginalImage,
          config: displayConfig, // Pass the config so it can be pre-filled
        } as any);
      } else {
        // If no parent nav, try to navigate to Features stack first
        navigation.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Features',
              params: {
                screen: 'PixelArtGamer',
                params: {
                  imageUri: displayOriginalImage,
                  config: displayConfig,
                },
              },
            },
          })
        );
      }
    }
  };

  const isTransformMode = displayEditMode === EditMode.TRANSFORM;
  const isReplaceBackgroundMode = displayEditMode === EditMode.REPLACE_BACKGROUND;
  const isRemoveObjectMode = displayEditMode === EditMode.REMOVE_OBJECT;
  const isProfessionalHeadshotsMode = (displayEditMode as any) === EditMode.PROFESSIONAL_HEADSHOTS;
  const isPixelArtGamerMode = displayEditMode === EditMode.PIXEL_ART_GAMER;
  const isStyleTransferMode = displayEditMode === EditMode.STYLE_TRANSFER;
  const isPopFigureMode = displayEditMode === EditMode.POP_FIGURE;
  const showTryAnotherStyle = isTransformMode || isReplaceBackgroundMode || isRemoveObjectMode || isProfessionalHeadshotsMode || isPixelArtGamerMode;

  // Helper to format labels (e.g., "corporate" -> "Corporate")
  const formatLabel = (value?: string, fallback: string = ''): string => {
    const v = (value || fallback).toString();
    return v.length ? v.charAt(0).toUpperCase() + v.slice(1) : '';
  };

  // Helper to format style preset names
  const formatStylePreset = (presetId?: string): string => {
    if (!presetId) return '';
    const presetMap: Record<string, string> = {
      'van_gogh': 'Van Gogh',
      'picasso': 'Picasso',
      'monet': 'Monet',
      'watercolor': 'Watercolor',
      'oil_painting': 'Oil Painting',
      'sketch': 'Sketch',
    };
    return presetMap[presetId] || formatLabel(presetId);
  };

  // Helper to format background style names
  const formatBackgroundStyle = (style?: string): string => {
    if (!style) return '';
    const styleMap: Record<string, string> = {
      'scene': 'Game Scene',
      'color': 'Color',
      'gradient': 'Gradient',
    };
    return styleMap[style] || formatLabel(style);
  };

  // Get contextual completion badge text based on edit mode
  const getCompletionBadgeText = () => {
    switch (displayEditMode) {
      case EditMode.TRANSFORM:
        return 'Transformation Complete';
      case EditMode.REMOVE_BACKGROUND:
        return 'Background Removed';
      case EditMode.ENHANCE:
        return 'Upscale Complete';
      case EditMode.REMOVE_OBJECT:
        return 'Object Removed';
      case EditMode.REPLACE_BACKGROUND:
        return 'Background Replaced';
      case EditMode.VIRTUAL_TRY_ON:
        return 'Try-On Complete';
      case EditMode.FACE_ENHANCE:
        return 'Face Enhanced';
      case EditMode.STYLE_TRANSFER:
        return 'Style Applied';
      case EditMode.FILTERS:
        return 'Filter Applied';
      case EditMode.PIXEL_ART_GAMER:
        return 'Pixel Art Created';
      default:
        return 'Processing Complete';
    }
  };

  // Get cost text for badge display
  const getCreditCostText = () => {
    // Calculate dynamic cost for ENHANCE mode
    let creditCost = displayModeData?.creditCost ?? 0;
    if (editMode === EditMode.ENHANCE && config) {
      creditCost = 0.3;
      if (config.outscale === 4) creditCost += 0.1;
      if (config.faceEnhance === true) creditCost += 0.2;
    }
    if (creditCost === 0) return null;
    return formatCreditCostText(creditCost);
  };

  // Calculate dynamic container style based on image dimensions
  // Optimized to reduce whitespace and make preview more compact
  const getImageContainerStyle = (): ViewStyle => {
    const horizontalPadding = spacing.md * 2;
    const maxWidth = width - horizontalPadding;
    // Reduced max height to make preview smaller and more compact
    const maxHeight = Math.min(height * 0.38, 380);

    // Use actual image aspect ratio if available, otherwise fallback to 4:3
    const aspectRatio = imageDimensions?.aspectRatio || 4 / 3;

    // Calculate dimensions that fit within constraints while preserving aspect ratio
    let containerWidth: number;
    let containerHeight: number;

    if (aspectRatio > maxWidth / maxHeight) {
      // Image is wider - fit to width
      containerWidth = maxWidth;
      containerHeight = maxWidth / aspectRatio;
      
      // Ensure we don't exceed max height
      if (containerHeight > maxHeight) {
        containerHeight = maxHeight;
        containerWidth = maxHeight * aspectRatio;
      }
    } else {
      // Image is taller - fit to height
      containerHeight = maxHeight;
      containerWidth = maxHeight * aspectRatio;
      
      // Ensure we don't exceed max width
      if (containerWidth > maxWidth) {
        containerWidth = maxWidth;
        containerHeight = maxWidth / aspectRatio;
      }
    }

    // Reduced minimum size for more compact display
    const minHeight = 250;
    if (containerHeight < minHeight) {
      containerHeight = minHeight;
      containerWidth = minHeight * aspectRatio;
    }

    return {
      width: containerWidth,
      height: containerHeight,
      aspectRatio: undefined, // Remove fixed aspect ratio
    };
  };

  // Handle thumbnail press to jump to result
  const handleThumbnailPress = (index: number) => {
    haptic.medium();
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ 
      index, 
      animated: true,
      viewPosition: 0.5,
    });
  };

  // Render thumbnail item
  const renderThumbnail = useCallback(({ item, index }: { item: HistoryEntry; index: number }) => {
    const isActive = index === currentIndex;
    return (
      <TouchableOpacity
        onPress={() => handleThumbnailPress(index)}
        activeOpacity={0.7}
        style={{
          marginHorizontal: spacing.xs,
          width: 70,
          height: 70,
          borderRadius: 8,
          overflow: 'hidden',
          borderWidth: isActive ? 3 : 1.5,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: isActive ? 1 : 0.7,
        }}
      >
        <Image
          source={{ uri: item.transformedImageUri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }, [currentIndex, colors, spacing, handleThumbnailPress]);

  // Render a single result item for the carousel
  const renderResultItem = ({ item }: { item: HistoryEntry }) => {
    const itemEditMode = item.editMode;
    const itemModeData = getEditMode(itemEditMode);
    const itemIsFree = item.transformedImageUri.includes('base64');
    const itemConfig = item.config;
    const itemIsVirtualTryOn = itemEditMode === EditMode.VIRTUAL_TRY_ON;
    const itemClothingItems = itemConfig?.clothingItems as ClothingItem[] | undefined;
    const itemIsPixelArtGamer = itemEditMode === EditMode.PIXEL_ART_GAMER;
    const itemIsTransformMode = itemEditMode === EditMode.TRANSFORM;
    const itemIsReplaceBackgroundMode = itemEditMode === EditMode.REPLACE_BACKGROUND;
    const itemIsRemoveObjectMode = itemEditMode === EditMode.REMOVE_OBJECT;
    const itemIsProfessionalHeadshotsMode = (itemEditMode as any) === EditMode.PROFESSIONAL_HEADSHOTS;

    return (
      <View style={{ width }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Preview - All Modes */}
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                if (isSharing) return;
                haptic.light();
                setShowImagePreview(true);
              }}
              activeOpacity={0.9}
              disabled={isSharing}
              style={{ alignSelf: 'center', opacity: isSharing ? 0.7 : 1 }}
            >
                <View style={[
                  styles.heroImageWrapper,
                  getImageContainerStyle(),
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 8,
                  }
                ]}>
                  {/* Original Image (Base Layer) */}
                  <Image
                    source={{ uri: item.originalImageUri }}
                    style={[styles.heroImage, { width: '100%', height: '100%' }]}
                    resizeMode="contain"
                  />

                  {/* Result Image (Clipped Layer) - for comparison */}
                  <View
                    style={[
                      styles.beforeLayer,
                      {
                        width: `${sliderPosition * 100}%`,
                      }
                    ]}
                    pointerEvents="none"
                    shouldRasterizeIOS={true}
                    renderToHardwareTextureAndroid={true}
                  >
                    <View style={{ width: getImageContainerStyle().width as number, height: '100%' }}>
                      <Image
                        source={{ uri: item.transformedImageUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  {/* Divider Line with Handle */}
                  <View
                    style={[
                      styles.dividerLine,
                      {
                        backgroundColor: colors.primary,
                        left: `${sliderPosition * 100}%`,
                      }
                    ]}
                    pointerEvents="none"
                  >
                    {/* Drag Handle */}
                    <View style={[styles.dragHandle, {
                      backgroundColor: colors.primary,
                      shadowColor: '#000',
                    }]}>
                      <Ionicons name="chevron-back" size={12} color="#FFFFFF" style={{ marginLeft: -2 }} />
                      <Ionicons name="chevron-forward" size={12} color="#FFFFFF" style={{ marginLeft: -4 }} />
                    </View>
                  </View>

                  {itemIsFree && (
                    <View style={[styles.watermarkOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                      <Text style={[styles.watermarkText, { color: '#FFFFFF' }]}>FREE</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Before/After Comparison Slider */}
              <View style={{ width: '100%', paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }}>
                    Original
                  </Text>
                  <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={1}
                    value={sliderPosition}
                    onValueChange={setSliderPosition}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }}>
                    Result
                  </Text>
                </View>
                {/* Hint Text */}
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: typography.scaled.xs,
                  textAlign: 'center',
                  marginTop: 2,
                  opacity: 0.6,
                }}>
                  Drag to compare
                </Text>
              </View>

              {/* Action Buttons - Save, Share, Try Again */}
              <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg, flexDirection: 'row', gap: spacing.sm }}>
                {/* Save Button */}
                <TouchableOpacity
                  onPress={saveImage}
                  disabled={isSaving}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.xs,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    gap: spacing.xs,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : hasSaved ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success || colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.text} />
                  )}
                  <Text style={{
                    color: colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.semibold
                  }}>
                    {hasSaved ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  onPress={shareImage}
                  disabled={isSharing}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.xs,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    gap: spacing.xs,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                    opacity: isSharing ? 0.6 : 1,
                  }}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="share-outline" size={20} color={colors.text} />
                  )}
                  <Text style={{
                    color: colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.semibold
                  }}>
                    Share
                  </Text>
                </TouchableOpacity>

                {/* Try Again Button */}
                <TouchableOpacity
                  onPress={createNew}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.xs,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    gap: spacing.xs,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.bold
                  }}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* Virtual Try-On Success Banner */}
            {itemIsVirtualTryOn && !showOriginal && (
              <View style={[styles.successBanner, {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
                padding: spacing.base,
                borderRadius: 12,
                marginHorizontal: spacing.base,
                marginTop: spacing.md,
                marginBottom: spacing.base,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }]}>
                <Text style={{ fontSize: 24, marginRight: spacing.sm }}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.successTitle, {
                    color: colors.text,
                    fontSize: typography.scaled.base,
                    fontWeight: typography.weight.bold,
                    marginBottom: 2,
                  }]}>
                    Virtual Try-On Complete!
                  </Text>
                  <Text style={[styles.successSubtitle, {
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                  }]}>
                    {itemClothingItems?.length || 0} clothing item{itemClothingItems?.length !== 1 ? 's' : ''} applied successfully
                  </Text>
                </View>
              </View>
            )}

              {/* Outfit Summary Card for Virtual Try-On */}
              {itemIsVirtualTryOn && itemClothingItems && itemClothingItems.length > 0 && !showOriginal && (
                <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
                  <OutfitSummaryCard items={itemClothingItems} />
                </View>
              )}

              {/* Pixel Art Gamer Options Card */}
              {itemIsPixelArtGamer && itemConfig && (() => {
                const schema = getOptionsSchema(itemEditMode);
                return schema ? (
                  <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.sm }}>
                    <OptionsUsed
                      config={itemConfig}
                      schema={schema}
                      defaultExpanded={true}
                    />
                    {/* Credit Cost, Date/Time, and File Size - Show for Pixel Art Gamer */}
                    <View style={[styles.badgesContainer, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                      {(() => {
                        const creditCost = itemModeData?.creditCost ?? 0;
                        const creditCostText = creditCost > 0 ? formatCreditCostText(creditCost) : null;
                        return creditCostText ? (
                          <View style={[styles.badge, {
                            backgroundColor: colors.primary + '15',
                            borderColor: colors.primary + '30',
                          }]}>
                            <Ionicons name="diamond-outline" size={14} color={colors.primary} />
                            <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                              {creditCostText}
                            </Text>
                          </View>
                        ) : null;
                      })()}
                      <View style={[styles.badge, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                          {formatTimestamp(item.timestamp)}
                        </Text>
                      </View>
                      {itemFileSizes.has(item.id) && (
                        <View style={[styles.badge, {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        }]}>
                          <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                            {formatBytes(itemFileSizes.get(item.id)!)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null;
              })()}

              {/* Options Used Card - Reusable Component (for other modes) */}
              {itemConfig && !itemIsPixelArtGamer && (() => {
                const schema = getOptionsSchema(itemEditMode);
                return schema ? (
                  <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
                    <OptionsUsed
                      config={itemConfig}
                      schema={schema}
                      defaultExpanded={true}
                    />
                    {/* Credit Cost, Date/Time, and File Size - Show for all modes with OptionsUsed (except Virtual Try-On) */}
                    {itemEditMode !== EditMode.VIRTUAL_TRY_ON && (() => {
                      // Calculate dynamic cost for ENHANCE mode
                      let creditCost = itemModeData?.creditCost ?? 0;
                      if (itemEditMode === EditMode.ENHANCE && itemConfig) {
                        creditCost = 0.3;
                        if (itemConfig.outscale === 4) creditCost += 0.1;
                        if (itemConfig.faceEnhance === true) creditCost += 0.2;
                      }
                      const creditCostText = creditCost > 0 ? formatCreditCostText(creditCost) : null;
                      return (
                        <View style={[styles.badgesContainer, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                          {creditCostText && (
                            <View style={[styles.badge, {
                              backgroundColor: colors.primary + '15',
                              borderColor: colors.primary + '30',
                            }]}>
                              <Ionicons name="diamond-outline" size={14} color={colors.primary} />
                              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                                {creditCostText}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.badge, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          }]}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                              {formatTimestamp(item.timestamp)}
                            </Text>
                          </View>
                          {itemFileSizes.has(item.id) && (
                            <View style={[styles.badge, {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            }]}>
                              <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
                              <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                                {formatBytes(itemFileSizes.get(item.id)!)}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                ) : null;
              })()}

              {/* Upgrade Card */}
              {itemIsFree && !showOriginal && (
                <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.md }}>
                  <Card style={[styles.upgradeCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]}>
                    <View style={styles.upgradeContent}>
                      <Text style={styles.upgradeIcon}>✨</Text>
                      <Text style={[styles.upgradeTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
                        Unlock Premium
                      </Text>
                      <Text style={[styles.upgradeDescription, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                        Unlimited transforms • No watermarks • HD quality
                      </Text>
                      <Button
                        title="Upgrade - $4.99/mo"
                        onPress={upgradeApp}
                        variant="primary"
                        size="large"
                        style={{ marginTop: spacing.md, width: '100%' }}
                      />
                    </View>
                  </Card>
                </View>
              )}

              {/* Status Chips at Bottom */}
              <View style={[styles.badgesContainer, { marginHorizontal: spacing.base, marginTop: spacing.lg, marginBottom: spacing.xl, justifyContent: 'center' }]}>
                <View style={[styles.badge, {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '30',
                }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                    {(() => {
                      switch (itemEditMode) {
                        case EditMode.TRANSFORM: return 'Transformation Complete';
                        case EditMode.REMOVE_BACKGROUND: return 'Background Removed';
                        case EditMode.ENHANCE: return 'Upscale Complete';
                        case EditMode.REMOVE_OBJECT: return 'Object Removed';
                        case EditMode.REPLACE_BACKGROUND: return 'Background Replaced';
                        case EditMode.VIRTUAL_TRY_ON: return 'Try-On Complete';
                        case EditMode.FACE_ENHANCE: return 'Face Enhanced';
                        case EditMode.STYLE_TRANSFER: return 'Style Applied';
                        case EditMode.FILTERS: return 'Filter Applied';
                        case EditMode.PIXEL_ART_GAMER: return 'Pixel Art Created';
                        default: return 'Processing Complete';
                      }
                    })()} {(() => {
                      // Calculate dynamic cost for ENHANCE mode
                      let creditCost = itemModeData?.creditCost ?? 0;
                      if (itemEditMode === EditMode.ENHANCE && itemConfig) {
                        creditCost = 0.3;
                        if (itemConfig.outscale === 4) creditCost += 0.1;
                        if (itemConfig.faceEnhance === true) creditCost += 0.2;
                      }
                      if (creditCost === 0) return '';
                      return `• ${formatCreditCostText(creditCost)}`;
                    })()}
                  </Text>
                </View>
                <View style={[styles.badge, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
                {itemFileSizes.has(item.id) && (
                  <View style={[styles.badge, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}>
                    <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                      {formatBytes(itemFileSizes.get(item.id)!)}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        );
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <AIToolHeader
        title={shouldShowCarousel ? 'Result Gallery' : getHeaderTitle()}
        backgroundColor={colors.backgroundSecondary}
        showBackButton={fromHistory}
        onBack={() => {
          if (fromHistory) {
            navigation.goBack();
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          }
        }}
        rightAction={shouldShowCarousel ? (
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              setFilterMode(filterMode === 'all' ? 'current' : 'all');
            }}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: 8,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Ionicons 
              name={filterMode === 'all' ? 'apps-outline' : 'funnel-outline'} 
              size={16} 
              color={colors.primary} 
            />
            <Text style={{
              color: colors.primary,
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.semibold,
            }}>
              {filterMode === 'all' ? 'All' : modeData?.name || 'Current'}
            </Text>
          </TouchableOpacity>
        ) : undefined}
      />

      {shouldShowCarousel ? (
        <>
          {/* Counter and Page Indicators */}
          <View style={[styles.headerBar, { 
            backgroundColor: colors.backgroundSecondary,
            paddingTop: spacing.xs,
            paddingBottom: spacing.xs,
            paddingHorizontal: spacing.base,
            position: 'relative',
          }]}>
            {/* Page Indicator Dots - Left side */}
            {filteredEntries.length > 1 && filteredEntries.length <= 10 && (
              <View style={styles.dotsContainer}>
                {filteredEntries.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index === currentIndex ? colors.primary : colors.border,
                        width: index === currentIndex ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        marginHorizontal: 3,
                      }
                    ]}
                  />
                ))}
              </View>
            )}
            
            {/* Counter - Centered absolutely */}
            <View style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={[styles.counterText, { 
                color: colors.text, 
                fontSize: typography.scaled.sm,
                fontWeight: typography.weight.semibold,
              }]}>
                {currentIndex + 1} / {filteredEntries.length}
              </Text>
            </View>
            
            {/* Right spacer to balance layout when dots are shown */}
            {filteredEntries.length > 1 && filteredEntries.length <= 10 && (
              <View style={{ width: 80 }} />
            )}
          </View>

          <FlatList
            ref={flatListRef}
            data={filteredEntries}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialScrollIndex={currentIndex >= 0 && currentIndex < filteredEntries.length ? currentIndex : 0}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
              });
            }}
            removeClippedSubviews={false}
          />

          {/* Thumbnail Strip */}
          {filteredEntries.length > 1 && (
            <View style={[styles.thumbnailStrip, {
              paddingTop: spacing.sm,
              paddingBottom: thumbnailStripPadding, // Calculated to always sit above tab bar
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            }]}>
              <FlatList
                ref={thumbnailListRef}
                data={filteredEntries}
                renderItem={renderThumbnail}
                keyExtractor={(item) => item.id}
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                style={{ height: 90 }}
                contentContainerStyle={{ paddingHorizontal: spacing.xs, alignItems: 'center' }}
                getItemLayout={(data, index) => ({
                  length: 70 + spacing.xs * 2,
                  offset: (70 + spacing.xs * 2) * index,
                  index,
                })}
                initialScrollIndex={currentIndex >= 0 && currentIndex < filteredEntries.length ? currentIndex : 0}
              />
            </View>
          )}
        </>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          >
            {/* Hero Image Preview - All Modes */}
            <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  if (isSharing) return;
                  haptic.light();
                  setShowImagePreview(true);
                }}
                activeOpacity={0.9}
                disabled={isSharing}
                style={{ alignSelf: 'center', opacity: isSharing ? 0.7 : 1 }}
              >
                  <View style={[
                    styles.heroImageWrapper,
                    getImageContainerStyle(),
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.15,
                      shadowRadius: 20,
                      elevation: 8,
                    }
                  ]}>
                    {/* Original Image (Base Layer) */}
                    <Image
                      source={{ uri: displayOriginalImage }}
                      style={[styles.heroImage, { width: '100%', height: '100%' }]}
                      resizeMode="contain"
                    />

                    {/* Result Image (Clipped Layer) - for comparison */}
                    <View
                      style={[
                        styles.beforeLayer,
                        {
                          width: `${sliderPosition * 100}%`,
                        }
                      ]}
                      pointerEvents="none"
                      shouldRasterizeIOS={true}
                      renderToHardwareTextureAndroid={true}
                    >
                      <View style={{ width: getImageContainerStyle().width as number, height: '100%' }}>
                        <Image
                          source={{ uri: displayTransformedImage }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    </View>

                    {/* Divider Line with Handle */}
                    <View
                      style={[
                        styles.dividerLine,
                        {
                          backgroundColor: colors.primary,
                          left: `${sliderPosition * 100}%`,
                        }
                      ]}
                      pointerEvents="none"
                    >
                      {/* Drag Handle */}
                      <View style={[styles.dragHandle, {
                        backgroundColor: colors.primary,
                        shadowColor: '#000',
                      }]}>
                        <Ionicons name="chevron-back" size={12} color="#FFFFFF" style={{ marginLeft: -2 }} />
                        <Ionicons name="chevron-forward" size={12} color="#FFFFFF" style={{ marginLeft: -4 }} />
                      </View>
                    </View>

                    {displayIsFree && (
                      <View style={[styles.watermarkOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                        <Text style={[styles.watermarkText, { color: '#FFFFFF' }]}>FREE</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Before/After Comparison Slider */}
                <View style={{ width: '100%', paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }}>
                      Original
                    </Text>
                    <Slider
                      style={{ flex: 1, height: 40 }}
                      minimumValue={0}
                      maximumValue={1}
                      value={sliderPosition}
                      onValueChange={setSliderPosition}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.primary}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }}>
                      Result
                    </Text>
                  </View>
                  {/* Hint Text */}
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: typography.scaled.xs,
                    textAlign: 'center',
                    marginTop: 2,
                    opacity: 0.6,
                  }}>
                    Drag to compare
                  </Text>
                </View>

                {/* Action Buttons - Save, Share, Try Again */}
                <View style={{ marginTop: spacing.sm, paddingHorizontal: spacing.lg, flexDirection: 'row', gap: spacing.sm }}>
                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={saveImage}
                    disabled={isSaving}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      gap: spacing.xs,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : hasSaved ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success || colors.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={20} color={colors.text} />
                    )}
                    <Text style={{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold
                    }}>
                      {hasSaved ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>

                  {/* Share Button */}
                  <TouchableOpacity
                    onPress={shareImage}
                    disabled={isSharing}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      gap: spacing.xs,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                      opacity: isSharing ? 0.6 : 1,
                    }}
                  >
                    {isSharing ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="share-outline" size={20} color={colors.text} />
                    )}
                    <Text style={{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold
                    }}>
                      Share
                    </Text>
                  </TouchableOpacity>

                  {/* Try Again Button */}
                  <TouchableOpacity
                    onPress={createNew}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                      gap: spacing.xs,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.bold
                    }}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            {/* Collapsible Details Section */}
            {(displayConfig || (displayIsVirtualTryOn && displayClothingItems && displayClothingItems.length > 0)) && (
              <View style={{ marginHorizontal: spacing.base, marginTop: spacing.sm, marginBottom: spacing.base }}>
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    setDetailsExpanded(!detailsExpanded);
                  }}
                  style={[styles.detailsHeader, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.detailsTitle, {
                    color: colors.text,
                    fontSize: typography.scaled.base,
                    fontWeight: typography.weight.semibold,
                  }]}>
                    View Settings Used
                  </Text>
                  <Ionicons
                    name={detailsExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {detailsExpanded && (
                  <View style={[styles.detailsContent, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}>
                    {/* Pixel Art Gamer Options Card */}
                    {isPixelArtGamerMode && displayConfig && (() => {
                      const schema = getOptionsSchema(displayEditMode);
                      return schema ? (
                        <>
                          <OptionsUsed
                            config={displayConfig}
                            schema={schema}
                            defaultExpanded={true}
                          />
                          {/* Credit Cost, Date/Time, and File Size - Show for Pixel Art Gamer */}
                          <View style={[styles.badgesContainer, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                            {getCreditCostText() && (
                              <View style={[styles.badge, {
                                backgroundColor: colors.primary + '15',
                                borderColor: colors.primary + '30',
                              }]}>
                                <Ionicons name="diamond-outline" size={14} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                                  {getCreditCostText()}
                                </Text>
                              </View>
                            )}
                            <View style={[styles.badge, {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            }]}>
                              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                              <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                                {formatTimestamp(displayCreatedAt)}
                              </Text>
                            </View>
                            {fileSize !== null && (
                              <View style={[styles.badge, {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                              }]}>
                                <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                                  {formatBytes(fileSize)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </>
                      ) : null;
                    })()}

                    {/* Options Used Card - Reusable Component (for other modes) */}
                    {displayConfig && !isPixelArtGamerMode && (() => {
                      const schema = getOptionsSchema(displayEditMode);
                      return schema ? (
                        <OptionsUsed
                          config={displayConfig}
                          schema={schema}
                          defaultExpanded={true}
                        />
                      ) : null;
                    })()}

                    {/* Virtual Try-On Outfit Details */}
                    {displayIsVirtualTryOn && displayClothingItems && displayClothingItems.length > 0 && (
                      <OutfitSummaryCard items={displayClothingItems} />
                    )}

                    {/* Credit Cost, Date/Time, and File Size - Show for all modes with OptionsUsed (except Virtual Try-On) */}
                    {!displayIsVirtualTryOn && displayConfig && getOptionsSchema(displayEditMode) && (
                      <View style={[styles.badgesContainer, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                        {getCreditCostText() && (
                          <View style={[styles.badge, {
                            backgroundColor: colors.primary + '15',
                            borderColor: colors.primary + '30',
                          }]}>
                            <Ionicons name="diamond-outline" size={14} color={colors.primary} />
                            <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                              {getCreditCostText()}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.badge, {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        }]}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                            {formatTimestamp(displayCreatedAt)}
                          </Text>
                        </View>
                        {fileSize !== null && (
                          <View style={[styles.badge, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          }]}>
                            <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                              {formatBytes(fileSize)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Try Again Button for Virtual Try-On */}
            {displayIsVirtualTryOn && !showOriginal && (
              <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
                <TouchableOpacity
                  onPress={() => {
                    haptic.medium();
                    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                  }}
                  activeOpacity={0.8}
                  style={[styles.tryAgainButton, {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderWidth: 2,
                    borderRadius: 16,
                    padding: spacing.base,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }]}
                >
                  <Ionicons name="refresh-outline" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
                  <Text style={[styles.tryAgainText, {
                    color: colors.primary,
                    fontSize: typography.scaled.base,
                    fontWeight: typography.weight.bold,
                  }]}>
                    Try Another Outfit
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Change Style Card */}
            {showTryAnotherStyle && (
              <View style={{ 
                marginHorizontal: spacing.base, 
                marginTop: 0, 
                marginBottom: spacing.base 
              }}>
                <TouchableOpacity
                  onPress={changeStyle}
                  activeOpacity={0.8}
                  style={[styles.changeStyleCard, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }]}
                >
                  <View style={[styles.changeStyleIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons 
                      name={
                        isReplaceBackgroundMode 
                          ? "layers-outline" 
                          : isRemoveObjectMode
                            ? "create-outline"
                            : "color-palette-outline"
                      } 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={[styles.changeStyleTitle, {
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {isReplaceBackgroundMode 
                        ? 'Try Another Background' 
                        : isRemoveObjectMode
                          ? 'Try Another Object'
                          : 'Try Another Style'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Upgrade Card */}
            {displayIsFree && !showOriginal && (
              <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.md }}>
                <Card style={[styles.upgradeCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]}>
                  <View style={styles.upgradeContent}>
                    <Text style={styles.upgradeIcon}>✨</Text>
                    <Text style={[styles.upgradeTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
                      Unlock Premium
                    </Text>
                    <Text style={[styles.upgradeDescription, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                      Unlimited transforms • No watermarks • HD quality
                    </Text>
                    <Button
                      title="Upgrade - $4.99/mo"
                      onPress={upgradeApp}
                      variant="primary"
                      size="large"
                      style={{ marginTop: spacing.md, width: '100%' }}
                    />
                  </View>
                </Card>
              </View>
            )}

            {/* Status Chips at Bottom */}
            <View style={[styles.badgesContainer, { marginHorizontal: spacing.base, marginTop: spacing.lg, marginBottom: spacing.xl, justifyContent: 'center' }]}>
              <View style={[styles.badge, {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
              }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                  {getCompletionBadgeText()} {getCreditCostText() ? `• ${getCreditCostText()}` : ''}
                </Text>
              </View>
              <View style={[styles.badge, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                  {formatTimestamp(displayCreatedAt)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {/* Immersive Zoomable Image Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        statusBarTranslucent
      >
        <ZoomableImage
          uri={showOriginal 
            ? (shouldShowCarousel && filteredEntries[currentIndex] 
                ? filteredEntries[currentIndex].originalImageUri 
                : displayOriginalImage)
            : (shouldShowCarousel && filteredEntries[currentIndex] 
                ? filteredEntries[currentIndex].transformedImageUri 
                : displayTransformedImage)
          }
          onClose={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
          watermark={
            (shouldShowCarousel 
              ? filteredEntries[currentIndex]?.transformedImageUri.includes('base64')
              : displayIsFree) && !showOriginal ? (
              <View style={[styles.watermarkModal, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <Text style={[styles.watermarkText, { color: '#FFFFFF' }]}>FREE</Text>
              </View>
            ) : undefined
          }
          onSave={!showOriginal ? saveImage : undefined}
          onShare={!showOriginal ? shareImage : undefined}
          isSaving={isSaving}
          hasSaved={hasSaved}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Dynamic
  },
  toggleTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTabText: {
    textAlign: 'center',
  },
  imageCard: {
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    minHeight: height * 0.5,
    maxHeight: height * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  heroImageWrapper: {
    // Dynamic width and height calculated in getImageContainerStyle()
    // Removed fixed aspectRatio to allow dynamic sizing
    borderRadius: 20, // More rounded for modern look
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: baseSpacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseSpacing.md,
    paddingVertical: baseSpacing.xs,
    borderRadius: 20,
    gap: baseSpacing.xs,
  },
  expandText: {
    // Dynamic styles applied inline
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: baseSpacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseSpacing.sm,
    paddingVertical: baseSpacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    gap: baseSpacing.xs,
  },
  badgeText: {
    // Dynamic styles applied inline
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  watermarkModal: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tryAgainButton: {
    // Dynamic styles applied inline
  },
  tryAgainText: {
    // Dynamic styles applied inline
  },
  previewModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalSafeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageWrapperModal: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  previewModalImage: {
    width: width - 56,
    height: height * 0.65,
    borderRadius: 16,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintGradient: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewModalHint: {
    textAlign: 'center',
  },
  changeStyleCard: {
    // Dynamic styles applied inline
  },
  changeStyleIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStyleTitle: {
    // Dynamic styles applied inline
  },
  changeStyleSubtitle: {
    // Dynamic styles applied inline
  },
  upgradeCard: {
    padding: 20,
  },
  upgradeContent: {
    alignItems: 'center',
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  upgradeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeDescription: {
    textAlign: 'center',
  },
  successBanner: {
    // Dynamic styles applied inline
  },
  successTitle: {
    // Dynamic styles applied inline
  },
  successSubtitle: {
    // Dynamic styles applied inline
  },
  paginationContainer: {
    alignItems: 'center',
    paddingHorizontal: baseSpacing.md,
  },
  paginationText: {
    fontWeight: '600',
  },
  counterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    letterSpacing: 0.5,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    // Animated via backgroundColor and width changes
  },
  thumbnailStrip: {
    // Height is controlled by inline styles for proper rendering
  },
  // New styles for mockup design
  beforeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  stateLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stateLabelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  expandGradient: {
    paddingTop: 40,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    // Dynamic styles applied inline
  },
  actionDivider: {
    width: 1,
    marginVertical: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  detailsTitle: {
    flex: 1,
  },
  detailsContent: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBar: {
    // Dynamic styles applied inline
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: baseSpacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    gap: baseSpacing.xs,
    minHeight: 44,
  },
  actionBarButtonText: {
    // Dynamic styles applied inline
  },
  floatingActionButtons: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: baseSpacing.xs,
    zIndex: 10,
  },
  floatingIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    backdropFilter: 'blur(10px)',
  },
  thumbnailStripWithActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.sm,
  },
  thumbnailStripActions: {
    flexDirection: 'row',
    gap: baseSpacing.xs,
    paddingLeft: baseSpacing.sm,
  },
  thumbnailActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ResultScreen;
