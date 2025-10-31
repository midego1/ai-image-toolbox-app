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

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden' as const,
  };

  const sectionHeaderStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: spacing.sm,
  };

  return (
    <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base }}>
      {/* What This Does Card */}
      <View style={cardStyle}>
        <View style={{ padding: spacing.lg }}>
          <TouchableOpacity
            disabled={!expandableWhat}
            onPress={toggleExpandWhat}
            activeOpacity={0.7}
            style={sectionHeaderStyle}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {!!icon && (
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Ionicons name={icon} size={22} color={colors.primary} />
                </View>
              )}
              <Text style={{
                color: colors.text,
                fontSize: typography.scaled.base,
                fontWeight: typography.weight.bold,
                flex: 1,
              }}>
                {whatTitle}
              </Text>
            </View>
            {expandableWhat && (
              <Ionicons
                name={expandedWhat ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          {(expandedWhat || !expandableWhat) && (
            typeof whatDescription === 'string' ? (
              <Text style={{
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                lineHeight: 24,
                marginTop: spacing.xs,
              }}>
                {whatDescription}
              </Text>
            ) : (
              <View style={{ marginTop: spacing.xs }}>{whatDescription}</View>
            )
          )}
        </View>
      </View>

      {/* How It Works Card */}
      {(howDescription || howItems.length > 0) && (
        <View style={[cardStyle, { marginTop: spacing.md }]}>
          <View style={{ padding: spacing.lg }}>
            <TouchableOpacity
              disabled={!expandableHow}
              onPress={toggleExpandHow}
              activeOpacity={0.7}
              style={sectionHeaderStyle}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
                </View>
                <Text style={{
                  color: colors.text,
                  fontSize: typography.scaled.base,
                  fontWeight: typography.weight.bold,
                  flex: 1,
                }}>
                  {howTitle}
                </Text>
              </View>
              {expandableHow && (
                <Ionicons
                  name={expandedHow ? 'chevron-up' : 'chevron-down'}
                  size={22}
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
                      lineHeight: 24,
                      marginTop: spacing.xs,
                      marginBottom: howItems.length > 0 ? spacing.md : 0,
                    }}>
                      {howDescription}
                    </Text>
                  ) : (
                    <View style={{ marginTop: spacing.xs, marginBottom: howItems.length > 0 ? spacing.md : 0 }}>{howDescription}</View>
                  )
                )}

                {howItems.length > 0 && (
                  <View style={{ marginTop: spacing.xs }}>
                    {howItems.map((item, idx) => (
                      <View 
                        key={`${item.text}-${idx}`} 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'flex-start', 
                          marginBottom: idx < howItems.length - 1 ? spacing.sm : 0,
                          paddingLeft: spacing.xs,
                        }}
                      >
                        <View style={{ marginTop: 2 }}>
                          <Ionicons
                            name={item.icon || 'checkmark-circle'}
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        <Text style={{
                          marginLeft: spacing.sm,
                          color: colors.textSecondary,
                          fontSize: typography.scaled.sm,
                          lineHeight: 22,
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
        </View>
      )}
    </View>
  );
};


