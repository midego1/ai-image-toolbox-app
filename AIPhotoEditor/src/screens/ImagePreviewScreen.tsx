import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { AIToolInfoCard } from '../components/AIToolInfoCard';
import { Button } from '../components/Button';
import { ToolStatsBar } from '../components/ToolStatsBar';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

const ImagePreviewScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scrollBottomPadding = useScrollBottomPadding();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'ImagePreview'>>();
  const { imageUri, editMode } = route.params;
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [removalPrompt, setRemovalPrompt] = useState('');
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [headshotStyle, setHeadshotStyle] = useState<'corporate' | 'creative' | 'casual' | 'executive'>('corporate');
  const [backgroundStyle, setBackgroundStyle] = useState<'office' | 'studio' | 'outdoor' | 'neutral'>('neutral');
  const [lightingStyle, setLightingStyle] = useState<'professional' | 'soft' | 'dramatic' | 'natural'>('professional');
  const [styleImageUri, setStyleImageUri] = useState<string | undefined>();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [styleStrength, setStyleStrength] = useState(0.7);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const modeData = getEditMode(editMode);
  const isRemoveBackgroundMode = editMode === EditMode.REMOVE_BACKGROUND;
  const isRemoveObjectMode = editMode === EditMode.REMOVE_OBJECT;
  const isReplaceBackgroundMode = editMode === EditMode.REPLACE_BACKGROUND;
  const isProfessionalHeadshotsMode = editMode === EditMode.PROFESSIONAL_HEADSHOTS;
  const isStyleTransferMode = editMode === EditMode.STYLE_TRANSFER;

  const presetStyles = [
    { id: 'van_gogh', name: 'Van Gogh', icon: '🎨' },
    { id: 'picasso', name: 'Picasso', icon: '🖼️' },
    { id: 'monet', name: 'Monet', icon: '🌅' },
    { id: 'watercolor', name: 'Watercolor', icon: '💧' },
    { id: 'oil_painting', name: 'Oil Painting', icon: '🖌️' },
    { id: 'sketch', name: 'Sketch', icon: '✏️' },
  ];

  const pickStyleFromLibrary = async () => {
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
        setStyleImageUri(selectedUri);
        setSelectedPreset(null);
      }
    } catch (error) {
      console.error('Error picking style image:', error);
      Alert.alert('Error', 'Failed to select style image from library');
    }
  };

  const handlePresetSelect = (preset: string) => {
    haptic.light();
    setSelectedPreset(preset);
    setStyleImageUri(undefined);
  };

  const handleProcess = () => {
    if (isRemoveObjectMode && !removalPrompt.trim()) {
      Alert.alert('Missing Prompt', 'Please describe what you want to remove from the image');
      return;
    }
    if (isReplaceBackgroundMode && !backgroundPrompt.trim()) {
      Alert.alert('Missing Background', 'Please describe the new background');
      return;
    }
    if (isStyleTransferMode && !styleImageUri && !selectedPreset) {
      Alert.alert('Missing Style', 'Please select a style image or preset');
      return;
    }

    haptic.medium();

    // Try to navigate using parent navigator first
    const parentNav = navigation.getParent();
    const config: any = isRemoveObjectMode
      ? { prompt: removalPrompt.trim(), removalPrompt: removalPrompt.trim() }
      : (isReplaceBackgroundMode
        ? { backgroundPrompt: backgroundPrompt.trim() }
        : (isProfessionalHeadshotsMode
          ? { headshotStyle, backgroundStyle, lightingStyle }
          : (isStyleTransferMode
            ? {
                styleStrength,
                ...(styleImageUri ? { styleImageUri } : {}),
                ...(selectedPreset ? { stylePreset: selectedPreset } : {}),
              }
            : {})));

    const navParams = {
      imageUri,
      editMode,
      config,
    };

    navigation.navigate('Processing', navParams);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <AIToolHeader
        title={modeData?.name || 'Preview'}
        backgroundColor={colors.backgroundSecondary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Preview - Remove Background, Remove Object, Replace Background, Professional Headshots, or Style Transfer Mode */}
        {(isRemoveBackgroundMode || isRemoveObjectMode || isReplaceBackgroundMode || isProfessionalHeadshotsMode || isStyleTransferMode) ? (
          <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, alignItems: 'center' }}>
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
                <View style={styles.expandOverlay}>
                  <View style={[styles.expandButton, { backgroundColor: colors.primary }]}>
                    <Ionicons name="expand" size={18} color="#FFFFFF" />
                    <Text style={[styles.expandText, { color: '#FFFFFF', fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                      Tap to view full size
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Tool Stats Bar */}
            {(isRemoveBackgroundMode || isRemoveObjectMode || isReplaceBackgroundMode || isProfessionalHeadshotsMode || isStyleTransferMode) && (
              <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.sm }}>
                <ToolStatsBar
                  time={
                    isRemoveBackgroundMode ? "2-5 sec" :
                    isRemoveObjectMode ? "3-6 sec" :
                    isReplaceBackgroundMode ? "4-8 sec" :
                    isProfessionalHeadshotsMode ? "8-12 sec" :
                    "10-15 sec"
                  }
                  credits={
                    isRemoveBackgroundMode ? "0.1 credit" :
                    isRemoveObjectMode ? "0.2 credit" :
                    isReplaceBackgroundMode ? "0.3 credit" :
                    isProfessionalHeadshotsMode ? "0.5 credit" :
                    "0.5 credit"
                  }
                  rating={
                    isRemoveBackgroundMode ? "4.9/5" :
                    isRemoveObjectMode ? "4.8/5" :
                    isReplaceBackgroundMode ? "4.7/5" :
                    isProfessionalHeadshotsMode ? "4.8/5" :
                    "4.7/5"
                  }
                  usage={
                    isRemoveBackgroundMode ? "2.3k today" :
                    isRemoveObjectMode ? "1.5k today" :
                    isReplaceBackgroundMode ? "1.2k today" :
                    isProfessionalHeadshotsMode ? "950 today" :
                    "850 today"
                  }
                />
              </View>
            )}

          {/* Prompt Input - Remove Object Mode */}
          {isRemoveObjectMode && (
            <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.xs,
                }]}>
                  What would you like to remove?
                </Text>
                <TextInput
                  style={[styles.promptInput, {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    fontSize: typography.scaled.base,
                  }]}
                  value={removalPrompt}
                  onChangeText={setRemovalPrompt}
                  placeholder="e.g., person, car, sign, bottle..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {/* Professional Headshots Controls */}
          {isProfessionalHeadshotsMode && (
            <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
              {/* Headshot Style Selection */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginBottom: spacing.base,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Headshot Style
                </Text>
                <View style={styles.optionGrid}>
                  {(['corporate', 'creative', 'casual', 'executive'] as const).map((style) => (
                    <TouchableOpacity
                      key={style}
                      onPress={() => {
                        haptic.light();
                        setHeadshotStyle(style);
                      }}
                      style={[styles.optionButton, {
                        backgroundColor: headshotStyle === style ? colors.primary : colors.background,
                        borderColor: headshotStyle === style ? colors.primary : colors.border,
                      }]}
                    >
                      <Text 
                        style={[styles.optionText, {
                          color: headshotStyle === style ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.sm,
                          fontWeight: typography.weight.medium,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Background Style Selection */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginBottom: spacing.base,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Background
                </Text>
                <View style={styles.optionGrid}>
                  {(['office', 'studio', 'outdoor', 'neutral'] as const).map((style) => (
                    <TouchableOpacity
                      key={style}
                      onPress={() => {
                        haptic.light();
                        setBackgroundStyle(style);
                      }}
                      style={[styles.optionButton, {
                        backgroundColor: backgroundStyle === style ? colors.primary : colors.background,
                        borderColor: backgroundStyle === style ? colors.primary : colors.border,
                      }]}
                    >
                      <Text 
                        style={[styles.optionText, {
                          color: backgroundStyle === style ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.sm,
                          fontWeight: typography.weight.medium,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Lighting Style Selection */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Lighting
                </Text>
                <View style={styles.optionGrid}>
                  {(['professional', 'soft', 'dramatic', 'natural'] as const).map((style) => (
                    <TouchableOpacity
                      key={style}
                      onPress={() => {
                        haptic.light();
                        setLightingStyle(style);
                      }}
                      style={[styles.optionButton, {
                        backgroundColor: lightingStyle === style ? colors.primary : colors.background,
                        borderColor: lightingStyle === style ? colors.primary : colors.border,
                      }]}
                    >
                      <Text 
                        style={[styles.optionText, {
                          color: lightingStyle === style ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.sm,
                          fontWeight: typography.weight.medium,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Background Input - Replace Background Mode */}
          {isReplaceBackgroundMode && (
            <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.xs,
                }]}> 
                  Describe the new background
                </Text>
                <TextInput
                  style={[styles.promptInput, {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    fontSize: typography.scaled.base,
                  }]}
                  value={backgroundPrompt}
                  onChangeText={setBackgroundPrompt}
                  placeholder="e.g., beach at sunset, modern office, forest trail"
                  placeholderTextColor={colors.textSecondary}
                  multiline={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {/* Style Transfer Controls */}
          {isStyleTransferMode && (
            <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
              {/* Style Image Selection */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginBottom: spacing.base,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Style Image (Optional)
                </Text>
                {styleImageUri ? (
                  <TouchableOpacity
                    onPress={() => { haptic.light(); setShowStylePreview(true); }}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.styleImageWrapper, {
                      backgroundColor: colors.background,
                      borderColor: colors.primary,
                      borderWidth: 2,
                    }]}> 
                      <Image
                        source={{ uri: styleImageUri }}
                        style={styles.styleImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: colors.error }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          haptic.light();
                          setStyleImageUri(undefined);
                        }}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.selectStyleButton, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }]}
                    onPress={pickStyleFromLibrary}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                    <Text style={[styles.selectStyleText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium, marginTop: spacing.xs }]}>
                      Select Style Image
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Preset Styles */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginBottom: spacing.base,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Or Choose Preset Style
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetScroll}
                >
                  {presetStyles.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetCard, {
                        backgroundColor: selectedPreset === preset.id ? colors.primary : colors.background,
                        borderColor: selectedPreset === preset.id ? colors.primary : colors.border,
                      }]}
                      onPress={() => handlePresetSelect(preset.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetIcon}>{preset.icon}</Text>
                      <Text style={[styles.presetText, {
                        color: selectedPreset === preset.id ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.xs,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Style Strength */}
              <View style={[styles.promptContainer, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.promptLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginBottom: spacing.sm,
                }]}>
                  Style Strength
                </Text>
                <View style={styles.optionGrid}>
                  {[
                    { value: 0.3, label: 'Light' },
                    { value: 0.5, label: 'Moderate' },
                    { value: 0.7, label: 'Strong' },
                    { value: 0.9, label: 'Very Strong' },
                  ].map((strength) => (
                    <TouchableOpacity
                      key={strength.value}
                      onPress={() => {
                        haptic.light();
                        setStyleStrength(strength.value);
                      }}
                      style={[styles.optionButton, {
                        backgroundColor: Math.abs(styleStrength - strength.value) < 0.1 ? colors.primary : colors.background,
                        borderColor: Math.abs(styleStrength - strength.value) < 0.1 ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={[styles.optionText, {
                        color: Math.abs(styleStrength - strength.value) < 0.1 ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {strength.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Process Button - Moved Above Information Card */}
          <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.lg }}>
            <Button
              title={
                isRemoveObjectMode
                  ? `Remove Object`
                  : isReplaceBackgroundMode
                    ? `Replace Background`
                    : isProfessionalHeadshotsMode
                      ? `Create Headshot`
                      : isStyleTransferMode
                        ? `Apply Style Transfer`
                        : `Remove Background`
              }
              onPress={handleProcess}
              disabled={
                (isRemoveObjectMode && !removalPrompt.trim()) ||
                (isReplaceBackgroundMode && !backgroundPrompt.trim()) ||
                (isStyleTransferMode && !styleImageUri && !selectedPreset)
              }
              style={[styles.processButton, { minHeight: 56 }] as any}
            />
            <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
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
                  Usually takes 5-10 seconds
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Compact preview - Other Modes */
        <View style={[styles.previewContainer, { paddingHorizontal: spacing.base, paddingVertical: spacing.base }]}>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              setShowImagePreview(true);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: imageUri }}
              style={[styles.preview, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}
            />
            <View style={[styles.expandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="expand" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[styles.previewTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
              Your Photo
            </Text>
            <Text style={[styles.previewSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
              Tap to view larger • Ready to process
            </Text>
          </View>
        </View>
      )}

      {/* Modern Information Card - All Relevant Modes */}
      {(isRemoveBackgroundMode || isRemoveObjectMode || isReplaceBackgroundMode || isProfessionalHeadshotsMode || isStyleTransferMode) && (
        <AIToolInfoCard
          icon={
            isRemoveObjectMode ? 'cut-outline' :
            isRemoveBackgroundMode ? 'cut-outline' :
            isReplaceBackgroundMode ? 'image-outline' :
            isProfessionalHeadshotsMode ? 'person-circle-outline' :
            'brush-outline'
          }
          whatDescription={
            isRemoveObjectMode
              ? 'AI-powered object removal based on your description. Describe what you want to remove, and our AI will intelligently erase it while preserving the rest of your image.'
              : isRemoveBackgroundMode
                ? 'Automatically removes the background from your photo while keeping your subject intact.'
                : isReplaceBackgroundMode
                  ? "Swap your photo's background with a new scene while keeping the subject natural and clean."
                  : isProfessionalHeadshotsMode
                    ? 'Generate a polished, professional-looking headshot from your photo with refined lighting and backgrounds.'
                    : "Apply artistic styles from famous paintings or any style image to your photos. Blend colors, brushstrokes, and textures while preserving your content's structure and composition."
          }
          howDescription={
            isRemoveObjectMode
              ? 'The system detects the described subject, removes it, and fills the area with context-aware detail to match surrounding textures and lighting.'
              : isRemoveBackgroundMode
                ? 'Your subject is separated using semantic analysis and edge handling, producing a clean cutout with natural boundaries.'
                : isReplaceBackgroundMode
                  ? 'Your subject is segmented, a precise mask is created, and a new background is composited with consistent perspective, lighting, and color.'
                  : isProfessionalHeadshotsMode
                    ? 'Facial regions and contours are preserved while lighting, background, and clarity are enhanced to produce a studio-quality portrait.'
                    : 'Our AI analyzes both your content image and style reference, then blends the artistic characteristics from the style onto your photo while maintaining recognizable content details.'
          }
          howItems={
            isRemoveObjectMode
              ? [
                  { text: 'Smart prompt understanding' },
                  { text: 'Context-aware inpainting' },
                  { text: 'Natural-looking results' },
                ]
              : isRemoveBackgroundMode
                ? [
                    { text: 'Transparent PNG output' },
                    { text: 'Great for product photos & posts' },
                    { text: 'Handles hair and fine edges' },
                  ]
                : isReplaceBackgroundMode
                  ? [
                      { text: 'Clean subject masking' },
                      { text: 'Scene-consistent lighting' },
                      { text: 'High-quality compositing' },
                    ]
                  : isProfessionalHeadshotsMode
                    ? [
                        { text: 'Identity-preserving adjustments' },
                        { text: 'Professional lighting & backdrop' },
                        { text: 'Crisp, share-ready results' },
                      ]
                    : [
                        { text: 'Preserves your photo\'s composition and subject' },
                        { text: 'Applies artistic style elements naturally' },
                        { text: 'Adjustable strength for subtle or bold effects' },
                      ]
          }
        />
      )}

      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
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

      {/* Style Image Preview Modal */}
      <Modal
        visible={showStylePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStylePreview(false)}
      >
        <Pressable
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          onPress={() => { haptic.light(); setShowStylePreview(false); }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}>
                <Image source={{ uri: styleImageUri || '' }} style={styles.previewModalImage} resizeMode="contain" />
              </View>
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
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
  },
  expandIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    // Dynamic
  },
  previewSubtitle: {
    marginTop: 2,
    // Dynamic
  },
  explanationContainer: {
    // Dynamic styles applied inline
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  processButton: {
    minWidth: '100%',
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
  // Beta Mode Styles
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
    bottom: baseSpacing.base,
    left: 0,
    right: 0,
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
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    // Dynamic styles applied inline
  },
  promptContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: baseSpacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promptLabel: {
    // Dynamic styles applied inline
  },
  promptInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: baseSpacing.base,
    paddingVertical: baseSpacing.sm,
    minHeight: 44,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseSpacing.sm,
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  optionText: {
    // Dynamic styles applied inline
  },
  styleImageWrapper: {
    width: width - (baseSpacing.base * 4),
    maxWidth: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: '100%',
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
  },
  selectStyleButton: {
    padding: baseSpacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseSpacing.xs,
  },
  selectStyleText: {
    // Dynamic styles applied inline
  },
  presetScroll: {
    paddingRight: baseSpacing.base,
    gap: baseSpacing.sm,
  },
  presetCard: {
    width: 80,
    borderRadius: 12,
    padding: baseSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: baseSpacing.sm,
    borderWidth: 1,
    minHeight: 80,
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: baseSpacing.xs / 2,
  },
  presetText: {
    // Dynamic styles applied inline
    textAlign: 'center',
  },
});

export default ImagePreviewScreen;
