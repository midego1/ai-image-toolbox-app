import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

export type MediaType = 'image' | 'video';

/**
 * Configuration for a media type tab
 */
export interface MediaTypeTabConfig<T extends string = MediaType> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Props for the MediaTypeTabs component
 * @template T - The string literal type for tabs (defaults to MediaType)
 */
export interface MediaTypeTabsProps<T extends string = MediaType> {
  /** The currently active tab */
  activeTab: T;
  /** Callback when a tab is selected */
  onTabChange: (tab: T) => void;
  /** Optional container style for the outer wrapper */
  containerStyle?: ViewStyle;
  /** Optional style for the tabs container */
  tabsContainerStyle?: ViewStyle;
  /** Whether to show icons. Defaults to true */
  showIcons?: boolean;
  /** Custom tab configurations. Defaults to Image and Video */
  tabs?: MediaTypeTabConfig<T>[];
  /** Optional right action element to display next to the tabs */
  rightAction?: React.ReactNode;
}

const DEFAULT_TABS: MediaTypeTabConfig[] = [
  { id: 'image', label: 'Image', icon: 'images-outline' },
  { id: 'video', label: 'Video', icon: 'videocam-outline' },
];

/**
 * Reusable MediaTypeTabs component that displays image/video tabs
 * with consistent styling matching TopTabSwitcher.
 * 
 * Made generic to support any string literal type for tabs (e.g., 'credits' | 'subscriptions')
 * 
 * @example
 * ```tsx
 * // Basic usage (Image/Video)
 * <MediaTypeTabs 
 *   activeTab={activeMediaType} 
 *   onTabChange={setActiveMediaType} 
 * />
 * 
 * // With custom tabs (Credits/Subscriptions)
 * <MediaTypeTabs<'credits' | 'subscriptions'>
 *   activeTab="credits"
 *   onTabChange={setActiveTab}
 *   tabs={[
 *     { id: 'credits', label: 'Credits', icon: 'wallet-outline' },
 *     { id: 'subscriptions', label: 'Subscriptions', icon: 'card-outline' }
 *   ]}
 * />
 * ```
 */
export const MediaTypeTabs = <T extends string = MediaType>({
  activeTab,
  onTabChange,
  containerStyle,
  tabsContainerStyle,
  showIcons = true,
  tabs = DEFAULT_TABS as MediaTypeTabConfig<T>[],
  rightAction,
}: MediaTypeTabsProps<T>) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleTabPress = (tab: T) => {
    if (tab !== activeTab) {
      haptic.light();
      onTabChange(tab);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.backgroundSecondary, paddingHorizontal: spacing.base },
      containerStyle,
    ]}>
      <View style={[
        styles.tabsContainer,
        { 
          backgroundColor: colors.surface, 
          borderRadius: 20,
          justifyContent: rightAction ? 'flex-start' : 'space-around',
        },
        tabsContainerStyle,
      ]}>
        {tabs.map((tabConfig) => {
          const isActive = tabConfig.id === activeTab;
          return (
            <TouchableOpacity
              key={tabConfig.id}
              style={styles.tab}
              onPress={() => handleTabPress(tabConfig.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {showIcons && (
                  <Ionicons
                    name={tabConfig.icon}
                    size={18}
                    color={isActive ? colors.primary : colors.textSecondary}
                    style={{ marginRight: spacing.xs / 2 }}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? colors.primary : colors.textSecondary,
                      fontSize: typography.scaled.sm,
                      fontWeight: isActive ? typography.weight.semibold : typography.weight.medium,
                      lineHeight: typography.scaled.sm * 1.3,
                      textAlignVertical: 'center',
                    },
                  ]}
                >
                  {tabConfig.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {rightAction && (
          <View style={styles.rightAction}>
            {rightAction}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingTop: baseSpacing.sm + 2,
    paddingBottom: baseSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    // Dynamic styles applied inline
  },
  rightAction: {
    marginLeft: baseSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

