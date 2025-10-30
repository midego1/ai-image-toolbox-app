import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { NavigationProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { IconButton } from '../components/IconButton';
import { useTheme, spacing as fallbackSpacing } from '../theme';
import { haptic } from '../utils/haptics';

const ImageSelectionScreen = () => {
  const { theme } = useTheme();
  const colors = theme?.colors || {} as any;
  const spacing = fallbackSpacing;
  const navigation = useNavigation<NavigationProp<'GenreSelection' | 'Processing' | 'Camera' | 'ImagePreview' | 'VirtualTryOnSelection'>>();
  const route = useRoute();
  const { editMode, preselectedGenreId } = (route.params as any) || {};
  const modeData = editMode ? getEditMode(editMode) : null;

  const copyImageToFileSystem = async (uri: string): Promise<string> => {
    if (uri.startsWith('file://')) {
      return uri;
    }

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      return manipulated.uri;
    } catch (error) {
      console.error('Error processing image URI:', error);
      throw error;
    }
  };

  const pickFromGallery = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptic.success();
        const fileUri = await copyImageToFileSystem(result.assets[0].uri);
        // Navigate to preview screen instead of processing instantly
        handleImageSelected(fileUri);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const takePhoto = () => {
    haptic.medium();
    // Navigate to camera with the edit mode, then return here with the image
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Camera', { editMode });
    } else {
      navigation.navigate('Camera', { editMode });
    }
  };

  const handleImageSelected = (imageUri: string) => {
    if (!editMode) {
      Alert.alert('Error', 'Edit mode not specified');
      return;
    }

    const parentNav = navigation.getParent();

    if (editMode === EditMode.VIRTUAL_TRY_ON) {
      // Virtual try-on goes to VirtualTryOnSelection for dual image selection
      // Pass the selected image as personImageUri if user selected from gallery
      if (parentNav) {
        parentNav.navigate('VirtualTryOnSelection', { editMode, personImageUri: imageUri });
      } else {
        navigation.navigate('VirtualTryOnSelection', { editMode, personImageUri: imageUri });
      }
    } else if (editMode === EditMode.TRANSFORM) {
      // Transform goes to GenreSelection for style selection
      if (parentNav) {
        (parentNav as any).navigate('GenreSelection', { imageUri, editMode, preselectedGenreId } as any);
      } else {
        (navigation as any).navigate('GenreSelection', { imageUri, editMode, preselectedGenreId } as any);
      }
    } else {
      // Other AI tools go to ImagePreview screen
      if (parentNav) {
        parentNav.navigate('ImagePreview', { imageUri, editMode });
      } else {
        navigation.navigate('ImagePreview', { imageUri, editMode });
      }
    }
  };

  // When taking a photo, camera will handle navigation to ImagePreview (for AI tools) or GenreSelection (for Transform)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          name="home-outline"
          onPress={() => {
            haptic.light();
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
          }}
          size={26}
          color={colors.text}
          backgroundColor="transparent"
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {modeData ? modeData.name : 'Select Image'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.placeholderContainer}>
          <View style={[styles.placeholderIcon, { backgroundColor: colors.surface }]}>
            <IconButton
              name="image-outline"
              onPress={() => {}}
              size={64}
              color={colors.textSecondary}
              backgroundColor="transparent"
            />
          </View>
          <Text style={[styles.placeholderText, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
            {modeData?.description || 'Select an image to process'}
          </Text>
        </View>

        <View style={styles.selectionButtons}>
          <TouchableOpacity
            style={[styles.selectionButton, { backgroundColor: colors.surface }]}
            onPress={pickFromGallery}
            activeOpacity={0.7}
          >
            <IconButton
              name="images"
              onPress={() => {}}
              size={28}
              color={colors.primary}
              backgroundColor="transparent"
            />
            <Text style={[styles.selectionButtonText, { color: colors.text }]}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectionButton, { backgroundColor: colors.surface }]}
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <IconButton
              name="camera"
              onPress={() => {}}
              size={28}
              color={colors.primary}
              backgroundColor="transparent"
            />
            <Text style={[styles.selectionButtonText, { color: colors.text }]}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  placeholderIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
  },
  selectionButtons: {
    gap: 12,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageSelectionScreen;
