import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MainHeader } from '../components/MainHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { EditMode, getEditMode } from '../constants/editModes';

const VideoPreviewScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { videoUri, editMode } = (route.params as any) || {};
  const modeData = editMode ? getEditMode(editMode) : null;

  const [operation, setOperation] = useState<'remove_object' | 'add_object' | 'style_transfer' | 'relight'>('remove_object');
  const [prompt, setPrompt] = useState('');

  const handleProcess = () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video selected');
      return;
    }

    haptic.medium();
    // Navigate to processing screen
    navigation.navigate('VideoProcessing', {
      videoUri,
      editMode,
      config: {
        operation,
        prompt: prompt.trim() || undefined,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <MainHeader title={modeData?.name || 'Edit Video'} onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.base }]}
      >
        {videoUri && (
          <View style={[styles.videoContainer, { backgroundColor: colors.surface, marginBottom: spacing.base }]}>
            <View style={[styles.videoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.videoPlaceholderText, { color: colors.textSecondary }]}>
                Video Preview
              </Text>
              <Text style={[styles.videoUri, { color: colors.textTertiary, fontSize: typography.scaled.xs, marginTop: spacing.xs }]}>
                {videoUri.substring(0, 50)}...
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
            Editing Options
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginBottom: spacing.base }]}>
            Configure how you want to edit this video
          </Text>
          
          {/* Add editing controls here based on edit mode */}
          {/* For now, just show a placeholder */}
        </View>

        <Button
          title="Process Video"
          onPress={handleProcess}
          variant="primary"
          size="large"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
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
    paddingBottom: 100,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  videoUri: {
    // Dynamic styles applied inline
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  hint: {
    marginTop: 4,
  },
});

export default VideoPreviewScreen;

