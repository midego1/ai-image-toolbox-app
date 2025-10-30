import React, { useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

export interface InfoItem {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
}

interface AIToolInfoCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  whatTitle?: string;
  whatDescription: string | ReactNode;
  howTitle?: string;
  howDescription?: string | ReactNode;
  howItems?: InfoItem[];
  expandableWhat?: boolean;
  expandableHow?: boolean;
  defaultExpandedWhat?: boolean;
  defaultExpandedHow?: boolean;
}

export const AIToolInfoCard: React.FC<AIToolInfoCardProps> = ({
  icon = 'information-circle-outline',
  whatTitle = 'What This Does',
  whatDescription,
  howTitle = 'How It Works',
  howDescription,
  howItems = [],
  expandableWhat = true,
  expandableHow = true,
  defaultExpandedWhat = false,
  defaultExpandedHow = false,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const [expandedWhat, setExpandedWhat] = useState(defaultExpandedWhat);
  const [expandedHow, setExpandedHow] = useState(defaultExpandedHow);

  const toggleExpandWhat = () => {
    if (!expandableWhat) return;
    haptic.light();
    setExpandedWhat(prev => !prev);
  };

  const toggleExpandHow = () => {
    if (!expandableHow) return;
    haptic.light();
    setExpandedHow(prev => !prev);
  };

  return (
    <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
      }}>
        {/* What This Does Section */}
        <View style={{ padding: spacing.base }}>
          <TouchableOpacity
            disabled={!expandableWhat}
            onPress={toggleExpandWhat}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!!icon && (
                <Ionicons name={icon} size={22} color={colors.primary} />
              )}
              <Text style={{
                marginLeft: spacing.xs,
                color: colors.text,
                fontSize: typography.scaled.base,
                fontWeight: typography.weight.bold,
              }}>
                {whatTitle}
              </Text>
            </View>
            {expandableWhat && (
              <Ionicons
                name={expandedWhat ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          {(expandedWhat || !expandableWhat) && (
            typeof whatDescription === 'string' ? (
              <Text style={{
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                marginTop: spacing.sm,
                lineHeight: 22,
              }}>
                {whatDescription}
              </Text>
            ) : (
              <View style={{ marginTop: spacing.sm }}>{whatDescription}</View>
            )
          )}
        </View>

        {/* Divider between cards to visually connect them */}
        {(howDescription || howItems.length > 0) && (
          <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.base }} />
        )}

        {/* How It Works Section */}
        {(howDescription || howItems.length > 0) && (
          <View style={{ padding: spacing.base }}>
            <TouchableOpacity
              disabled={!expandableHow}
              onPress={toggleExpandHow}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                <Text style={{
                  marginLeft: spacing.xs,
                  color: colors.text,
                  fontSize: typography.scaled.base,
                  fontWeight: typography.weight.bold,
                }}>
                  {howTitle}
                </Text>
              </View>
              {expandableHow && (
                <Ionicons
                  name={expandedHow ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              )}
            </TouchableOpacity>

            {(expandedHow || !expandableHow) && (
              <View>
                {howDescription && (
                  typeof howDescription === 'string' ? (
                    <Text style={{
                      color: colors.textSecondary,
                      fontSize: typography.scaled.sm,
                      marginTop: spacing.sm,
                      lineHeight: 22,
                    }}>
                      {howDescription}
                    </Text>
                  ) : (
                    <View style={{ marginTop: spacing.sm }}>{howDescription}</View>
                  )
                )}

                {howItems.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    {howItems.map((item, idx) => (
                      <View key={`${item.text}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                        <Ionicons
                          name={item.icon || 'checkmark-circle-outline'}
                          size={16}
                          color={colors.textTertiary}
                        />
                        <Text style={{
                          marginLeft: spacing.xs,
                          color: colors.textSecondary,
                          fontSize: typography.scaled.sm,
                          lineHeight: 20,
                          flex: 1,
                        }}>
                          {item.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};


