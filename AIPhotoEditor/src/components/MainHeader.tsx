import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface MainHeaderProps {
  title: string;
  showConnected?: boolean;
  backgroundColor?: string;
  onBack?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  title,
  showConnected = false,
  backgroundColor,
  onBack,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const bgColor = backgroundColor || colors.background;

  // Stylized H icon made of rectangles (blocky pixelated style)
  const HIcon = () => (
    <View style={styles.hIconContainer}>
      {/* Left vertical bar */}
      <View style={[styles.hRect, styles.hLeft, { backgroundColor: colors.text }]} />
      {/* Middle horizontal bar */}
      <View style={[styles.hRect, styles.hMiddle, { backgroundColor: colors.text }]} />
      {/* Right vertical bar */}
      <View style={[styles.hRect, styles.hRight, { backgroundColor: colors.text }]} />
    </View>
  );

  const handleBack = () => {
    haptic.light();
    onBack?.();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <View style={[styles.headerWrapper, { backgroundColor: bgColor }]}>
        <View style={styles.leftContainer}>
          {onBack ? (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <HIcon />
          )}
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={styles.connectedContainer}>
            {showConnected && (
              <>
                <View style={[styles.connectedDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.connectedText, { color: colors.success }]}>connected</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.rightContainer} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // backgroundColor will be set dynamically
  },
  headerWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  hIconContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    flexDirection: 'row',
  },
  hRect: {
    position: 'absolute',
  },
  hLeft: {
    left: 0,
    width: 6,
    height: 24,
  },
  hMiddle: {
    left: 9,
    top: 9,
    width: 6,
    height: 6,
  },
  hRight: {
    right: 0,
    width: 6,
    height: 24,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    height: 18,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectedText: {
    fontSize: 14,
  },
});

