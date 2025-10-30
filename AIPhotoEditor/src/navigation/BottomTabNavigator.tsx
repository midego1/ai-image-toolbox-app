import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { TabParamList } from '../types/navigation';
import { FeaturesStackNavigator } from './FeaturesStackNavigator';
import QuickCameraScreen from '../screens/QuickCameraScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { SettingsStackNavigator } from './SettingsStackNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: theme.colors.background,
        paddingBottom: Math.max(insets.bottom, 8),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
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

        // Match icons from the design
        // Features: grid/apps icon
        // Camera: camera icon
        // History: time/images icon
        // Settings: settings/cog icon
        let iconName: string;
        if (route.name === 'Features') {
          iconName = 'grid-outline';
        } else if (route.name === 'Camera') {
          iconName = 'camera-outline';
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
                styles.tabLabel,
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
  );
};

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      {...({ tabBar: (props: BottomTabBarProps) => <CustomTabBar {...props} /> } as any)}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Features"
        component={FeaturesStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Features',
        }}
      />
      <Tab.Screen
        name="Camera"
        component={QuickCameraScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Camera',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: 60,
    paddingTop: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
});
