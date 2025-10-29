import React, { useState, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Share, Alert, ScrollView, Text, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

const ResultScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const IMAGE_HEIGHT = height * 0.5;
  const navigation = useNavigation<NavigationProp<'Camera'>>();
  const route = useRoute<RouteProp<'Result'>>();
  const { originalImage, transformedImage, editMode } = route.params;
  const modeData = getEditMode(editMode);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const isFree = transformedImage.includes('base64');

  const saveImage = async () => {
    if (isSaving) return;
    
    try {
      haptic.light();
      setIsSaving(true);
      
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        haptic.error();
        Alert.alert('Permission Required', 'Please allow access to save photos');
        setIsSaving(false);
        return;
      }
      
      if (transformedImage.includes('base64')) {
        try {
          // Extract base64 data from data URI
          const base64Match = transformedImage.match(/data:image\/[^;]+;base64,(.+)/);
          if (!base64Match || !base64Match[1]) {
            throw new Error('Invalid base64 data URI');
          }
          
          // Save to temp file
          const tempUri = `${FileSystem.cacheDirectory}transformed_${Date.now()}.jpg`;
          await FileSystem.writeAsStringAsync(tempUri, base64Match[1], {
            encoding: 'base64'
          });
          
          await MediaLibrary.saveToLibraryAsync(tempUri);
          setHasSaved(true);
          haptic.success();
          
          // Clean up temp file
          try {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        } catch (fetchError) {
          try {
            await MediaLibrary.saveToLibraryAsync(transformedImage);
            setHasSaved(true);
            haptic.success();
          } catch (fallbackError) {
            throw new Error('Unable to save image');
          }
        }
      } else {
        await MediaLibrary.saveToLibraryAsync(transformedImage);
        setHasSaved(true);
        haptic.success();
      }
    } catch (error) {
      console.error('Error saving image:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to save image to gallery');
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      haptic.light();
      await Share.share({
        message: `Check out my ${modeData?.name || 'edited'} image!`,
        url: transformedImage,
      });
      haptic.success();
    } catch (error) {
      console.error('Error sharing image:', error);
      haptic.error();
    }
  };

  const upgradeApp = () => {
    haptic.medium();
    Alert.alert(
      'Upgrade to Pro',
      'Get unlimited transformations, no watermarks, and premium effects!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {
          haptic.success();
          console.log('Upgrade pressed');
        }},
      ]
    );
  };

  const createNew = () => {
    haptic.medium();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <Header
        title={modeData?.name || 'Result'}
        titleIcon={modeData?.icon}
        leftAction={{
          icon: 'chevron-back-outline',
          onPress: () => navigation.goBack(),
        }}
        rightAction={{
          icon: 'add-outline',
          onPress: createNew,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.base, paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Toggle Tabs */}
        <View style={[styles.toggleTabs, { backgroundColor: colors.surface, marginTop: spacing.md, marginBottom: spacing.base, borderRadius: 12, padding: 4 }]}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              !showOriginal && { backgroundColor: colors.primary },
              { borderRadius: 8, flex: 1, paddingVertical: 10 }
            ]}
            onPress={() => {
              if (showOriginal) {
                haptic.light();
                setShowOriginal(false);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.toggleTabText,
              { color: !showOriginal ? '#FFFFFF' : colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }
            ]}>
              Result
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              showOriginal && { backgroundColor: colors.primary },
              { borderRadius: 8, flex: 1, paddingVertical: 10 }
            ]}
            onPress={() => {
              if (!showOriginal) {
                haptic.light();
                setShowOriginal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.toggleTabText,
              { color: showOriginal ? '#FFFFFF' : colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }
            ]}>
              Original
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Image Card */}
        <Card style={[styles.imageCard, { backgroundColor: colors.surface, padding: spacing.sm, marginBottom: spacing.base }]}>
          <View style={[styles.imageWrapper, { backgroundColor: colors.backgroundSecondary, borderRadius: 12 }]}>
            <Image
              source={{ uri: showOriginal ? originalImage : transformedImage }}
              style={styles.resultImage}
              resizeMode="contain"
            />

            {isFree && !showOriginal && (
              <View style={[styles.watermark, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <Text style={[styles.watermarkText, { color: '#FFFFFF' }]}>FREE</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Upgrade Card */}
        {isFree && (
          <Card style={[styles.upgradeCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1, marginBottom: spacing.md }]}>
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeIcon}>✨</Text>
              <Text style={[styles.upgradeTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
                Unlock Premium
              </Text>
              <Text style={[styles.upgradeDescription, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                Unlimited transforms • No watermarks • HD quality
              </Text>
              <Button
                title="Upgrade - $4.99/mo"
                onPress={upgradeApp}
                variant="primary"
                size="large"
                style={{ marginTop: spacing.md, width: '100%' }}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons - Always visible at bottom */}
      <View style={[styles.actionContainer, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.base }]}>
        <View style={[styles.actionRow, { gap: spacing.md }]}>
          <Button
            title={hasSaved ? '✓ Saved' : 'Save'}
            onPress={saveImage}
            variant="secondary"
            size="large"
            loading={isSaving}
            disabled={hasSaved}
            style={{ flex: 1 }}
          />
          <Button
            title="Share"
            onPress={shareImage}
            variant="primary"
            size="large"
            style={{ flex: 1 }}
          />
        </View>
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
  scrollContent: {
    // Dynamic
  },
  actionContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    // borderTopColor set dynamically
  },
  toggleTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTabText: {
    textAlign: 'center',
  },
  imageCard: {
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    minHeight: height * 0.5,
    maxHeight: height * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
  },
  upgradeCard: {
    padding: 20,
  },
  upgradeContent: {
    alignItems: 'center',
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  upgradeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeDescription: {
    textAlign: 'center',
  },
});

export default ResultScreen;
