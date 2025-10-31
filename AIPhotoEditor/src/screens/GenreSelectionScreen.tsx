import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
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
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding

const GenreSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri, editMode, preselectedGenreId } = (route.params as any) || {};
  const [showImagePreview, setShowImagePreview] = useState(false);
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
        (navigation as any).setParams({ imageUri: selectedUri, editMode: editMode || EditMode.TRANSFORM });
      }
    } catch (error) {
      console.error('Error picking from library:', error);
    }
  };
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const selectedGenre = useMemo(() => GENRES.find(g => g.id === selectedGenreId) || null, [selectedGenreId]);
  const [expandedGenreId, setExpandedGenreId] = useState<string | null>(null);

  // When navigating back here after capturing/selecting an image, preserve the originally tapped style
  useEffect(() => {
    if (preselectedGenreId && preselectedGenreId !== selectedGenreId) {
      setSelectedGenreId(preselectedGenreId);
    }
  }, [preselectedGenreId]);

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Add padding when button is visible to prevent content from being hidden
          imageUri && selectedGenreId ? { paddingBottom: 120 } : { paddingBottom: insets.bottom + spacing.base },
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
                      const parentNav = navigation.getParent();
                      if (parentNav) {
                        (parentNav as any).navigate('QuickCameraLocal', { editMode: EditMode.TRANSFORM });
                      } else {
                        (navigation as any).navigate('QuickCameraLocal', { editMode: EditMode.TRANSFORM });
                      }
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

          {/* Quick Info Badges */}
          <View style={[styles.badgesContainer, { marginTop: spacing.xs }]}>
            <View style={[styles.badge, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}>
                AI-powered
              </Text>
            </View>
            <View style={[styles.badge, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="apps-outline" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}>
                {GENRES.length} Styles
              </Text>
            </View>
            <View style={[styles.badge, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="brush-outline" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }]}>
                Professional
              </Text>
            </View>
          </View>
        </View>

      {/* Removed search, sorting, featured and recent sections */}

      {/* Modern Information Card */}
        <AIToolInfoCard
          icon="color-palette-outline"
          whatDescription={`Transform your photo into stunning artistic styles while preserving your identity. Choose from ${GENRES.length} unique transformations ranging from classic art styles to futuristic themes.`}
          howDescription="The system analyzes your photo’s content and structure, then applies learned style patterns to blend artistic elements while preserving important details like facial features and composition."
          howItems={[
            { text: 'Face recognition preserved' },
            { text: `${GENRES.length} unique art styles` },
            { text: 'High-quality AI rendering' },
          ]}
        />

        {/* Style Selection Section */}
        <View style={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, {
            color: colors.text,
            fontSize: typography.scaled.lg,
            fontWeight: typography.weight.bold,
            marginBottom: spacing.base,
          }]}>
            Choose a Style
          </Text>
        </View>

        {/* Accordion list of styles */}
        <View style={{ paddingHorizontal: spacing.base }}>
          {GENRES.map((genre, index, array) => {
            const isExpanded = expandedGenreId === genre.id;
            const isSelected = selectedGenreId === genre.id;
            const isLast = index === array.length - 1;
            return (
              <View key={genre.id}>
                <Card
                  icon={genre.icon}
                  title={genre.name}
                  subtitle={genre.description}
                  rightIcon={isExpanded ? 'chevron-up' : 'chevron'}
                  onPress={() => {
                    haptic.light();
                    setExpandedGenreId(isExpanded ? null : genre.id);
                    setSelectedGenreId(genre.id);
                  }}
                  isFirstInGroup={index === 0}
                  isLastInGroup={isLast && !isExpanded}
                  showSeparator={!isExpanded && index < array.length - 1}
                  iconColor={colors.primary}
                  style={[
                    isSelected && {
                      borderWidth: 1,
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '0F',
                    }
                  ]}
                />

                {isExpanded && (
                  <View style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderBottomLeftRadius: isLast ? 12 : 0,
                    borderBottomRightRadius: isLast ? 12 : 0,
                    padding: spacing.base,
                  }}>
                    {/* Thumbnails grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                      {[0,1,2].map((i) => (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.85}
                          onPress={() => {
                            haptic.light();
                            setSelectedGenreId(genre.id);
                          }}
                          style={{
                            width: Math.floor((width - (spacing.base * 2) - 24) / 3) - 6,
                            aspectRatio: 1,
                            borderRadius: 8,
                            marginBottom: 8,
                            overflow: 'hidden',
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: colors.surfaceElevated,
                          }}
                        >
                          {imageUri ? (
                            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                              <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: typography.scaled.xs }}>Preview</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Brief style description */}
                    <Text
                      style={{
                        marginTop: spacing.sm,
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                      }}
                    >
                      {genre.description}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ActionButtonBar
        visible={!!(imageUri && selectedGenreId)}
        bottomContent={
          <View style={[styles.timingInfo, {
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.xs,
            borderRadius: 20,
          }]}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.timingText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              marginLeft: spacing.xs,
            }]}>
              5–10s
            </Text>
          </View>
        }
      >
        <Button
          title={selectedGenre ? `Generate ${selectedGenre.name}` : 'Generate'}
          onPress={handleGenerate}
          size="large"
          style={{ minHeight: 56, width: '100%' }}
        />
      </ActionButtonBar>

      {/* Image Preview Modal */}
      <Modal
        visible={!!imageUri && showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <Pressable
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          onPress={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            {/* Image - center of screen with elegant styling */}
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewModalImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Elegant hint with gradient backdrop */}
            <View style={styles.hintContainer}>
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.4)']}
                style={styles.hintGradient}
              >
                <View style={[styles.hintBubble, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
                  <Ionicons name="hand-left-outline" size={18} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={[styles.previewModalHint, { color: 'rgba(255, 255, 255, 0.9)', fontSize: typography.scaled.base, fontWeight: typography.weight.medium }]}>
                    Tap anywhere to close
                  </Text>
                </View>
              </LinearGradient>
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
});

export default GenreSelectionScreen;
