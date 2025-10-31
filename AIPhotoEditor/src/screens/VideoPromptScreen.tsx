import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MainHeader } from '../components/MainHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { EditMode, getEditMode } from '../constants/editModes';

const VideoPromptScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { editMode } = (route.params as any) || {};
  const modeData = editMode ? getEditMode(editMode) : null;

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const handleGenerate = () => {
    if (!prompt.trim()) {
      haptic.error();
      Alert.alert('Error', 'Please enter a prompt to generate the video');
      return;
    }

    if (!editMode) {
      Alert.alert('Error', 'Edit mode not specified');
      return;
    }

    haptic.medium();
    // Navigate to processing screen
    navigation.navigate('VideoProcessing', {
      editMode,
      config: {
        prompt: prompt.trim(),
        duration,
        aspectRatio,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <MainHeader title={modeData?.name || 'Create Video'} onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.base }]}
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
            Video Prompt
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                fontSize: typography.scaled.base,
              },
            ]}
            placeholder="Describe the video you want to create..."
            placeholderTextColor={colors.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
            Be specific about the scene, action, and style for best results.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
            Duration (seconds)
          </Text>
          <View style={styles.durationRow}>
            {[3, 5, 10].map((dur) => (
              <TouchableOpacity
                key={dur}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: duration === dur ? colors.primary : colors.surface,
                    borderColor: duration === dur ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  haptic.light();
                  setDuration(dur);
                }}
              >
                <Text
                  style={[
                    styles.durationText,
                    {
                      color: duration === dur ? colors.text : colors.textSecondary,
                      fontSize: typography.scaled.base,
                      fontWeight: typography.weight.medium,
                    },
                  ]}
                >
                  {dur}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
            Aspect Ratio
          </Text>
          <View style={styles.aspectRow}>
            {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
              <TouchableOpacity
                key={ratio}
                style={[
                  styles.aspectButton,
                  {
                    backgroundColor: aspectRatio === ratio ? colors.primary : colors.surface,
                    borderColor: aspectRatio === ratio ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  haptic.light();
                  setAspectRatio(ratio);
                }}
              >
                <Text
                  style={[
                    styles.aspectText,
                    {
                      color: aspectRatio === ratio ? colors.text : colors.textSecondary,
                      fontSize: typography.scaled.base,
                      fontWeight: typography.weight.medium,
                    },
                  ]}
                >
                  {ratio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Generate Video"
          onPress={handleGenerate}
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
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    marginBottom: 8,
  },
  hint: {
    marginTop: 4,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    // Dynamic styles applied inline
  },
  aspectRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aspectButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectText: {
    // Dynamic styles applied inline
  },
});

export default VideoPromptScreen;

