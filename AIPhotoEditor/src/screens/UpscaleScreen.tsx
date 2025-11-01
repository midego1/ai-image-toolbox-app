import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { formatCreditCost, formatCreditCostText } from '../utils/creditCost';

const { width, height } = Dimensions.get('window');

const UpscaleScreen = () => {
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
  const [outscale, setOutscale] = useState<number>((routeConfig?.outscale as number) || 4);
  const [faceEnhance, setFaceEnhance] = useState<boolean>((routeConfig?.faceEnhance as boolean) || false);
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
      editMode: EditMode.ENHANCE,
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
      editMode: EditMode.ENHANCE,
      config: {
        outscale: outscale,
        faceEnhance: faceEnhance,
      }
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
        title="Upscale"
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
              time="5-15 sec"
              cost={(() => {
                let cost = 0.3;
                if (outscale === 4) cost += 0.1;
                if (faceEnhance) cost += 0.2;
                return `${cost} cost${cost !== 1 ? 's' : ''}`;
              })()}
              rating="4.8/5"
              usage="1.5k today"
            />
          </View>
        </View>

        {/* Advanced Settings - Always visible, before image selection */}
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
                  Enhancement Options
                </Text>
              </View>

              {/* Upscale Factor Toggle */}
              <View style={styles.inlineOption}>
                <Text style={[styles.inlineLabel, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                }]}>
                  Upscale Factor
                </Text>
                <View style={[styles.qualityToggle, {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }]}>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setOutscale(2);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: outscale === 2 ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: outscale === 2 ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: outscale === 2 ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      2x
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setOutscale(4);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: outscale === 4 ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: outscale === 4 ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: outscale === 4 ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      4x
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Face Enhancement Toggle */}
              <View style={styles.inlineOption}>
                <Text style={[styles.inlineLabel, {
                  color: colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                }]}>
                  Face Enhancement
                </Text>
                <View style={[styles.qualityToggle, {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }]}>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setFaceEnhance(false);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: !faceEnhance ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: !faceEnhance ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: !faceEnhance ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      Disabled
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setFaceEnhance(true);
                    }}
                    style={[styles.qualityToggleButton, {
                      backgroundColor: faceEnhance ? colors.primary : 'transparent',
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qualityToggleText, {
                      color: faceEnhance ? '#FFFFFF' : colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: faceEnhance ? typography.weight.semibold : typography.weight.medium,
                    }]}>
                      Enabled
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pricing Breakdown */}
              <View style={[{
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }]}>
                <View style={[styles.cardHeader, { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }]}>
                  <Ionicons name="cash-outline" size={16} color={colors.primary} style={{ marginRight: spacing.xs }} />
                  <Text style={[styles.cardHeaderText, {
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.bold,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }]}>
                    Cost Breakdown
                  </Text>
                </View>

                {/* Cost Calculation */}
                {(() => {
                  const baseCost = 0.3;
                  const upscaleAddition = outscale === 4 ? 0.1 : 0;
                  const faceAddition = faceEnhance ? 0.2 : 0;
                  const totalCost = baseCost + upscaleAddition + faceAddition;
                  
                  // Calculate average price per credit: (0.99 + 2.19 + 4.19 + 7.99) / (10 + 25 + 50 + 100) = 15.36 / 185 = 0.083
                  const averagePricePerCredit = 0.083;
                  const totalCostUSD = totalCost * averagePricePerCredit;

                  return (
                    <View>
                      {/* Breakdown Items */}
                      <View style={{ marginBottom: spacing.xs }}>
                        <View style={[styles.costRow, {
                          justifyContent: 'space-between',
                          marginBottom: spacing.xs,
                        }]}>
                          <Text style={[styles.costLabel, {
                            color: colors.textSecondary,
                            fontSize: typography.scaled.xs,
                          }]}>
                            Base Cost (2x Upscale)
                          </Text>
                          <Text style={[styles.costValue, {
                            color: colors.text,
                            fontSize: typography.scaled.xs,
                            fontWeight: typography.weight.medium,
                          }]}>
                            {formatCreditCostText(baseCost)}
                          </Text>
                        </View>
                        
                        {outscale === 4 && (
                          <View style={[styles.costRow, {
                            justifyContent: 'space-between',
                            marginBottom: spacing.xs,
                            marginLeft: spacing.md,
                          }]}>
                            <Text style={[styles.costLabel, {
                              color: colors.textSecondary,
                              fontSize: typography.scaled.xs,
                            }]}>
                              + 4x Upscale Addition
                            </Text>
                            <Text style={[styles.costValue, {
                              color: colors.text,
                              fontSize: typography.scaled.xs,
                              fontWeight: typography.weight.medium,
                            }]}>
                              +{formatCreditCost(upscaleAddition)} costs
                            </Text>
                          </View>
                        )}
                        
                        {faceEnhance && (
                          <View style={[styles.costRow, {
                            justifyContent: 'space-between',
                            marginBottom: spacing.xs,
                            marginLeft: spacing.md,
                          }]}>
                            <Text style={[styles.costLabel, {
                              color: colors.textSecondary,
                              fontSize: typography.scaled.xs,
                            }]}>
                              + Face Enhancement
                            </Text>
                            <Text style={[styles.costValue, {
                              color: colors.text,
                              fontSize: typography.scaled.xs,
                              fontWeight: typography.weight.medium,
                            }]}>
                              +{formatCreditCost(faceAddition)} costs
                            </Text>
                          </View>
                        )}

                        {/* Total Cost */}
                        <View style={[{
                          marginTop: spacing.xs,
                          paddingTop: spacing.xs,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                        }]}>
                          <View style={[styles.costRow, {
                            justifyContent: 'space-between',
                            marginBottom: spacing.xs,
                          }]}>
                            <Text style={[styles.costLabel, {
                              color: colors.text,
                              fontSize: typography.scaled.sm,
                              fontWeight: typography.weight.semibold,
                            }]}>
                              Total Cost
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.costValue, {
                                color: colors.primary,
                                fontSize: typography.scaled.base,
                                fontWeight: typography.weight.bold,
                              }]}>
                                {formatCreditCostText(totalCost)}
                              </Text>
                              <Text style={[styles.costLabel, {
                                color: colors.textSecondary,
                                fontSize: typography.scaled.xs,
                                marginTop: 2,
                              }]}>
                                ≈ ${totalCostUSD.toFixed(3)} USD (avg)
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Reference to Guide */}
                      <TouchableOpacity
                        onPress={() => {
                          haptic.light();
                          setActiveTopTab('guide');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: spacing.xs,
                          paddingTop: spacing.xs,
                          borderTopWidth: 1,
                          borderTopColor: colors.border + '50',
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="information-circle-outline" size={14} color={colors.primary} style={{ marginRight: spacing.xs }} />
                        <Text style={[{
                          color: colors.primary,
                          fontSize: typography.scaled.xs,
                          fontWeight: typography.weight.medium,
                          flex: 1,
                        }]}>
                          See full cost breakdown in Guide → Cost tab
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>

              {/* Hint Text */}
              <Text style={[styles.optionsHint, {
                color: colors.textSecondary,
                fontSize: typography.scaled.xs,
                marginTop: spacing.sm,
                lineHeight: 18,
              }]}>
                {faceEnhance 
                  ? 'Face enhancement uses GFPGAN for better portrait quality. 4x upscale is recommended for best results.' 
                  : '4x upscale is recommended for best results. Face enhancement is great for portraits and close-ups.'}
              </Text>
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
              title="How to Upscale Your Photos"
              content={`Upscale your photos with AI-powered enhancement that sharpens details, reduces noise, and improves overall quality.\n\n📸 Step 1: Select Your Photo\nChoose a photo from your library or take a new one. Low-resolution photos, old photos, or images with compression artifacts work great.\n\n⚙️ Step 2: Choose Settings\n• Upscale Factor: Choose 2x for moderate enhancement or 4x for maximum detail\n• Face Enhancement: Enable for portraits to enhance facial features using GFPGAN\n\n✨ Step 3: Upscale\nTap Upscale and wait 5-15 seconds. The AI will upscale your image while preserving natural details and colors.\n\n💾 Step 4: Save or Share\nAfter processing, you can:\n• Save the upscaled image to your library\n• Share it directly to social media\n• Use it for prints or digital displays\n\n🎯 Pro Tips\n• 4x upscale works best for photos under 1440p resolution\n• Face enhancement is ideal for portraits and close-ups\n• Great for restoring old photos or low-res images\n• Perfect for printing larger sizes without quality loss\n• Works well with both photos and artwork`}
              images={[
                {
                  source: require('../../assets/images/upscale/modelcard_upscale.png'),
                  caption: 'Example of upscaled image'
                }
              ]}
            />

            {/* Info Tab */}
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="sparkles-outline"
                whatDescription="Upscale your photos with AI-powered enhancement that increases resolution, sharpens details, and reduces noise while keeping colors natural."
                howDescription="We use Real-ESRGAN, an advanced AI model that reconstructs fine details and textures. Optional GFPGAN face enhancement improves portrait quality."
                howItems={[
                  { text: '2x or 4x upscaling' },
                  { text: 'Optional face enhancement for portraits' },
                  { text: 'Ideal for low-res images and old photos' },
                ]}
                expandableWhat={false}
                expandableHow={false}
              />
            </View>

            <ToolCreditsTab
              creditCost={0.3}
              processingTime="5-15s"
              variableCosts={[
                { label: '2x Upscale (base)', cost: 0.3 },
                { label: '4x Upscale', cost: 0.4 },
                { label: '2x + Face Enhancement', cost: 0.5 },
                { label: '4x + Face Enhancement', cost: 0.6 },
              ]}
            />
          </TabView>
          
          {/* Extra bottom padding */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {activeTopTab === 'history' && (
        <ToolHistoryTab editMode={EditMode.ENHANCE} />
      )}

      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!localImageUri}
      >
        <Button
          title={`Upscale ${outscale}x${faceEnhance ? ' + Face' : ''} (${(() => {
            let cost = 0.3;
            if (outscale === 4) cost += 0.1;
            if (faceEnhance) cost += 0.2;
            return cost;
          })()} costs)`}
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
  optionCard: {
    // Dynamic styles applied inline
  },
  cardHeader: {
    // Dynamic styles applied inline
  },
  cardHeaderText: {
    // Dynamic styles applied inline
  },
  inlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: baseSpacing.base,
  },
  inlineLabel: {
    // Dynamic styles applied inline
  },
  qualityToggle: {
    flexDirection: 'row',
    padding: 2,
    gap: 4,
  },
  qualityToggleButton: {
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityToggleText: {
    // Dynamic styles applied inline
  },
  optionsHint: {
    // Dynamic styles applied inline
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costLabel: {
    // Dynamic styles applied inline
  },
  costValue: {
    // Dynamic styles applied inline
  },
});

export default UpscaleScreen;

