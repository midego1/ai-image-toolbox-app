import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as spacingConstants } from '../theme/spacing';

/**
 * Option field definition for how to display a single config option
 */
export interface OptionField {
  /** Key in the config object */
  key: string;
  /** Display label (e.g., "Bit Depth") */
  label: string;
  /** Icon name from Ionicons */
  icon: string;
  /** Function to format the value for display */
  formatValue?: (value: any, config: any) => string;
  /** Short format for preview (e.g., "16-bit" instead of "16-bit (SNES)") */
  formatPreview?: (value: any, config: any) => string;
  /** Whether to show this in the preview (default: true) */
  showInPreview?: boolean;
  /** Nested fields that only show when parent condition is met */
  nestedFields?: OptionField[];
  /** Condition function to show nested fields (e.g., when backgroundStyle === 'scene') */
  nestedCondition?: (config: any) => boolean;
  /** Condition function to show this specific field (for nested fields) */
  showCondition?: (config: any) => boolean;
}

/**
 * Options schema that defines how to display all options
 */
export interface OptionsSchema {
  /** Fields to display */
  fields: OptionField[];
  /** Custom preview formatter that returns the preview string (overrides individual field previews) */
  customPreviewFormatter?: (config: any) => string;
}

export interface OptionsUsedProps {
  /** Config object from the result */
  config: any;
  /** Schema defining how to display the options */
  schema: OptionsSchema;
  /** Default expanded state (default: false) */
  defaultExpanded?: boolean;
  /** Container style override */
  containerStyle?: any;
}

/**
 * OptionsUsed - Reusable component for displaying AI tool options/config
 * 
 * Features:
 * - Collapsed preview showing key options (e.g., "16-bit • RPG • Scene")
 * - Expandable to show full details with icons
 * - Smooth animations
 * - Flexible schema-based configuration
 * - Works with any AI tool's config structure
 * 
 * Usage:
 * ```tsx
 * <OptionsUsed
 *   config={config}
 *   schema={{
 *     fields: [
 *       {
 *         key: 'bitDepth',
 *         label: 'Bit Depth',
 *         icon: 'grid-outline',
 *         formatValue: (v) => v === '8-bit' ? '8-bit (NES)' : '16-bit (SNES)',
 *         formatPreview: (v) => v === '8-bit' ? '8-bit' : '16-bit',
 *       },
 *       // ... more fields
 *     ],
 *   }}
 * />
 * ```
 */
export const OptionsUsed: React.FC<OptionsUsedProps> = ({
  config,
  schema,
  defaultExpanded = false,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Animate expand/collapse
  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, [isExpanded]);

  const toggle = () => {
    haptic.light();
    setIsExpanded(!isExpanded);
  };

  // Generate preview text
  const getPreviewText = (): string => {
    if (schema.customPreviewFormatter) {
      return schema.customPreviewFormatter(config);
    }

    const previewParts: string[] = [];
    for (const field of schema.fields) {
      if (field.showInPreview !== false && config[field.key]) {
        const value = config[field.key];
        const preview = field.formatPreview 
          ? field.formatPreview(value, config)
          : field.formatValue
          ? field.formatValue(value, config)
          : String(value);
        if (preview) {
          previewParts.push(preview);
        }
      }
    }
    return previewParts.join(' • ');
  };

  const previewText = getPreviewText();

  // Check if config has any valid options
  const hasOptions = schema.fields.some(field => config[field.key] != null);

  if (!hasOptions) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={[styles.header, {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: isExpanded ? 0 : 12,
          borderBottomRightRadius: isExpanded ? 0 : 12,
          borderWidth: 1,
          borderColor: colors.border,
        }]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings-outline" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, {
            color: colors.text,
            fontSize: typography.scaled.sm,
            fontWeight: typography.weight.semibold,
            marginLeft: spacing.xs,
          }]}>
            Options Used
          </Text>
          {!isExpanded && previewText && (
            <Text style={[styles.previewText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              marginLeft: spacing.xs,
            }]} numberOfLines={1}>
              {previewText}
            </Text>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={[styles.expandedContent, {
          backgroundColor: colors.background,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: colors.border,
        }]}>
          <View style={styles.fieldsContainer}>
            {schema.fields.map((field, index) => {
              const value = config[field.key];
              if (value == null) return null;

              const displayValue = field.formatValue
                ? field.formatValue(value, config)
                : String(value);

              return (
                <React.Fragment key={field.key}>
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldLabelContainer}>
                      <Ionicons name={field.icon as any} size={16} color={colors.textSecondary} />
                      <Text style={[styles.fieldLabel, {
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        marginLeft: spacing.xs,
                      }]}>
                        {field.label}
                      </Text>
                    </View>
                    <Text style={[styles.fieldValue, {
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {displayValue}
                    </Text>
                  </View>

                  {/* Nested fields */}
                  {field.nestedFields && field.nestedCondition && field.nestedCondition(config) && (
                    <View style={styles.nestedContainer}>
                      {field.nestedFields.map((nestedField) => {
                        const nestedValue = config[nestedField.key];
                        if (nestedValue == null) return null;
                        // Check if this nested field should be shown
                        if (nestedField.showCondition && !nestedField.showCondition(config)) {
                          return null;
                        }

                        const nestedDisplayValue = nestedField.formatValue
                          ? nestedField.formatValue(nestedValue, config)
                          : String(nestedValue);

                        return (
                          <View key={nestedField.key} style={[styles.fieldRow, styles.nestedFieldRow]}>
                            <Text style={[styles.nestedFieldLabel, {
                              color: colors.textSecondary,
                              fontSize: typography.scaled.xs,
                            }]}>
                              {nestedField.label}
                            </Text>
                            <Text style={[styles.nestedFieldValue, {
                              color: colors.text,
                              fontSize: typography.scaled.xs,
                              fontWeight: typography.weight.medium,
                            }]}>
                              {nestedDisplayValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacingConstants.sm,
  },
  header: {
    padding: spacingConstants.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  headerTitle: {
    // Dynamic styles applied inline
  },
  previewText: {
    // Dynamic styles applied inline
  },
  expandedContent: {
    padding: spacingConstants.sm,
    paddingTop: spacingConstants.xs,
    overflow: 'hidden',
  },
  fieldsContainer: {
    gap: spacingConstants.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldLabel: {
    // Dynamic styles applied inline
  },
  fieldValue: {
    // Dynamic styles applied inline
  },
  nestedContainer: {
    marginLeft: spacingConstants.md,
    marginTop: spacingConstants.xs,
  },
  nestedFieldRow: {
    marginTop: spacingConstants.xs,
  },
  nestedFieldLabel: {
    // Dynamic styles applied inline
  },
  nestedFieldValue: {
    // Dynamic styles applied inline
  },
});

