import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated, Alert } from 'react-native';
import { useRoute, useNavigation, usePreventRemove } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode } from '../types/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { AIToolInfoCard } from '../components/AIToolInfoCard';
import { Button } from '../components/Button';
import { CaptureLibraryButtons } from '../components/CaptureLibraryButtons';
import { ActionButtonBar } from '../components/ActionButtonBar';
import { SectionHeader } from '../components/SectionHeader';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { AdvancedOptionsSelector } from '../components/AdvancedOptionsSelector';
import { ToolStatsBar } from '../components/ToolStatsBar';
import { TopTabSwitcher } from '../components/TopTabSwitcher';
import { ToolGuideTab } from '../components/ToolGuideTab';
import { ToolExamplesTab } from '../components/ToolExamplesTab';
import { ToolHistoryTab } from '../components/ToolHistoryTab';
import { TabView } from '../components/TabView';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding, useScrollBottomPaddingWithActionButton } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

const StyleTransferScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri, fromToolMockup, config: routeConfig } = (route.params as any) || {};
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [styleImageUri, setStyleImageUri] = useState<string | undefined>(routeConfig?.styleImageUri);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(routeConfig?.stylePreset || null);
  const [styleStrength, setStyleStrength] = useState((routeConfig?.styleStrength as number) || 0.7);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'tool' | 'guide' | 'history'>('tool');
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  const presetStyles = [
    { id: 'van_gogh', name: 'Van Gogh', icon: '🎨', desc: 'Post-impressionist' },
    { id: 'picasso', name: 'Picasso', icon: '🖼️', desc: 'Cubist' },
    { id: 'monet', name: 'Monet', icon: '🌅', desc: 'Impressionist' },
    { id: 'watercolor', name: 'Watercolor', icon: '💧', desc: 'Soft paint' },
    { id: 'oil_painting', name: 'Oil Painting', icon: '🖌️', desc: 'Classic art' },
    { id: 'sketch', name: 'Sketch', icon: '✏️', desc: 'Pencil drawing' },
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

  useEffect(() => {
    if (!localImageUri) {
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
  }, [localImageUri]);

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
        setLocalImageUri(selectedUri);
      }
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select image from library');
    }
  };

  const openCamera = () => {
    haptic.medium();
    (navigation as any).navigate('QuickCameraLocal', { 
      editMode: EditMode.STYLE_TRANSFER,
      onPhoto: (uri: string) => {
        setLocalImageUri(uri);
      }
    });
  };

  const handleGenerate = () => {
    if (!localImageUri) return;
    
    if (!styleImageUri && !selectedPreset) {
      Alert.alert('Missing Style', 'Please select a style image or preset');
      return;
    }

    haptic.medium();
    const config: any = {
      styleStrength: styleStrength,
    };

    if (styleImageUri) {
      config.styleImageUri = styleImageUri;
    } else if (selectedPreset) {
      config.stylePreset = selectedPreset;
    }

    const params = {
      imageUri: localImageUri,
      editMode: EditMode.STYLE_TRANSFER,
      config,
    } as any;
    (navigation as any).navigate('Processing', params);
  };

  // Handle swipe back when coming from ToolMockupScreen
  const handleBackToToolMockup = React.useCallback(() => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      (parentNav as any).navigate('MainTabs', {
        screen: 'Settings',
        params: {
          screen: 'ToolMockup',
        }
      });
    } else {
      navigation.goBack();
    }
  }, [navigation]);

  usePreventRemove(
    fromToolMockup === true,
    ({ data }) => {
      handleBackToToolMockup();
    }
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}> 
      <AIToolHeader
        title="Style Transfer"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={() => {
          if (fromToolMockup) {
            const parentNav = navigation.getParent();
            if (parentNav) {
              (parentNav as any).navigate('MainTabs', {
                screen: 'Settings',
                params: {
                  screen: 'ToolMockup',
                }
              });
            } else {
              navigation.goBack();
            }
          } else {
            navigation.goBack();
          }
        }}
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
          // Use proper padding that accounts for floating tab bar
          // When button is visible, account for ActionButtonBar height
          localImageUri && (styleImageUri || selectedPreset) 
            ? { paddingBottom: scrollBottomPaddingWithButton } 
            : { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, alignItems: 'center' }}>
          {localImageUri ? (
            <TouchableOpacity
              onPress={() => { haptic.light(); setShowImagePreview(true); }}
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
                  source={{ uri: localImageUri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={[styles.expandOverlay, { backgroundColor: 'transparent' }]}> 
                  <View style={[styles.expandButton, { backgroundColor: colors.primary }]}> 
                    <Ionicons name="expand" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }}>
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
                <CaptureLibraryButtons
                  onCapture={openCamera}
                  onLibrary={pickFromLibrary}
                  cardScale={cardScale}
                />

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
              time="10-15 sec"
              credits="0.5 credit"
              rating="4.7/5"
              usage="950 today"
            />
          </View>
        </View>

        {/* Style Selection - Always visible */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          <CollapsibleSection
            title="Advanced Options"
            defaultExpanded={true}
            containerStyle={{ marginBottom: spacing.base }}
            previewText={[
              styleImageUri ? 'Custom Style' : (selectedPreset ? presetStyles.find(p => p.id === selectedPreset)?.name || '' : ''),
              styleStrength === 0.3 ? 'Light' : styleStrength === 0.5 ? 'Moderate' : styleStrength === 0.7 ? 'Strong' : styleStrength === 0.9 ? 'Very Strong' : '',
            ].filter(Boolean).join(' • ')}
          >
            {/* Style Image Option */}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[styles.optionLabel, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold, marginBottom: spacing.sm }]}>
                Use Custom Style Image
              </Text>
              {styleImageUri ? (
                <TouchableOpacity
                  onPress={() => { haptic.light(); setShowStylePreview(true); }}
                  activeOpacity={0.9}
                  style={{ alignSelf: 'center' }}
                >
                  <View style={[styles.styleImageWrapper, {
                    backgroundColor: colors.surface,
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
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  onPress={pickStyleFromLibrary}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={28} color={colors.primary} />
                  <Text style={[styles.selectStyleText, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium, marginTop: spacing.xs }]}>
                    Select Style Image
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* OR Divider */}
            <View style={{ marginVertical: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.divider, { backgroundColor: colors.border, flex: 1 }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginHorizontal: spacing.sm }]}>
                OR
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border, flex: 1 }]} />
            </View>

            {/* Preset Styles */}
            <AdvancedOptionsSelector
              label="Choose Preset Style"
              options={presetStyles.map(preset => ({
                id: preset.id,
                label: preset.name,
                icon: preset.icon,
              }))}
              selectedId={selectedPreset || ''}
              onSelect={(id) => handlePresetSelect(id)}
              layout="horizontal"
              showSeparator={true}
            />

            {/* Style Strength */}
            <AdvancedOptionsSelector
              label="Style Strength"
              options={[
                { id: '0.3', label: 'Light' },
                { id: '0.5', label: 'Moderate' },
                { id: '0.7', label: 'Strong' },
                { id: '0.9', label: 'Very Strong' },
              ]}
              selectedId={styleStrength.toString()}
              onSelect={(id) => {
                haptic.light();
                setStyleStrength(parseFloat(id));
              }}
              layout="horizontal"
            />
          </CollapsibleSection>
        </View>
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
              { id: 'examples', label: 'Examples', icon: 'images-outline' },
              { id: 'info', label: 'Info', icon: 'information-circle-outline' },
            ]}
            defaultTab="guide"
            containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
          >
            {/* Guide Tab */}
            <ToolGuideTab
              title="How to Apply Style Transfer"
              content={`Apply artistic styles from famous paintings or any style image to your photos.\n\n📸 Step 1: Select Your Photo\nChoose a photo from your library or take a new one. This is your content image that will receive the style.\n\n🎨 Step 2: Choose Style Source\nYou have two options:\n• Preset Styles - Choose from famous artistic styles like Van Gogh, Watercolor, Oil Painting\n• Custom Style Image - Upload your own style reference image\n\n⚙️ Step 3: Adjust Strength (Optional)\nControl how strong the style effect is applied:\n• Subtle - Preserves more of your original photo\n• Bold - More dramatic style transformation\n\n✨ Step 4: Generate\nTap Apply Style Transfer and wait 10-20 seconds. The AI will blend the artistic characteristics onto your photo while maintaining recognizable details.\n\n🎯 Pro Tips\n• Your photo's composition and subject are preserved\n• Preset styles provide consistent, tested results\n• Custom style images let you experiment with any look\n• Adjust strength to find your perfect balance\n• Works great for artistic profile pictures and creative projects`}
            />

            {/* Examples Tab */}
            <ToolExamplesTab
              title="Style Transfer Examples"
              examples={[
                {
                  id: '1',
                  title: 'Van Gogh Style',
                  description: 'Post-impressionist brushstroke effects on portraits',
                  tags: ['Van Gogh', 'Artistic'],
                },
                {
                  id: '2',
                  title: 'Watercolor Effect',
                  description: 'Soft watercolor painting style transformation',
                  tags: ['Watercolor', 'Soft'],
                },
                {
                  id: '3',
                  title: 'Oil Painting',
                  description: 'Classic oil painting texture and style',
                  tags: ['Oil Painting', 'Classic'],
                },
              ]}
              onExamplePress={(example) => {
                haptic.light();
                console.log('Example pressed:', example.title);
              }}
            />

            {/* Info Tab */}
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="brush-outline"
                whatDescription="Apply artistic styles from famous paintings or any style image to your photos. Blend colors, brushstrokes, and textures while preserving your content's structure and composition."
                howDescription="Our AI analyzes both your content image and style reference, then blends the artistic characteristics from the style onto your photo while maintaining recognizable content details."
                howItems={[
                  { text: 'Preserves your photo\'s composition and subject' },
                  { text: 'Applies artistic style elements naturally' },
                  { text: 'Adjustable strength for subtle or bold effects' },
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
        <ToolHistoryTab editMode={EditMode.STYLE_TRANSFER} />
      )}

      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!(localImageUri && (styleImageUri || selectedPreset))}
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
              Usually takes 10–20 seconds
            </Text>
          </View>
        }
      >
        <Button
          title="Apply Style Transfer"
          onPress={handleGenerate}
          size="large"
          style={{ minHeight: 56, width: '100%' }}
        />
      </ActionButtonBar>

      {/* Image Preview Modal */}
      <Modal
        visible={!!localImageUri && showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <Pressable
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          onPress={() => { haptic.light(); setShowImagePreview(false); }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}> 
                <Image source={{ uri: localImageUri || '' }} style={styles.previewModalImage} resizeMode="contain" />
              </View>
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
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    // Dynamic styles applied inline
  },
  styleImageWrapper: {
    width: width - (baseSpacing.base * 2),
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
  optionLabel: {
    // Dynamic styles applied inline
  },
  divider: {
    height: 1,
  },
  dividerText: {
    // Dynamic styles applied inline
  },
});

export default StyleTransferScreen;
