import React, { useState, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Share, Alert, ScrollView, Text, TouchableOpacity, Animated, ViewStyle, Modal, Pressable, Easing } from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { SaveShareActions } from '../components/SaveShareActions';
import { ZoomableImage } from '../components/ZoomableImage';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { ClothingItem } from '../services/processors/virtualTryOnProcessor';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { HistoryService } from '../services/historyService';
import { AnalyticsService } from '../services/analyticsService';

const { width, height } = Dimensions.get('window');

const ResultScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scrollBottomPadding = useScrollBottomPadding();
  const IMAGE_HEIGHT = height * 0.5;
  const navigation = useNavigation<NavigationProp<'MainTabs'>>();
  const route = useRoute<RouteProp<'Result'>>();
  
  // Add error handling for route params with logging
  let originalImage: string;
  let transformedImage: string;
  let editMode: EditMode;
  let config: any;
  let fromHistory: boolean = false;
  let createdAt: number | undefined;
  
  try {
    const params = route.params;
    originalImage = params.originalImage;
    transformedImage = params.transformedImage;
    editMode = params.editMode;
    config = params.config;
    fromHistory = params.fromHistory || false;
    console.log('[ResultScreen] Initialized with params:', {
      hasOriginalImage: !!originalImage,
      hasTransformedImage: !!transformedImage,
      editMode,
      hasConfig: !!config,
      configType: config ? typeof config : 'undefined',
      fromHistory,
      hasCreatedAt: !!params.createdAt,
    });
    createdAt = params.createdAt;
  } catch (error: any) {
    console.error('[ResultScreen] Error reading route params:', error);
    // Fallback values
    originalImage = '';
    transformedImage = '';
    editMode = EditMode.TRANSFORM;
    config = undefined;
    fromHistory = false;
    createdAt = undefined;
  }
  
  const modeData = getEditMode(editMode);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isFree = transformedImage.includes('base64');

  // Animated gentle wobble (tilt) for diamond icon only
  const wobbleValue = useRef(new Animated.Value(0)).current;
  const diamondRotate = wobbleValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '8deg', '0deg'] });

  React.useEffect(() => {
    // Only animate when there is a credit cost (e.g., "1 credit")
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
        createdAt
      ).then(() => {
        setHistorySaved(true);
        console.log('[ResultScreen] Saved to history');
      }).catch(error => {
        console.error('[ResultScreen] Failed to save to history:', error);
        // Non-critical, don't block UI
      });
    }
  }, [fromHistory, historySaved, originalImage, transformedImage, editMode, modeData, config, createdAt]);

  const formatTimestamp = (ts?: number) => {
    try {
      const date = ts ? new Date(ts) : new Date();
      return date.toLocaleString();
    } catch {
      return '';
    }
  };

  // Virtual Try-On specific data
  const isVirtualTryOn = editMode === EditMode.VIRTUAL_TRY_ON;
  const clothingItems = config?.clothingItems as ClothingItem[] | undefined;
  
  console.log('[ResultScreen] Virtual try-on check:', {
    isVirtualTryOn,
    clothingItemsCount: clothingItems?.length || 0,
    clothingItemsType: clothingItems ? Array.isArray(clothingItems) ? 'array' : typeof clothingItems : 'undefined',
  });
  
  // Enhanced title for virtual try-on
  const getHeaderTitle = () => {
    try {
      if (isVirtualTryOn && clothingItems && clothingItems.length > 0) {
        const itemCount = clothingItems.length;
        const itemText = itemCount === 1 ? 'item' : 'items';
        return `Virtual Try-On (${itemCount} ${itemText})`;
      }
    } catch (error) {
      console.error('[ResultScreen] Error in getHeaderTitle:', error);
    }
    return modeData?.name || 'Result';
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
      
      if (transformedImage.includes('base64')) {
        try {
          // Extract base64 data from data URI
          const base64Match = transformedImage.match(/data:image\/[^;]+;base64,(.+)/);
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
            await MediaLibrary.saveToLibraryAsync(transformedImage);
            setHasSaved(true);
            haptic.success();
            try { await AnalyticsService.increment('image_saved'); } catch {}
          } catch (fallbackError) {
            throw new Error('Unable to save image');
          }
        }
      } else {
        await MediaLibrary.saveToLibraryAsync(transformedImage);
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
      
      try {
        const result = await Share.share({
          message: `Check out my ${modeData?.name || 'edited'} image!`,
          url: transformedImage,
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
    
    if (editMode === EditMode.TRANSFORM) {
      // Navigate back to genre selection with the original image
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('GenreSelection', { 
          imageUri: originalImage, 
          editMode: EditMode.TRANSFORM 
        });
      } else {
        navigation.navigate('GenreSelection', { 
          imageUri: originalImage, 
          editMode: EditMode.TRANSFORM 
        });
      }
    } else if (editMode === EditMode.REPLACE_BACKGROUND) {
      // Navigate back to image preview with the original image for Replace Background
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.REPLACE_BACKGROUND 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.REPLACE_BACKGROUND 
        });
      }
    } else if (editMode === EditMode.REMOVE_OBJECT) {
      // Navigate back to image preview with the original image for Remove Object
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.REMOVE_OBJECT 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.REMOVE_OBJECT 
        });
      }
    } else if ((editMode as any) === EditMode.PROFESSIONAL_HEADSHOTS) {
      // Navigate back to image preview with the original image for Professional Headshots
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      }
    } else if (editMode === EditMode.PROFESSIONAL_HEADSHOTS) {
      // Navigate back to image preview with the original image for Professional Headshots
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      } else {
        navigation.navigate('ImagePreview', { 
          imageUri: originalImage, 
          editMode: EditMode.PROFESSIONAL_HEADSHOTS 
        });
      }
    } else if (editMode === EditMode.PIXEL_ART_GAMER) {
      // Navigate back to PixelArtGamerScreen with the original image and current config
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('PixelArtGamer', { 
          imageUri: originalImage,
          config: config, // Pass the config so it can be pre-filled
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
                  imageUri: originalImage,
                  config: config,
                },
              },
            },
          })
        );
      }
    }
  };

  const isTransformMode = editMode === EditMode.TRANSFORM;
  const isReplaceBackgroundMode = editMode === EditMode.REPLACE_BACKGROUND;
  const isRemoveObjectMode = editMode === EditMode.REMOVE_OBJECT;
  const isProfessionalHeadshotsMode = (editMode as any) === EditMode.PROFESSIONAL_HEADSHOTS;
  const isPixelArtGamerMode = editMode === EditMode.PIXEL_ART_GAMER;
  const isStyleTransferMode = editMode === EditMode.STYLE_TRANSFER;
  const isPopFigureMode = editMode === EditMode.POP_FIGURE;
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

  // Get contextual completion badge text based on edit mode
  const getCompletionBadgeText = () => {
    switch (editMode) {
      case EditMode.TRANSFORM:
        return 'Transformation Complete';
      case EditMode.REMOVE_BACKGROUND:
        return 'Background Removed';
      case EditMode.ENHANCE:
        return 'Enhancement Complete';
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
        return 'Sprite Created';
      default:
        return 'Processing Complete';
    }
  };

  // Get credit cost text for badge display
  const getCreditCostText = () => {
    const creditCost = modeData?.creditCost ?? 0;
    if (creditCost === 0) return null;
    if (creditCost === 0.1) return '0.1 credit';
    return `${creditCost} credit${creditCost !== 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <AIToolHeader
        title={getHeaderTitle()}
        backgroundColor={colors.backgroundSecondary}
        showBackButton={fromHistory}
        onBack={() => {
          if (fromHistory) {
            // If coming from history, go back to history
            navigation.goBack();
          } else {
            // Otherwise, navigate to Features tab (home)
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Preview - All Modes */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              // Prevent image enlargement if share is active or just dismissed
              if (isSharing) {
                return;
              }
              haptic.light();
              setShowImagePreview(true);
            }}
            activeOpacity={0.9}
            disabled={isSharing}
            style={{ alignSelf: 'center', opacity: isSharing ? 0.7 : 1 }}
          >
            <View style={[styles.heroImageWrapper, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }]}>
              <Image
                source={{ uri: showOriginal ? originalImage : transformedImage }}
                style={styles.heroImage}
                resizeMode={isVirtualTryOn ? "contain" : "cover"}
              />
              <View style={[styles.expandOverlay, {
                backgroundColor: 'transparent',
              }]}>
                <View style={[styles.expandButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="expand" size={18} color="#FFFFFF" />
                  <Text style={[styles.expandText, { color: '#FFFFFF', fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                    Tap to view full size
                  </Text>
                </View>
              </View>
              {isFree && !showOriginal && (
                <View style={[styles.watermarkOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                  <Text style={[styles.watermarkText, { color: '#FFFFFF' }]}>FREE</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Quick Info Badges */}
          <View style={[styles.badgesContainer, { marginTop: spacing.sm }]}>
            <View style={[styles.badge, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}>
                {getCompletionBadgeText()}
              </Text>
            </View>
            <View style={[styles.badge, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}>
                AI-powered
              </Text>
            </View>
            {getCreditCostText() && (
              <View style={[styles.badge, { 
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
              }]}>
                <Animated.View style={{ transform: [{ rotate: diamondRotate }] }}>
                  <Ionicons name="diamond-outline" size={14} color={colors.primary} />
                </Animated.View>
                <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}> 
                  {getCreditCostText()}
                </Text>
              </View>
            )}
            {/* Created at timestamp */}
            <View style={[styles.badge, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}> 
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}> 
                {formatTimestamp(createdAt)}
              </Text>
            </View>
          </View>

          {/* Image Toggle Tabs */}
          <View style={[styles.toggleTabs, { 
            backgroundColor: colors.surface, 
            marginTop: spacing.md, 
            borderRadius: 12, 
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }]}>
            <TouchableOpacity
              style={[
                styles.toggleTab,
                !showOriginal && { backgroundColor: colors.primary },
                { borderRadius: 8, flex: 1, paddingVertical: 10 }
              ]}
              onPress={() => {
                if (showOriginal) {
                  haptic.light();
                  setShowOriginal(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.toggleTabText,
                { color: !showOriginal ? '#FFFFFF' : colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }
              ]}>
                Result
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleTab,
                showOriginal && { backgroundColor: colors.primary },
                { borderRadius: 8, flex: 1, paddingVertical: 10 }
              ]}
              onPress={() => {
                if (!showOriginal) {
                  haptic.light();
                  setShowOriginal(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.toggleTabText,
                { color: showOriginal ? '#FFFFFF' : colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }
              ]}>
                Original
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Virtual Try-On Success Banner */}
        {isVirtualTryOn && !showOriginal && (
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
                {clothingItems?.length || 0} clothing item{clothingItems?.length !== 1 ? 's' : ''} applied successfully
              </Text>
            </View>
          </View>
        )}

        {/* Outfit Summary Card for Virtual Try-On */}
        {isVirtualTryOn && clothingItems && clothingItems.length > 0 && !showOriginal && (
          <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
            <OutfitSummaryCard items={clothingItems} />
          </View>
        )}

        {/* Pixel Art Gamer Options Card */}
        {isPixelArtGamerMode && config && (
          <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card style={[{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: spacing.base,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={[{
                  color: colors.text,
                  fontSize: typography.scaled.base,
                  fontWeight: typography.weight.semibold,
                  marginLeft: spacing.sm,
                }]}>
                  Options Used
                </Text>
              </View>
              
              <View style={{ gap: spacing.sm }}>
                {config.bitDepth && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Bit Depth
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {config.bitDepth === '8-bit' ? '8-bit (NES)' : '16-bit (SNES)'}
                    </Text>
                  </View>
                )}
                
                {config.gameStyle && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="game-controller-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Game Style
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {formatLabel(config.gameStyle)}
                    </Text>
                  </View>
                )}
                
                {config.backgroundStyle && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Background
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {formatLabel(config.backgroundStyle)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Style Transfer Options Card */}
        {isStyleTransferMode && config && (
          <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card style={[{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: spacing.base,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={[{
                  color: colors.text,
                  fontSize: typography.scaled.base,
                  fontWeight: typography.weight.semibold,
                  marginLeft: spacing.sm,
                }]}>
                  Options Used
                </Text>
              </View>
              
              <View style={{ gap: spacing.sm }}>
                {config.stylePreset && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="brush-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Style Preset
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {formatStylePreset(config.stylePreset)}
                    </Text>
                  </View>
                )}
                
                {config.styleImageUri && !config.stylePreset && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Style Source
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      Custom Image
                    </Text>
                  </View>
                )}
                
                {config.styleStrength !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="pulse-outline" size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Style Strength
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {config.styleStrength > 0.75 
                        ? 'Strong' 
                        : config.styleStrength > 0.5 
                        ? 'Moderate' 
                        : config.styleStrength > 0.25
                        ? 'Subtle'
                        : 'Light'} ({Math.round(config.styleStrength * 100)}%)
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Pop Figure Options Card */}
        {isPopFigureMode && config && (
          <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card style={[{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: spacing.base,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={[{
                  color: colors.text,
                  fontSize: typography.scaled.base,
                  fontWeight: typography.weight.semibold,
                  marginLeft: spacing.sm,
                }]}>
                  Options Used
                </Text>
              </View>
              
              <View style={{ gap: spacing.sm }}>
                {config.includeBox !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name={config.includeBox ? "cube" : "cube-outline"} size={16} color={colors.textSecondary} />
                      <Text style={[{
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        Box Included
                      </Text>
                    </View>
                    <Text style={[{
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {config.includeBox ? 'Yes' : 'No'}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Try Again Button for Virtual Try-On */}
        {isVirtualTryOn && !showOriginal && (
          <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.base }}>
            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                // Reset navigation stack to MainTabs (home screen) to start a new try-on
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

        {/* (Removed) separate blue Try Another Style button for Professional Headshots */}

        {/* Change Style Card - Transform Mode, Replace Background, and Remove Object */}
        {showTryAnotherStyle && !showOriginal && (
          <View style={{ marginHorizontal: spacing.base, marginTop: spacing.md, marginBottom: spacing.base }}>
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
                {/* Contextual taglines for guidance */}
                {isReplaceBackgroundMode && (
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: typography.scaled.xs,
                    marginTop: 2,
                  }}>
                    Prompt a different scene (e.g., “modern office”, “sunny beach”, “forest path”).
                  </Text>
                )}
                {isRemoveObjectMode && (
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: typography.scaled.xs,
                    marginTop: 2,
                  }}>
                    Describe what to remove (e.g., “person in red shirt”, “logo in top‑left”, “street sign”).
                  </Text>
                )}
                {isTransformMode && (
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: typography.scaled.xs,
                    marginTop: 2,
                  }}>
                    Choose a different artistic style or genre for a new look.
                  </Text>
                )}
                {isProfessionalHeadshotsMode && (
                  <>
                    <Text style={{
                      color: colors.textSecondary,
                      fontSize: typography.scaled.xs,
                      marginTop: 2,
                    }}>
                      Change style, background, or lighting
                    </Text>
                    
                  </>
                )}
                {isPixelArtGamerMode && (
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: typography.scaled.xs,
                    marginTop: 2,
                  }}>
                    Adjust bit depth, game style, or background options
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Upgrade Card */}
        {isFree && !showOriginal && (
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
      </ScrollView>

      {/* Action Buttons - Always visible at bottom */}
      <SaveShareActions
        onSave={saveImage}
        onShare={shareImage}
        isSaving={isSaving}
        hasSaved={hasSaved}
      />

      {/* Immersive Zoomable Image Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        statusBarTranslucent
      >
        <ZoomableImage
          uri={showOriginal ? originalImage : transformedImage}
          onClose={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
          watermark={
            isFree && !showOriginal ? (
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
    width: width - (baseSpacing.md * 2), // Use md spacing (12px) for slightly wider image
    aspectRatio: 4 / 3, // Photo-friendly aspect ratio
    maxHeight: Math.min(height * 0.6, 550), // 60% of screen height or 550px max
    minHeight: 300, // Ensure minimum size for smaller devices
    borderRadius: 20, // More rounded for modern look
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
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
});

export default ResultScreen;
