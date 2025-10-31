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
export interface MediaTypeTabConfig {
  id: MediaType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Props for the MediaTypeTabs component
 */
export interface MediaTypeTabsProps {
  /** The currently active tab */
  activeTab: MediaType;
  /** Callback when a tab is selected */
  onTabChange: (tab: MediaType) => void;
  /** Optional container style for the outer wrapper */
  containerStyle?: ViewStyle;
  /** Optional style for the tabs container */
  tabsContainerStyle?: ViewStyle;
  /** Whether to show icons. Defaults to true */
  showIcons?: boolean;
  /** Custom tab configurations. Defaults to Image and Video */
  tabs?: MediaTypeTabConfig[];
}

const DEFAULT_TABS: MediaTypeTabConfig[] = [
  { id: 'image', label: 'Image', icon: 'images-outline' },
  { id: 'video', label: 'Video', icon: 'videocam-outline' },
];

/**
 * Reusable MediaTypeTabs component that displays image/video tabs
 * with consistent styling matching TopTabSwitcher.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <MediaTypeTabs 
 *   activeTab={activeMediaType} 
 *   onTabChange={setActiveMediaType} 
 * />
 * 
 * // With custom styling
 * <MediaTypeTabs
 *   activeTab={activeMediaType}
 *   onTabChange={setActiveMediaType}
 *   containerStyle={{ paddingVertical: 16 }}
 *   showIcons={false}
 * />
 * ```
 */
export const MediaTypeTabs: React.FC<MediaTypeTabsProps> = ({
  activeTab,
  onTabChange,
  containerStyle,
  tabsContainerStyle,
  showIcons = true,
  tabs = DEFAULT_TABS,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleTabPress = (tab: MediaType) => {
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
        { backgroundColor: colors.surface, borderRadius: 20 },
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
                    },
                  ]}
                >
                  {tabConfig.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingVertical: baseSpacing.sm,
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
});

