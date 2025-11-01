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
import { ToolHistoryTab } from '../components/ToolHistoryTab';
import { TabView } from '../components/TabView';
import { ToolCreditsTab } from '../components/ToolCreditsTab';
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

          {/* Tool Stats Bar */}
          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.sm }}>
            <ToolStatsBar
              time="15-20 sec"
              cost="1.0 cost"
              rating="4.8/5"
              usage="520 today"
            />
          </View>
        </View>

        {/* Advanced Options */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
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

              {/* Box Toggle */}
              <View style={styles.inlineOption}>
                <Text style={[styles.inlineLabel, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                }]}>
                  Box
                </Text>
                <View style={[styles.qualityToggle, {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }]}>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setIncludeBox(true);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: includeBox ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: includeBox ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: includeBox ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      With Box
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setIncludeBox(false);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: !includeBox ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: !includeBox ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: !includeBox ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      Without Box
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Background Type Tabs */}
              <View style={styles.inlineOption}>
                <Text style={[styles.inlineLabel, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginRight: spacing.base,
                }]}>
                  Background
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.gameStyleSlider}
                  contentContainerStyle={{ gap: spacing.xs, paddingLeft: spacing.xs }}
                >
                  {[
                    { id: 'studio', label: 'Studio', icon: '🎬' },
                    { id: 'marble', label: 'Marble', icon: '🪨' },
                    { id: 'glossy', label: 'Glossy', icon: '✨' },
                    { id: 'simple', label: 'Simple', icon: '⬜' },
                    { id: 'color', label: 'Color', icon: '🎨' },
                  ].map((bg) => {
                    const isSelected = backgroundType === bg.id;
                    return (
                      <TouchableOpacity
                        key={bg.id}
                        onPress={() => {
                          haptic.light();
                          setBackgroundType(bg.id as any);
                        }}
                        style={[styles.gameStyleSliderChip, {
                          backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }]}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 14 }}>{bg.icon}</Text>
                        <Text style={[styles.gameStyleSliderLabel, {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: typography.scaled.sm,
                          fontWeight: typography.weight.medium,
                        }]}>
                          {bg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Color Options - Only show when Color is selected */}
              {backgroundType === 'color' && (
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
            </View>
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
              { id: 'info', label: 'Info', icon: 'information-circle-outline' },
              { id: 'cost', label: 'Cost', icon: 'card-outline' },
            ]}
            defaultTab="guide"
            containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
          >
            {/* Guide Tab */}
            <ToolGuideTab
              title="How to Create Pop Figure"
              content={`Transform your photo into a detailed 3D render of a chibi pop figure.\n\n📸 Step 1: Select Your Photo\nChoose a portrait photo from your library or take a new one. Photos with clear faces work best.\n\n🎨 Step 2: Choose Options (Optional)\nYou can customize your pop figure:\n• Display box - Include a collectible display box\n• Without box - Standalone figure for digital use\n• Chibi proportions - Classic oversized head style\n\n✨ Step 3: Generate\nTap Create Pop Figure and wait 5-15 seconds. The AI will create a professional 3D render in authentic pop figure style, preserving your facial features and distinctive characteristics.\n\n🎯 Pro Tips\n• Portrait photos with clear faces produce the best results\n• Your identity is accurately represented\n• Display boxes are perfect for collectible looks\n• Standalone figures work great for digital avatars\n• Chibi proportions create the classic pop figure appearance`}
              images={[
                {
                  source: require('../../assets/images/pop-figure/modelcard_popfigure.jpg'),
                  caption: 'Example of a pop figure transformation'
                }
              ]}
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

            <ToolCreditsTab
              creditCost={1.0}
              processingTime="15-20s"
            />
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
      >
        <Button
          title="Create Pop Figure (5-15s)"
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
  optionCard: {
    padding: baseSpacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderText: {
    letterSpacing: 0.5,
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
  colorSwatchInline: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  colorPickerInlineText: {
    flex: 1,
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

export default PopFigureScreen;

