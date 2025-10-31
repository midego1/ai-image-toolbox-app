import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { MainHeader } from './MainHeader';
import { NavigationProp } from '../types/navigation';
import { haptic } from '../utils/haptics';

interface AIToolHeaderProps {
  title: string;
  backgroundColor?: string;
  rightAction?: React.ReactNode;
  /**
   * Show back button instead of home button.
   * When true, shows back arrow and calls onBack or navigation.goBack().
   * When false (default), shows home icon and navigates to MainTabs.
   */
  showBackButton?: boolean;
  /**
   * Custom back handler. If provided, overrides default navigation behavior.
   * - If showBackButton is false: Overrides default home navigation
   * - If showBackButton is true: Overrides default goBack behavior
   */
  onBack?: () => void;
}

/**
 * Standard header component for AI tool screens
 * By default shows a home button that navigates to MainTabs (home)
 * Can show back button for special cases (e.g., ResultScreen from history)
 * Use this instead of MainHeader for consistency across AI tool screens
 */
export const AIToolHeader: React.FC<AIToolHeaderProps> = ({
  title,
  backgroundColor,
  rightAction,
  showBackButton = false,
  onBack,
}) => {
  const navigation = useNavigation<NavigationProp<'MainTabs'>>();

  const handleAction = () => {
    haptic.light();
    if (onBack) {
      onBack();
    } else if (showBackButton) {
      // Default back behavior
      navigation.goBack();
    } else {
      // Default home behavior: Use goBack() to preserve navigation stack and scroll position
      // This will naturally navigate back to FeaturesMain when in Features stack
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Last resort: reset to MainTabs only if we can't go back
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    }
  };

  return (
    <MainHeader
      title={title}
      backgroundColor={backgroundColor}
      useHomeButton={!showBackButton}
      onBack={handleAction}
      rightAction={rightAction}
    />
  );
};

