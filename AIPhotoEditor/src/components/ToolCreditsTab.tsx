import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';
import { formatCreditCost, formatCreditCostText } from '../utils/creditCost';

interface CreditPackRow {
  pack: string;
  credits: number;
  price: string;
  operationsPerDollar: string;
}

interface ToolCreditsTabProps {
  creditCost: number;
  processingTime: string;
  title?: string;
  /** Variable costs for tools like ENHANCE (e.g., different costs for different configs) */
  variableCosts?: Array<{ label: string; cost: number }>;
}

export const ToolCreditsTab: React.FC<ToolCreditsTabProps> = ({
  creditCost,
  processingTime,
  title = 'Cost Information',
  variableCosts,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  // Calculate operations per dollar for each credit pack
  const creditPacks: CreditPackRow[] = [
    {
      pack: 'Small Pack',
      credits: 10,
      price: '$0.99',
      operationsPerDollar: (10 / 0.99 / creditCost).toFixed(1),
    },
    {
      pack: 'Medium Pack',
      credits: 25,
      price: '$2.19',
      operationsPerDollar: (25 / 2.19 / creditCost).toFixed(1),
    },
    {
      pack: 'Large Pack',
      credits: 50,
      price: '$4.19',
      operationsPerDollar: (50 / 4.19 / creditCost).toFixed(1),
    },
    {
      pack: 'Mega Pack',
      credits: 100,
      price: '$7.99',
      operationsPerDollar: (100 / 7.99 / creditCost).toFixed(1),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.base }}>
        {/* Header */}
        <View style={[styles.headerSection, {
          backgroundColor: colors.primary + '10',
          borderColor: colors.primary + '30',
          borderRadius: 12,
          padding: spacing.base,
          marginBottom: spacing.lg,
        }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="diamond" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, {
            color: colors.text,
            fontSize: typography.scaled.lg,
            fontWeight: typography.weight.bold,
          }]}>
            {title}
          </Text>
        </View>

        {/* Cost Summary */}
        <View style={[styles.summaryCard, {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: spacing.base,
          marginBottom: spacing.lg,
        }]}>
          <Text style={[styles.summaryTitle, {
            color: colors.textSecondary,
            fontSize: typography.scaled.sm,
            fontWeight: typography.weight.semibold,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: spacing.base,
          }]}>
            Cost Summary
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="diamond-outline" size={18} color={colors.primary} />
              <Text style={[styles.summaryLabel, {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
              }]}>
                {variableCosts ? 'Base Cost' : 'Cost'}
              </Text>
            </View>
            <Text style={[styles.summaryValue, {
              color: colors.text,
              fontSize: typography.scaled.base,
              fontWeight: typography.weight.bold,
            }]}>
              {formatCreditCostText(creditCost)}
            </Text>
          </View>

          {/* Variable Costs Section - Show if variableCosts provided */}
          {variableCosts && variableCosts.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="list-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, {
                    color: colors.textSecondary,
                    fontSize: typography.scaled.sm,
                  }]}>
                    Cost Breakdown
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: spacing.xs, marginLeft: spacing.lg }}>
                {variableCosts.map((variable, index) => (
                  <View key={index} style={[styles.summaryRow, { marginBottom: spacing.xs }]}>
                    <Text style={[styles.summaryLabel, {
                      color: colors.textSecondary,
                      fontSize: typography.scaled.xs,
                      flex: 1,
                    }]}>
                      {variable.label}
                    </Text>
                    <Text style={[styles.summaryValue, {
                      color: colors.text,
                      fontSize: typography.scaled.sm,
                      fontWeight: typography.weight.semibold,
                    }]}>
                      {formatCreditCostText(variable.cost)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="flash-outline" size={18} color={colors.primary} />
              <Text style={[styles.summaryLabel, {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
              }]}>
                Processing Time
              </Text>
            </View>
            <Text style={[styles.summaryValue, {
              color: colors.text,
              fontSize: typography.scaled.base,
              fontWeight: typography.weight.bold,
            }]}>
              {processingTime}
            </Text>
          </View>
        </View>

        {/* Value Per Dollar Table */}
        <View style={[styles.tableCard, {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: spacing.base,
          marginBottom: spacing.base,
        }]}>
          <Text style={[styles.tableTitle, {
            color: colors.textSecondary,
            fontSize: typography.scaled.sm,
            fontWeight: typography.weight.semibold,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: spacing.base,
          }]}>
            Operations Per Dollar
          </Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 8,
            padding: spacing.sm,
            marginBottom: spacing.xs,
          }]}>
            <Text style={[styles.tableHeaderText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.semibold,
              flex: 2,
            }]}>
              Credit Pack
            </Text>
            <Text style={[styles.tableHeaderText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.semibold,
              flex: 1,
              textAlign: 'center',
            }]}>
              Credits
            </Text>
            <Text style={[styles.tableHeaderText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.semibold,
              flex: 1,
              textAlign: 'center',
            }]}>
              Price
            </Text>
            <Text style={[styles.tableHeaderText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.xs,
              fontWeight: typography.weight.semibold,
              flex: 1.5,
              textAlign: 'right',
            }]}>
              Per $1
            </Text>
          </View>

          {/* Table Rows */}
          {creditPacks.map((pack, index) => {
            const isPopular = pack.pack === 'Medium Pack';
            return (
              <View
                key={pack.pack}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: isPopular ? colors.primary + '08' : 'transparent',
                    borderWidth: isPopular ? 1 : 0,
                    borderColor: colors.primary + '30',
                    borderRadius: 8,
                    padding: spacing.sm,
                    marginBottom: index < creditPacks.length - 1 ? spacing.xs : 0,
                  },
                ]}
              >
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.tableCell, {
                    color: colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: isPopular ? typography.weight.semibold : typography.weight.medium,
                  }]}>
                    {pack.pack}
                  </Text>
                  {isPopular && (
                    <View style={[styles.popularBadge, {
                      backgroundColor: colors.primary,
                      marginLeft: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }]}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: typography.weight.bold,
                      }}>
                        POPULAR
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tableCell, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  flex: 1,
                  textAlign: 'center',
                }]}>
                  {pack.credits}
                </Text>
                <Text style={[styles.tableCell, {
                  color: colors.text,
                  fontSize: typography.scaled.sm,
                  flex: 1,
                  textAlign: 'center',
                }]}>
                  {pack.price}
                </Text>
                <Text style={[styles.tableCell, {
                  color: colors.primary,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.bold,
                  flex: 1.5,
                  textAlign: 'right',
                }]}>
                  {pack.operationsPerDollar}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Info Footer */}
        <View style={[styles.infoFooter, {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          padding: spacing.base,
          marginBottom: spacing.base,
        }]}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={[styles.infoText, {
              color: colors.textSecondary,
              fontSize: typography.scaled.sm,
              flex: 1,
              lineHeight: 20,
            }]}>
              Costs never expire and can be used across all tools. Larger packs offer better value per dollar.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: baseSpacing.sm,
  },
  headerTitle: {
    textAlign: 'center',
  },
  summaryCard: {
    // Dynamic styles
  },
  summaryTitle: {
    // Dynamic styles
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: baseSpacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.xs,
  },
  summaryLabel: {
    // Dynamic styles
  },
  summaryValue: {
    // Dynamic styles
  },
  divider: {
    height: 1,
    marginVertical: baseSpacing.xs,
  },
  tableCard: {
    // Dynamic styles
  },
  tableTitle: {
    // Dynamic styles
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderText: {
    // Dynamic styles
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCell: {
    // Dynamic styles
  },
  popularBadge: {
    // Dynamic styles
  },
  infoFooter: {
    // Dynamic styles
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: baseSpacing.sm,
  },
  infoText: {
    // Dynamic styles
  },
});
