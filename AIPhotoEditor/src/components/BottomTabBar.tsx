import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { NavigationProp } from '../types/navigation';
import { haptic } from '../utils/haptics';

type TabName = 'Features' | 'History' | 'Settings';

interface BottomTabBarProps {
  activeTab?: TabName;
  showForStack?: boolean; // If true, navigate using stack navigation instead of tab navigation
}

export const BottomTabBar: React.FC<BottomTabBarProps> = React.memo(({ activeTab, showForStack = false }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<'MainTabs'>>();
  
  // Get current route name and check parent tab navigator state
  const currentRouteName = useNavigationState(state => {
    if (!state) return null;
    const route = state.routes[state.index];
    return route.name;
  });
  
  // Try to get the active tab from parent tab navigator
  const parentTabState = useNavigationState(state => {
    if (!state) return null;
    // Find MainTabs in the navigation state
    const mainTabsRoute = state.routes.find(r => r.name === 'MainTabs');
    if (mainTabsRoute && 'state' in mainTabsRoute && mainTabsRoute.state) {
      const tabState = mainTabsRoute.state as any;
      if (tabState.routes && tabState.index !== undefined) {
        const activeTabRoute = tabState.routes[tabState.index];
        return activeTabRoute?.name as TabName | null;
      }
    }
    return null;
  });

  const tabs: { name: TabName; label: string; icon: string }[] = [
    { name: 'Features', label: 'Features', icon: 'grid-outline' },
    { name: 'History', label: 'History', icon: 'time-outline' },
    { name: 'Settings', label: 'Settings', icon: 'settings-outline' },
  ];

  const handleTabPress = (tabName: TabName) => {
    haptic.light();
    
    if (showForStack) {
      // When in a stack screen, navigate to MainTabs with the specific tab screen
      const parentNav = navigation.getParent();
      const nav = parentNav || navigation;
      
      // If clicking Settings tab while in AppearanceSettings, just go back
      // Otherwise navigate to MainTabs with the selected tab
      if (tabName === 'Settings') {
        // Go back to Settings screen (which will pop AppearanceSettings from stack)
        nav.goBack();
      } else {
        // Use CommonActions to navigate reliably to MainTabs with a specific tab
        // This ensures the tab navigator shows the correct screen
        nav.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: tabName,
            },
          } as any)
        );
      }
    } else {
      // If we're in a tab navigator context, this shouldn't be called
      // but handle it gracefully
      console.warn('BottomTabBar: showForStack should be true when used in stack screens');
    }
  };

  // For stack screens, we determine the active tab based on navigation state
  // Check if we're coming from a tab screen
  const getIsActive = (tabName: TabName) => {
    if (showForStack) {
      // First, try to get from parent tab navigator state
      if (parentTabState) {
        return parentTabState === tabName;
      }
      // Fallback: If we're on AppearanceSettings, Subscription, or LanguageSelection, 
      // we should highlight Settings tab (since these come from Settings)
      if (currentRouteName === 'AppearanceSettings' || 
          currentRouteName === 'Subscription' || 
          currentRouteName === 'LanguageSelection') {
        return tabName === 'Settings';
      }
      // If we're on Result, we might want to highlight History tab
      if (currentRouteName === 'Result') {
        // Could highlight History or leave it unhighlighted
        // Leaving unhighlighted for now - user can manually navigate
      }
      return false;
    }
    return activeTab === tabName;
  };

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: theme.colors.background,
        paddingBottom: Math.max(insets.bottom, 4),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = getIsActive(tab.name);

        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
            onPress={() => handleTabPress(tab.name)}
            style={styles.tabItem}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? theme.colors.text : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: theme.typography.scaled.xs,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: 52,
    paddingTop: 6,
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
    paddingVertical: 2,
  },
  tabLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
});

