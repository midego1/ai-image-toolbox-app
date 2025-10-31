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
import { CollapsibleSection } from '../components/CollapsibleSection';
import { AdvancedOptionsSelector } from '../components/AdvancedOptionsSelector';
import ColorPicker from '../components/ColorPicker';
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

const PopFigureScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri, fromToolMockup } = (route.params as any) || {};
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [includeBox, setIncludeBox] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'studio' | 'marble' | 'glossy' | 'simple' | 'color'>('studio');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'tool' | 'guide' | 'history'>('tool');
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

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
    // Navigate to QuickCameraLocal within Features stack
    (navigation as any).navigate('QuickCameraLocal', { 
      editMode: EditMode.POP_FIGURE,
      onPhoto: (uri: string) => {
        setLocalImageUri(uri);
      }
    });
  };

  const handleContinue = () => {
    if (!localImageUri) return;
    haptic.medium();
    const params = {
      imageUri: localImageUri,
      editMode: EditMode.POP_FIGURE,
      config: {
        includeBox: includeBox,
        backgroundType: backgroundType,
        backgroundColor: backgroundColor,
        isTransparent: isTransparent,
      }
    } as any;
    (navigation as any).navigate('Processing', params);
  };

  // Handle swipe back when coming from ToolMockupScreen
  const handleBackToToolMockup = React.useCallback(() => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      // Navigate back to Settings tab, then to ToolMockup screen
      (parentNav as any).navigate('MainTabs', {
        screen: 'Settings',
        params: {
          screen: 'ToolMockup',
        }
      });
    } else {
      // Fallback: just go back
      navigation.goBack();
    }
  }, [navigation]);

  // Prevent native back when coming from ToolMockupScreen and handle it ourselves
  usePreventRemove(
    fromToolMockup === true,
    ({ data }) => {
      handleBackToToolMockup();
    }
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}> 
      <AIToolHeader
        title="Pop Figure"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={() => {
          if (fromToolMockup) {
            // Navigate back to ToolMockupScreen in Settings stack
            const parentNav = navigation.getParent();
            if (parentNav) {
              // Navigate to Settings tab, then to ToolMockup screen
              (parentNav as any).navigate('MainTabs', {
                screen: 'Settings',
                params: {
                  screen: 'ToolMockup',
                }
              });
            } else {
              // Fallback: just go back
              navigation.goBack();
            }
          } else {
            // Normal back behavior - go back in Features stack
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
          localImageUri 
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
              time="15-20 sec"
              credits="1.0 credit"
              rating="4.8/5"
              usage="520 today"
            />
          </View>
        </View>

        {/* Advanced Options */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          <CollapsibleSection
            title="Advanced Options"
            defaultExpanded={true}
            containerStyle={{ marginBottom: spacing.base }}
          >
            {/* Box Option Toggle */}
            <AdvancedOptionsSelector
              label="Box"
              options={[
                { id: 'with', label: 'With Box', icon: 'cube' },
                { id: 'without', label: 'Without Box', icon: 'cube-outline' },
              ]}
              selectedId={includeBox ? 'with' : 'without'}
              onSelect={(id) => setIncludeBox(id === 'with')}
              layout="toggle"
              showSeparator={true}
            />

            {/* Background Selection */}
            <AdvancedOptionsSelector
              label="Background"
              labelIcon="🖼️"
              options={[
                { id: 'studio', label: 'Studio', icon: '🎬' },
                { id: 'marble', label: 'Marble', icon: '🪨' },
                { id: 'glossy', label: 'Glossy', icon: '✨' },
                { id: 'simple', label: 'Simple', icon: '⬜' },
                {
                  id: 'color',
                  label: 'Color',
                  icon: '🎨',
                  renderCustom: (isSelected: boolean, onPress: () => void) => (
                    <TouchableOpacity
                      onPress={onPress}
                      style={[styles.bitDepthButton, {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }]}
                    >
                      <View style={[styles.colorIndicator, { 
                        backgroundColor: isTransparent ? 'transparent' : backgroundColor,
                        borderWidth: isTransparent ? 1 : 0,
                        borderColor: isSelected ? '#FFFFFF' : colors.border,
                      }]} />
                      <Text style={[styles.bitDepthText, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.xs,
                        fontWeight: typography.weight.medium,
                      }]}>
                        Color
                      </Text>
                    </TouchableOpacity>
                  ),
                },
              ]}
              selectedId={backgroundType}
              onSelect={(id) => {
                if (id === 'color') {
                  setBackgroundType('color');
                } else {
                  setBackgroundType(id as 'studio' | 'marble' | 'glossy' | 'simple' | 'color');
                }
              }}
              layout="horizontal"
            />

            {/* Background Sub-options */}
            {backgroundType === 'color' && (
              <>
                <View style={[styles.bitDepthContainer]}>
                  <Text style={[styles.bitDepthLabel, {
                    color: colors.text,
                    fontSize: typography.scaled.xs,
                    fontWeight: typography.weight.medium,
                  }]}>
                    🎨 Color
                  </Text>
                  <TouchableOpacity
                    style={[styles.colorPickerButton, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      flex: 1,
                      minHeight: 36,
                    }]}
                    onPress={() => {
                      haptic.light();
                      setShowColorPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorSwatchSmall, { 
                      backgroundColor: isTransparent ? 'transparent' : backgroundColor,
                      borderWidth: isTransparent ? 1 : 0,
                      borderColor: colors.border,
                    }]} />
                    <Text style={[styles.compactChipLabel, {
                      color: colors.text,
                      fontSize: typography.scaled.xs * 0.9,
                      fontWeight: typography.weight.medium,
                      flex: 1,
                    }]}>
                      {isTransparent ? 'Transparent' : backgroundColor}
                    </Text>
                    <Ionicons name="color-palette-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {/* Transparent Toggle */}
                <View style={[styles.bitDepthContainer]}>
                  <Text style={[styles.bitDepthLabel, {
                    color: colors.text,
                    fontSize: typography.scaled.xs,
                    fontWeight: typography.weight.medium,
                  }]}>
                    🔲 Transparent
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setIsTransparent(!isTransparent);
                    }}
                    style={[styles.bitDepthButton, {
                      backgroundColor: isTransparent ? colors.primary : colors.background,
                      borderColor: isTransparent ? colors.primary : colors.border,
                      minWidth: 100,
                    }]}
                  >
                    <Text style={[styles.bitDepthText, {
                      color: isTransparent ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.xs,
                      fontWeight: typography.weight.medium,
                    }]}>
                      {isTransparent ? 'Enabled' : 'Disabled'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
              title="How to Create Pop Figure"
              content={`Transform your photo into a detailed 3D render of a chibi pop figure.\n\n📸 Step 1: Select Your Photo\nChoose a portrait photo from your library or take a new one. Photos with clear faces work best.\n\n🎨 Step 2: Choose Options (Optional)\nYou can customize your pop figure:\n• Display box - Include a collectible display box\n• Without box - Standalone figure for digital use\n• Chibi proportions - Classic oversized head style\n\n✨ Step 3: Generate\nTap Create Pop Figure and wait 5-15 seconds. The AI will create a professional 3D render in authentic pop figure style, preserving your facial features and distinctive characteristics.\n\n🎯 Pro Tips\n• Portrait photos with clear faces produce the best results\n• Your identity is accurately represented\n• Display boxes are perfect for collectible looks\n• Standalone figures work great for digital avatars\n• Chibi proportions create the classic pop figure appearance`}
            />

            {/* Examples Tab */}
            <ToolExamplesTab
              title="Pop Figure Examples"
              examples={[
                {
                  id: '1',
                  title: 'With Display Box',
                  description: 'Collectible pop figure with classic display box',
                  tags: ['Box', 'Collectible'],
                },
                {
                  id: '2',
                  title: 'Without Box',
                  description: 'Standalone pop figure for digital use',
                  tags: ['Standalone', 'Digital'],
                },
                {
                  id: '3',
                  title: 'Chibi Style',
                  description: 'Classic chibi proportions with oversized head',
                  tags: ['Chibi', 'Cute'],
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
                icon="cube-outline"
                whatDescription="Transform your photo into a detailed 3D render of a chibi pop figure. The figure will accurately represent you or your subject with authentic pop figure styling, oversized head, and collectible appearance."
                howDescription="Our AI analyzes your reference photo and creates a professional 3D render in the classic pop figure style, preserving facial features, clothing, and distinctive characteristics while applying the signature chibi proportions and smooth, toy-like finish."
                howItems={[
                  { text: 'Accurate representation of your photo' },
                  { text: 'Authentic pop figure chibi proportions' },
                  { text: 'Professional 3D rendering quality' },
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
        <ToolHistoryTab editMode={EditMode.POP_FIGURE} />
      )}

      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!localImageUri}
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
              Usually takes 5–15 seconds
            </Text>
          </View>
        }
      >
        <Button
          title="Create Pop Figure"
          onPress={handleContinue}
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

      <ColorPicker
        visible={showColorPicker}
        initialColor={isTransparent ? 'transparent' : backgroundColor}
        onColorSelect={(color) => {
          // If color is 'transparent' string, set transparent
          if (color === 'transparent') {
            setIsTransparent(true);
            setBackgroundColor('#FFFFFF'); // Keep a default color for fallback
          } else {
            setIsTransparent(false);
            setBackgroundColor(color);
          }
          setBackgroundType('color'); // Ensure color option is selected
          setShowColorPicker(false);
        }}
        onClose={() => setShowColorPicker(false)}
      />
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
  optionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: baseSpacing.base,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    // Dynamic styles applied inline
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: baseSpacing.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: {
    // Dynamic styles applied inline
  },
  bitDepthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.md,
    paddingVertical: 0,
    minHeight: 44,
    height: 44,
  },
  bitDepthLabel: {
    // Dynamic styles applied inline
    minWidth: 90,
  },
  bitDepthScrollView: {
    flex: 1,
  },
  bitDepthOptions: {
    flexDirection: 'row',
    gap: baseSpacing.sm,
    paddingRight: baseSpacing.md,
  },
  bitDepthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 36,
    gap: baseSpacing.xs,
  },
  bitDepthIcon: {
    fontSize: 14,
  },
  bitDepthText: {
    // Dynamic styles applied inline
  },
  separatorLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: -baseSpacing.base,
    marginRight: -baseSpacing.base,
    marginVertical: baseSpacing.xs,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseSpacing.sm,
    paddingVertical: baseSpacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    gap: baseSpacing.xs,
    minHeight: 36,
  },
  colorSwatchSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  compactChipLabel: {
    // Dynamic styles applied inline
  },
});

export default PopFigureScreen;

