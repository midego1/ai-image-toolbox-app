import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, Alert, ScrollView, Modal, Dimensions, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode } from '../constants/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { AIToolInfoCard } from '../components/AIToolInfoCard';
import { CaptureLibraryButtons } from '../components/CaptureLibraryButtons';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
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
import { ClothingType, ClothingTypeData, CLOTHING_TYPES, getAllClothingTypes } from '../constants/clothingTypes';
import { ClothingItem } from '../services/processors/virtualTryOnProcessor';

const { width } = Dimensions.get('window');

const VirtualTryOnSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollBottomPaddingWithButton = useScrollBottomPaddingWithActionButton();
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute();
  const { editMode, personImageUri: initialPersonImageUri } = (route.params as any) || {};

  const [personImageUri, setPersonImageUri] = useState<string | null>(initialPersonImageUri || null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pendingClothingUri, setPendingClothingUri] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'tool' | 'guide'>('tool');
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!personImageUri) {
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
  }, [personImageUri]);

  const copyImageToFileSystem = async (uri: string): Promise<string> => {
    if (uri.startsWith('file://')) {
      return uri;
    }

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { 
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      return manipulated.uri;
    } catch (error) {
      console.error('Error processing image URI:', error);
      throw error;
    }
  };

  const selectPersonImage = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptic.success();
        const fileUri = await copyImageToFileSystem(result.assets[0].uri);
        setPersonImageUri(fileUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const takePersonPhoto = () => {
    haptic.medium();
    (navigation as any).navigate('QuickCameraLocal', {
      editMode: editMode || EditMode.VIRTUAL_TRY_ON,
      onPhoto: (uri: string) => {
        copyImageToFileSystem(uri).then(setPersonImageUri);
      }
    });
  };

  const selectClothingImage = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptic.success();
        const fileUri = await copyImageToFileSystem(result.assets[0].uri);
        setPendingClothingUri(fileUri);
        setEditingItemIndex(null); // This is a new item, not editing
        setShowTypePicker(true);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const takeClothingPhoto = () => {
    haptic.medium();
    // Store that we're adding clothing, then navigate to camera
    // After camera returns, we'll need to handle the type selection
    // For now, navigate to camera and handle on return
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('QuickCameraLocal', { editMode });
    } else {
      navigation.navigate('QuickCameraLocal', { editMode });
    }
  };

  const handleTypeSelected = (type: ClothingType) => {
    if (!pendingClothingUri) return;

    haptic.success();
    
    if (editingItemIndex !== null) {
      // Updating existing item
      const updated = [...clothingItems];
      updated[editingItemIndex].type = type;
      setClothingItems(updated);
    } else {
      // Adding new item
      const newItem: ClothingItem = {
        uri: pendingClothingUri,
        type: type,
      };
      setClothingItems([...clothingItems, newItem]);
    }
    
    setPendingClothingUri(null);
    setEditingItemIndex(null);
    setShowTypePicker(false);
  };

  const removeClothingItem = (index: number) => {
    haptic.light();
    setClothingItems(clothingItems.filter((_, i) => i !== index));
  };


  const handleProcess = () => {
    if (!personImageUri) {
      Alert.alert('Missing Photo', 'Please select a photo of the person first');
      return;
    }
    if (clothingItems.length === 0) {
      Alert.alert('Missing Clothing', 'Please add at least one clothing item');
      return;
    }

    haptic.medium();
    const navParams = {
      imageUri: personImageUri,
      editMode: editMode || EditMode.VIRTUAL_TRY_ON,
      config: {
        clothingItems: clothingItems,
        fitStyle: 'natural',
        preserveBackground: true,
      }
    };
    navigation.navigate('Processing', navParams);
  };


  const renderClothingItem = (item: ClothingItem, index: number) => {
    const typeData = CLOTHING_TYPES[item.type];

    return (
      <View key={index} style={[styles.clothingItemContainer, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        padding: spacing.base,
        marginBottom: spacing.md,
      }]}>
        <View style={styles.clothingItemHeader}>
          <View style={styles.clothingItemInfo}>
            <Text style={[styles.clothingItemNumber, { color: colors.textSecondary }]}>
              #{index + 1}
            </Text>
            <View style={styles.clothingItemType}>
              <Text style={{ fontSize: 20, marginRight: spacing.xs }}>{typeData.icon}</Text>
              <Text style={[styles.clothingItemTypeText, { color: colors.text }]}>
                {typeData.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => removeClothingItem(index)}
            style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
          >
            <IconButton
              name="close"
              onPress={() => {}}
              size={20}
              color={colors.error}
              backgroundColor="transparent"
            />
          </TouchableOpacity>
        </View>

        <Image
          source={{ uri: item.uri }}
          style={[styles.clothingItemPreview, { borderColor: colors.border }]}
          resizeMode="cover"
        />

        <TouchableOpacity
          style={[styles.typeSelectButton, { 
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }]}
          onPress={() => {
            haptic.light();
            // Store the item being edited (don't remove it yet)
            setPendingClothingUri(item.uri);
            setEditingItemIndex(index);
            setShowTypePicker(true);
          }}
        >
          <Text style={[styles.typeSelectButtonText, { color: colors.primary }]}>
            Change Type
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTypePicker = () => {
    const clothingTypes = getAllClothingTypes();

    return (
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowTypePicker(false);
          setPendingClothingUri(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.background,
            padding: spacing.base,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: 18, fontWeight: '600' }]}>
                Select Clothing Type
              </Text>
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  setShowTypePicker(false);
                  setPendingClothingUri(null);
                  setEditingItemIndex(null); // Clear editing state when canceled
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.typeList}>
              {clothingTypes.map((typeData) => (
                <TouchableOpacity
                  key={typeData.id}
                  style={[styles.typeOption, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  onPress={() => handleTypeSelected(typeData.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 32, marginRight: spacing.base }}>{typeData.icon}</Text>
                  <View style={styles.typeOptionText}>
                    <Text style={[styles.typeOptionName, { color: colors.text }]}>
                      {typeData.name}
                    </Text>
                    <Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>
                      {typeData.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}>
      <AIToolHeader
        title="Virtual Try-On"
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
          // Add padding when button is visible to prevent content from being hidden
          // ActionButtonBar is ~100px (button 56px + padding + timing info) + safe area
          personImageUri && clothingItems.length > 0 
            // Use proper padding that accounts for floating tab bar
            // When button is visible, account for ActionButtonBar height
            ? { paddingBottom: scrollBottomPaddingWithButton } 
            : { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, alignItems: 'center' }}>
          {personImageUri ? (
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
                  source={{ uri: personImageUri }}
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
                  onCapture={takePersonPhoto}
                  onLibrary={selectPersonImage}
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
              time="12-18 sec"
              credits="0.8 credit"
              rating="4.6/5"
              usage="650 today"
            />
          </View>
        </View>

        {/* Information Card */}
        <AIToolInfoCard
          icon="shirt-outline"
          whatDescription="Try on clothing items virtually with realistic fit and appearance. Upload a person photo and one or more clothing items to see how they look together."
          howDescription="Our AI analyzes the person's pose and body structure, then accurately places clothing items with realistic fit, shadows, and lighting to create a natural try-on effect."
          howItems={[
            { text: 'Realistic fit and appearance' },
            { text: 'Multiple clothing items supported' },
            { text: 'Natural lighting and shadows' },
          ]}
        />

        {/* Clothing Selection Section */}
        <View style={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}>
          <View style={[styles.sectionContainer, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            padding: spacing.base,
            marginBottom: spacing.md,
          }]}>
            <View style={styles.clothingSectionHeader}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text,
                fontSize: 16,
                fontWeight: '600',
              }]}>
                👕 Clothing Items ({clothingItems.length})
              </Text>
            </View>

            {clothingItems.length > 0 && (
              <View style={styles.clothingItemsList}>
                {clothingItems.map((item, index) => renderClothingItem(item, index))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
                borderWidth: 2,
                borderStyle: 'dashed',
              }]}
              onPress={selectClothingImage}
              activeOpacity={0.7}
            >
              <IconButton
                name="add"
                onPress={() => {}}
                size={24}
                color={colors.primary}
                backgroundColor="transparent"
              />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                Add Clothing Item
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
              title="How to Use Virtual Try-On"
              content="Try on clothing virtually with realistic fit, shadows, and natural appearance. Perfect for shopping decisions.\n\n👤 Step 1: Select Person Photo\nChoose a full-body photo from your library or take a new one. Full-body photos provide the most accurate fitting.\n\n👕 Step 2: Add Clothing Items\nTap Add Clothing Item to upload clothing photos. You can add multiple items to try on complete outfits:\nShirts, T-shirts, Blouses\nPants, Jeans, Shorts\nDresses, Skirts\nJackets, Coats\nAccessories\n\n🏷️ Step 3: Specify Clothing Type\nFor each item, select the correct clothing type. This helps the AI place and fit items accurately.\n\n✨ Step 4: Generate Try-On\nTap Generate Try-On and wait 12-18 seconds. The AI will:\nAnalyze body pose and structure\nFit clothing with realistic wrinkles and draping\nApply natural lighting and shadows\nBlend everything seamlessly\n\n🎯 Pro Tips\nFull-body, front-facing photos work best.\nClear, well-lit photos improve accuracy.\nAdd multiple items to see complete outfit combinations.\nSpecify correct clothing type for best fit.\nWorks great for e-commerce and personal shopping.\nNatural lighting in photos produces more realistic results."
            />

            {/* Examples Tab */}
            <ToolExamplesTab
              title="Virtual Try-On Examples"
              examples={[
                {
                  id: '1',
                  title: 'Single Item Try-On',
                  description: 'Try on a shirt with realistic fit and appearance',
                  tags: ['Shirt', 'Single Item'],
                },
                {
                  id: '2',
                  title: 'Complete Outfit',
                  description: 'Try on multiple items for a complete outfit look',
                  tags: ['Outfit', 'Multiple Items'],
                },
                {
                  id: '3',
                  title: 'Casual Wear',
                  description: 'Try on casual clothing with natural fit',
                  tags: ['Casual', 'Natural'],
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
                icon="shirt-outline"
                whatDescription="Try on clothing items virtually with realistic fit and appearance. Upload a person photo and one or more clothing items to see how they look together."
                howDescription="Our AI analyzes the person's pose and body structure, then accurately places clothing items with realistic fit, shadows, and lighting to create a natural try-on effect."
                howItems={[
                  { text: 'Realistic fit and appearance' },
                  { text: 'Multiple clothing items supported' },
                  { text: 'Natural lighting and shadows' },
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
        visible={activeTopTab === 'tool' && !!(personImageUri && clothingItems.length > 0)}
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
              Usually takes 10–15 seconds
            </Text>
          </View>
        }
      >
        <Button
          title={`Generate Try-On${clothingItems.length > 1 ? ` (${clothingItems.length} items)` : ''}`}
          onPress={handleProcess}
          disabled={!personImageUri || clothingItems.length === 0}
          size="large"
          style={{ minHeight: 56, width: '100%' }}
        />
      </ActionButtonBar>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <TouchableOpacity
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          activeOpacity={1}
          onPress={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}>
                <Image
                  source={{ uri: personImageUri || '' }}
                  style={styles.previewModalImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      {renderTypePicker()}
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
  },
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
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
    height: (Dimensions.get('window').height * 0.65),
    borderRadius: 16,
  },
  sectionContainer: {
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {},
  clothingSectionHeader: {
    marginBottom: 12,
  },
  clothingItemsList: {
    marginBottom: 12,
  },
  clothingItemContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  clothingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clothingItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clothingItemNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  clothingItemType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clothingItemTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
  },
  clothingItemPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  typeSelectButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeSelectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {},
  infoText: {},
  buttonContainer: {},
  processButton: {
    minWidth: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {},
  typeList: {
    maxHeight: 400,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  typeOptionText: {
    flex: 1,
  },
  typeOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeOptionDesc: {
    fontSize: 13,
  },
});

export default VirtualTryOnSelectionScreen;
