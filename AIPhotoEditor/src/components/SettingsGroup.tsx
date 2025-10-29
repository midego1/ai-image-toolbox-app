import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface SettingsGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({ children, style }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  // Convert children to array for processing
  const childrenArray = React.Children.toArray(children);

  // Clone each child and add position props
  const enhancedChildren = React.Children.map(childrenArray, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as any, {
        isFirstInGroup: index === 0,
        isLastInGroup: index === childrenArray.length - 1,
        showSeparator: index < childrenArray.length - 1,
      });
    }
    return child;
  });

  // Match Features page categoryContainer exactly: just padding, no background/border/margin
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.base, // Match categoryContainer in Features
        },
        style
      ]}
    >
      {enhancedChildren}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles set dynamically
    // Ensure consistent layout for all children
    flexDirection: 'column',
  },
});

