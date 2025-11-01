import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { revenueCatService } from '../services/revenueCatService';
import { MainHeader } from '../components/MainHeader';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { Ionicons } from '@expo/vector-icons';
import type { Offering, PurchasesPackage } from 'react-native-purchases';

interface PackageGroup {
  tier: 'basic' | 'pro' | 'premium';
  packages: PurchasesPackage[];
}

const RevenueCatPackagesTestScreen = () => {
  const { theme } = useTheme();
  const scrollBottomPadding = useScrollBottomPadding();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme, scrollBottomPadding), [theme, scrollBottomPadding]);

  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>([]);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if RevenueCat is initialized
      if (!revenueCatService.isReady()) {
        const initialized = await revenueCatService.initialize();
        if (!initialized) {
          // Check if we're in Expo Go (common issue)
          const isExpoGo = typeof (global as any).__DEV__ !== 'undefined' && 
                          !(global as any).__EXPO_NATIVE__;
          
          if (isExpoGo) {
            setError(
              'RevenueCat requires a development build and cannot run in Expo Go.\n\n' +
              'To test RevenueCat:\n' +
              '1. Create a development build: npx expo run:ios\n' +
              '2. Or use EAS Build: eas build --profile development --platform ios\n\n' +
              'See https://docs.expo.dev/development/introduction/ for more info.'
            );
          } else {
            setError('RevenueCat not initialized. Please check your API key configuration.');
          }
          setLoading(false);
          return;
        }
      }

      // Fetch offerings
      const currentOffering = await revenueCatService.getOfferings();
      
      if (!currentOffering) {
        setError('No offerings found. Please configure offerings in RevenueCat dashboard.');
        setLoading(false);
        return;
      }

      setOffering(currentOffering);

      // Organize packages by tier
      const packages = currentOffering.availablePackages;
      const grouped: PackageGroup[] = [
        { tier: 'basic', packages: [] },
        { tier: 'pro', packages: [] },
        { tier: 'premium', packages: [] },
      ];

      packages.forEach((pkg) => {
        const productId = pkg.storeProduct.identifier.toLowerCase();
        
        if (productId.includes('basic')) {
          grouped[0].packages.push(pkg);
        } else if (productId.includes('pro')) {
          grouped[1].packages.push(pkg);
        } else if (productId.includes('premium')) {
          grouped[2].packages.push(pkg);
        }
      });

      // Sort packages within each tier by duration
      grouped.forEach((group) => {
        group.packages.sort((a, b) => {
          const aId = a.storeProduct.identifier.toLowerCase();
          const bId = b.storeProduct.identifier.toLowerCase();
          
          // Weekly first, then monthly, then 3months
          if (aId.includes('weekly') && !bId.includes('weekly')) return -1;
          if (!aId.includes('weekly') && bId.includes('weekly')) return 1;
          if (aId.includes('1month') && bId.includes('3months')) return -1;
          if (aId.includes('3months') && bId.includes('1month')) return 1;
          return 0;
        });
      });

      // Filter out empty groups
      setPackageGroups(grouped.filter(g => g.packages.length > 0));
      
    } catch (err: any) {
      console.error('Error loading packages:', err);
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (productId: string): string => {
    const id = productId.toLowerCase();
    if (id.includes('weekly')) return 'Weekly';
    if (id.includes('1month')) return 'Monthly';
    if (id.includes('3months')) return '3 Months';
    return 'Unknown';
  };

  const getTierEmoji = (tier: string): string => {
    switch (tier) {
      case 'basic': return '⭐';
      case 'pro': return '💎';
      case 'premium': return '👑';
      default: return '📦';
    }
  };

  const handlePackagePress = (pkg: PurchasesPackage) => {
    Alert.alert(
      'Package Details',
      `Product ID: ${pkg.storeProduct.identifier}\n` +
      `Price: ${pkg.storeProduct.localizedPrice}\n` +
      `Duration: ${getDurationLabel(pkg.storeProduct.identifier)}\n` +
      `Package Type: ${pkg.packageType}\n` +
      `Tier: ${pkg.storeProduct.identifier.includes('basic') ? 'Basic' : pkg.storeProduct.identifier.includes('pro') ? 'Pro' : 'Premium'}`,
      [{ text: 'OK' }]
    );
  };

  const renderPackage = (pkg: PurchasesPackage, index: number, isLast: boolean) => {
    const duration = getDurationLabel(pkg.storeProduct.identifier);
    
    return (
      <TouchableOpacity
        key={pkg.identifier}
        onPress={() => handlePackagePress(pkg)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.packageCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            !isLast && { borderBottomWidth: 1 },
          ]}
        >
          <View style={styles.packageContent}>
            <View style={styles.packageLeft}>
              <Text style={[styles.durationLabel, { color: theme.colors.text }]}>
                {duration}
              </Text>
              <Text style={[styles.productId, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {pkg.storeProduct.identifier}
              </Text>
            </View>
            <View style={styles.packageRight}>
              <Text style={[styles.price, { color: theme.colors.text }]}>
                {pkg.storeProduct.localizedPrice}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTierSection = (group: PackageGroup) => {
    if (group.packages.length === 0) return null;

    const tierName = group.tier.charAt(0).toUpperCase() + group.tier.slice(1);
    const emoji = getTierEmoji(group.tier);

    return (
      <View key={group.tier} style={styles.tierSection}>
        <SectionHeader title={`${emoji} ${tierName} Tier`} />
        <View style={[styles.packagesContainer, { backgroundColor: theme.colors.surface }]}>
          {group.packages.map((pkg, index) =>
            renderPackage(pkg, index, index === group.packages.length - 1)
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <MainHeader
        title="RevenueCat Packages"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading packages...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Error Loading Packages
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadPackages}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : packageGroups.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Packages Found
            </Text>
            <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
              No packages are available. Please configure offerings in RevenueCat dashboard.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadPackages}
            >
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {offering && (
              <View style={styles.infoCard}>
                <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                  Current Offering
                </Text>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  Identifier: {offering.identifier}
                </Text>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  Server Description: {offering.serverDescription || 'N/A'}
                </Text>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  Packages: {offering.availablePackages.length}
                </Text>
              </View>
            )}

            {packageGroups.map(renderTierSection)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, scrollBottomPadding: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: scrollBottomPadding,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      minHeight: 400,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.scaled.base,
    },
    errorTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    errorMessage: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    emptyMessage: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    retryButton: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.spacing.sm,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
    },
    infoCard: {
      margin: theme.spacing.base,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoTitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: theme.typography.scaled.sm,
      marginBottom: theme.spacing.xs,
    },
    tierSection: {
      marginBottom: theme.spacing.lg,
    },
    packagesContainer: {
      marginHorizontal: theme.spacing.base,
      borderRadius: theme.spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    packageCard: {
      padding: theme.spacing.md,
    },
    packageContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    packageLeft: {
      flex: 1,
    },
    packageRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    durationLabel: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: theme.spacing.xs,
    },
    productId: {
      fontSize: theme.typography.scaled.xs,
    },
    price: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
    },
  });

export default RevenueCatPackagesTestScreen;

