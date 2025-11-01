import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode } from '../types/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { Button } from '../components/Button';
import { ActionButtonBar } from '../components/ActionButtonBar';
import { CaptureLibraryButtons } from '../components/CaptureLibraryButtons';
import { CollapsibleSection } from '../components/CollapsibleSection';
import ColorPicker from '../components/ColorPicker';
import { TopTabSwitcher } from '../components/TopTabSwitcher';
import { ToolGuideTab } from '../components/ToolGuideTab';
import { ToolHistoryTab } from '../components/ToolHistoryTab';
import { TabView } from '../components/TabView';
import { AIToolInfoCard } from '../components/AIToolInfoCard';
import { ToolCreditsTab } from '../components/ToolCreditsTab';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding, useScrollBottomPaddingWithActionButton } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

const PixelArtGamerScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri, fromToolMockup, config: routeConfig } = (route.params as any) || {};

  // Default values
  const DEFAULT_BIT_DEPTH = '16-bit';
  const DEFAULT_GAME_STYLE = 'rpg';
  const DEFAULT_BACKGROUND_TYPE = 'color';
  const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
  const DEFAULT_IS_TRANSPARENT = false;
  const DEFAULT_SCENE_TYPE = 'gaming';
  const DEFAULT_GRADIENT_TYPE = 'sunset';

  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedBitDepth, setSelectedBitDepth] = useState<'8-bit' | '16-bit'>((routeConfig?.bitDepth as any) || DEFAULT_BIT_DEPTH);
  const [selectedGameStyle, setSelectedGameStyle] = useState<'rpg' | 'platformer' | 'arcade' | 'fighter' | 'adventure' | 'indie'>((routeConfig?.gameStyle as any) || DEFAULT_GAME_STYLE);
  const [selectedBackgroundType, setSelectedBackgroundType] = useState<'color' | 'scene' | 'gradient'>(DEFAULT_BACKGROUND_TYPE);
  const [backgroundColor, setBackgroundColor] = useState<string>(DEFAULT_BACKGROUND_COLOR);
  const [isTransparent, setIsTransparent] = useState<boolean>(DEFAULT_IS_TRANSPARENT);
  const [sceneType, setSceneType] = useState<'gaming' | 'fantasy' | 'cyberpunk' | 'nature'>(DEFAULT_SCENE_TYPE);
  const [gradientType, setGradientType] = useState<'sunset' | 'ocean' | 'forest' | 'neon'>(DEFAULT_GRADIENT_TYPE);
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
    (navigation as any).navigate('QuickCameraLocal', {
      editMode: EditMode.PIXEL_ART_GAMER,
      onPhoto: (uri: string) => {
        setLocalImageUri(uri);
      }
    });
  };

  const handleResetToDefaults = () => {
    haptic.medium();
    setSelectedBitDepth(DEFAULT_BIT_DEPTH);
    setSelectedGameStyle(DEFAULT_GAME_STYLE);
    setSelectedBackgroundType(DEFAULT_BACKGROUND_TYPE);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setIsTransparent(DEFAULT_IS_TRANSPARENT);
    setSceneType(DEFAULT_SCENE_TYPE);
    setGradientType(DEFAULT_GRADIENT_TYPE);
  };

  const handleRandomize = () => {
    haptic.medium();

    // Randomize bit depth
    const bitDepths: ('8-bit' | '16-bit')[] = ['8-bit', '16-bit'];
    setSelectedBitDepth(bitDepths[Math.floor(Math.random() * bitDepths.length)]);

    // Randomize game style
    const gameStyles: ('rpg' | 'platformer' | 'arcade' | 'fighter' | 'adventure' | 'indie')[] =
      ['rpg', 'platformer', 'arcade', 'fighter', 'adventure', 'indie'];
    setSelectedGameStyle(gameStyles[Math.floor(Math.random() * gameStyles.length)]);

    // Randomize background type
    const backgroundTypes: ('color' | 'scene' | 'gradient')[] = ['color', 'scene', 'gradient'];
    const randomBgType = backgroundTypes[Math.floor(Math.random() * backgroundTypes.length)];
    setSelectedBackgroundType(randomBgType);

    // If color, randomize color
    if (randomBgType === 'color') {
      const colors = ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
      setBackgroundColor(colors[Math.floor(Math.random() * colors.length)]);
      setIsTransparent(Math.random() > 0.7); // 30% chance of transparent
    }

    // If scene, randomize scene type
    if (randomBgType === 'scene') {
      const sceneTypes: ('gaming' | 'fantasy' | 'cyberpunk' | 'nature')[] =
        ['gaming', 'fantasy', 'cyberpunk', 'nature'];
      setSceneType(sceneTypes[Math.floor(Math.random() * sceneTypes.length)]);
    }

    // If gradient, randomize gradient type
    if (randomBgType === 'gradient') {
      const gradientTypes: ('sunset' | 'ocean' | 'forest' | 'neon')[] =
        ['sunset', 'ocean', 'forest', 'neon'];
      setGradientType(gradientTypes[Math.floor(Math.random() * gradientTypes.length)]);
    }
  };

  const handleContinue = () => {
    if (!localImageUri) return;
    haptic.medium();
    const config: any = {
      bitDepth: selectedBitDepth,
      gameStyle: selectedGameStyle,
    };

    if (selectedBackgroundType === 'color') {
      config.backgroundStyle = isTransparent ? 'transparent' : 'solid';
      config.transparentColor = backgroundColor;
    } else {
      config.backgroundStyle = selectedBackgroundType;
      if (selectedBackgroundType === 'scene') {
        config.sceneType = sceneType;
      } else if (selectedBackgroundType === 'gradient') {
        config.gradientType = gradientType;
      }
    }

    const params = {
      imageUri: localImageUri,
      editMode: EditMode.PIXEL_ART_GAMER,
      config,
    } as any;
    (navigation as any).navigate('Processing', params);
  };

  const formatLabel = (value?: string): string => {
    if (!value) return '';
    const acronyms: Record<string, string> = { 'rpg': 'RPG' };
    if (acronyms[value.toLowerCase()]) return acronyms[value.toLowerCase()];
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}>
      <AIToolHeader
        title="Pixel Art Gamer"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={() => navigation.goBack()}
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

      <View style={{ height: 12 + 48 + 12 }} />

      {activeTopTab === 'tool' && (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          localImageUri
            ? { paddingBottom: scrollBottomPaddingWithButton }
            : { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Integrated Controls */}
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md }}>
          {localImageUri ? (
            <TouchableOpacity
              onPress={() => { haptic.light(); setShowImagePreview(true); }}
              activeOpacity={0.9}
            >
              <View style={[styles.heroImageWrapper, {
                aspectRatio: 1,
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
                <View style={styles.expandOverlay}>
                  <View style={[styles.expandButton, { backgroundColor: colors.primary + 'DD' }]}>
                    <Ionicons name="expand" size={16} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.medium }}>
                      Tap to view full
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    haptic.light();
                    setLocalImageUri(undefined);
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

          {/* Inline Stats */}
          <View style={[styles.inlineStats, {
            backgroundColor: colors.surface,
            borderRadius: 12,
            marginTop: spacing.sm,
          }]}>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.text, fontSize: typography.scaled.xs }]}>8-12s</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.text, fontSize: typography.scaled.xs }]}>0.3</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.text, fontSize: typography.scaled.xs }]}>4.9/5</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.text, fontSize: typography.scaled.xs }]}>850 today</Text>
            </View>
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.xl }}>
          <CollapsibleSection
            title="⚙️ Advanced Settings"
            defaultExpanded={true}
            hideIcon={true}
          >
            <View style={[styles.optionCard, {
              backgroundColor: 'transparent',
              borderWidth: 0,
              paddingHorizontal: 0,
              paddingBottom: spacing.xs,
              marginTop: -spacing.xs,
            }]}>
              {/* Card Header */}
              <View style={[styles.cardHeader, { marginBottom: spacing.xs }]}>
                <Text style={[styles.cardHeaderText, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.bold,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }]}>
                  Style Options
                </Text>
              </View>

            {/* Pixel Quality Toggle */}
            <View style={styles.inlineOption}>
              <Text style={[styles.inlineLabel, {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                fontWeight: typography.weight.medium,
              }]}>
                Pixel Quality
              </Text>
              <View style={[styles.qualityToggle, {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 8,
              }]}>
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    setSelectedBitDepth('8-bit');
                  }}
                  style={[styles.qualityToggleButton, {
                    backgroundColor: selectedBitDepth === '8-bit' ? colors.primary : 'transparent',
                  }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qualityToggleText, {
                    color: selectedBitDepth === '8-bit' ? '#FFFFFF' : colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: selectedBitDepth === '8-bit' ? typography.weight.semibold : typography.weight.medium,
                  }]}>
                    8-bit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    setSelectedBitDepth('16-bit');
                  }}
                  style={[styles.qualityToggleButton, {
                    backgroundColor: selectedBitDepth === '16-bit' ? colors.primary : 'transparent',
                  }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qualityToggleText, {
                    color: selectedBitDepth === '16-bit' ? '#FFFFFF' : colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: selectedBitDepth === '16-bit' ? typography.weight.semibold : typography.weight.medium,
                  }]}>
                    16-bit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Game Style Slider */}
            <View style={styles.inlineOption}>
              <Text style={[styles.inlineLabel, {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                fontWeight: typography.weight.medium,
                marginRight: spacing.base,
              }]}>
                Game Style
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.gameStyleSlider}
                contentContainerStyle={{ gap: spacing.xs, paddingLeft: spacing.xs }}
              >
                {[
                  { id: 'rpg', label: 'RPG', icon: '⚔️' },
                  { id: 'platformer', label: 'Platform', icon: '🏃' },
                  { id: 'fighter', label: 'Fighter', icon: '👊' },
                  { id: 'adventure', label: 'Adventure', icon: '🗡️' },
                  { id: 'arcade', label: 'Arcade', icon: '🎯' },
                  { id: 'indie', label: 'Indie', icon: '🎨' },
                ].map((style) => {
                  const isSelected = selectedGameStyle === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => {
                        haptic.light();
                        setSelectedGameStyle(style.id as any);
                      }}
                      style={[styles.gameStyleSliderChip, {
                        backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 14 }}>{style.icon}</Text>
                      <Text style={[styles.gameStyleSliderLabel, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Background Tabs - Inline */}
            <View style={styles.inlineOption}>
              <Text style={[styles.inlineLabel, {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                fontWeight: typography.weight.medium,
                marginRight: spacing.base,
              }]}>
                Background
              </Text>
              <View style={[styles.backgroundTabsInline, {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 8,
              }]}>
                {[
                  { id: 'color', label: 'Color', icon: '🎨' },
                  { id: 'scene', label: 'Scene', icon: '🎮' },
                  { id: 'gradient', label: 'Fade', icon: '🌈' },
                ].map((tab) => {
                  const isSelected = selectedBackgroundType === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => {
                        haptic.light();
                        setSelectedBackgroundType(tab.id as any);
                      }}
                      style={[styles.backgroundTabInline, {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      }]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 12 }}>{tab.icon}</Text>
                      <Text style={[styles.backgroundTabLabelInline, {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: isSelected ? typography.weight.semibold : typography.weight.medium,
                      }]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Color Options - Only show when Color is selected */}
            {selectedBackgroundType === 'color' && (
              <>
                {/* Transparent Background Toggle */}
                <View style={styles.inlineOption}>
                  <Text style={[styles.inlineLabel, {
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.medium,
                  }]}>
                    Transparent Background
                  </Text>
                  <View style={[styles.qualityToggle, {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 8,
                  }]}>
                    <TouchableOpacity
                      onPress={() => {
                        haptic.light();
                        setIsTransparent(false);
                      }}
                      style={[styles.qualityToggleButton, {
                        backgroundColor: !isTransparent ? colors.primary : 'transparent',
                      }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.qualityToggleText, {
                        color: !isTransparent ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: !isTransparent ? typography.weight.semibold : typography.weight.medium,
                      }]}>
                        No
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        haptic.light();
                        setIsTransparent(true);
                      }}
                      style={[styles.qualityToggleButton, {
                        backgroundColor: isTransparent ? colors.primary : 'transparent',
                      }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.qualityToggleText, {
                        color: isTransparent ? '#FFFFFF' : colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: isTransparent ? typography.weight.semibold : typography.weight.medium,
                      }]}>
                        Yes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Color Presets */}
                <View style={styles.inlineOption}>
                  <Text style={[styles.inlineLabel, {
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.medium,
                  }]}>
                    Quick Colors
                  </Text>
                  <View style={styles.colorPresetsContainer}>
                    {[
                      { color: '#FFFFFF', label: 'White' },
                      { color: '#000000', label: 'Black' },
                      { color: '#FF6B6B', label: 'Red' },
                      { color: '#4ECDC4', label: 'Teal' },
                    ].map((preset) => {
                      const isSelected = backgroundColor === preset.color && !isTransparent;
                      return (
                        <TouchableOpacity
                          key={preset.color}
                          onPress={() => {
                            haptic.light();
                            setBackgroundColor(preset.color);
                            setIsTransparent(false);
                          }}
                          style={[styles.colorPresetButton, {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                          }]}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.colorPresetSwatch, {
                            backgroundColor: preset.color,
                            borderWidth: 1,
                            borderColor: preset.color === '#FFFFFF' ? colors.border : 'transparent',
                          }]} />
                          {isSelected && (
                            <View style={styles.colorPresetCheckmark}>
                              <Ionicons name="checkmark" size={12} color={colors.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      onPress={() => {
                        haptic.light();
                        setShowColorPicker(true);
                      }}
                      style={[styles.colorPresetButton, {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Custom Color Display */}
                {!isTransparent && ![
                  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4'
                ].includes(backgroundColor) && (
                  <View style={styles.inlineOption}>
                    <Text style={[styles.inlineLabel, {
                      color: colors.textSecondary,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.medium,
                    }]}>
                      Custom Color
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        haptic.light();
                        setShowColorPicker(true);
                      }}
                      style={[styles.customColorDisplay, {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      }]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.colorSwatchInline, {
                        backgroundColor: backgroundColor,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }]} />
                      <Text style={[styles.colorPickerInlineText, {
                        color: colors.text,
                        fontSize: typography.scaled.sm,
                        fontWeight: typography.weight.medium,
                      }]}>
                        {backgroundColor}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Action Tags */}
            <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
              <TouchableOpacity
                onPress={handleRandomize}
                style={[styles.actionTag, {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '30',
                }]}
                activeOpacity={0.7}
              >
                <Ionicons name="shuffle" size={12} color={colors.primary} />
                <Text style={[styles.actionTagText, {
                  color: colors.primary,
                  fontSize: typography.scaled.xs,
                  fontWeight: typography.weight.medium,
                }]}>
                  Randomize
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetToDefaults}
                style={[styles.actionTag, {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                }]}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={12} color={colors.textSecondary} />
                <Text style={[styles.actionTagText, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.xs,
                  fontWeight: typography.weight.medium,
                }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>

          </View>
          </CollapsibleSection>
        </View>

        {/* Contextual Tip */}
        {selectedBitDepth === '16-bit' && selectedGameStyle === 'rpg' && (
          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}>
            <View style={[styles.tipCard, {
              backgroundColor: colors.primary + '10',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary + '30',
            }]}>
              <Ionicons name="bulb" size={20} color={colors.primary} />
              <Text style={[styles.tipText, {
                color: colors.text,
                fontSize: typography.scaled.sm,
              }]}>
                <Text style={{ fontWeight: typography.weight.bold }}>Pro Tip:</Text> 16-bit RPG style works best with portrait photos!
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
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
          <TabView
            tabs={[
              { id: 'guide', label: 'Guide', icon: 'book-outline' },
              { id: 'info', label: 'Info', icon: 'information-circle-outline' },
              { id: 'cost', label: 'Cost', icon: 'card-outline' },
            ]}
            defaultTab="guide"
            containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
          >
            <ToolGuideTab
              title="How to Use"
              content={`Transform yourself into a retro video game character sprite with authentic 16-bit pixel art styling.\n\n📸 Step 1: Select Your Photo\nChoose a portrait photo from your library or take a new one. Photos with clear faces work best.\n\n🎮 Step 2: Choose Game Style\nSelect from authentic game styles:\nRPG - Classic Final Fantasy style\nPlatformer - Side-scrolling adventure hero\nArcade - Retro arcade game character\nFighter - Fighting game champion\nAdventure - Epic quest protagonist\nIndie - Modern indie game aesthetic\n\n🎨 Step 3: Set Bit Depth\n8-bit - Classic retro look, more pixelated\n16-bit - More detail, smoother appearance\n\n🖼️ Step 4: Configure Background\nColor - Solid color (with transparency option)\nScene - Gaming-themed background\nGradient - Colorful gradient backdrop\n\n✨ Step 5: Generate\nTap Create Pixel Art Sprite and wait 5-15 seconds for your retro game character.`}
              images={[
                {
                  source: require('../../assets/images/pixel-art/modelcard_pixelart.jpg'),
                  caption: 'Example of pixel art transformation'
                }
              ]}
            />

            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="game-controller-outline"
                whatDescription="Transform your photo into a retro 16-bit video game sprite in the style of classic RPG games like Final Fantasy."
                howDescription="Our AI analyzes your reference photo and creates a pixelated character sprite in classic 16-bit RPG style."
                howItems={[
                  { text: 'Accurate representation of your photo' },
                  { text: 'Authentic 16-bit pixel art style' },
                  { text: 'Classic RPG character presentation' },
                ]}
                expandableWhat={false}
                expandableHow={false}
              />
            </View>

            <ToolCreditsTab
              creditCost={0.3}
              processingTime="8-12s"
            />
          </TabView>
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {activeTopTab === 'history' && (
        <ToolHistoryTab editMode={EditMode.PIXEL_ART_GAMER} />
      )}

      {/* Action Button Bar */}
      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!localImageUri}
      >
        <Button
          title="🎮 Create Pixel Art Sprite (5-15s)"
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
              <Image source={{ uri: localImageUri || '' }} style={styles.previewModalImage} resizeMode="contain" />
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* Color Picker Modal */}
      <ColorPicker
        visible={showColorPicker}
        initialColor={isTransparent ? 'transparent' : backgroundColor}
        onColorSelect={(color) => {
          if (color === 'transparent') {
            setIsTransparent(true);
            setBackgroundColor('#FFFFFF');
          } else {
            setIsTransparent(false);
            setBackgroundColor(color);
          }
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
    width: '100%',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
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
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseSpacing.base,
    paddingVertical: baseSpacing.xs,
    borderRadius: 20,
    gap: baseSpacing.xs,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    // Dynamic styles
  },
  statDivider: {
    width: 1,
    height: 16,
  },
  sectionMainHeader: {
    marginBottom: baseSpacing.xs,
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: baseSpacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  randomizeButtonText: {
    // Dynamic styles
  },
  actionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionTagText: {
    // Dynamic styles
  },
  optionCard: {
    padding: baseSpacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: baseSpacing.base,
  },
  cardHeaderText: {
    letterSpacing: 0.5,
  },
  selectedBadge: {
    paddingHorizontal: baseSpacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    // Dynamic styles
  },
  inlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: baseSpacing.base,
  },
  inlineLabel: {
    // Dynamic styles
  },
  qualityToggle: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  qualityToggleButton: {
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 6,
  },
  qualityToggleText: {
    // Dynamic styles
  },
  gameStyleSlider: {
    flex: 1,
  },
  gameStyleSliderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  gameStyleSliderLabel: {
    // Dynamic styles
  },
  sectionDivider: {
    height: 1,
  },
  compactSectionLabel: {
    // Dynamic styles
  },
  backgroundTabsInline: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  backgroundTabInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.sm,
    borderRadius: 6,
  },
  backgroundTabLabelInline: {
    // Dynamic styles
  },
  colorPresetsContainer: {
    flexDirection: 'row',
    gap: baseSpacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  colorPresetButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  colorPresetSwatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  colorPresetCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.xs,
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  colorPickerInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.xs,
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  colorSwatchInline: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  colorPickerInlineText: {
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.sm,
    padding: baseSpacing.base,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
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
  previewModalImage: {
    width: width - 56,
    height: height * 0.65,
    borderRadius: 16,
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
});

export default PixelArtGamerScreen;
