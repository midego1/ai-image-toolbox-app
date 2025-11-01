import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated, FlatList, PanResponder } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GENRES } from '../constants/Genres';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode } from '../types/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { AIToolInfoCard } from '../components/AIToolInfoCard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ActionButtonBar } from '../components/ActionButtonBar';
import { ZoomableImage } from '../components/ZoomableImage';
import { ToolStatsBar } from '../components/ToolStatsBar';
import { TopTabSwitcher } from '../components/TopTabSwitcher';
import { ToolGuideTab } from '../components/ToolGuideTab';
import { ToolHistoryTab } from '../components/ToolHistoryTab';
import { TabView } from '../components/TabView';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding, useScrollBottomPaddingWithActionButton } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding
const FILTER_CARD_WIDTH = 120;
const FILTER_CARD_SPACING = baseSpacing.sm; // 8px
const FILTER_CARD_TOTAL = FILTER_CARD_WIDTH + FILTER_CARD_SPACING; // 128px

// Get genre-specific example image (modelcard) if available
const getGenreExampleImage = (genreId: string): number | null => {
  const genreExampleMap: Record<string, () => number> = {
    art_deco: () => require('../../assets/images/transform/modelcard_artdeco.jpg'),
    cyberpunk: () => require('../../assets/images/transform/modelcard_cyberpunk.jpg'),
    vintage: () => require('../../assets/images/transform/modelcard_vintage.jpg'),
    pixar: () => require('../../assets/images/transform/modelcard_pixar.jpg'),
    '90s': () => require('../../assets/images/transform/modelcard_90s.jpg'),
    wild_west: () => require('../../assets/images/transform/modelcard_wildwest.jpg'),
    medieval: () => require('../../assets/images/transform/modelcard_medieval.jpg'),
    underwater: () => require('../../assets/images/transform/modelcard_underwater.jpg'),
    steampunk: () => require('../../assets/images/transform/modelcard_steampunk.jpg'),
    neon_tokyo: () => require('../../assets/images/transform/modelcard_neontokyo.jpg'),
    anime: () => require('../../assets/images/transform/modelcard_anime.jpg'),
    disco: () => require('../../assets/images/transform/modelcard_disco.jpg'),
    gothic: () => require('../../assets/images/transform/modelcard_gothic.jpg'),
    matrix: () => require('../../assets/images/transform/modelcard_matrix.jpg'),
    oil_painting: () => require('../../assets/images/transform/modelcard_oilpainting.jpg'),
    spy: () => require('../../assets/images/transform/modelcard_spy.jpg'),
    zombie: () => require('../../assets/images/transform/modelcard_zombie.jpg'),
    comic_book: () => require('../../assets/images/transform/modelcard_comicbook.jpg'),
    sketch: () => require('../../assets/images/transform/modelcard_pencilsketch.jpg'),
    renaissance: () => require('../../assets/images/transform/modelcard_renaissance.jpg'),
    vaporwave: () => require('../../assets/images/transform/modelcard_vaporware.jpg'),
    watercolor: () => require('../../assets/images/transform/modelcard_waterpainting.jpg'),
  };
  
  const imageLoader = genreExampleMap[genreId];
  return imageLoader ? imageLoader() : null;
};

