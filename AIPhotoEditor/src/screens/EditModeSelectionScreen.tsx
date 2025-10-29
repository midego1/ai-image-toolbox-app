import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { EditMode, EditModeCategory, getEditMode, getAvailableEditModes } from '../constants/editModes';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';
import { haptic } from '../utils/haptics';
import { SubscriptionService } from '../services/subscriptionService';

const EditModeSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'Camera' | 'ImageSelection'>>();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const premium = await SubscriptionService.checkSubscriptionStatus();
    setIsPremium(premium);
  };

  // Determine which modes should use image selection (can work on existing images)
  // vs camera (optimized for taking new photos)
  const shouldUseImageSelection = (mode: EditMode): boolean => {
    // Modes that work on any existing image - use image selection
    const imageSelectionModes: EditMode[] = [
      EditMode.REMOVE_BACKGROUND,
      EditMode.REMOVE_OBJECT,
      EditMode.REPLACE_BACKGROUND,
      EditMode.FACE_ENHANCE,
      EditMode.ENHANCE,
      EditMode.FILTERS,
      EditMode.STYLE_TRANSFER,
      EditMode.TEXT_OVERLAY,
      EditMode.CROP_ROTATE,
    ];
    return imageSelectionModes.includes(mode);
  };

  const handleModeSelect = (mode: EditMode) => {
    haptic.medium();
    const modeData = getEditMode(mode);
    
    if (modeData?.isPremium && !isPremium) {
      haptic.error();
      // TODO: Show upgrade prompt
      return;
    }

    // For AI tools that work on existing images, use image selection screen
    // For TRANSFORM (which goes to GenreSelection), use camera for better flow
    if (shouldUseImageSelection(mode)) {
      navigation.navigate('ImageSelection', { editMode: mode });
    } else {
      // Navigate to camera with selected edit mode
      navigation.navigate('Camera', { editMode: mode });
    }
  };

  const availableModes = getAvailableEditModes(isPremium);
  
  // Group modes by category
  const modesByCategory = {
    [EditModeCategory.TRANSFORM]: availableModes.filter(m => m.category === EditModeCategory.TRANSFORM),
    [EditModeCategory.ENHANCE]: availableModes.filter(m => m.category === EditModeCategory.ENHANCE),
    [EditModeCategory.EDIT]: availableModes.filter(m => m.category === EditModeCategory.EDIT),
    [EditModeCategory.STYLIZE]: availableModes.filter(m => m.category === EditModeCategory.STYLIZE),
  };

  const renderModeCard = (modeData: typeof availableModes[0]) => (
    <Card
      key={modeData.id}
      onPress={() => handleModeSelect(modeData.id)}
      style={[styles.modeCard, { width: '48%', marginBottom: spacing.base, minHeight: 140 }]}
    >
      <Text style={[styles.modeIcon, { fontSize: 48, marginBottom: spacing.md }]}>{modeData.icon}</Text>
      <Text style={[styles.modeName, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold, marginBottom: spacing.xs }]}>{modeData.name}</Text>
      <Text style={[styles.modeDescription, { color: colors.textSecondary, fontSize: typography.scaled.sm, paddingHorizontal: spacing.xs }]}>{modeData.description}</Text>
      {modeData.isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 }]}>
          <Text style={[styles.premiumText, { color: colors.text, fontSize: typography.scaled.xs, fontWeight: typography.weight.bold }]}>PRO</Text>
        </View>
      )}
    </Card>
  );

  const renderCategory = (category: EditModeCategory, title: string) => {
    const modes = modesByCategory[category];
    if (modes.length === 0) return null;

    return (
      <View key={category} style={[styles.categorySection, { marginBottom: spacing.xl }]}>
        <Text style={[styles.categoryTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold, marginBottom: spacing.base, marginTop: spacing.md }]}>{title}</Text>
        <View style={styles.modeGrid}>
          {modes.map(renderModeCard)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <Header
        title="Choose Edit Mode"
        leftAction={{
          icon: 'chevron-back-outline',
          onPress: () => {
            // If we're in tabs, navigate to Home tab
            navigation.goBack();
          },
        }}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.base, paddingBottom: spacing['3xl'] + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderCategory(EditModeCategory.TRANSFORM, 'Transform')}
        {renderCategory(EditModeCategory.ENHANCE, 'Enhance')}
        {renderCategory(EditModeCategory.EDIT, 'Edit')}
        {renderCategory(EditModeCategory.STYLIZE, 'Stylize')}
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
    // Dynamic styles applied inline
  },
  categorySection: {
    // Dynamic styles applied inline
  },
  categoryTitle: {
    // Dynamic styles applied inline
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeCard: {
    alignItems: 'center',
    position: 'relative',
    // Dynamic styles applied inline
  },
  modeIcon: {
    // Dynamic styles applied inline
  },
  modeName: {
    textAlign: 'center',
    // Dynamic styles applied inline
  },
  modeDescription: {
    textAlign: 'center',
    // Dynamic styles applied inline
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    // Dynamic styles applied inline
  },
  premiumText: {
    // Dynamic styles applied inline
  },
});

export default EditModeSelectionScreen;

