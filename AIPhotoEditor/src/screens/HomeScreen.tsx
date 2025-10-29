import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { EditMode, getEditMode, PHASE1_FEATURES } from '../constants/editModes';
import { Button } from '../components/Button';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'EditModeSelection' | 'Settings'>>();

  const handleStartCreating = () => {
    haptic.medium();
    navigation.navigate('EditModeSelection');
  };

  const handleQuickAction = (mode: EditMode) => {
    haptic.medium();
    navigation.navigate('Camera', { editMode: mode });
  };

  const featuredModes = PHASE1_FEATURES.slice(0, 4); // Show first 4 featured modes

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { padding: spacing.xl, paddingTop: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.scaled['3xl'], fontWeight: typography.weight.bold, marginBottom: spacing.xs }]}>AI Photo Editor</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.scaled.base, marginBottom: spacing.lg }]}>Transform Photos with AI</Text>
        <View style={styles.subscriptionContainer}>
          <SubscriptionStatus />
        </View>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing['3xl'] + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary CTA */}
        <View style={[styles.ctaSection, { paddingHorizontal: spacing.xl, marginBottom: spacing.xl }]}>
          <Button
            title="🎨 Start Creating"
            onPress={handleStartCreating}
            variant="primary"
            size="large"
            style={{ marginBottom: spacing.base }}
            fullWidth
          />
          <Button
            title="Browse All Styles →"
            onPress={handleStartCreating}
            variant="secondary"
            size="medium"
            fullWidth
          />
        </View>

        {/* Featured Edit Modes */}
        <View style={[styles.featuredSection, { marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold, marginBottom: spacing.base, paddingHorizontal: spacing.xl }]}>Featured Styles</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.featuredScrollContent, { paddingHorizontal: spacing.xl, paddingRight: spacing.xl * 2 }]}
          >
            {featuredModes.map((modeId) => {
              const mode = getEditMode(modeId);
              if (!mode) return null;
              
              return (
                <TouchableOpacity
                  key={modeId}
                  style={[styles.featuredCard, {
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    marginRight: spacing.base,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }]}
                  onPress={() => handleQuickAction(modeId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.featuredIcon, { fontSize: 48, marginBottom: spacing.sm }]}>{mode.icon}</Text>
                  <Text style={[styles.featuredName, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>{mode.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    // Dynamic styles
  },
  subtitle: {
    // Dynamic styles
  },
  subscriptionContainer: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Will be calculated dynamically
  },
  ctaSection: {
    // Dynamic styles
  },
  featuredSection: {
    // Dynamic styles
  },
  sectionTitle: {
    // Dynamic styles
  },
  featuredScrollContent: {
    paddingHorizontal: 24,
    paddingRight: 48,
  },
  featuredCard: {
    width: 120,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    // Dynamic styles
  },
  featuredIcon: {
    // Dynamic styles
  },
  featuredName: {
    textAlign: 'center',
    // Dynamic styles
  },
});

export default HomeScreen;

