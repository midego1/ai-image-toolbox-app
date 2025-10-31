import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

export interface TopTab {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string; // Optional badge text (e.g., count)
}

export interface TopTabSwitcherProps {
  tabs: TopTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  containerStyle?: any;
}

export const TopTabSwitcher: React.FC<TopTabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabId: string) => {
    haptic.light();
    onTabChange(tabId);
  };

  // Calculate top position - below header (assuming header is ~56-60px)
  // Add some spacing between header and floating tab bar
  const HEADER_HEIGHT = 60;
  const TOP_OFFSET = 12;

  return (
    <View 
      style={[
        styles.container,
        {
          top: HEADER_HEIGHT + insets.top + TOP_OFFSET,
          left: 16,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: 20,
          shadowColor: '#000',
        },
        containerStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderRadius: 20 }]}>
        <View style={styles.tabList}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  {tab.icon && (
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={isActive ? colors.primary : colors.textSecondary}
                      style={{ marginRight: spacing.xs / 2 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        fontWeight: isActive ? typography.weight.semibold : typography.weight.medium,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.badge && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isActive ? colors.primary : colors.textSecondary,
                          marginLeft: spacing.xs / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: '#FFFFFF',
                            fontSize: typography.scaled.xs,
                            fontWeight: typography.weight.bold,
                          },
                        ]}
                      >
                        {tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    minHeight: 48,
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tabList: {
    flexDirection: 'row',
    flex: 1,
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
  tabLabel: {
    // Dynamic styles applied inline
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // Dynamic styles applied inline
  },
});