// Mockup preview styles for each genre - color overlays and gradients
const getGenrePreviewStyle = (genreId: string) => {
  const styles: Record<string, { gradientColors: string[], overlayOpacity: number, blendMode?: any }> = {
    art_deco: { gradientColors: ['rgba(255, 215, 0, 0.4)', 'rgba(0, 0, 0, 0.3)'], overlayOpacity: 0.5 },
    cyberpunk: { gradientColors: ['rgba(138, 43, 226, 0.5)', 'rgba(0, 255, 255, 0.4)'], overlayOpacity: 0.6 },
    wild_west: { gradientColors: ['rgba(139, 69, 19, 0.3)', 'rgba(255, 140, 0, 0.3)'], overlayOpacity: 0.4 },
    vintage: { gradientColors: ['rgba(184, 134, 11, 0.4)', 'rgba(205, 133, 63, 0.3)'], overlayOpacity: 0.5 },
    underwater: { gradientColors: ['rgba(0, 191, 255, 0.4)', 'rgba(32, 178, 170, 0.4)'], overlayOpacity: 0.5 },
    medieval: { gradientColors: ['rgba(139, 69, 19, 0.4)', 'rgba(101, 67, 33, 0.4)'], overlayOpacity: 0.5 },
    neon_tokyo: { gradientColors: ['rgba(255, 20, 147, 0.5)', 'rgba(0, 191, 255, 0.5)'], overlayOpacity: 0.6 },
    steampunk: { gradientColors: ['rgba(184, 115, 51, 0.4)', 'rgba(139, 69, 19, 0.4)'], overlayOpacity: 0.5 },
    spy: { gradientColors: ['rgba(0, 0, 0, 0.5)', 'rgba(25, 25, 112, 0.4)'], overlayOpacity: 0.6 },
    gothic: { gradientColors: ['rgba(75, 0, 130, 0.5)', 'rgba(25, 25, 112, 0.5)'], overlayOpacity: 0.6 },
    '90s': { gradientColors: ['rgba(255, 20, 147, 0.4)', 'rgba(0, 255, 127, 0.4)'], overlayOpacity: 0.5 },
    disco: { gradientColors: ['rgba(255, 0, 255, 0.5)', 'rgba(255, 20, 147, 0.5)', 'rgba(0, 191, 255, 0.5)'], overlayOpacity: 0.6 },
    trump: { gradientColors: ['rgba(255, 215, 0, 0.4)', 'rgba(220, 20, 60, 0.3)'], overlayOpacity: 0.5 },
    anime: { gradientColors: ['rgba(255, 182, 193, 0.4)', 'rgba(135, 206, 250, 0.4)'], overlayOpacity: 0.5 },
    oil_painting: { gradientColors: ['rgba(139, 69, 19, 0.3)', 'rgba(101, 67, 33, 0.3)'], overlayOpacity: 0.4 },
    pixar: { gradientColors: ['rgba(255, 182, 193, 0.3)', 'rgba(135, 206, 250, 0.3)'], overlayOpacity: 0.4 },
    matrix: { gradientColors: ['rgba(0, 255, 0, 0.5)', 'rgba(0, 0, 0, 0.6)'], overlayOpacity: 0.7 },
    zombie: { gradientColors: ['rgba(128, 128, 128, 0.5)', 'rgba(34, 139, 34, 0.4)'], overlayOpacity: 0.6 },
    comic_book: { gradientColors: ['rgba(255, 0, 0, 0.4)', 'rgba(0, 0, 255, 0.4)', 'rgba(255, 255, 0, 0.3)'], overlayOpacity: 0.5 },
    watercolor: { gradientColors: ['rgba(255, 182, 193, 0.3)', 'rgba(221, 160, 221, 0.3)', 'rgba(176, 224, 230, 0.3)'], overlayOpacity: 0.4 },
    renaissance: { gradientColors: ['rgba(184, 134, 11, 0.4)', 'rgba(139, 69, 19, 0.4)'], overlayOpacity: 0.5 },
    vaporwave: { gradientColors: ['rgba(255, 20, 147, 0.5)', 'rgba(0, 191, 255, 0.5)'], overlayOpacity: 0.6 },
    sketch: { gradientColors: ['rgba(128, 128, 128, 0.3)', 'rgba(192, 192, 192, 0.2)'], overlayOpacity: 0.3 },
  };
  return styles[genreId] || { gradientColors: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.2)'], overlayOpacity: 0.3 };
};

const GenreSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri, editMode, preselectedGenreId } = (route.params as any) || {};
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showGenreExampleFullscreen, setShowGenreExampleFullscreen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showWhatThisDoes, setShowWhatThisDoes] = useState(false);
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const hintAnim = useRef(new Animated.Value(0)).current; // 0..1 for opacity/translate
  

  const pickFromLibrary = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        // Stay on the same page; just update params in-place
        // Clear any preselected genre when user uploads their own image
        (navigation as any).setParams({ imageUri: selectedUri, editMode: editMode || EditMode.TRANSFORM, preselectedGenreId: undefined });
        // Clear selected genre if one was previously selected
        setSelectedGenreId(null);
      }
    } catch (error) {
      console.error('Error picking from library:', error);
    }
  };
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const selectedGenre = useMemo(() => GENRES.find(g => g.id === selectedGenreId) || null, [selectedGenreId]);
  const [expandedGenreId, setExpandedGenreId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeTopTab, setActiveTopTab] = useState<'tool' | 'guide' | 'history'>('tool');
  const carouselRef = useRef<FlatList>(null);
  const thumbnailsScrollRef = useRef<ScrollView>(null);
  
  // Get example image for selected genre (for main preview when no user image)
  const selectedGenreExampleImage = useMemo(() => {
    if (!selectedGenreId) return null;
    return getGenreExampleImage(selectedGenreId);
  }, [selectedGenreId]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const previewSwipeStartX = useRef(0);
  const isPreviewSwiping = useRef(false);

  // When navigating back here after capturing/selecting an image, preserve the originally tapped style
  // Only auto-select if preselectedGenreId is explicitly provided (e.g., from QuickCameraLocal)
  // But don't auto-select when user just uploads an image themselves
  useEffect(() => {
    if (preselectedGenreId && preselectedGenreId !== selectedGenreId && !imageUri) {
      // Only auto-select if there's no image yet - this handles the case when user clicks a style first
      setSelectedGenreId(preselectedGenreId);
      // Scroll to the selected genre in carousel
      if (viewMode === 'carousel') {
        const index = GENRES.findIndex(g => g.id === preselectedGenreId);
        if (index >= 0 && carouselRef.current) {
          setTimeout(() => {
            carouselRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
          }, 100);
        }
      }
    }
  }, [preselectedGenreId, imageUri, selectedGenreId, viewMode]);

  // Subtle animations for attention guidance when no image
  useEffect(() => {
    if (!imageUri) {
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(120),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(hintAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(hintAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [imageUri]);

  // removed recents

  // PanResponder for swipe gesture on preview image
  // Only responds to clear horizontal swipes, not vertical scrolling or carousel scrolling
  const previewPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture on start - let ScrollView handle vertical scrolling
      onStartShouldSetPanResponderCapture: () => false, // Don't capture during capture phase
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to very clear horizontal swipes (not vertical scrolling or carousel scrolling)
        // Require horizontal movement to be at least 3x the vertical movement
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 3;
        const hasSignificantMovement = Math.abs(gestureState.dx) > 30; // Higher threshold
        // Only activate if we're clearly swiping horizontally on the preview image
        return isHorizontal && hasSignificantMovement;
      },
      onMoveShouldSetPanResponderCapture: () => false, // Don't capture during capture phase
      onPanResponderGrant: () => {
        previewSwipeStartX.current = carouselIndex;
        isPreviewSwiping.current = true;
      },
      onPanResponderMove: () => {
        // No visual translation - just let the release handle the change
      },
      onPanResponderRelease: (_, gestureState) => {
        isPreviewSwiping.current = false;
        
        const swipeThreshold = 80; // Higher threshold for more intentional swipes
        let newIndex = carouselIndex;
        
        // Only process if it was very clearly a horizontal swipe
        // Require horizontal to be at least 2x vertical movement
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        
        if (isHorizontal && Math.abs(gestureState.dx) > swipeThreshold) {
          if (gestureState.dx < -swipeThreshold && carouselIndex < GENRES.length - 1) {
            // Swipe left - next genre
            newIndex = carouselIndex + 1;
          } else if (gestureState.dx > swipeThreshold && carouselIndex > 0) {
            // Swipe right - previous genre
            newIndex = carouselIndex - 1;
          }
          
          // Update selection if changed
          if (newIndex !== carouselIndex && GENRES[newIndex]) {
            haptic.medium();
            setSelectedGenreId(GENRES[newIndex].id);
            setCarouselIndex(newIndex);
            // Scroll carousel to match
            setTimeout(() => {
              if (carouselRef.current) {
                carouselRef.current.scrollToIndex({ 
                  index: newIndex, 
                  animated: true,
                  viewPosition: 0.5,
                });
              }
            }, 50);
          }
        }
      },
      onPanResponderTerminate: () => {
        // If gesture is cancelled, just reset
        isPreviewSwiping.current = false;
      },
      onPanResponderTerminationRequest: () => true, // Allow cancellation
    })
  ).current;

  // Update preview position when genre changes via carousel
  useEffect(() => {
    if (!isPreviewSwiping.current && selectedGenreId) {
      const index = GENRES.findIndex(g => g.id === selectedGenreId);
      if (index >= 0 && index !== carouselIndex) {
        setCarouselIndex(index);
      }
    }
  }, [selectedGenreId]);

  // Auto-scroll thumbnails to selected genre
  useEffect(() => {
    if (selectedGenreId && thumbnailsScrollRef.current && viewMode === 'carousel') {
      const index = GENRES.findIndex(g => g.id === selectedGenreId);
      if (index >= 0) {
        // Calculate approximate position (thumbnail width + margin)
        const thumbnailWidth = 90; // Approximate width including margins
        const scrollPosition = Math.max(0, (index * thumbnailWidth) - (width / 2) + (thumbnailWidth / 2));
        setTimeout(() => {
          thumbnailsScrollRef.current?.scrollTo({
            x: scrollPosition,
            animated: true,
          });
        }, 100);
      }
    }
  }, [selectedGenreId, viewMode]);

  const handleGenreSelect = (genreId: string) => {
    const genre = GENRES.find(g => g.id === genreId);
    if (genre) {
      haptic.medium();

      // If no image yet, prompt to take a picture first
      if (!imageUri) {
        // Open local camera within Features stack; keep bottom bar
        (navigation as any).navigate('QuickCameraLocal', {
          editMode: EditMode.TRANSFORM,
          preselectedGenreId: genre.id,
          onPhoto: (uri: string) => {
            (navigation as any).setParams({ imageUri: uri, editMode: EditMode.TRANSFORM, preselectedGenreId: genre.id });
          }
        });
        return;
      }

      // Do not auto-generate; store selection and show bottom banner
      setSelectedGenreId(genre.id);
    }
  };

  const handleGenerate = () => {
    if (!selectedGenreId || !imageUri) return;
    const genre = GENRES.find(g => g.id === selectedGenreId);
    if (!genre) return;

    const navParams = {
      imageUri,
      editMode: editMode || EditMode.TRANSFORM,
      config: { prompt: genre.prompt, genre: genre.id }
    } as any;
    (navigation as any).navigate('Processing', navParams);
  };

  // removed featured/recent/search/sort helpers

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}>
      <AIToolHeader
        title="Transform Your Photo"
        backgroundColor={colors.backgroundSecondary}
      />

      {/* Floating Top Tab Switcher */}
      <TopTabSwitcher
        tabs={[
          { id: 'tool', label: 'Tool', icon: 'create-outline' },
          { id: 'guide', label: 'Guide', icon: 'book-outline' },
          { id: 'history', label: 'History', icon: 'time-outline' },
        ]}
        activeTab={activeTopTab}
        onTabChange={(tabId) => setActiveTopTab(tabId as 'tool' | 'guide' | 'history')}
      />

      {/* Add top padding to content to account for floating tab bar */}
      <View style={{ height: 12 + 48 + 12 }} />

      {activeTopTab === 'tool' && (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Add padding when button is visible to prevent content from being hidden
          // ActionButtonBar is ~100px (button 56px + padding + timing info) + safe area
          imageUri && selectedGenreId 
            // Use proper padding that accounts for floating tab bar
            // When button is visible, account for ActionButtonBar height
            ? { paddingBottom: scrollBottomPaddingWithButton } 
            : { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section: image preview or camera prompt */}
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, alignItems: 'center' }}>
          {imageUri ? (
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setShowImagePreview(true);
              }}
              activeOpacity={0.9}
              style={{ alignSelf: 'center' }}
            >
              <View style={[styles.heroImageWrapper, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }]}> 
                <Image
                  source={{ uri: imageUri }}
                  style={styles.heroImage}
                  resizeMode="cover"
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
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    haptic.light();
                    (navigation as any).setParams({ imageUri: undefined, preselectedGenreId: undefined });
                    setSelectedGenreId(null);
                  }}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ alignSelf: 'center', width: '100%' }}>
              <LinearGradient
                colors={[colors.primary + '12', colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroImageWrapper, {
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: spacing.base,
                  height: 220,
                }]}
              >
                <Animated.View style={[styles.ctaGrid, { transform: [{ scale: cardScale }] }]}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.ctaCard, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '26' }]}
                    onPress={() => {
                      haptic.medium();
                      // Navigate to QuickCameraLocal in the same Features stack
                      (navigation as any).navigate('QuickCameraLocal', { editMode: EditMode.TRANSFORM });
                    }}
                  >
                    <View style={[styles.ctaIconCircle, { backgroundColor: colors.primary + '22' }]}> 
                      <Ionicons name="camera-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={{ marginTop: 8, color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }}>
                      Capture
                    </Text>
                    <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: typography.scaled.sm }}>
                      Take your picture
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.ctaCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    onPress={pickFromLibrary}
                  >
                    <View style={[styles.ctaIconCircle, { backgroundColor: colors.surface }]}> 
                      <Ionicons name="images-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={{ marginTop: 8, color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }}>
                      Library
                    </Text>
                    <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: typography.scaled.sm }}>
                      Photo Roll
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.Text
                  style={{
                    marginTop: spacing.lg,
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                    opacity: hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                    transform: [{ translateY: hintAnim.interpolate({ inputRange: [0, 1], outputRange: [2, -1] }) }],
                  }}
                >
                  Choose one to get started
                </Animated.Text>
              </LinearGradient>
            </View>
          )}

          {/* Tool Stats Bar */}
          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.sm }}>
            <ToolStatsBar
              time="5-10 sec"
              cost="0.5 cost"
              rating="4.8/5"
              usage="1.2k today"
            />
          </View>
        </View>

      {/* Removed search, sorting, featured and recent sections */}

        {/* Style Selection Section */}
        <View style={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base }}>
            <Text style={[styles.sectionTitle, {
              color: colors.text,
              fontSize: typography.scaled.lg,
              fontWeight: typography.weight.bold,
            }]}>
              Choose a Style
            </Text>
            {/* View Toggle */}
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel');
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons 
                name={viewMode === 'carousel' ? 'grid' : 'list'} 
                size={18} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Polaroid Style View */}
        {viewMode === 'carousel' && (
          <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.base }}>
            {/* Polaroid Frame */}
            <View style={[styles.polaroidContainer, {
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }]}>
              {/* Main Image Area */}
              <View style={styles.polaroidImageContainer}>
                {selectedGenreExampleImage ? (
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => {
                      haptic.light();
                      setShowGenreExampleFullscreen(true);
                    }}
                    style={styles.polaroidImageWrapper}
                  >
                    <Image 
                      source={selectedGenreExampleImage} 
                      style={styles.polaroidImage}
                      resizeMode="cover"
                    />
                    {/* Expand Icon in Top Right */}
                    <View style={[styles.expandIconButton, {
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }]}>
                      <Ionicons name="expand" size={20} color="#FFFFFF" />
                    </View>
                    {/* Info Overlay - Inside the image */}
                    {selectedGenreId && selectedGenre && (
                      <View style={styles.polaroidOverlay}>
                        <LinearGradient
                          colors={['transparent', 'rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.95)']}
                          style={styles.polaroidOverlayGradient}
                        >
                          {/* Additional backdrop for extra readability */}
                          <View style={styles.polaroidOverlayBackdrop} />
                          <View style={styles.polaroidOverlayContent}>
                            {/* Style Name */}
                            <Text style={[styles.polaroidStyleName, styles.polaroidTextShadow, {
                              color: '#FFFFFF',
                              fontSize: typography.scaled.lg,
                              fontWeight: typography.weight.bold,
                            }]}>
                              {selectedGenre.icon} {selectedGenre.name}
                            </Text>
                            
                            {/* Description */}
                            <Text style={[styles.polaroidDescription, styles.polaroidTextShadow, {
                              color: '#FFFFFF',
                              fontSize: typography.scaled.sm,
                              marginTop: spacing.xs,
                            }]} numberOfLines={2}>
                              {selectedGenre.description}
                            </Text>
                          </View>
                        </LinearGradient>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.polaroidImage, { 
                    backgroundColor: colors.backgroundSecondary,
                    position: 'relative',
                    overflow: 'hidden',
                  }]}>
                    {selectedGenreExampleImage ? (
                      <>
                        <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                          <Image 
                            source={selectedGenreExampleImage}
                            style={{ width: '100%', height: '120%', position: 'absolute', top: 0 }}
                            resizeMode="cover"
                          />
                        </View>
                        {/* Info Overlay - Show title and description over example image */}
                        {selectedGenreId && selectedGenre && (
                          <View style={[styles.polaroidOverlay, {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                          }]}>
                            <LinearGradient
                              colors={['transparent', 'rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.95)']}
                              style={styles.polaroidOverlayGradient}
                            >
                              <View style={styles.polaroidOverlayContent}>
                                {/* Style Name */}
                                <Text style={[styles.polaroidStyleName, styles.polaroidTextShadow, {
                                  color: '#FFFFFF',
                                  fontSize: typography.scaled.lg,
                                  fontWeight: typography.weight.bold,
                                }]}>
                                  {selectedGenre.icon} {selectedGenre.name}
                                </Text>
                                
                                {/* Description */}
                                <Text style={[styles.polaroidDescription, styles.polaroidTextShadow, {
                                  color: '#FFFFFF',
                                  fontSize: typography.scaled.sm,
                                  marginTop: spacing.xs,
                                }]} numberOfLines={2}>
                                  {selectedGenre.description}
                                </Text>
                              </View>
                            </LinearGradient>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
                        <Text style={{ marginTop: spacing.sm, color: colors.textSecondary, fontSize: typography.scaled.sm, textAlign: 'center' }}>
                          Select a photo to preview styles
                        </Text>
                        {/* Info Overlay - Show title and description */}
                        {selectedGenreId && selectedGenre && (
                          <View style={[styles.polaroidOverlay, {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                          }]}>
                            <LinearGradient
                              colors={['transparent', colors.surface + 'CC', colors.surface + 'E6']}
                              style={styles.polaroidOverlayGradient}
                            >
                              <View style={styles.polaroidOverlayContent}>
                                {/* Style Name */}
                                <Text style={[styles.polaroidStyleName, {
                                  color: colors.text,
                                  fontSize: typography.scaled.lg,
                                  fontWeight: typography.weight.bold,
                                }]}>
                                  {selectedGenre.icon} {selectedGenre.name}
                                </Text>
                                
                                {/* Description */}
                                <Text style={[styles.polaroidDescription, {
                                  color: colors.textSecondary,
                                  fontSize: typography.scaled.sm,
                                  marginTop: spacing.xs,
                                }]} numberOfLines={2}>
                                  {selectedGenre.description}
                                </Text>
                              </View>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>


              {/* Bottom Thumbnails - Scrollable All Styles */}
              <View style={{ marginTop: spacing.base }}>
                <Text style={[styles.polaroidThumbnailsTitle, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.semibold,
                  marginBottom: spacing.sm,
                  paddingHorizontal: spacing.xs,
                }]}>
                  All Styles ({GENRES.length})
                </Text>
                <ScrollView
                  ref={thumbnailsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.polaroidThumbnailsScrollContent}
                  style={styles.polaroidThumbnailsScrollView}
                >
                  {GENRES.map((genre, index) => {
                    const isSelected = selectedGenreId === genre.id;
                    return (
                      <TouchableOpacity
                        key={genre.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          haptic.medium();
                          setSelectedGenreId(genre.id);
                          const genreIndex = GENRES.findIndex(g => g.id === genre.id);
                          if (genreIndex >= 0) {
                            setCarouselIndex(genreIndex);
                          }
                        }}
                        style={[styles.polaroidThumbnail, {
                          borderWidth: isSelected ? 3 : 2,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
                          marginRight: spacing.sm,
                        }]}
                      >
                        {(() => {
                          // Always show genre example images in thumbnails, not user's image
                          const exampleImage = getGenreExampleImage(genre.id);
                          return exampleImage ? (
                            <View style={[styles.polaroidThumbnailImage, {
                              overflow: 'hidden',
                              position: 'relative',
                            }]}>
                              <Image 
                                source={exampleImage}
                                style={{ width: '100%', height: '120%', position: 'absolute', top: 0 }}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <View style={[styles.polaroidThumbnailImage, {
                              backgroundColor: colors.backgroundSecondary,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }]}>
                              <Text style={{ fontSize: 24 }}>{genre.icon}</Text>
                            </View>
                          );
                        })()}
                        <Text style={[styles.polaroidThumbnailLabel, {
                          color: isSelected ? colors.primary : colors.text,
                          fontSize: typography.scaled.xs,
                          fontWeight: isSelected ? typography.weight.bold : typography.weight.medium,
                        }]} numberOfLines={1}>
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}>
            <View style={styles.gridContainer}>
              {GENRES.map((genre, index) => {
                const isSelected = selectedGenreId === genre.id;
                const isLeftColumn = index % 2 === 0;
                return (
                  <TouchableOpacity
                    key={genre.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      haptic.medium();
                      setSelectedGenreId(genre.id);
                    }}
                    style={[styles.gridCard, {
                      borderWidth: isSelected ? 2.5 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                      marginRight: isLeftColumn ? baseSpacing.sm : 0,
                      marginBottom: baseSpacing.sm,
                    }]}
                  >
                    {(() => {
                      // Always show genre example images in grid, not user's image
                      const exampleImage = getGenreExampleImage(genre.id);
                      return exampleImage ? (
                        <View style={styles.gridThumbnail}>
                          <Image 
                            source={exampleImage}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          {/* Overlay Label on Image */}
                          <LinearGradient
                            colors={['transparent', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.85)']}
                            style={styles.gridLabelOverlay}
                          >
                            <Text style={[styles.gridLabel, { 
                              color: '#FFFFFF',
                              fontSize: typography.scaled.xs,
                              fontWeight: isSelected ? typography.weight.bold : typography.weight.medium,
                            }]}>
                              {genre.icon} {genre.name}
                            </Text>
                            {isSelected && (
                              <Text style={[styles.gridDescription, {
                                color: '#FFFFFF',
                                fontSize: typography.scaled.xs * 0.85,
                                marginTop: spacing.xs / 2,
                                opacity: 0.9,
                              }]} numberOfLines={2}>
                                {genre.description}
                              </Text>
                            )}
                          </LinearGradient>
                        </View>
                      ) : (
                        <View style={styles.gridThumbnail}>
                          <View style={{ 
                            width: '100%',
                            height: '100%',
                            backgroundColor: colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <Text style={{ fontSize: 28 }}>{genre.icon}</Text>
                          </View>
                          {/* Label for no-image case */}
                          <View style={[styles.gridLabelContainer, {
                            backgroundColor: 'transparent',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                          }]}>
                            <Text style={[styles.gridLabel, { 
                              color: colors.text,
                              fontSize: typography.scaled.xs,
                              fontWeight: isSelected ? typography.weight.bold : typography.weight.medium,
                            }]}>
                              {genre.icon} {genre.name}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}


      </ScrollView>
      )}

      {activeTopTab === 'guide' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Guide Tab Content with sub-tabs */}
          <TabView
            tabs={[
              { id: 'guide', label: 'Guide', icon: 'book-outline' },
              { id: 'info', label: 'Info', icon: 'information-circle-outline' },
            ]}
            defaultTab="guide"
            containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
          >
            {/* Guide Tab */}
            <ToolGuideTab
              title="How to Transform Your Photo"
              content={`Transform your photo into stunning artistic styles while preserving your identity.\n\n📸 Step 1: Select Your Photo\nChoose a photo from your library or take a new one. Portrait photos work best.\n\n🎨 Step 2: Choose Art Style\nSelect from multiple artistic genres:\n• Cyberpunk - Futuristic neon aesthetics\n• Oil Painting - Classic artistic textures\n• Anime - Cartoon art style\n• Watercolor - Soft painted effects\n• And many more styles\n\n✨ Step 3: Generate\nTap Generate and wait 5-10 seconds. The AI will apply the selected style while preserving your facial features and identity.\n\n🎯 Pro Tips\n• Portrait photos produce the best transformations\n• Your identity and facial features are preserved\n• Each style has unique characteristics\n• Try different styles to find your favorite\n• Works great for profile pictures and artistic projects`}
              images={[
                {
                  source: require('../../assets/images/transform/modelcard_transform.jpg'),
                  caption: 'Example of artistic style transformation'
                }
              ]}
            />

            {/* Info Tab */}
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="color-palette-outline"
                whatDescription={`Transform your photo into stunning artistic styles while preserving your identity. Choose from ${GENRES.length} unique transformations ranging from classic art styles to futuristic themes.`}
                howDescription="The system analyzes your photo's content and structure, then applies learned style patterns to blend artistic elements while preserving important details like facial features and composition."
                howItems={[
                  { text: 'Face recognition preserved' },
                  { text: `${GENRES.length} unique art styles` },
                  { text: 'High-quality AI rendering' },
                ]}
                expandableWhat={false}
                expandableHow={false}
              />
            </View>
          </TabView>
          
          {/* Extra bottom padding */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {activeTopTab === 'history' && (
        <ToolHistoryTab editMode={EditMode.TRANSFORM} />
      )}

      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!(imageUri && selectedGenreId)}
      >
        <Button
          title={selectedGenre ? `Generate ${selectedGenre.name} (5–10s)` : 'Generate (5–10s)'}
          onPress={handleGenerate}
          size="large"
          style={{ minHeight: 56, width: '100%' }}
        />
      </ActionButtonBar>

      {/* Image Preview Modal with Zoom */}
      <Modal
        visible={!!imageUri && showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        statusBarTranslucent
      >
        <ZoomableImage
          uri={imageUri || ''}
          onClose={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
        />
      </Modal>

      {/* Genre Example Image Fullscreen Modal */}
      <Modal
        visible={showGenreExampleFullscreen && !!selectedGenreExampleImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenreExampleFullscreen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          onPress={() => {
            haptic.light();
            setShowGenreExampleFullscreen(false);
          }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}>
                {selectedGenreExampleImage && (
                  <Image 
                    source={selectedGenreExampleImage} 
                    style={styles.previewModalImage} 
                    resizeMode="contain" 
                  />
                )}
              </View>
              {/* Close Button */}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
                onPress={() => {
                  haptic.light();
                  setShowGenreExampleFullscreen(false);
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Pressable>
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
    flexGrow: 1,
  },
  heroImageWrapper: {
    width: width - (baseSpacing.base * 2),
    height: width - (baseSpacing.base * 2),
    maxHeight: 300,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
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
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  modernCard: {
    // Dynamic styles applied inline
  },
  divider: {
    height: 1,
    marginHorizontal: baseSpacing.base,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  explanationTitle: {
    // Dynamic styles applied inline
  },
  explanationText: {
    // Dynamic styles applied inline
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: baseSpacing.sm,
  },
  checkText: {
    // Dynamic styles applied inline
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: baseSpacing.sm,
  },
  techDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  techText: {
    // Dynamic styles applied inline
  },
  techSectionTitle: {
    // Dynamic styles applied inline
  },
  techNote: {
    // Dynamic styles applied inline
  },
  sectionTitle: {
    // Dynamic styles applied inline
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  genreCard: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  genreGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  genreIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  genreName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  genreDescription: {
    textAlign: 'center',
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
  imageWrapper: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  previewModalImage: {
    width: width - 56,
    height: height * 0.65,
    borderRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: baseSpacing.base + 44, // Safe area + spacing
    right: baseSpacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ctaBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  ctaGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: baseSpacing.base,
    justifyContent: 'space-between',
  },
  ctaCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    // Dynamic styles applied inline
  },
  // Polaroid styles
  polaroidContainer: {
    width: '100%',
    borderRadius: 8,
    padding: baseSpacing.base,
    paddingTop: baseSpacing.base,
    paddingBottom: baseSpacing.lg,
  },
  polaroidImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: baseSpacing.sm,
  },
  polaroidImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  expandIconButton: {
    position: 'absolute',
    top: baseSpacing.sm,
    right: baseSpacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  polaroidOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    justifyContent: 'flex-end',
  },
  polaroidOverlayGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: baseSpacing.base,
    paddingHorizontal: baseSpacing.base,
  },
  polaroidOverlayBackdrop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  polaroidOverlayContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  polaroidTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    elevation: 2,
  },
  polaroidDivider: {
    height: 1,
    width: '100%',
    marginVertical: baseSpacing.base,
  },
  polaroidInfoSection: {
    paddingHorizontal: baseSpacing.xs,
  },
  polaroidStyleName: {
    textAlign: 'center',
  },
  polaroidDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  polaroidSwipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: baseSpacing.xs,
  },
  polaroidThumbnailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: baseSpacing.base,
    paddingHorizontal: baseSpacing.xs,
  },
  polaroidThumbnailsScrollView: {
    marginHorizontal: -baseSpacing.xs,
  },
  polaroidThumbnailsScrollContent: {
    paddingHorizontal: baseSpacing.xs,
    paddingRight: baseSpacing.base,
  },
  polaroidThumbnailsTitle: {
    // Dynamic styles applied inline
  },
  polaroidThumbnail: {
    width: 90,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: baseSpacing.xs,
  },
  polaroidThumbnailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: baseSpacing.xs,
  },
  polaroidThumbnailLabel: {
    textAlign: 'center',
    paddingHorizontal: baseSpacing.xs,
  },
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - (baseSpacing.base * 2) - baseSpacing.sm) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: baseSpacing.xs,
    paddingVertical: baseSpacing.xs,
    paddingTop: baseSpacing.base,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  gridLabelContainer: {
    flex: 1,
    paddingHorizontal: baseSpacing.xs,
    paddingVertical: baseSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    textAlign: 'center',
  },
  gridDescription: {
    textAlign: 'center',
    lineHeight: 14,
  },
  // Quick Select styles
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickSelectCard: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickSelectThumbnail: {
    width: '100%',
    height: '75%',
  },
  quickSelectLabelContainer: {
    flex: 1,
    paddingHorizontal: baseSpacing.xs,
    paddingVertical: baseSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickSelectLabel: {
    textAlign: 'center',
  },
});

export default GenreSelectionScreen;
