/**
 * Example: Custom Floating Tab Bar for Native Bottom Tab Navigator
 * 
 * This shows how someone might implement a floating tab bar that works
 * alongside the native navigator. However, note that you'd need to:
 * 1. Hide the native tab bar (tabBarStyle: { display: 'none' })
 * 2. Use this component as an overlay
 * 3. Manage navigation state manually
 * 
 * This is complex and generally NOT recommended - the regular navigator
 * is simpler and achieves the same result.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export const NativeFloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          bottom: 20 + Math.max(insets.bottom - 8, 0), // Account for safe area
          left: 16,
          right: 16,
          backgroundColor: theme.colors.background,
          borderRadius: 20,
          shadowColor: '#000',
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.background,
            borderRadius: 20,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Icon mapping
          let iconName: string;
          if (route.name === 'Features') {
            iconName = 'grid-outline';
          } else if (route.name === 'History') {
            iconName = 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <Ionicons
                name={iconName as any}
                size={24}
                color={isFocused ? theme.colors.text : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? theme.colors.text : theme.colors.textSecondary,
                    fontSize: theme.typography.scaled.xs,
                  },
                ]}
              >
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    paddingHorizontal: 0,
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
    minHeight: 52,
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  label: {
    marginTop: 2,
    fontWeight: '500',
  },
});




