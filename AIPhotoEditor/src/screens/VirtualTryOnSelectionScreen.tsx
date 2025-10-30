import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { NavigationProp } from '../types/navigation';
import { EditMode } from '../constants/editModes';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { useTheme, spacing as fallbackSpacing } from '../theme';
import { haptic } from '../utils/haptics';
import { ClothingType, ClothingTypeData, CLOTHING_TYPES, getAllClothingTypes } from '../constants/clothingTypes';
import { ClothingItem } from '../services/processors/virtualTryOnProcessor';

const VirtualTryOnSelectionScreen = () => {
  const { theme } = useTheme();
  const colors = theme?.colors || {} as any;
  const spacing = fallbackSpacing;
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute();
  const { editMode, personImageUri: initialPersonImageUri } = (route.params as any) || {};

  const [personImageUri, setPersonImageUri] = useState<string | null>(initialPersonImageUri || null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pendingClothingUri, setPendingClothingUri] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null); // Track which item is being edited

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
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Camera', { editMode });
    } else {
      navigation.navigate('Camera', { editMode });
    }
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
      parentNav.navigate('Camera', { editMode });
    } else {
      navigation.navigate('Camera', { editMode });
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
    const parentNav = navigation.getParent();
    const navParams = {
      imageUri: personImageUri,
      editMode: editMode || EditMode.VIRTUAL_TRY_ON,
      config: {
        clothingItems: clothingItems,
        fitStyle: 'natural',
        preserveBackground: true,
      }
    };

    if (parentNav) {
      parentNav.navigate('Processing', navParams);
    } else {
      navigation.navigate('Processing', navParams);
    }
  };

  const renderPersonSelector = () => {
    const hasImage = !!personImageUri;

    return (
      <View style={[styles.sectionContainer, { 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        padding: spacing.base,
        marginBottom: spacing.md,
      }]}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          marginBottom: spacing.xs,
        }]}>
          👤 Person Photo
        </Text>
        <Text style={[styles.sectionDescription, { 
          color: colors.textSecondary,
          fontSize: 14,
          marginBottom: spacing.md,
        }]}>
          Select a clear, front-facing photo of the person
        </Text>

        {hasImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: personImageUri }}
              style={[styles.imagePreview, { borderColor: colors.border }]}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={[styles.changeButton, { backgroundColor: colors.primary }]}
              onPress={selectPersonImage}
              activeOpacity={0.7}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectorButtons}>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={selectPersonImage}
              activeOpacity={0.7}
            >
              <IconButton
                name="images"
                onPress={() => {}}
                size={24}
                color={colors.primary}
                backgroundColor="transparent"
              />
              <Text style={[styles.selectorButtonText, { color: colors.text }]}>
                Choose from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={takePersonPhoto}
              activeOpacity={0.7}
            >
              <IconButton
                name="camera"
                onPress={() => {}}
                size={24}
                color={colors.primary}
                backgroundColor="transparent"
              />
              <Text style={[styles.selectorButtonText, { color: colors.text }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Header
        title="Virtual Try-On"
        leftAction={{
          icon: 'home-outline',
          onPress: () => {
            haptic.light();
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
          },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { padding: spacing.base }]}>
          <Text style={[styles.introText, { 
            color: colors.textSecondary,
            fontSize: 14,
            marginBottom: spacing.lg,
            lineHeight: 20,
            textAlign: 'center',
          }]}>
            Select a photo of the person and add clothing items to create a realistic virtual try-on.
          </Text>

          {renderPersonSelector()}

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

          {personImageUri && clothingItems.length > 0 && (
            <View style={[styles.infoBox, { 
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
              padding: spacing.md,
              marginTop: spacing.md,
              borderRadius: 12,
              borderWidth: 1,
            }]}>
              <Text style={[styles.infoText, { 
                color: colors.text,
                fontSize: 13,
                lineHeight: 18,
              }]}>
                💡 Tip: For best results, use clear photos with good lighting. 
                {clothingItems.length > 1 && ' Multiple items will be combined into a complete outfit.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderTypePicker()}

      <View style={[styles.buttonContainer, { 
        padding: spacing.base,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }]}>
        <Button
          title={`Generate Try-On${clothingItems.length > 1 ? ` (${clothingItems.length} items)` : ''}`}
          onPress={handleProcess}
          disabled={!personImageUri || clothingItems.length === 0}
          style={styles.processButton}
        />
      </View>
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
  content: {
    flex: 1,
  },
  introText: {},
  sectionContainer: {
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {},
  sectionDescription: {},
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  changeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  selectorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
