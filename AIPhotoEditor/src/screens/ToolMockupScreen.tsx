import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import { AIToolHeader } from '../components/AIToolHeader';
import { haptic } from '../utils/haptics';

const { width } = Dimensions.get('window');

const ToolMockupScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedTab, setSelectedTab] = useState<'hub' | 'detail' | 'search'>('hub');
  const [selectedToolDetail, setSelectedToolDetail] = useState<string | null>(null); // Track which tool detail to show
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null); // Track selected image for mockup

  // Scroll to top when detail view is opened
  useEffect(() => {
    if (selectedTab === 'detail' && selectedToolDetail === 'remove-bg') {
      // Small delay to ensure the view has rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [selectedTab, selectedToolDetail]);

  // Mock data for demonstrations
  const mockTools = [
    { id: 1, icon: '🎯', name: 'Remove BG', time: '2.5s', uses: '2.3k', trending: false, description: 'Cut out subjects instantly' },
    { id: 2, icon: '🖼️', name: 'Replace BG', time: '4s', uses: '1.8k', trending: false, description: 'Swap scenes with AI' },
    { id: 3, icon: '👗', name: 'Try-On', time: '3s', uses: '3.1k', trending: true, description: 'Preview outfits instantly' },
    { id: 4, icon: '🎨', name: 'Transform', time: '3s', uses: '2.8k', trending: false, description: 'Apply art styles' },
    { id: 5, icon: '💼', name: 'Headshots', time: '3.5s', uses: '1.5k', trending: false, description: 'Professional portraits' },
    { id: 6, icon: '✨', name: 'Enhance', time: '2s', uses: '2.1k', trending: true, description: 'Upscale & sharpen' },
  ];

  const renderMockupHeader = (title: string, subtitle: string) => (
    <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
      <Text style={[styles.mockupTitle, { color: colors.text, fontSize: typography.scaled.xl, fontWeight: typography.weight.bold }]}>
        {title}
      </Text>
      <Text style={[styles.mockupSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }]}>
        {subtitle}
      </Text>
    </View>
  );

  // Handle tool card click - navigate to detail view for Remove BG
  const handleToolCardPress = (tool: typeof mockTools[0]) => {
    haptic.medium();
    if (tool.name === 'Remove BG') {
      setSelectedToolDetail('remove-bg');
      setSelectedTab('detail');
    } else {
      // For other tools, just show haptic feedback
      haptic.light();
      Alert.alert('Coming Soon', `The ${tool.name} tool mockup detail view is coming soon!`);
    }
  };

  // Handle Take Photo button
  const handleTakePhoto = () => {
    haptic.medium();
    // In real app, this would open camera - for mockup, we'll show a mock image selection
    Alert.alert(
      'Take Photo',
      'This would open the camera. For this mockup, we\'ll simulate selecting a photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Photo',
          onPress: () => {
            // Simulate selecting a mock image
            setSelectedImageUri('mockup://photo-from-camera');
            haptic.success();
          }
        }
      ]
    );
  };

  // Handle Choose from Library button
  const handleChooseFromLibrary = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        haptic.success();
      }
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select image from library');
    }
  };

  // Handle processing (Remove Background action)
  const handleProcessRemoveBG = () => {
    if (!selectedImageUri) {
      Alert.alert('No Image', 'Please select an image first using Take Photo or Choose from Library');
      return;
    }
    haptic.medium();
    Alert.alert(
      'Processing Mockup',
      'In the real app, this would process the image and remove the background. For this mockup, we\'re showing the concept.',
      [{ text: 'OK', onPress: () => haptic.light() }]
    );
  };

  const renderPolishedToolCard = (tool: typeof mockTools[0], variant: 'full' | 'compact' = 'full') => {
    if (variant === 'compact') {
      // Compact 2-column card for variety
      // Calculate width: full container width minus section padding (both sides)
      // Using space-between for gap, so we calculate available space and split evenly with a small gap
      const containerWidth = width - (spacing.base * 2); // Account for section paddingHorizontal
      const gapBetweenCards = spacing.sm;
      const cardWidth = (containerWidth - gapBetweenCards) / 2;

      return (
        <TouchableOpacity
          key={tool.id}
          style={[styles.compactCard, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            width: cardWidth,
          }]}
          activeOpacity={0.8}
          onPress={() => handleToolCardPress(tool)}
        >
          {/* Icon & Title */}
          <Text style={{ fontSize: 32, marginBottom: spacing.xs }}>{tool.icon}</Text>
          <Text style={[styles.compactTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold }]}>
            {tool.name}
          </Text>

          {/* Mini Preview */}
          <View style={[styles.miniPreview, { backgroundColor: colors.backgroundSecondary, marginVertical: spacing.sm }]}>
            <View style={styles.miniBeforeAfter}>
              <View style={[styles.miniBox, { backgroundColor: colors.primary + '20' }]} />
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              <View style={[styles.miniBox, { backgroundColor: colors.primary + '40' }]} />
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="flash" size={12} color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginLeft: 2 }}>
              {tool.time}
            </Text>
          </View>

          {/* Trending Badge */}
          {tool.trending && (
            <View style={[styles.compactBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: typography.weight.bold }}>🔥</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Full-width polished card (like Recommended)
    return (
      <TouchableOpacity
        key={tool.id}
        style={[styles.polishedCard, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }]}
        activeOpacity={0.85}
        onPress={() => handleToolCardPress(tool)}
      >
        {/* Before/After Preview Section */}
        <View style={[styles.polishedPreview, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.largeBeforeAfter}>
            <View style={[styles.largeBox, { backgroundColor: colors.primary + '15' }]}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: typography.weight.medium }}>Before</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            </View>
            <View style={[styles.largeBox, { backgroundColor: colors.primary + '35' }]}>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: typography.weight.medium }}>After</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={{ padding: spacing.base }}>
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 28, marginRight: spacing.sm }}>{tool.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.polishedTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }]}>
                  {tool.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: 2 }}>
                  AI-powered processing
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>

          {/* Stats & Badges Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.base, flexWrap: 'wrap', gap: spacing.xs }}>
            <View style={[styles.statBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="flash" size={14} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium, marginLeft: 4 }}>
                {tool.time}
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people" size={14} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.medium, marginLeft: 4 }}>
                {tool.uses} today
              </Text>
            </View>
            {tool.trending && (
              <View style={[styles.statBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>
                  🔥 Trending
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              style={[styles.polishedPrimaryButton, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press
                if (tool.name === 'Remove BG') {
                  setSelectedToolDetail('remove-bg');
                  setSelectedTab('detail');
                  // Small delay to show detail view, then trigger photo action
                  setTimeout(() => handleTakePhoto(), 300);
                } else {
                  handleTakePhoto();
                }
              }}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginLeft: spacing.xs }}>
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.polishedSecondaryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press
                if (tool.name === 'Remove BG') {
                  setSelectedToolDetail('remove-bg');
                  setSelectedTab('detail');
                  // Small delay to show detail view, then trigger library action
                  setTimeout(() => handleChooseFromLibrary(), 300);
                } else {
                  handleChooseFromLibrary();
                }
              }}
            >
              <Ionicons name="images" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrendingSection = () => (
    <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '08']}
        style={[styles.trendingContainer, {
          borderColor: colors.primary + '35',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.trendingIconWrapper, { backgroundColor: colors.primary }]}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
            </View>
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }]}>
                TRENDING NOW
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: 2 }}>
                2.3k people creating
              </Text>
            </View>
          </View>
          <View style={[styles.livePulse, { backgroundColor: colors.primary }]}>
            <View style={[styles.liveDot, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.base }}>
          <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
            {[
              { icon: '👗', label: 'Try-On' },
              { icon: '✨', label: 'Enhance' },
              { icon: '🎯', label: 'Remove BG' },
              { icon: '🎨', label: 'Transform' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.trendingCard, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                onPress={() => {
                  if (item.label === 'Remove BG') {
                    const tool = mockTools.find(t => t.name === 'Remove BG');
                    if (tool) handleToolCardPress(tool);
                  } else {
                    haptic.light();
                  }
                }}
              >
                <View style={[styles.trendingPreview, { backgroundColor: colors.primary + '20' }]}>
                  <View style={styles.trendingBeforeAfter}>
                    <View style={[styles.trendingBox, { backgroundColor: colors.primary + '30' }]} />
                    <Ionicons name="arrow-forward" size={10} color={colors.primary} style={{ marginHorizontal: 4 }} />
                    <View style={[styles.trendingBox, { backgroundColor: colors.primary + '50' }]} />
                  </View>
                </View>
                <Text style={{ fontSize: 20, marginVertical: spacing.xs }}>{item.icon}</Text>
                <Text style={{ color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );

  const renderQuickActions = () => (
    <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginBottom: spacing.sm }]}>
        ⚡ Quick Start
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.base }}>
        <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
          {['📸 Take', '🎯 Rm BG', '🖼️ Swap', '🎨 Style', '👗 Try-On', '✨ Enhance'].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionChip, { backgroundColor: colors.surface, borderColor: colors.primary + '50' }]}
              onPress={() => haptic.light()}
            >
              <Text style={{ color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }}>
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRecommendedCard = () => (
    <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginBottom: spacing.sm }]}>
        💡 Recommended for You
      </Text>
      <TouchableOpacity
        style={[styles.recommendedCard, {
          backgroundColor: colors.surface,
          borderColor: colors.primary + '30',
        }]}
        onPress={() => haptic.light()}
      >
        <View style={[styles.recommendedPreview, { backgroundColor: colors.primary + '15' }]}>
          <Text style={{ fontSize: 32 }}>👗</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.recommendedTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }]}>
            Virtual Try-On
          </Text>
          <Text style={[styles.recommendedSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }]}>
            Try outfits instantly
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <View style={[styles.hotBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ color: colors.primary, fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>
                🔥 Trending
              </Text>
            </View>
            <View style={[styles.proBadge, { backgroundColor: colors.primary, marginLeft: spacing.xs }]}>
              <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>
                💎 Pro
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderRemoveBGDetailView = () => (
    <View style={[styles.detailContainer, { backgroundColor: colors.surface }]}>
      {/* Hero Section - Before/After Preview */}
      <View style={[styles.detailHero, { backgroundColor: colors.backgroundSecondary }]}>
        {selectedImageUri ? (
          <View style={styles.beforeAfterLarge}>
            <View style={[styles.beforeLarge, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
              {selectedImageUri.startsWith('mockup://') ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="image" size={40} color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: spacing.xs, fontSize: typography.scaled.sm }}>Selected Photo</Text>
                </View>
              ) : (
                <Image source={{ uri: selectedImageUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
              )}
              <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: colors.primary, fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>BEFORE</Text>
              </View>
            </View>
            <View style={styles.sliderLine}>
              <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            </View>
            <View style={[styles.afterLarge, { backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary + '40' }]}>
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: spacing.xs, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }}>Background Removed</Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: 4 }}>Transparent PNG</Text>
              </View>
              <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>AFTER</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.beforeAfterLarge}>
            <View style={[styles.beforeLarge, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="camera-outline" size={48} color={colors.primary + '60'} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, fontSize: typography.scaled.sm }}>Select a photo to see preview</Text>
            </View>
            <View style={styles.sliderLine}>
              <Ionicons name="arrow-forward" size={24} color={colors.primary + '60'} />
            </View>
            <View style={[styles.afterLarge, { backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="cut-outline" size={48} color={colors.primary + '60'} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, fontSize: typography.scaled.sm }}>Background removed</Text>
            </View>
          </View>
        )}
        {selectedImageUri && (
          <Text style={[styles.sliderHint, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: spacing.sm }]}>
            ← Drag to compare →
          </Text>
        )}
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            2.5 sec
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            0.1 credit
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            4.9/5
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            2.3k today
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ padding: spacing.base }}>
        {selectedImageUri ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
            onPress={handleProcessRemoveBG}
          >
            <Ionicons name="cut" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.sm }}>
              Remove Background
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[selectedImageUri ? styles.secondaryButton : styles.primaryButton, { backgroundColor: selectedImageUri ? colors.backgroundSecondary : colors.primary, borderColor: selectedImageUri ? colors.border : undefined }]}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera" size={20} color={selectedImageUri ? colors.text : "#FFFFFF"} />
          <Text style={{ color: selectedImageUri ? colors.text : '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.sm }}>
            Take Photo Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: spacing.sm }]}
          onPress={handleChooseFromLibrary}
        >
          <Ionicons name="images" size={20} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold, marginLeft: spacing.sm }}>
            Choose from Library
          </Text>
        </TouchableOpacity>
        {selectedImageUri && (
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface + '80', borderColor: colors.border, marginTop: spacing.sm }]}
            onPress={() => {
              setSelectedImageUri(null);
              haptic.light();
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium, marginLeft: spacing.sm }}>
              Clear Selection
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Collapsible Sections */}
      <View style={{ padding: spacing.base }}>
        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="cut-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginLeft: spacing.xs }]}>
              ✓ What You Get
            </Text>
          </View>
          {['Transparent PNG export', 'Perfect edge detection', 'Works with any subject', 'Instant results (2-5 seconds)'].map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, marginLeft: spacing.xs }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: spacing.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginLeft: spacing.xs }]}>
              💡 Best For
            </Text>
          </View>
          {['Product photography', 'Social media profiles', 'Creating graphics', 'E-commerce listings'].map((item, index) => (
            <Text key={index} style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30', marginTop: spacing.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginLeft: spacing.xs }]}>
              How It Works
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, lineHeight: 20 }}>
            Our AI detects the subject and separates it from the background using edge-aware segmentation, preserving fine details like hair and transparent objects.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDetailView = () => (
    <View style={[styles.detailContainer, { backgroundColor: colors.surface }]}>
      {/* Hero Section */}
      <View style={[styles.detailHero, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.beforeAfterLarge}>
          <View style={[styles.beforeLarge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ color: colors.textSecondary }}>Before</Text>
          </View>
          <View style={styles.sliderLine}>
            <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
          </View>
          <View style={[styles.afterLarge, { backgroundColor: colors.primary + '40' }]}>
            <Text style={{ color: colors.text }}>After</Text>
          </View>
        </View>
        <Text style={[styles.sliderHint, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: spacing.sm }]}>
          ← Drag to compare →
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            2-5 sec
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            0.1 credit
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            4.9/5
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
            2.3k today
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ padding: spacing.base }}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => haptic.medium()}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.sm }}>
            Take Photo Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => haptic.light()}
        >
          <Ionicons name="images" size={20} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold, marginLeft: spacing.sm }}>
            Choose from Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Sections */}
      <View style={{ padding: spacing.base }}>
        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold }]}>
            ✓ What You Get
          </Text>
          {['Transparent PNG export', 'Perfect edge detection', 'Works with any subject', 'Instant results'].map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, marginLeft: spacing.xs }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: spacing.sm }]}>
          <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold }]}>
            💡 Best For
          </Text>
          {['Product photography', 'Social media profiles', 'Creating graphics', 'Presentations'].map((item, index) => (
            <Text key={index} style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }}>
              • {item}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSearchView = () => (
    <View style={{ padding: spacing.base }}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.base, marginLeft: spacing.sm }}>
          What do you want to do?
        </Text>
      </View>

      {/* Suggestions */}
      <View style={{ marginTop: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginBottom: spacing.sm }]}>
          💡 Try searching:
        </Text>
        {[
          'remove person from photo',
          'make professional headshot',
          'change background',
          'try on clothes'
        ].map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => haptic.light()}
          >
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, marginLeft: spacing.sm }}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Browse by Goal */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.bold, marginBottom: spacing.sm }]}>
          🎯 Browse by Goal
        </Text>
        {[
          { icon: '📸', title: 'Perfect for Social Media', tools: 'Remove BG, Filters, Style' },
          { icon: '💼', title: 'Professional & Business', tools: 'Headshots, Enhance, Face' },
          { icon: '🎨', title: 'Creative & Artistic', tools: 'Transform, Style, Filters' },
          { icon: '🛍️', title: 'E-commerce & Products', tools: 'Remove BG, Replace BG' },
        ].map((goal, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => haptic.light()}
          >
            <Text style={{ fontSize: 24, marginRight: spacing.sm }}>{goal.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                {goal.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: 2 }}>
                → {goal.tools}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}>
      <AIToolHeader
        title="Tool Mockups"
        backgroundColor={colors.backgroundSecondary}
      />

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { key: 'hub', label: 'AI Tools Hub', icon: 'grid' },
          { key: 'detail', label: 'Detail View', icon: 'document-text' },
          { key: 'search', label: 'Search', icon: 'search' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => {
              haptic.light();
              setSelectedTab(tab.key as any);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={selectedTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={{
              color: selectedTab === tab.key ? colors.primary : colors.textSecondary,
              fontSize: typography.scaled.xs,
              fontWeight: selectedTab === tab.key ? typography.weight.bold : typography.weight.medium,
              marginLeft: spacing.xs
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing['3xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Tools Hub View */}
        {selectedTab === 'hub' && (
          <View>
            {renderMockupHeader(
              'AI Tools Hub',
              'Visual-first discovery with trending, quick actions, and personalized recommendations'
            )}

            {renderTrendingSection()}
            {renderQuickActions()}
            {renderRecommendedCard()}

            {/* All Tools Section - Using same padding pattern as Features page */}
            <View style={{ marginBottom: spacing.lg }}>
              <View style={{ paddingHorizontal: spacing.base }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginBottom: spacing.sm }]}>
                  🎨 All AI Tools
                </Text>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.base, marginHorizontal: -spacing.base }}>
                  <View style={{ paddingHorizontal: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
                    {['All', 'Edit', 'Style', 'Enhance'].map((filter, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.filterChip,
                          index === 0
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                        onPress={() => haptic.light()}
                      >
                        <Text style={{
                          color: index === 0 ? '#FFFFFF' : colors.textSecondary,
                          fontSize: typography.scaled.sm,
                          fontWeight: typography.weight.medium
                        }}>
                          {filter}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Tool Grid - Mix of Full & Compact Cards */}
                <View style={styles.polishedToolGrid}>
                  {/* First two: Full-width polished cards */}
                  {renderPolishedToolCard(mockTools[0], 'full')}
                  {renderPolishedToolCard(mockTools[1], 'full')}

                  {/* Next two: Compact 2-column */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    {renderPolishedToolCard(mockTools[2], 'compact')}
                    {renderPolishedToolCard(mockTools[3], 'compact')}
                  </View>

                  {/* Last two: Full-width polished cards */}
                  {renderPolishedToolCard(mockTools[4], 'full')}
                  {renderPolishedToolCard(mockTools[5], 'full')}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Detail View */}
        {selectedTab === 'detail' && (
          <View>
            <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTab('hub');
                    setSelectedToolDetail(null);
                    haptic.light();
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                  <Text style={{ color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium, marginLeft: spacing.xs }}>
                    Back to Hub
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.mockupTitle, { color: colors.text, fontSize: typography.scaled.xl, fontWeight: typography.weight.bold }]}>
                  {selectedToolDetail === 'remove-bg' ? 'Remove Background' : 'Tool Detail View'}
                </Text>
                <Text style={[styles.mockupSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }]}>
                  {selectedToolDetail === 'remove-bg' 
                    ? 'Remove backgrounds with AI-powered precision. Perfect for product photos and portraits.'
                    : 'Comprehensive information with interactive before/after, stats, and progressive disclosure'}
                </Text>
              </View>
            </View>
            {selectedToolDetail === 'remove-bg' ? renderRemoveBGDetailView() : renderDetailView()}
          </View>
        )}

        {/* Search View */}
        {selectedTab === 'search' && (
          <View>
            {renderMockupHeader(
              'Smart Search & Discovery',
              'Intent-based search with suggestions and goal-based browsing'
            )}
            {renderSearchView()}
          </View>
        )}

        {/* Design Notes */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.xl }}>
          <View style={[styles.designNotes, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.notesTitle, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.xs }]}>
                Design Notes
              </Text>
            </View>
            <Text style={[styles.notesText, { color: colors.textSecondary, fontSize: typography.scaled.sm, lineHeight: 20 }]}>
              These mockups demonstrate the proposed redesign from AI_TOOLS_PAGE_REDESIGN.md. Key improvements include:
            </Text>
            <Text style={[styles.notesText, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }]}>
              • Polished card layouts (full-width + compact variants){'\n'}
              • Visual before/after previews on every card{'\n'}
              • Prominent "Take Photo" CTAs for quick access{'\n'}
              • Real-time stats (speed, usage, trending indicators){'\n'}
              • Trending section at top with live activity{'\n'}
              • Personalized recommendations with rich visuals{'\n'}
              • Smart search with goal-based browsing{'\n'}
              • Consistent spacing, shadows, and visual hierarchy
            </Text>
          </View>
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
    paddingTop: 16,
    paddingHorizontal: 0, // No horizontal padding - sections handle their own paddingHorizontal
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  mockupTitle: {
    // Dynamic
  },
  mockupSubtitle: {
    // Dynamic
  },
  sectionTitle: {
    // Dynamic
  },
  trendingContainer: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  trendingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendingCard: {
    width: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  trendingPreview: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBeforeAfter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  quickActionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  recommendedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    width: '100%', // Ensure full width like FeaturesScreen cards
  },
  recommendedPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recommendedTitle: {
    // Dynamic
  },
  recommendedSubtitle: {
    // Dynamic
  },
  hotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  polishedToolGrid: {
    width: '100%', // Ensure grid takes full width
  },
  polishedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%', // Ensure card takes full width of container
  },
  polishedPreview: {
    padding: 20,
  },
  largeBeforeAfter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  largeBox: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polishedTitle: {
    // Dynamic
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  polishedPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  polishedSecondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 180,
  },
  compactTitle: {
    textAlign: 'center',
  },
  miniPreview: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
  },
  miniBeforeAfter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  compactBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHero: {
    padding: 24,
    alignItems: 'center',
  },
  beforeAfterLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 150,
    position: 'relative',
  },
  beforeLarge: {
    flex: 1,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  afterLarge: {
    flex: 1,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -12,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderHint: {
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    // Dynamic
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalTitle: {
    // Dynamic
  },
  designNotes: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 16,
  },
  notesTitle: {
    // Dynamic
  },
  notesText: {
    // Dynamic
  },
});

export default ToolMockupScreen;
