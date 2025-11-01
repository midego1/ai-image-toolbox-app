import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '../types/navigation';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { FeaturedToolsGrid } from '../components/FeaturedToolsGrid';
import { FeaturedToolsList } from '../components/FeaturedToolsList';
import { MediaTypeTabs, MediaType } from '../components/MediaTypeTabs';
import { EditMode, EditModeCategory, getEditModesByCategory, getEditMode } from '../constants/editModes';
import { SubscriptionService } from '../services/subscriptionService';
import { ImageProcessingService } from '../services/imageProcessingService';
import { VideoProcessingService } from '../services/videoProcessingService';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';

const FeaturesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const styles = createStyles(theme, insets, scrollBottomPadding);
  const [isPremium, setIsPremium] = useState(false);
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('image');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef<number>(0);
  const lastTabPressTimeRef = useRef<number>(0);

  // Handle double-tap on tab to scroll to top
  useEffect(() => {
    // Get the parent tab navigator to listen to tab press events
    const parentTabNavigator = navigation.getParent();
    
    if (!parentTabNavigator) return;

    const unsubscribe = parentTabNavigator.addListener('tabPress', (e: any) => {
      // Check if this screen is already focused (meaning tab was pressed while active)
      if (navigation.isFocused()) {
        const now = Date.now();
        const timeSinceLastPress = now - lastTabPressTimeRef.current;
        
        // If tab was pressed within 500ms of last press, scroll to top
        if (timeSinceLastPress < 500) {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          haptic.light();
        }
        
        lastTabPressTimeRef.current = now;
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadSubscriptionStatus = async () => {
    const premium = await SubscriptionService.checkSubscriptionStatus();
    setIsPremium(premium);
  };

  // Reload subscription status and restore scroll position whenever the screen comes into focus
  // This ensures the status updates when navigating back from subscription screen
  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptionStatus();
      // Restore scroll position after a short delay to ensure the view has rendered
      if (scrollOffsetRef.current > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ 
            y: scrollOffsetRef.current, 
            animated: false 
          });
        }, 100);
      }
    }, [])
  );

  const handleFeaturePress = (editMode: EditMode, requiresPremium: boolean) => {
    haptic.medium();

    if (requiresPremium && !isPremium) {
      // Show upgrade prompt
      haptic.error();
      handleUpgradePress();
      return;
    }

    // Handle video modes
    if (
      editMode === EditMode.TEXT_TO_VIDEO_VEO ||
      editMode === EditMode.TEXT_TO_VIDEO_VEO_FAST ||
      editMode === EditMode.TEXT_TO_VIDEO_KLING
    ) {
      // Text-to-video: go to prompt screen
      (navigation as any).navigate('VideoPrompt', { editMode });
      return;
    }

    if (editMode === EditMode.EDIT_VIDEO_RUNWAY) {
      // Video editing: go to video selection screen
      (navigation as any).navigate('VideoSelection', { editMode });
      return;
    }

    // Transform should go to GenreSelection within the Features stack (keep tab bar)
    if (editMode === EditMode.TRANSFORM) {
      (navigation as any).navigate('GenreSelection', { editMode });
      return;
    }

    // Remove Background should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.REMOVE_BACKGROUND) {
      (navigation as any).navigate('RemoveBackground');
      return;
    }

    // Replace Background should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.REPLACE_BACKGROUND) {
      (navigation as any).navigate('ReplaceBackground');
      return;
    }

    // Remove Object should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.REMOVE_OBJECT) {
      (navigation as any).navigate('RemoveObject');
      return;
    }

    // Professional Headshots should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.PROFESSIONAL_HEADSHOTS) {
      (navigation as any).navigate('ProfessionalHeadshots');
      return;
    }

    // Pop Figure should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.POP_FIGURE) {
      (navigation as any).navigate('PopFigure');
      return;
    }

    // Pixel Art Gamer should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.PIXEL_ART_GAMER) {
      (navigation as any).navigate('PixelArtGamer');
      return;
    }

    // Style Transfer should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.STYLE_TRANSFER) {
      (navigation as any).navigate('StyleTransfer');
      return;
    }

    // Ghiblify should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.GHIBLIFY) {
      (navigation as any).navigate('Ghiblify');
      return;
    }

    // Enhance (Upscale) should first show pre-capture selection (Library or Camera) in a dedicated screen
    if (editMode === EditMode.ENHANCE) {
      (navigation as any).navigate('Upscale');
      return;
    }

    // Virtual Try-On should go to VirtualTryOnSelection
    if (editMode === EditMode.VIRTUAL_TRY_ON) {
      (navigation as any).navigate('VirtualTryOnSelection', { editMode });
      return;
    }

    // Default: go to ImageSelection for other modes (legacy behavior)
    (navigation as any).navigate('ImageSelection', { editMode });
  };

  const handleUpgradePress = () => {
    haptic.medium();
    // Navigate to Subscription screen
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Subscription');
    } else {
      // Fallback if getParent doesn't work
      navigation.navigate('Subscription' as any);
    }
  };

  const handleFeaturedToolPress = (tool: { id: string; editMode: EditMode; screen: string }) => {
    haptic.medium();
    
    const mode = getEditMode(tool.editMode);
    
    if (mode?.isPremium && !isPremium) {
      haptic.error();
      handleUpgradePress();
      return;
    }
    
    // Navigate to the tool screen
    // VirtualTryOnSelection and GenreSelection need editMode parameter
    if (tool.screen === 'VirtualTryOnSelection' || tool.screen === 'GenreSelection') {
      (navigation as any).navigate(tool.screen, { editMode: tool.editMode });
    } else {
      (navigation as any).navigate(tool.screen);
    }
  };

  const renderCategory = (categoryName: string, category: EditModeCategory, rightAction?: React.ReactNode) => {
    const modes = getEditModesByCategory(category);

    if (modes.length === 0) return null;

    // Filter by media type
    const isVideoCategory = category === EditModeCategory.VIDEO;
    const isImageCategory = category !== EditModeCategory.VIDEO;
    
    if (activeMediaType === 'image' && isVideoCategory) return null;
    if (activeMediaType === 'video' && isImageCategory) return null;

    // Filter out modes that are already in featured tools to avoid duplication
    const featuredToolModes = [
      EditMode.TRANSFORM, // Filter out Transform since it's in featured tools
      EditMode.GHIBLIFY, // Filter out Ghiblify since it's in featured tools
      EditMode.POP_FIGURE,
      EditMode.PIXEL_ART_GAMER,
      EditMode.REMOVE_BACKGROUND,
      EditMode.REPLACE_BACKGROUND,
      EditMode.VIRTUAL_TRY_ON,
      EditMode.ENHANCE, // Filter out Enhance since it's in featured tools
      EditMode.STYLE_TRANSFER,
    ];
    const filteredModes = modes.filter(mode => !featuredToolModes.includes(mode.id));

    if (filteredModes.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <SectionHeader title={categoryName} rightAction={rightAction} />
        <View style={styles.categoryContainer}>
          {filteredModes.map((mode, index) => {
            const isLocked = mode.isPremium && !isPremium;
            // Check support: video modes use VideoProcessingService, others use ImageProcessingService
            const isVideoMode = mode.category === EditModeCategory.VIDEO;
            const isNotWorking = isVideoMode 
              ? !VideoProcessingService.isModeSupported(mode.id)
              : !ImageProcessingService.isModeSupported(mode.id);
            const isDisabled = isLocked || isNotWorking;
            return (
              <Card
                key={mode.id}
                icon={mode.icon}
                title={mode.name}
                subtitle={mode.description}
                showPremiumBadge={mode.isPremium}
                rightIcon={isLocked ? 'lock' : undefined}
                showChevron={false}
                disabled={isDisabled}
                onPress={() => handleFeaturePress(mode.id, mode.isPremium)}
                iconColor={theme.colors.primary}
                isFirstInGroup={index === 0}
                isLastInGroup={index === modes.length - 1}
                showSeparator={index < modes.length - 1}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader title="Features" backgroundColor={theme.colors.backgroundSecondary} />

      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Media Type Tabs */}
        <MediaTypeTabs 
          activeTab={activeMediaType} 
          onTabChange={(tab) => setActiveMediaType(tab)}
          rightAction={
            activeMediaType === 'image' ? (
              <TouchableOpacity
                style={styles.viewToggleButton}
                onPress={() => {
                  haptic.light();
                  setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={18}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: theme.spacing.xs / 2 }}
                />
                <Text style={[styles.viewToggleText, { color: theme.colors.textSecondary }]}>
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Featured Tools - Only show on Image tab */}
        {activeMediaType === 'image' && (
          <>
            {/* Featured Tools Grid or List */}
            {viewMode === 'grid' ? (
              <FeaturedToolsGrid onToolPress={handleFeaturedToolPress} isPremium={isPremium} />
            ) : (
              <FeaturedToolsList onToolPress={handleFeaturedToolPress} isPremium={isPremium} />
            )}
          </>
        )}

        {/* Subscription Status Banner */}
        {!isPremium && (
          <View style={styles.bannerContainer}>
            <TouchableOpacity
              onPress={handleUpgradePress}
              activeOpacity={0.85}
              style={styles.bannerTouchable}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary + '20',
                  theme.colors.primary + '15',
                  theme.colors.primary + '10'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerLeftSection}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '30' }]}>
                      <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.textSection}>
                      <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
                        Upgrade to Pro
                      </Text>
                      <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                        Unlock all premium features
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Image Categories - shown when Image tab is active */}
        {activeMediaType === 'image' && (
          <>
            {/* Transform Category */}
            {renderCategory('🎨 TRANSFORM', EditModeCategory.TRANSFORM)}

            {/* Edit Category */}
            {renderCategory('✏️ EDIT', EditModeCategory.EDIT)}

            {/* Enhance Category */}
            {renderCategory('✨ UPSCALE', EditModeCategory.ENHANCE)}

            {/* Stylize Category */}
            {renderCategory('🖌️ STYLIZE', EditModeCategory.STYLIZE)}
          </>
        )}

        {/* Video Category - shown when Video tab is active */}
        {activeMediaType === 'video' && (
          <>
            {renderCategory('🎬 VIDEO', EditModeCategory.VIDEO)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, insets: { bottom: number }, scrollBottomPadding: number) =>
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
    bannerContainer: {
      paddingHorizontal: theme.spacing.base,
      marginBottom: theme.spacing.lg,
    },
    bannerTouchable: {
      borderRadius: theme.spacing.md,
      overflow: 'hidden',
      // Subtle shadow/elevation matching cards
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    bannerGradient: {
      borderRadius: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
    },
    bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: theme.spacing.base,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.base,
    },
    textSection: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    bannerSubtitle: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
    },
    viewToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    viewToggleText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
  });

export default FeaturesScreen;
