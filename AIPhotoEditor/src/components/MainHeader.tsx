import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { SubscriptionService } from '../services/subscriptionService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';

interface MainHeaderProps {
  title: string;
  showConnected?: boolean;
  backgroundColor?: string;
  onBack?: () => void;
  useHomeButton?: boolean; // If true, shows home icon instead of back arrow
  rightAction?: React.ReactNode; // Optional right action button (replaces credits display)
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  title,
  showConnected = false,
  backgroundColor,
  onBack,
  useHomeButton = false,
  rightAction,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const bgColor = backgroundColor || colors.background;
  const navigation = useNavigation<NavigationProp<'Subscription'>>();
  
  // Credits state
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    tier: string;
    creditsAllocated: number;
    creditsRemaining: number;
  }>({
    tier: 'free',
    creditsAllocated: 3,
    creditsRemaining: 3,
  });
  
  const handleCreditsPress = () => {
    haptic.light();
    navigation.navigate('Subscription');
  };
  
  const loadCredits = async () => {
    const info = await SubscriptionService.getSubscriptionInfo();
    setSubscriptionInfo({
      tier: info.tier,
      creditsAllocated: info.creditsAllocated,
      creditsRemaining: info.creditsRemaining,
    });
  };
  
  useEffect(() => {
    loadCredits();
  }, []);
  
  // Refresh credits when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCredits();
    }, [])
  );

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

  const isSubscribed = subscriptionInfo.tier !== 'free';
  const creditsRemaining = subscriptionInfo.creditsRemaining;
  const creditsAllocated = subscriptionInfo.creditsAllocated;
  
  // Format credits display (handle fractional credits)
  const formatCredits = (credits: number): string => {
    if (credits % 1 === 0) {
      return credits.toFixed(0);
    }
    return credits.toFixed(1);
  };
  
  const creditsText = isSubscribed
    ? `${formatCredits(creditsRemaining)}/${creditsAllocated}`
    : `${formatCredits(creditsRemaining)} left`;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <View style={[styles.headerWrapper, { backgroundColor: bgColor }]}>
        <View style={styles.leftContainer}>
          {onBack ? (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
              <Ionicons 
                name={useHomeButton ? "home-outline" : "arrow-back"} 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          ) : (
            <HIcon />
          )}
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.centerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {showConnected && (
              <View style={styles.connectedContainer}>
                <View style={[styles.connectedDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.connectedText, { color: colors.success }]}>connected</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.rightContainer}>
          {rightAction ? (
            rightAction
          ) : (
            <TouchableOpacity 
              style={[styles.creditsContainer, { backgroundColor: colors.surface }]}
              onPress={handleCreditsPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.creditsText, { color: colors.text, fontSize: typography.scaled.sm }]}>
                {creditsText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingVertical: 8,
    alignItems: 'center',
    minHeight: 44,
    position: 'relative',
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
    zIndex: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
    zIndex: 1,
    minWidth: 140,
  },
  creditsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsText: {
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  hIconContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

