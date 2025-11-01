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

const GhiblifyScreen = () => {
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
      editMode: EditMode.GHIBLIFY,
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
      editMode: EditMode.GHIBLIFY,
    } as any;
    (navigation as any).navigate('Processing', params);
  };

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
        title="Ghiblify"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={() => {
          if (fromToolMockup) {
            handleBackToToolMockup();
          } else {
            navigation.goBack();
          }
        }}
      />

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

          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.sm }}>
            <ToolStatsBar
              time="15-20 sec"
              cost="1.0 cost"
              rating="4.8/5"
              usage="520 today"
            />
          </View>
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
              title="How to Ghiblify Your Photo"
              content={`Transform your photo into Studio Ghibli's iconic animation style.\n\n📸 Step 1: Select Your Photo\nChoose a portrait photo from your library or take a new one. Photos with clear faces work best.\n\n🎨 Step 2: Choose Style Options (Optional)\nCustomize your Ghiblify transformation:\n• Style Intensity - Control how strong the animation style is applied\n• Movie Style - Choose from different Ghibli film aesthetics\n• Background - Natural, fantasy, or simple backgrounds\n• Art Detail - Soft or detailed hand-painted quality\n\n✨ Step 3: Generate\nTap Ghiblify Photo and wait 15-20 seconds. The AI will transform your photo into authentic Studio Ghibli animation style, preserving your identity while applying the iconic hand-painted aesthetic.\n\n🎯 Pro Tips\n• Portrait photos with clear faces produce the best results\n• Your identity is accurately preserved\n• Different movie styles offer unique aesthetic flavors\n• Adjust intensity to find your perfect balance\n• Natural backgrounds work great for portraits`}
              images={[
                {
                  source: require('../../assets/images/ghiblify/modelcard_ghiblify.jpg'),
                  caption: 'Example of Studio Ghibli style transformation'
                }
              ]}
            />
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base }}>
              <AIToolInfoCard
                icon="brush-outline"
                whatDescription="Transform your photo into Studio Ghibli's iconic animation style with soft colors, hand-painted aesthetics, and whimsical charm. Your identity is preserved while applying the legendary Studio Ghibli animation aesthetic."
                howDescription="Our AI analyzes your reference photo and transforms it into authentic Studio Ghibli animation style, preserving facial features, clothing, and distinctive characteristics while applying the signature hand-painted animation quality, natural color palette, and detailed backgrounds characteristic of Studio Ghibli films."
                howItems={[
                  { text: 'Accurate representation of your photo' },
                  { text: 'Authentic Studio Ghibli animation aesthetic' },
                  { text: 'Professional hand-painted quality' },
                ]}
                expandableWhat={false}
                expandableHow={false}
              />
            </View>
            <ToolCreditsTab
              creditCost={1.0}
              processingTime="15-20 sec"
            />
          </TabView>
          
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {activeTopTab === 'history' && (
        <ToolHistoryTab editMode={EditMode.GHIBLIFY} />
      )}

      <ActionButtonBar
        visible={activeTopTab === 'tool' && !!localImageUri}
      >
        <Button
          title="Ghiblify Photo (15-20s)"
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
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 3,
    gap: 3,
    flex: 1,
  },
  qualityToggleButton: {
    paddingVertical: baseSpacing.xs,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityToggleText: {
    // Dynamic styles applied inline
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
    // Dynamic styles applied inline
  },
  backgroundTabsInline: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    flex: 1,
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
    // Dynamic styles applied inline
  },
  previewModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalSafeArea: {
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: baseSpacing.base,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalImage: {
    width: '100%',
    height: '100%',
  },
});

export default GhiblifyScreen;

