import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { IconButton } from '../components/IconButton';
import { MainHeader } from '../components/MainHeader';
import { useTheme, spacing as fallbackSpacing } from '../theme';
import { haptic } from '../utils/haptics';

const VideoSelectionScreen = () => {
  const { theme } = useTheme();
  const colors = theme?.colors || {} as any;
  const spacing = fallbackSpacing;
  const navigation = useNavigation<NavigationProp<'VideoPreview'>>();
  const route = useRoute();
  const { editMode } = (route.params as any) || {};
  const modeData = editMode ? getEditMode(editMode) : null;

  const pickFromGallery = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptic.success();
        const videoUri = result.assets[0].uri;
        handleVideoSelected(videoUri);
      }
    } catch (error) {
      console.error('Error picking video from gallery:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to select video from gallery');
    }
  };

  const handleVideoSelected = (videoUri: string) => {
    if (!editMode) {
      Alert.alert('Error', 'Edit mode not specified');
      return;
    }

    // Navigate to video preview/configuration screen
    navigation.navigate('VideoPreview', {
      videoUri,
      editMode,
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <MainHeader 
        title={modeData?.name || 'Select Video'} 
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.content, { padding: spacing.xl }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: spacing.md }]}>
          Select a Video
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: 16, marginBottom: spacing['2xl'] }]}>
          {modeData?.description || 'Choose a video to edit'}
        </Text>

        <TouchableOpacity
          style={[
            styles.optionButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginBottom: spacing.base,
            },
          ]}
          onPress={pickFromGallery}
          activeOpacity={0.7}
        >
          <IconButton
            icon="images-outline"
            size={32}
            color={colors.primary}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={[styles.optionTitle, { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: spacing.xs }]}>
            Choose from Library
          </Text>
          <Text style={[styles.optionDescription, { color: colors.textSecondary, fontSize: 14 }]}>
            Select a video from your photo library
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  optionButton: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    textAlign: 'center',
  },
  optionDescription: {
    textAlign: 'center',
  },
});

export default VideoSelectionScreen;



