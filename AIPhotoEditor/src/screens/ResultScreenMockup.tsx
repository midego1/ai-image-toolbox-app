import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { AIToolHeader } from '../components/AIToolHeader';
import { useScrollBottomPadding } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

/**
 * ResultScreenMockup - Interactive demo of the redesigned Results screen
 *
 * Key improvements showcased:
 * 1. Hero image takes 45% of screen (balanced size)
 * 2. Drag on image for before/after comparison
 * 3. Tap image to zoom (quick tap with minimal movement)
 * 4. Gallery navigation to browse through multiple results
 * 5. Floating action buttons (beautiful card design)
 * 6. Reduced badges from 4-5 to 2-3
 * 7. Collapsible details section
 * 8. Cleaner visual hierarchy
 */
const ResultScreenMockup = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scrollBottomPadding = useScrollBottomPadding();

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0.5); // 0 = before, 1 = after
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartRef = useRef({ x: 0, time: 0 });

  const IMAGE_CONTAINER_HEIGHT = height * 0.45;
  const imageWidth = width - (spacing.lg * 2);

  // Mock multiple results for gallery demo - different results of the same style
  const styleName = 'Monet';
  const mockResults = [
    { resultNumber: 1, colors: [colors.primary + '40', colors.primary + 'A0', colors.primary], icon: 'sparkles' },
    { resultNumber: 2, colors: [colors.primary + '50', colors.primary + 'B0', colors.primary], icon: 'sparkles' },
    { resultNumber: 3, colors: [colors.primary + '45', colors.primary + 'A5', colors.primary], icon: 'sparkles' },
    { resultNumber: 4, colors: [colors.primary + '55', colors.primary + 'B5', colors.primary], icon: 'sparkles' },
  ];

  const currentResult = mockResults[currentImageIndex];

  const handleZoomTap = () => {
    haptic.medium();
    alert('Zoom to full size\n\nThis would show the image in full screen mode with pinch-to-zoom.');
  };

  const updateSliderFromImageTouch = (locationX: number) => {
    // Calculate position relative to the image width
    const newPosition = Math.max(0, Math.min(1, locationX / imageWidth));
    setSliderPosition(newPosition);
  };

  const handleAction = (action: string) => {
    haptic.medium();
    setTimeout(() => {
      alert(`${action} action!\n\nThis is a demo mockup.`);
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <AIToolHeader
        title="Result Screen Redesign"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingImage}
      >
        {/* Hero Section - 45% of screen */}
        <View style={[styles.heroSection, { paddingHorizontal: spacing.lg }]}>

          {/* Image Counter & Navigation */}
          <View style={styles.imageHeader}>
            <TouchableOpacity
              onPress={() => {
                if (currentImageIndex > 0) {
                  haptic.light();
                  setCurrentImageIndex(currentImageIndex - 1);
                }
              }}
              disabled={currentImageIndex === 0}
              style={[styles.navButton, { opacity: currentImageIndex === 0 ? 0.3 : 1 }]}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.counterContainer}>
              <Text style={[styles.counterText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                Result {currentImageIndex + 1} / {mockResults.length}
              </Text>
              <Text style={[styles.styleLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
                {styleName} Style
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (currentImageIndex < mockResults.length - 1) {
                  haptic.light();
                  setCurrentImageIndex(currentImageIndex + 1);
                }
              }}
              disabled={currentImageIndex === mockResults.length - 1}
              style={[styles.navButton, { opacity: currentImageIndex === mockResults.length - 1 ? 0.3 : 1 }]}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Large Image Preview - Drag to Compare or Tap to Zoom */}
          <View
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              const locationX = e.nativeEvent.locationX;
              touchStartRef.current = { x: locationX, time: Date.now() };
              haptic.light();
              setIsDraggingImage(true);
              updateSliderFromImageTouch(locationX);
            }}
            onResponderMove={(e) => {
              updateSliderFromImageTouch(e.nativeEvent.locationX);
            }}
            onResponderRelease={(e) => {
              const moveDistance = Math.abs(e.nativeEvent.locationX - touchStartRef.current.x);
              const tapDuration = Date.now() - touchStartRef.current.time;

              // If it was a quick tap with minimal movement, treat as zoom tap
              if (moveDistance < 10 && tapDuration < 200) {
                handleZoomTap();
              } else {
                haptic.light();
              }

              setIsDraggingImage(false);
            }}
            onResponderTerminate={() => {
              setIsDraggingImage(false);
            }}
            style={[
              styles.imageContainer,
              {
                height: IMAGE_CONTAINER_HEIGHT,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000',
                marginTop: spacing.sm,
              }
            ]}
          >
            {/* AFTER Image (Base Layer) - Styled Result */}
            <LinearGradient
              colors={currentResult.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imageGradient}
            >
              <View style={styles.imageContent}>
                <Ionicons name={currentResult.icon as any} size={80} color="#FFFFFF40" />
                <Text style={[styles.imageLabel, { color: '#FFFFFFC0', marginTop: spacing.md }]}>
                  STYLED
                </Text>
              </View>
            </LinearGradient>

            {/* BEFORE Image (Clipped Layer) - Original */}
            <View
              style={[
                styles.beforeLayer,
                {
                  width: `${sliderPosition * 100}%`,
                }
              ]}
              pointerEvents="none"
            >
              <View style={{ width: imageWidth, height: IMAGE_CONTAINER_HEIGHT }}>
                <LinearGradient
                  colors={[colors.textSecondary + '30', colors.textSecondary + '50', colors.textSecondary + '70']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.imageGradient}
                >
                  <View style={styles.imageContent}>
                    <Ionicons name="image-outline" size={80} color={colors.textSecondary + '80'} />
                    <Text style={[styles.imageLabel, { color: colors.textSecondary + 'B0', marginTop: spacing.md }]}>
                      ORIGINAL
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Divider Line */}
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: colors.primary,
                  left: `${sliderPosition * 100}%`,
                  opacity: isDraggingImage ? 0.9 : 1,
                }
              ]}
              pointerEvents="none"
            />

            {/* Current State Label */}
            <View style={[styles.stateLabel, { backgroundColor: colors.primary }]}>
              <Text style={styles.stateLabelText}>
                {sliderPosition < 0.5 ? 'ORIGINAL' : 'STYLED'}
              </Text>
            </View>

            {/* Interaction hints */}
            <View style={styles.zoomHint} pointerEvents="none">
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.zoomGradient}
              >
                {isDraggingImage ? (
                  <>
                    <Ionicons name="swap-horizontal" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.zoomText}>Comparing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="expand" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.zoomText}>Tap to zoom • Drag to compare</Text>
                  </>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Page Indicators */}
          <View style={[styles.pageIndicators, { marginTop: spacing.md }]}>
            {mockResults.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  haptic.light();
                  setCurrentImageIndex(index);
                }}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentImageIndex ? colors.primary : colors.border,
                    width: index === currentImageIndex ? 24 : 8,
                  }
                ]}
              />
            ))}
          </View>

          {/* Simplified Status Chips - Only 2 badges! */}
          <View style={[styles.statusChips, { marginTop: spacing.md }]}>
            <View style={[styles.chip, {
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                Complete • 1 credit
              </Text>
            </View>
            <View style={[styles.chip, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.chipText, { color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                2m ago
              </Text>
            </View>
          </View>
        </View>

        {/* Beautiful Floating Action Buttons Card */}
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <View style={[styles.actionCard, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
          }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Save')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="save-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold }]}>
                Save
              </Text>
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Share')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="share-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold }]}>
                Share
              </Text>
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Retry')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="refresh-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold }]}>
                Retry
              </Text>
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('More')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold }]}>
                More
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Details Section */}
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
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
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Style
                </Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                  {styleName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Intensity
                </Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                  80%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Processing Time
                </Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                  8.3s
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Resolution
                </Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                  1024 × 1024
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Subtle CTA - Not Pushy */}
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => handleAction('Try Another Style')}
            style={[styles.subtleCTA, {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            }]}
            activeOpacity={0.8}
          >
            <View style={[styles.ctaIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
                Love this? Try another style
              </Text>
              <Text style={[styles.ctaSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                Explore more AI transformations
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    // paddingBottom set dynamically with scrollBottomPadding
  },
  heroSection: {
    paddingTop: 16,
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  counterContainer: {
    alignItems: 'center',
    flex: 1,
  },
  counterText: {
    // Dynamic styles applied inline
  },
  styleLabel: {
    marginTop: 2,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  imageGradient: {
    width: '100%',
    height: '100%',
  },
  imageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
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
  },
  stateLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stateLabelText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  zoomGradient: {
    paddingTop: 40,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  zoomText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    // Dynamic styles applied inline
  },
  actionCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    // Dynamic styles applied inline
  },
  detailValue: {
    // Dynamic styles applied inline
  },
  subtleCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    marginBottom: 2,
  },
  ctaSubtitle: {
    // Dynamic styles applied inline
  },
});

export default ResultScreenMockup;
