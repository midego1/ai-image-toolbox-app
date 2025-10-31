import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

export type MediaType = 'image' | 'video';

interface MediaTypeTabsProps {
  activeTab: MediaType;
  onTabChange: (tab: MediaType) => void;
}

export const MediaTypeTabs: React.FC<MediaTypeTabsProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleTabPress = (tab: MediaType) => {
    if (tab !== activeTab) {
      haptic.light();
      onTabChange(tab);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingHorizontal: spacing.base }]}>
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderRadius: 20 }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('image')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name="images-outline"
              size={18}
              color={activeTab === 'image' ? colors.primary : colors.textSecondary}
              style={{ marginRight: spacing.xs / 2 }}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'image' ? colors.primary : colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: activeTab === 'image' ? typography.weight.semibold : typography.weight.medium,
                },
              ]}
            >
              Image
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('video')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name="videocam-outline"
              size={18}
              color={activeTab === 'video' ? colors.primary : colors.textSecondary}
              style={{ marginRight: spacing.xs / 2 }}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'video' ? colors.primary : colors.textSecondary,
                  fontSize: typography.scaled.sm,
                  fontWeight: activeTab === 'video' ? typography.weight.semibold : typography.weight.medium,
                },
              ]}
            >
              Video
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
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
  tabText: {
    // Dynamic styles applied inline
  },
});

