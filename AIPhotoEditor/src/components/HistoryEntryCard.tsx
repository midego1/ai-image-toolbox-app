import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { HistoryEntry } from '../services/historyService';

const { width } = Dimensions.get('window');
const DEFAULT_ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onPress: (entry: HistoryEntry) => void;
  onDelete?: (entry: HistoryEntry) => void;
  size?: number; // Optional size override, defaults to calculated size
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const HistoryEntryCard: React.FC<HistoryEntryCardProps> = ({
  entry,
  onPress,
  onDelete,
  size,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const itemSize = size || DEFAULT_ITEM_SIZE;

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={({ pressed }) => [
        styles.entryContainer,
        {
          width: itemSize,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.imageWrapper, { 
        width: itemSize,
        height: itemSize,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }]}>
        <Image
          source={{ uri: entry.transformedImageUri }}
          style={styles.entryImage}
          resizeMode="cover"
          onError={(error) => {
            console.warn('[HistoryEntryCard] Failed to load image:', entry.id, error.nativeEvent.error);
          }}
        />
        
        {/* Edit mode badge at bottom - centered */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
            <Text style={[styles.badgeIcon, { fontSize: 14, color: '#FFFFFF' }]}>
              {entry.editModeIcon}
            </Text>
            <Text 
              style={[styles.badgeText, { 
                color: '#FFFFFF', 
                fontSize: typography.scaled.xs,
                fontWeight: typography.weight.medium,
              }]} 
              numberOfLines={1}
            >
              {entry.editModeName}
            </Text>
          </View>
        </View>

        {/* Timestamp at top */}
        <View style={[styles.timestampBadge, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
          <Text 
            style={[styles.timestampText, { 
              color: '#FFFFFF', 
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.medium,
            }]}
          >
            {formatTimestamp(entry.timestamp)}
          </Text>
        </View>

        {/* Delete button (optional) */}
        {onDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(entry);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  entryContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  entryImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeText: {
    // Removed flex: 1 to allow text to center naturally
  },
  timestampBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timestampText: {
    // Styles applied inline
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 2,
  },
});

