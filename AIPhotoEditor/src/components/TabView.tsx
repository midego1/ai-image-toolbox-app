import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Tab {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string | number;
}

export interface TabViewProps {
  tabs: Tab[];
  children: React.ReactNode[];
  defaultTab?: string;
  containerStyle?: any;
  showIcons?: boolean;
  scrollable?: boolean;
}

export const TabView: React.FC<TabViewProps> = ({
  tabs,
  children,
  defaultTab,
  containerStyle,
  showIcons = true,
  scrollable = true,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabContainerRef = useRef<View>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(SCREEN_WIDTH);
  const indicatorAnim = useState(new Animated.Value(0))[0];

  // Validate that we have matching tabs and children
  if (tabs.length !== children.length) {
    console.warn(`TabView: Number of tabs (${tabs.length}) doesn't match number of children (${children.length})`);
  }

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  const activeChild = children[activeIndex] || null;

  const handleTabPress = (tabId: string, index: number) => {
    haptic.light();
    setActiveTab(tabId);
    
    // Animate indicator
    const tabWidth = tabContainerWidth / tabs.length;
    Animated.spring(indicatorAnim, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  };

  // Initialize indicator position
  React.useEffect(() => {
    if (activeIndex >= 0) {
      const tabWidth = tabContainerWidth / tabs.length;
      indicatorAnim.setValue(activeIndex * tabWidth);
    }
  }, [tabContainerWidth]);

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        style: styles.scrollContent,
        contentContainerStyle: { paddingBottom: spacing.lg },
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.content };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Tab Header */}
      <View style={[styles.tabHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View 
          ref={tabContainerRef}
          style={styles.tabList}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              setTabContainerWidth(width);
            }
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, { width: `${100 / tabs.length}%` }]}
                onPress={() => handleTabPress(tab.id, index)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  {showIcons && tab.icon && (
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
                          backgroundColor: isActive ? colors.primary : colors.border,
                          marginLeft: spacing.xs / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isActive ? '#FFFFFF' : colors.textSecondary,
                            fontSize: typography.scaled.xs,
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
        
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.primary,
              width: `${100 / tabs.length}%`,
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />
      </View>

      {/* Tab Content */}
      <ContentWrapper {...contentWrapperProps}>
        <View style={[styles.tabContentContainer, {
          backgroundColor: colors.surface,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          borderColor: colors.border,
        }]}>
          {activeChild}
        </View>
      </ContentWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabHeader: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
  },
  tabList: {
    flexDirection: 'row',
  },
  tab: {
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // Dynamic styles applied inline
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  scrollContent: {
    flex: 1,
    maxHeight: 600, // Adjust based on your needs
  },
  content: {
    // Non-scrollable content
  },
  tabContentContainer: {
    flex: 1,
  },
});

