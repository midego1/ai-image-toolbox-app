import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService } from '../services/subscriptionService';
import { AnalyticsService, ModeCounters } from '../services/analyticsService';
import { EDIT_MODES } from '../constants/editModes';
import { EditMode } from '../types/editModes';
import { haptic } from '../utils/haptics';

function formatBytes(size: number): string {
	if (size === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(size) / Math.log(k));
	return `${(size / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

async function calculateDirectorySize(path: string): Promise<number> {
	try {
		const info = await FileSystem.getInfoAsync(path);
		if (!info.exists) return 0;
		if (info.isDirectory) {
			const entries = await FileSystem.readDirectoryAsync(path);
			let total = 0;
			for (const entry of entries) {
				const childPath = `${path}${path.endsWith('/') ? '' : '/'}${entry}`;
				total += await calculateDirectorySize(childPath);
			}
			return total;
		}
		return info.size ?? 0;
	} catch (e) {
		return 0;
	}
}

const StatisticsScreen = () => {
	const { theme } = useTheme();
	const styles = createStyles(theme);

	const [transformationsUsed, setTransformationsUsed] = useState<number>(0);
	const [appCacheBytes, setAppCacheBytes] = useState<number | null>(null);
	const [appDocsBytes, setAppDocsBytes] = useState<number | null>(null);
	const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);
	const [cacheFileCount, setCacheFileCount] = useState<number | null>(null);
	const [docsFileCount, setDocsFileCount] = useState<number | null>(null);
	const [counters, setCounters] = useState<any | null>(null);
	const [oneDayTotals, setOneDayTotals] = useState<any | null>(null);
	const [sevenDayTotals, setSevenDayTotals] = useState<any | null>(null);
	const [thirtyDayTotals, setThirtyDayTotals] = useState<any | null>(null);
	const [lastResetTs, setLastResetTs] = useState<number | null>(null);
	const [modeCounters, setModeCounters] = useState<ModeCounters | null>(null);
	const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
	const [selectedPeriod, setSelectedPeriod] = useState<1 | 7 | 30>(1);
	const isMountedRef = useRef(true);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		(async () => {
			await loadUsageStats();
			await loadAnalytics();
			void calculateAppStorage();
		})();
	}, []);

	// Reset expanded cards when period changes
	useEffect(() => {
		setExpandedCards(new Set());
	}, [selectedPeriod]);

	const totalAppBytes = useMemo(() => {
		return (appCacheBytes ?? 0) + (appDocsBytes ?? 0);
	}, [appCacheBytes, appDocsBytes]);

	const selectedPeriodData = useMemo(() => {
		switch (selectedPeriod) {
			case 1:
				return oneDayTotals;
			case 7:
				return sevenDayTotals;
			case 30:
				return thirtyDayTotals;
			default:
				return oneDayTotals;
		}
	}, [selectedPeriod, oneDayTotals, sevenDayTotals, thirtyDayTotals]);

	const getPeriodLabel = (period: 1 | 7 | 30): string => {
		switch (period) {
			case 1:
				return '1 Day';
			case 7:
				return '7 Days';
			case 30:
				return '30 Days';
		}
	};

	const getPeriodSubtitle = (period: 1 | 7 | 30): string => {
		switch (period) {
			case 1:
				return 'Today';
			case 7:
				return '7-day total';
			case 30:
				return '30-day total';
		}
	};

	async function loadUsageStats(): Promise<void> {
		try {
			const used = await SubscriptionService.getTransformationsUsed();
			if (isMountedRef.current) setTransformationsUsed(used);
		} catch {}
	}

	async function loadAnalytics(): Promise<void> {
		try {
			const [c, meta, t1, t7, t30, modes] = await Promise.all([
				AnalyticsService.getCounters(),
				AnalyticsService.getMeta(),
				AnalyticsService.getLastNDaysTotals(1),
				AnalyticsService.getLastNDaysTotals(7),
				AnalyticsService.getLastNDaysTotals(30),
				AnalyticsService.getModeCounters(),
			]);
			if (!isMountedRef.current) return;
			setCounters(c);
			setLastResetTs(meta.last_reset_ts);
			setOneDayTotals(t1);
			setSevenDayTotals(t7);
			setThirtyDayTotals(t30);
			setModeCounters(modes);
		} catch {}
	}

	const toggleCard = (cardId: string) => {
		setExpandedCards(prev => {
			const next = new Set(prev);
			if (next.has(cardId)) {
				next.delete(cardId);
			} else {
				next.add(cardId);
			}
			return next;
		});
	};

	const getModeName = (modeId: string): string => {
		const mode = EDIT_MODES[modeId as EditMode];
		return mode?.name || modeId;
	};

	const getModeIcon = (modeId: string): string => {
		const mode = EDIT_MODES[modeId as EditMode];
		return mode?.icon || '🔧';
	};

	const renderTimePeriodTabs = () => {
		const periods: Array<1 | 7 | 30> = [1, 7, 30];
		return (
			<View style={styles.tabContainer}>
				{periods.map((period, index) => {
					const isSelected = selectedPeriod === period;
					const isFirst = index === 0;
					const isLast = index === periods.length - 1;
					
					return (
						<TouchableOpacity
							key={period}
							style={[
								styles.tab,
								isFirst && styles.tabFirst,
								isLast && styles.tabLast,
								isSelected && { backgroundColor: theme.colors.primary },
								!isSelected && { backgroundColor: theme.colors.surface },
							]}
							onPress={() => {
								haptic.light();
								setSelectedPeriod(period);
							}}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									{ color: isSelected ? '#FFFFFF' : theme.colors.text },
								]}
							>
								{getPeriodLabel(period)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		);
	};

	const renderExpandableCard = ({
		id,
		iconName,
		title,
		subtitle,
		value,
		iconColor,
		isFirstInGroup,
		getNextCardId,
		breakdownType,
	}: {
		id: string;
		iconName: keyof typeof Ionicons.glyphMap;
		title: string;
		subtitle: string;
		value: string;
		iconColor: string;
		isFirstInGroup: boolean;
		getNextCardId: () => string | null;
		breakdownType: 'edit_started' | 'edit_completed';
	}) => {
		const isExpanded = expandedCards.has(id);
		const nextCardId = getNextCardId();
		const hasNextCard = !!nextCardId;

		return (
			<View
				style={[
					styles.expandableCardContainer,
					{
						borderTopLeftRadius: isFirstInGroup ? 12 : 0,
						borderTopRightRadius: isFirstInGroup ? 12 : 0,
						borderBottomLeftRadius: (!hasNextCard || isExpanded) ? 12 : 0,
						borderBottomRightRadius: (!hasNextCard || isExpanded) ? 12 : 0,
						overflow: 'hidden',
						backgroundColor: theme.colors.surface,
					},
				]}
			>
					<Card
						iconName={iconName}
						title={title}
						subtitle={subtitle}
						value={value}
						showChevron={false}
						rightIcon={
							<Ionicons
								name={isExpanded ? 'chevron-up' : 'chevron-down'}
								size={18}
								color={theme.colors.textSecondary}
							/>
						}
						iconColor={iconColor}
						isFirstInGroup={false}
						isLastInGroup={isExpanded}
						showSeparator={!isExpanded && hasNextCard}
						onPress={() => toggleCard(id)}
						style={{ marginBottom: 0 }}
					/>
					{isExpanded && (
						<View style={styles.expandedContentInner}>
							{renderModeBreakdown(breakdownType)}
						</View>
					)}
			</View>
		);
	};

	const renderModeBreakdown = (type: 'edit_started' | 'edit_completed') => {
		if (!modeCounters || Object.keys(modeCounters).length === 0) {
			return (
				<View style={styles.breakdownContainer}>
					<Text style={[styles.breakdownEmpty, { color: theme.colors.textTertiary }]}>
						No data available yet
					</Text>
				</View>
			);
		}

		// Sort by count descending, then by name
		const sortedModes = Object.entries(modeCounters)
			.filter(([_, data]) => (data[type] ?? 0) > 0)
			.sort((a, b) => {
				const countA = a[1][type] ?? 0;
				const countB = b[1][type] ?? 0;
				if (countB !== countA) return countB - countA;
				return getModeName(a[0]).localeCompare(getModeName(b[0]));
			});

		if (sortedModes.length === 0) {
			return (
				<View style={styles.breakdownContainer}>
					<Text style={[styles.breakdownEmpty, { color: theme.colors.textTertiary }]}>
						No {type === 'edit_started' ? 'edits started' : 'edits completed'} yet
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.breakdownContainer}>
				{sortedModes.map(([modeId, data], index) => {
					const count = data[type] ?? 0;
					const modeName = getModeName(modeId);
					const modeIcon = getModeIcon(modeId);
					return (
						<View
							key={modeId}
							style={[
								styles.breakdownItem,
								index > 0 && { 
									borderTopColor: theme.colors.border,
									borderTopWidth: StyleSheet.hairlineWidth,
								},
							]}
						>
							<View style={styles.breakdownItemContent}>
								<Text style={styles.breakdownIcon}>{modeIcon}</Text>
								<Text style={[styles.breakdownName, { color: theme.colors.text }]}>
									{modeName}
								</Text>
							</View>
							<View style={[styles.breakdownBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
								<Text style={[styles.breakdownValue, { color: theme.colors.textSecondary }]}>
									{count}
								</Text>
							</View>
						</View>
					);
				})}
			</View>
		);
	};

	async function calculateAppStorage(): Promise<void> {
		setIsCalculatingStorage(true);
		try {
			const cacheDir = FileSystem.cacheDirectory ?? '';
			const docsDir = FileSystem.documentDirectory ?? '';
			const [cache, docs, cacheEntries, docsEntries] = await Promise.all([
				calculateDirectorySize(cacheDir),
				calculateDirectorySize(docsDir),
				cacheDir ? FileSystem.readDirectoryAsync(cacheDir).catch(() => []) : [],
				docsDir ? FileSystem.readDirectoryAsync(docsDir).catch(() => []) : [],
			]);
			if (isMountedRef.current) {
				setAppCacheBytes(cache);
				setAppDocsBytes(docs);
				setCacheFileCount(Array.isArray(cacheEntries) ? cacheEntries.length : 0);
				setDocsFileCount(Array.isArray(docsEntries) ? docsEntries.length : 0);
			}
		} catch (e) {
			// ignore
		} finally {
			if (isMountedRef.current) setIsCalculatingStorage(false);
		}
	}

	return (
		<SafeAreaView style={styles.container} edges={[]}> 
			<MainHeader title="App Statistics" showConnected={false} backgroundColor={theme.colors.backgroundSecondary} />
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			> 

				<SectionHeader title="USAGE" />
				<View style={styles.tabsWrapper}>
					{renderTimePeriodTabs()}
				</View>
				<View style={styles.cards}> 
					<Card
						iconName="timer-outline"
						title="App Opens"
						subtitle={getPeriodSubtitle(selectedPeriod)}
						value={selectedPeriodData ? String(selectedPeriodData.app_open ?? 0) : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={true}
						isLastInGroup={false}
						showSeparator={true}
					/>
					{renderExpandableCard({
						id: `period_${selectedPeriod}_edit_started`,
						iconName: 'sparkles-outline',
						title: 'Edits Started',
						subtitle: getPeriodSubtitle(selectedPeriod),
						value: selectedPeriodData ? String(selectedPeriodData.edit_started ?? 0) : '—',
						iconColor: theme.colors.primary,
						isFirstInGroup: false,
						getNextCardId: () => `period_${selectedPeriod}_edit_completed`,
						breakdownType: 'edit_started',
					})}
					{renderExpandableCard({
						id: `period_${selectedPeriod}_edit_completed`,
						iconName: 'checkmark-circle-outline',
						title: 'Edits Completed',
						subtitle: getPeriodSubtitle(selectedPeriod),
						value: selectedPeriodData ? String(selectedPeriodData.edit_completed ?? 0) : '—',
						iconColor: theme.colors.success,
						isFirstInGroup: false,
						getNextCardId: () => `period_${selectedPeriod}_avg_time`,
						breakdownType: 'edit_completed',
					})}
					<View
						style={[
							styles.expandableCardContainer,
							{
								borderTopLeftRadius: 0,
								borderTopRightRadius: 0,
								borderBottomLeftRadius: 0,
								borderBottomRightRadius: 0,
								overflow: 'hidden',
								backgroundColor: theme.colors.surface,
							},
						]}
					>
						<Card
							iconName="time-outline"
							title="Avg Edit Time"
							subtitle={getPeriodSubtitle(selectedPeriod)}
							value={selectedPeriodData && (selectedPeriodData.edit_completed ?? 0) > 0 ? `${Math.round((selectedPeriodData.total_edit_duration_ms ?? 0) / (selectedPeriodData.edit_completed || 1) / 1000)}s` : '—'}
							showChevron={false}
							iconColor={theme.colors.primary}
							isFirstInGroup={false}
							isLastInGroup={false}
							showSeparator={true}
							style={{ marginBottom: 0 }}
						/>
					</View>
					<View
						style={[
							styles.expandableCardContainer,
							{
								borderTopLeftRadius: 0,
								borderTopRightRadius: 0,
								borderBottomLeftRadius: 12,
								borderBottomRightRadius: 12,
								overflow: 'hidden',
								backgroundColor: theme.colors.surface,
							},
						]}
					>
						<Card
							iconName="stats-chart-outline"
							title="Success Rate"
							subtitle="Completed / Started"
							value={selectedPeriodData ? `${Math.round(((selectedPeriodData.edit_completed ?? 0) / Math.max(1, (selectedPeriodData.edit_started ?? 0))) * 100)}%` : '—'}
							showChevron={false}
							iconColor={theme.colors.success}
							isFirstInGroup={false}
							isLastInGroup={true}
							showSeparator={false}
							style={{ marginBottom: 0 }}
						/>
					</View>
				</View>

				<SectionHeader title="APP STORAGE" />
				<View style={styles.cards}> 
					<Card
						iconName="trash-outline"
						title="Cache"
						subtitle={cacheFileCount !== null ? `${cacheFileCount} items` : 'Temporary files'}
						value={appCacheBytes !== null ? formatBytes(appCacheBytes) : isCalculatingStorage ? 'Calculating…' : '—'}
						showChevron={false}
						iconColor={theme.colors.warning}
						isFirstInGroup={true}
						isLastInGroup={false}
						showSeparator={true}
					/>
					<Card
						iconName="folder-outline"
						title="Documents"
						subtitle={docsFileCount !== null ? `${docsFileCount} items` : 'Saved files and edits'}
						value={appDocsBytes !== null ? formatBytes(appDocsBytes) : isCalculatingStorage ? 'Calculating…' : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={false}
						isLastInGroup={false}
						showSeparator={true}
					/>
					<Card
						iconName="stats-chart-outline"
						title="Total App Storage"
						subtitle="Cache + Documents"
						value={formatBytes(totalAppBytes)}
						showChevron={false}
						iconColor={theme.colors.success}
						isFirstInGroup={false}
						isLastInGroup={true}
						showSeparator={false}
					/>
				</View>

				<SectionHeader title="ALL-TIME" />
				<View style={styles.cards}> 
					<Card
						iconName="timer-outline"
						title="App Opens"
						subtitle={lastResetTs ? `Since ${new Date(lastResetTs).toLocaleDateString()}` : 'All time'}
						value={counters ? String(counters.app_open) : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={true}
						isLastInGroup={false}
						showSeparator={true}
					/>
					{renderExpandableCard({
						id: 'alltime_edit_started',
						iconName: 'construct-outline',
						title: 'Edits Started',
						subtitle: 'Number of edit sessions',
						value: counters ? String(counters.edit_started) : '—',
						iconColor: theme.colors.primary,
						isFirstInGroup: false,
						getNextCardId: () => 'alltime_edit_completed',
						breakdownType: 'edit_started',
					})}
					{renderExpandableCard({
						id: 'alltime_edit_completed',
						iconName: 'checkmark-circle-outline',
						title: 'Edits Completed',
						subtitle: 'Finished successfully',
						value: counters ? String(counters.edit_completed) : '—',
						iconColor: theme.colors.success,
						isFirstInGroup: false,
						getNextCardId: () => 'alltime_images_saved',
						breakdownType: 'edit_completed',
					})}
					<View
						style={[
							styles.expandableCardContainer,
							{
								borderTopLeftRadius: 0,
								borderTopRightRadius: 0,
								borderBottomLeftRadius: 0,
								borderBottomRightRadius: 0,
								overflow: 'hidden',
								backgroundColor: theme.colors.surface,
							},
						]}
					>
						<Card
							iconName="save-outline"
							title="Images Saved"
							subtitle="Saved to gallery"
							value={counters ? String(counters.image_saved) : '—'}
							showChevron={false}
							iconColor={theme.colors.primary}
							isFirstInGroup={false}
							isLastInGroup={false}
							showSeparator={true}
							style={{ marginBottom: 0 }}
						/>
					</View>
					<Card
						iconName="share-social-outline"
						title="Images Shared"
						subtitle="Share sheet opened"
						value={counters ? String(counters.image_shared) : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={false}
						isLastInGroup={false}
						showSeparator={true}
					/>
					<Card
						iconName="time-outline"
						title="Total Edit Time"
						subtitle="Cumulative duration"
						value={counters ? `${Math.round((counters.total_edit_duration_ms || 0)/1000)}s` : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={false}
						isLastInGroup={true}
						showSeparator={false}
					/>
				</View>

				{isCalculatingStorage && (
					<View style={styles.footer}> 
						<ActivityIndicator color={theme.colors.primary} />
						<Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Working in background…</Text>
					</View>
				)}
			</ScrollView>
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
		},
		scrollView: {
			flex: 1,
		},
		scrollContent: {
			paddingBottom: theme.spacing.xl,
		},
		tabsWrapper: {
			paddingHorizontal: theme.spacing.base,
			marginBottom: theme.spacing.md,
		},
		tabContainer: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			padding: 4,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		tab: {
			flex: 1,
			paddingVertical: theme.spacing.sm,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 8,
		},
		tabFirst: {
			marginRight: 2,
		},
		tabLast: {
			marginLeft: 2,
		},
		tabText: {
			fontSize: theme.typography.scaled.sm,
			fontWeight: '600',
		},
		cards: {
			paddingHorizontal: theme.spacing.base,
			marginBottom: theme.spacing.lg,
		},
		footer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingHorizontal: theme.spacing.base,
		},
		footerText: {
			marginLeft: theme.spacing.sm,
		},
		expandableCardContainer: {
			marginBottom: 0,
		},
		expandedContentInner: {
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.md,
			borderTopWidth: StyleSheet.hairlineWidth,
			borderTopColor: theme.colors.border,
		},
		breakdownContainer: {
			// No padding - Card already provides horizontal padding
		},
		breakdownItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.base,
		},
		breakdownItemContent: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
		},
		breakdownIcon: {
			fontSize: 20,
			marginRight: theme.spacing.sm,
			width: 24,
		},
		breakdownName: {
			fontSize: 15,
			flex: 1,
			fontWeight: '500',
		},
		breakdownBadge: {
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 4,
			borderRadius: 12,
			minWidth: 32,
			alignItems: 'center',
		},
		breakdownValue: {
			fontSize: 13,
			fontWeight: '600',
		},
		breakdownEmpty: {
			fontSize: 13,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.base,
			textAlign: 'center',
		},
	});

export default StatisticsScreen;
