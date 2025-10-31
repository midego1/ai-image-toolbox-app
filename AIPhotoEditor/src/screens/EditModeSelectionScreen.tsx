import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { EditMode, EditModeCategory, getEditMode, getAvailableEditModes, PHASE1_FEATURES } from '../constants/editModes';
import { AIToolHeader } from '../components/AIToolHeader';
import { Card } from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';
import { haptic } from '../utils/haptics';
import { SubscriptionService } from '../services/subscriptionService';
import { ImageProcessingService } from '../services/imageProcessingService';
 

const EditModeSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'ImageSelection'>>();
  const [isPremium, setIsPremium] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | EditModeCategory>('all');

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
      EditMode.PROFESSIONAL_HEADSHOTS,
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
      navigation.navigate('QuickCameraLocal', { editMode: mode });
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

  // Removed featured and recent

  // Filter + sort modes for "All"
  const filteredModes = useMemo(() => {
    let list = [...availableModes];
    if (selectedCategory !== 'all') {
      list = list.filter(m => m.category === selectedCategory);
    }
    return list;
  }, [availableModes, selectedCategory]);

  const renderModeCard = (modeData: typeof availableModes[0], index: number, totalCount: number) => {
    const isNotWorking = !ImageProcessingService.isModeSupported(modeData.id);
    const isDisabled = (modeData.isPremium && !isPremium) || isNotWorking;
    const isLeftColumn = index % 2 === 0;
    const itemsInLastRow = totalCount % 2 === 0 ? 2 : 1;
    const isLastRow = index >= totalCount - itemsInLastRow;
    
    return (
      <Card
        key={modeData.id}
        onPress={() => handleModeSelect(modeData.id)}
        disabled={isDisabled}
        style={[
          styles.modeCard,
          {
            width: '50%',
            minHeight: 140,
            marginBottom: 0,
            borderRightWidth: isLeftColumn ? StyleSheet.hairlineWidth : 0,
            borderBottomWidth: !isLastRow ? StyleSheet.hairlineWidth : 0,
            borderColor: colors.border,
            borderRadius: 0,
          },
        ]}
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
  };

  const renderCategory = (category: EditModeCategory, title: string) => {
    const modes = modesByCategory[category];
    if (modes.length === 0) return null;

    return (
      <View key={category} style={[styles.categorySection, { marginBottom: spacing.xl }]}>
        <Text style={[styles.categoryTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold, marginBottom: spacing.base, marginTop: spacing.md }]}>{title}</Text>
        <View style={[styles.modeGridContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.modeGrid}>
            {modes.map((m, idx) => renderModeCard(m, idx, modes.length))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <AIToolHeader title="Styles" />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.base, paddingBottom: spacing['3xl'] + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: spacing.xs, gap: spacing.sm }}
          style={{ marginBottom: spacing.base }}
        >
          {(['all', EditModeCategory.TRANSFORM, EditModeCategory.ENHANCE, EditModeCategory.EDIT, EditModeCategory.STYLIZE] as const).map(cat => {
            const isActive = selectedCategory === cat;
            const label = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
            return (
              <TouchableOpacity
                key={String(cat)}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.xs,
                  borderRadius: 16,
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  marginRight: spacing.sm,
                }}
              >
                <Text style={{ color: isActive ? colors.text : colors.textSecondary, fontWeight: typography.weight.medium }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        

        {/* Removed featured and recent sections */}

        {/* All (filtered) */}
        <View style={[styles.categorySection, { marginBottom: spacing['2xl'] }]}>
          <Text style={[styles.categoryTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold, marginBottom: spacing.base, marginTop: spacing.md }]}>All</Text>
          <View style={[styles.modeGridContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.modeGrid}>
              {filteredModes.map((m, idx) => renderModeCard(m, idx, filteredModes.length))}
            </View>
          </View>
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
    justifyContent: 'flex-start',
  },
  modeGridContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
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

