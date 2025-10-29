import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';

const TerminalsScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <MainHeader title="Terminals" backgroundColor={theme.colors.backgroundSecondary} />
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your terminals will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.base,
    },
    subtitle: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
    },
  });

export default TerminalsScreen;

