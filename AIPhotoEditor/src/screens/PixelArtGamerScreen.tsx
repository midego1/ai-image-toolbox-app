import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated, Alert, Platform } from 'react-native';
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
import ColorPicker from '../components/ColorPicker';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { TopTabSwitcher } from '../components/TopTabSwitcher';
import { ToolGuideTab } from '../components/ToolGuideTab';
import { ToolExamplesTab, Example } from '../components/ToolExamplesTab';
import { TabView } from '../components/TabView';
import { ToolStatsBar } from '../components/ToolStatsBar';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding, useScrollBottomPaddingWithActionButton } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

const PixelArtGamerScreen = () => {
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
  const [selectedBitDepth, setSelectedBitDepth] = useState<'8-bit' | '16-bit'>((routeConfig?.bitDepth as any) || '16-bit');
  const [selectedGameStyle, setSelectedGameStyle] = useState<'rpg' | 'platformer' | 'arcade' | 'fighter' | 'adventure' | 'indie'>((routeConfig?.gameStyle as any) || 'rpg');
  const [selectedBackground, setSelectedBackground] = useState<'color' | 'scene' | 'gradient'>((() => {
    const bg = (routeConfig?.backgroundStyle as any);
    // Migrate old 'transparent' or 'solid' to 'color'
    return (bg === 'transparent' || bg === 'solid') ? 'color' : (bg || 'color');
  })());
  // Background sub-options
  const [backgroundColor, setBackgroundColor] = useState<string>((routeConfig?.transparentColor as string) || (routeConfig?.backgroundColor as string) || '#FFFFFF');
  const [isTransparent, setIsTransparent] = useState<boolean>((routeConfig?.backgroundStyle as any) === 'transparent' || (routeConfig?.isTransparent as boolean) || false);
  const [sceneType, setSceneType] = useState<'gaming' | 'fantasy' | 'cyberpunk' | 'nature'>((routeConfig?.sceneType as any) || 'gaming');
  const [gradientType, setGradientType] = useState<'sunset' | 'ocean' | 'forest' | 'neon'>((routeConfig?.gradientType as any) || 'sunset');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'tool' | 'guide'>('tool');
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
      editMode: EditMode.PIXEL_ART_GAMER,
      onPhoto: (uri: string) => {
        setLocalImageUri(uri);
      }
    });
  };

  const handleContinue = () => {
    if (!localImageUri) return;
    haptic.medium();
    const config: any = {
      bitDepth: selectedBitDepth,
      gameStyle: selectedGameStyle,
      backgroundStyle: selectedBackground,
    };
    
    // Add sub-options based on selected background
    if (selectedBackground === 'color') {
      config.backgroundColor = backgroundColor;
      config.isTransparent = isTransparent;
    } else if (selectedBackground === 'scene') {
      config.sceneType = sceneType;
    } else if (selectedBackground === 'gradient') {
      config.gradientType = gradientType;
    }
    
    const params = {
      imageUri: localImageUri,
      editMode: EditMode.PIXEL_ART_GAMER,
      config,
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
        title="Pixel Art Gamer"
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
        ]}
        activeTab={activeTopTab}
        onTabChange={(tabId) => setActiveTopTab(tabId as 'tool' | 'guide')}
      />

      {/* Add top padding to content to account for floating tab bar */}
      <View style={{ height: 12 + 48 + 12 }} />

      {activeTopTab === 'tool' ? (
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
              time="8-12 sec"
              credits="0.3 credit"
              rating="4.9/5"
              usage="850 today"
            />
          </View>
        </View>

        {/* Configuration Section - Always visible */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          <CollapsibleSection
            title="Advanced Options"
            defaultExpanded={true}
            containerStyle={{ marginBottom: spacing.base }}
          >
            {/* Bit Depth - Custom Inline Layout */}
            <View style={[styles.bitDepthContainer]}>
              <Text style={[styles.bitDepthLabel, {
                color: colors.text,
                fontSize: typography.scaled.xs,
                fontWeight: typography.weight.medium,
              }]}>
                📊 Bit Depth
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.bitDepthScrollView}
                contentContainerStyle={styles.bitDepthOptions}
              >
                {(['8-bit', '16-bit'] as const).map((bit) => {
                  const isSelected = selectedBitDepth === bit;
                  return (
                    <TouchableOpacity
                      key={bit}
                      onPress={() => {
                        haptic.light();
                        setSelectedBitDepth(bit);
                      }}
                      style={[styles.bitDepthButton, {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={styles.bitDepthIcon}>
                        {bit === '8-bit' ? '📱' : '🎮'}
                      </Text>
                      <Text style={[styles.bitDepthText, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.xs,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {bit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Separator Line */}
            <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />

            {/* Game Style - Custom Inline Layout */}
            <View style={[styles.bitDepthContainer]}>
              <Text style={[styles.bitDepthLabel, {
                color: colors.text,
                fontSize: typography.scaled.xs,
                fontWeight: typography.weight.medium,
              }]}>
                🎮 Game Style
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.bitDepthScrollView}
                contentContainerStyle={styles.bitDepthOptions}
              >
                {([
                  { id: 'rpg', label: 'RPG', icon: '⚔️' },
                  { id: 'platformer', label: 'Platformer', icon: '🏃' },
                  { id: 'fighter', label: 'Fighter', icon: '👊' },
                  { id: 'adventure', label: 'Adventure', icon: '🗡️' },
                  { id: 'arcade', label: 'Arcade', icon: '🎯' },
                  { id: 'indie', label: 'Indie', icon: '🎨' },
                ] as const).map((style) => {
                  const isSelected = selectedGameStyle === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => {
                        haptic.light();
                        setSelectedGameStyle(style.id as any);
                      }}
                      style={[styles.bitDepthButton, {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={styles.bitDepthIcon}>{style.icon}</Text>
                      <Text style={[styles.bitDepthText, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.xs,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Separator Line */}
            <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />

            {/* Background - Custom Inline Layout */}
            <View style={[styles.bitDepthContainer]}>
              <Text style={[styles.bitDepthLabel, {
                color: colors.text,
                fontSize: typography.scaled.xs,
                fontWeight: typography.weight.medium,
              }]}>
                🖼️ Background
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.bitDepthScrollView}
                contentContainerStyle={styles.bitDepthOptions}
              >
                {[
                  { 
                    id: 'color', 
                    label: 'Color', 
                    icon: '🎨',
                  },
                  { id: 'scene', label: 'Gaming Scene', icon: '🎮' },
                  { id: 'gradient', label: 'Gradient', icon: '🌈' },
                ].map((bg) => {
                  const isSelected = selectedBackground === bg.id;
                  const isColorOption = bg.id === 'color';
                  
                  return (
                    <TouchableOpacity
                      key={bg.id}
                      onPress={() => {
                        haptic.light();
                        if (isColorOption) {
                          // Set color as selected (don't open picker immediately)
                          setSelectedBackground('color');
                        } else {
                          setSelectedBackground(bg.id as any);
                        }
                      }}
                      style={[styles.bitDepthButton, {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }]}
                    >
                      {isColorOption ? (
                        <View style={[styles.colorIndicator, { 
                          backgroundColor: isTransparent ? 'transparent' : backgroundColor,
                          borderWidth: isTransparent ? 1 : 0,
                          borderColor: colors.border,
                        }]} />
                      ) : (
                        <Text style={styles.bitDepthIcon}>{bg.icon}</Text>
                      )}
                      <Text style={[styles.bitDepthText, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.xs,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {bg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Background Sub-options */}
            {selectedBackground === 'color' && (
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

            {selectedBackground === 'scene' && (
              <View style={[styles.bitDepthContainer]}>
                <Text style={[styles.bitDepthLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.xs,
                  fontWeight: typography.weight.medium,
                }]}>
                  🎮 Type
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.bitDepthScrollView}
                  contentContainerStyle={styles.bitDepthOptions}
                >
                  {([
                    { id: 'gaming', label: 'Gaming', icon: '🎮' },
                    { id: 'fantasy', label: 'Fantasy', icon: '🧙' },
                    { id: 'cyberpunk', label: 'Cyberpunk', icon: '🤖' },
                    { id: 'nature', label: 'Nature', icon: '🌲' },
                  ] as const).map((scene) => {
                    const isSelected = sceneType === scene.id;
                    return (
                      <TouchableOpacity
                        key={scene.id}
                        onPress={() => {
                          haptic.light();
                          setSceneType(scene.id as any);
                        }}
                        style={[styles.bitDepthButton, {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={styles.bitDepthIcon}>{scene.icon}</Text>
                        <Text style={[styles.bitDepthText, {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.xs,
                          fontWeight: typography.weight.medium,
                        }]}>
                          {scene.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedBackground === 'gradient' && (
              <View style={[styles.bitDepthContainer]}>
                <Text style={[styles.bitDepthLabel, {
                  color: colors.text,
                  fontSize: typography.scaled.xs,
                  fontWeight: typography.weight.medium,
                }]}>
                  🌈 Gradient Type
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.bitDepthScrollView}
                  contentContainerStyle={styles.bitDepthOptions}
                >
                  {([
                    { id: 'sunset', label: 'Sunset', icon: '🌅' },
                    { id: 'ocean', label: 'Ocean', icon: '🌊' },
                    { id: 'forest', label: 'Forest', icon: '🌲' },
                    { id: 'neon', label: 'Neon', icon: '💫' },
                  ] as const).map((gradient) => {
                    const isSelected = gradientType === gradient.id;
                    return (
                      <TouchableOpacity
                        key={gradient.id}
                        onPress={() => {
                          haptic.light();
                          setGradientType(gradient.id as any);
                        }}
                        style={[styles.bitDepthButton, {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={styles.bitDepthIcon}>{gradient.icon}</Text>
                        <Text style={[styles.bitDepthText, {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.xs,
                          fontWeight: typography.weight.medium,
                        }]}>
                          {gradient.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* Information Card - kept for quick reference */}
        <AIToolInfoCard
          icon="game-controller-outline"
          whatDescription="Transform your photo into a retro 16-bit video game sprite in the style of classic RPG games like Final Fantasy."
          howDescription="Our AI analyzes your reference photo and creates a pixelated character sprite in classic 16-bit RPG style."
          howItems={[
            { text: 'Accurate representation of your photo' },
            { text: 'Authentic 16-bit pixel art style' },
            { text: 'Classic RPG character presentation' },
          ]}
        />
        
        {/* Extra bottom padding to ensure scrolling */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
      ) : (
        /* Guide View */
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
            containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
          >
            {/* Guide Tab */}
            <ToolGuideTab
              title="How to Use"
              content="Transform yourself into a retro video game character sprite with authentic 16-bit pixel art styling.\n\n📸 Step 1: Select Your Photo\nChoose a portrait photo from your library or take a new one. Photos with clear faces work best.\n\n🎮 Step 2: Choose Game Style\nSelect from authentic game styles:\nRPG - Classic Final Fantasy style\nPlatformer - Side-scrolling adventure hero\nArcade - Retro arcade game character\nFighter - Fighting game champion\nAdventure - Epic quest protagonist\nIndie - Modern indie game aesthetic\n\n🎨 Step 3: Set Bit Depth\n8-bit - Classic retro look, more pixelated\n16-bit - More detail, smoother appearance\n\n🖼️ Step 4: Configure Background\nColor - Solid color (with transparency option)\nScene - Gaming-themed background\nGradient - Colorful gradient backdrop\n\n✨ Step 5: Generate\nTap Create Pixel Art Sprite and wait 5-15 seconds for your retro game character.\n\n🎯 Pro Tips\nPortrait photos with clear faces produce the best sprites.\n16-bit works great for detailed photos.\nTransparent backgrounds are perfect for game integration.\nRPG style works beautifully with fantasy-themed photos.\nEach game style has unique characteristics. Try them all.\nPerfect for creating game avatars or unique profile pictures."
              images={[
                // Add your guide images here when ready
                // { source: { uri: 'https://example.com/guide-image.jpg' }, caption: 'Example: RPG style sprite' },
              ]}
            />

            {/* Examples Tab */}
            <ToolExamplesTab
              title="Pixel Art Examples"
              examples={[
                {
                  id: '1',
                  title: 'RPG Character - 16-bit',
                  description: 'Classic RPG style with transparent background, perfect for game integration',
                  tags: ['16-bit', 'RPG', 'Transparent'],
                },
                {
                  id: '2',
                  title: 'Arcade Style - 8-bit',
                  description: 'Retro arcade character with neon gradient background',
                  tags: ['8-bit', 'Arcade', 'Gradient'],
                },
                {
                  id: '3',
                  title: 'Platformer Hero - 16-bit',
                  description: 'Side-scrolling platformer style with gaming scene background',
                  tags: ['16-bit', 'Platformer', 'Scene'],
                },
                {
                  id: '4',
                  title: 'Fighter Character - 16-bit',
                  description: 'Fighting game style with dramatic lighting and solid background',
                  tags: ['16-bit', 'Fighter', 'Solid'],
                },
              ]}
              onExamplePress={(example) => {
                haptic.light();
                // You can implement modal or navigation here to show full example
                console.log('Example pressed:', example.title);
              }}
            />

            {/* Info Tab */}
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="game-controller-outline"
                whatDescription="Transform your photo into a retro 16-bit video game sprite in the style of classic RPG games like Final Fantasy. The sprite will accurately represent you or your subject with authentic pixel art styling, blocky features, and adventure game aesthetics."
                howDescription="Our AI analyzes your reference photo and creates a pixelated character sprite in classic 16-bit RPG style, preserving facial features, clothing, and distinctive characteristics while applying authentic pixel art techniques and retro game aesthetics."
                howItems={[
                  { text: 'Accurate representation of your photo' },
                  { text: 'Authentic 16-bit pixel art style' },
                  { text: 'Classic RPG character presentation' },
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
          title="Create Pixel Art Sprite"
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

      {/* Color Picker Modal */}
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
          setSelectedBackground('color'); // Ensure color option is selected
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
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseSpacing.base,
    paddingVertical: baseSpacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    height: 48,
  },
  advancedToggleText: {
    // Dynamic styles applied inline
  },
  compactOptionsContainer: {
    gap: baseSpacing.base,
  },
  compactOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.sm,
  },
  compactLabel: {
    // Dynamic styles applied inline
  },
  compactChipRow: {
    flexDirection: 'row',
    flex: 1,
    gap: baseSpacing.xs,
    flexWrap: 'wrap',
  },
  compactChipScrollContainer: {
    flex: 1,
  },
  compactChipScroll: {
    gap: baseSpacing.xs,
    paddingRight: baseSpacing.base,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 6,
  },
  compactChipIcon: {
    fontSize: 16,
  },
  compactChipLabel: {
    // Dynamic styles applied inline
  },
  subOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.sm,
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
  optionButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseSpacing.xs / 2,
  },
  optionText: {
    // Dynamic styles applied inline
    textAlign: 'center',
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
});

export default PixelArtGamerScreen;

