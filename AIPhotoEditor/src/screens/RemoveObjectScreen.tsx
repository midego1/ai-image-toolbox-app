import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable, Animated, Alert, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
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
import { ToolStatsBar } from '../components/ToolStatsBar';
import { TopTabSwitcher } from '../components/TopTabSwitcher';
import { ToolGuideTab } from '../components/ToolGuideTab';
import { ToolExamplesTab } from '../components/ToolExamplesTab';
import { TabView } from '../components/TabView';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';
import { useScrollBottomPadding, useScrollBottomPaddingWithActionButton } from '../utils/scrollPadding';

const { width, height } = Dimensions.get('window');

const RemoveObjectScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'GenreSelection'>>();
  const { imageUri } = (route.params as any) || {};
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [removalPrompt, setRemovalPrompt] = useState('');
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
    (navigation as any).navigate('QuickCameraLocal', { 
      editMode: EditMode.REMOVE_OBJECT,
      onPhoto: (uri: string) => {
        setLocalImageUri(uri);
      }
    });
  };

  const handleGenerate = () => {
    if (!localImageUri) return;
    if (!removalPrompt.trim()) {
      Alert.alert('Missing Prompt', 'Please describe what you want to remove from the image');
      return;
    }
    haptic.medium();
    const params = {
      imageUri: localImageUri,
      editMode: EditMode.REMOVE_OBJECT,
      config: { prompt: removalPrompt.trim(), removalPrompt: removalPrompt.trim() }
    } as any;
    (navigation as any).navigate('Processing', params);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}> 
      <AIToolHeader
        title="Remove Object"
        backgroundColor={colors.backgroundSecondary}
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
          localImageUri && removalPrompt.trim()
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
              time="3-6 sec"
              credits="0.2 credit"
              rating="4.8/5"
              usage="1.5k today"
            />
          </View>
        </View>

        {/* Prompt Input Section - Always visible */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
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

        {/* Information Card */}
        <AIToolInfoCard
          icon="remove-circle-outline"
          whatDescription="Remove unwanted objects, people, or distractions from your photos with precision. Simply describe what to remove and our AI handles the rest."
          howDescription="Our AI identifies the object you specify and intelligently removes it while filling in the background naturally, preserving the scene's integrity."
          howItems={[
            { text: 'Natural background filling' },
            { text: 'Precise object detection' },
            { text: 'Works with any object description' },
          ]}
        />
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
              title="How to Remove Objects"
              content="Clean up your photos by removing unwanted elements with AI precision.\n\n📸 Step 1: Select Your Photo\nChoose a photo from your library or take a new one. Make sure the object you want to remove is clearly visible.\n\n✍️ Step 2: Describe What to Remove\nType a clear description in the prompt field. For example:\nperson in the background\nred car\ntext sign on the wall\n\n✨ Step 3: Process\nTap Remove Object and our AI will intelligently remove the specified element.\n\n🎨 Step 4: Perfect Result\nThe AI automatically fills in the background naturally, preserving the scene's integrity.\n\n🎯 Pro Tips\nBe specific: 'red car' works better than just 'car'.\nDescribe location: 'person on the left' is clearer.\nWorks great for removing tourists, signs, or distractions.\nMultiple objects? Describe them all in one prompt.\nSimple, uncluttered backgrounds produce the best results."
            />

            {/* Examples Tab */}
            <ToolExamplesTab
              title="Remove Object Examples"
              examples={[
                {
                  id: '1',
                  title: 'Remove Person',
                  description: 'Clean removal of people from crowded scenes',
                  tags: ['Person', 'Crowd'],
                },
                {
                  id: '2',
                  title: 'Remove Vehicle',
                  description: 'Remove cars and vehicles from street scenes',
                  tags: ['Vehicle', 'Street'],
                },
                {
                  id: '3',
                  title: 'Remove Signs',
                  description: 'Remove text signs and advertisements from photos',
                  tags: ['Sign', 'Text'],
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
                icon="remove-circle-outline"
                whatDescription="Remove unwanted objects, people, or distractions from your photos with precision. Simply describe what to remove and our AI handles the rest."
                howDescription="Our AI identifies the object you specify and intelligently removes it while filling in the background naturally, preserving the scene's integrity."
                howItems={[
                  { text: 'Natural background filling' },
                  { text: 'Precise object detection' },
                  { text: 'Works with any object description' },
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
        visible={activeTopTab === 'tool' && !!(localImageUri && removalPrompt.trim())}
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
              Usually takes 5–10 seconds
            </Text>
          </View>
        }
      >
        <Button
          title="Remove Object"
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
  promptContainer: {
    padding: baseSpacing.base,
    borderRadius: 12,
    borderWidth: 1,
  },
  promptLabel: {
    // Dynamic styles applied inline
  },
  promptInput: {
    paddingHorizontal: baseSpacing.base,
    paddingVertical: baseSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
});

export default RemoveObjectScreen;

