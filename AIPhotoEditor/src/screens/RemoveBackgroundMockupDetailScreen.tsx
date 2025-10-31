import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import { AIToolHeader } from '../components/AIToolHeader';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { SettingsNavigationProp } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';

const RemoveBackgroundMockupDetailScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<SettingsNavigationProp<'RemoveBackgroundMockupDetail'>>();
  const route = useRoute<RouteProp<{ RemoveBackgroundMockupDetail: { imageUri?: string } }, 'RemoveBackgroundMockupDetail'>>();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const scrollViewRef = useRef<ScrollView>(null);
  const params = (route.params as any) || {};
  const initialImageUri = params.imageUri || null;
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(initialImageUri);

  // Handle Take Photo button
  const handleTakePhoto = () => {
    haptic.medium();
    // Simulate selecting a mock image after a short delay
    setTimeout(() => {
      setSelectedImageUri('mockup://photo-from-camera');
      haptic.success();
      // Scroll to top of detail view to show the image
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }, 300);
  };

  // Handle Choose from Library button
  const handleChooseFromLibrary = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        haptic.success();
        // Scroll to top of detail view to show the image
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select image from library');
    }
  };

  // Handle processing (Remove Background action)
  const handleProcessRemoveBG = () => {
    if (!selectedImageUri) {
      Alert.alert('No Image', 'Please select an image first using Take Photo or Choose from Library');
      return;
    }
    haptic.medium();
    Alert.alert(
      'Processing Mockup',
      'In the real app, this would process the image and remove the background. For this mockup, we\'re showing the concept.',
      [{ text: 'OK', onPress: () => haptic.light() }]
    );
  };

  // Handle back navigation - return to ToolMockup with scroll position
  const handleBack = () => {
    // Store scroll positions in a way that ToolMockupScreen can access them
    // We'll use navigation params or a shared ref/context approach
    // For now, navigation.goBack() should work and useFocusEffect will restore
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={[]}>
      <AIToolHeader
        title="Remove Background"
        backgroundColor={colors.backgroundSecondary}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.scaled.xl, fontWeight: typography.weight.bold }]}>
            Remove Background
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginTop: spacing.xs }]}>
            Remove backgrounds with AI-powered precision. Perfect for product photos and portraits.
          </Text>
        </View>

        {/* Hero Section - Before/After Preview */}
        <View style={[styles.detailHero, { backgroundColor: colors.backgroundSecondary }]}>
          {selectedImageUri ? (
            <View style={styles.beforeAfterLarge}>
              <View style={[styles.beforeLarge, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                {selectedImageUri.startsWith('mockup://') ? (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="image" size={40} color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: spacing.xs, fontSize: typography.scaled.sm }}>Selected Photo</Text>
                  </View>
                ) : (
                  <Image source={{ uri: selectedImageUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                )}
                <View style={{ 
                  position: 'absolute', 
                  top: 8, 
                  left: 8, 
                  backgroundColor: 'rgba(0, 0, 0, 0.75)', 
                  paddingHorizontal: 10, 
                  paddingVertical: 6, 
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>BEFORE</Text>
                </View>
              </View>
              <View style={styles.sliderLine}>
                <Ionicons name="arrow-forward" size={24} color={colors.primary} />
              </View>
              <View style={[styles.afterLarge, { backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary + '40' }]}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
                  <Text style={{ color: colors.text, marginTop: spacing.xs, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }}>Background Removed</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: 4 }}>Transparent PNG</Text>
                </View>
                <View style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  backgroundColor: colors.primary, 
                  paddingHorizontal: 10, 
                  paddingVertical: 6, 
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }}>AFTER</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.beforeAfterLarge}>
              <View style={[styles.beforeLarge, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="camera-outline" size={48} color={colors.primary + '60'} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, fontSize: typography.scaled.sm }}>Select a photo to see preview</Text>
              </View>
              <View style={styles.sliderLine}>
                <Ionicons name="arrow-forward" size={24} color={colors.primary + '60'} />
              </View>
              <View style={[styles.afterLarge, { backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="cut-outline" size={48} color={colors.primary + '60'} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, fontSize: typography.scaled.sm }}>Background removed</Text>
              </View>
            </View>
          )}
          {selectedImageUri && (
            <Text style={[styles.sliderHint, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: spacing.sm }]}>
              ← Drag to compare →
            </Text>
          )}
        </View>

        {/* Stats Bar */}
        <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
          <View style={[styles.statsBar, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            borderRadius: 12,
            borderWidth: 1,
          }]}>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
                2.5 sec
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={16} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
                0.1 credit
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
                4.9/5
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.scaled.xs }]}>
                2.3k today
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: spacing.base }}>
          {selectedImageUri ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
              onPress={handleProcessRemoveBG}
            >
              <Ionicons name="cut" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.sm }}>
                Remove Background
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[selectedImageUri ? styles.secondaryButton : styles.primaryButton, { backgroundColor: selectedImageUri ? colors.backgroundSecondary : colors.primary, borderColor: selectedImageUri ? colors.border : undefined }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color={selectedImageUri ? colors.text : "#FFFFFF"} />
            <Text style={{ color: selectedImageUri ? colors.text : '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginLeft: spacing.sm }}>
              Take Photo Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: spacing.sm }]}
            onPress={handleChooseFromLibrary}
          >
            <Ionicons name="images" size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold, marginLeft: spacing.sm }}>
              Choose from Library
            </Text>
          </TouchableOpacity>
          {selectedImageUri && (
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surface + '80', borderColor: colors.border, marginTop: spacing.sm }]}
              onPress={() => {
                setSelectedImageUri(null);
                haptic.light();
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium, marginLeft: spacing.sm }}>
                Clear Selection
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingTop: 16,
  },
  title: {
    // Dynamic
  },
  subtitle: {
    // Dynamic
  },
  detailHero: {
    padding: 20,
    marginBottom: 16,
  },
  beforeAfterLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  beforeLarge: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sliderLine: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  afterLarge: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sliderHint: {
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    // Dynamic
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default RemoveBackgroundMockupDetailScreen;

