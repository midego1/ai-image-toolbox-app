import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService } from '../services/subscriptionService';
import { AnalyticsService } from '../services/analyticsService';

function formatBytes(size: number): string {
	if (size === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(size) / Math.log(k));
	return `${(size / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

async function calculateDirectorySize(path: string): Promise<number> {
	try {
		const info = await FileSystem.getInfoAsync(path, { size: true });
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
	const [lastResetTs, setLastResetTs] = useState<number | null>(null);
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

	const totalAppBytes = useMemo(() => {
		return (appCacheBytes ?? 0) + (appDocsBytes ?? 0);
	}, [appCacheBytes, appDocsBytes]);

	async function loadUsageStats(): Promise<void> {
		try {
			const used = await SubscriptionService.getTransformationsUsed();
			if (isMountedRef.current) setTransformationsUsed(used);
		} catch {}
	}

	async function loadAnalytics(): Promise<void> {
		try {
			const [c, meta] = await Promise.all([
				AnalyticsService.getCounters(),
				AnalyticsService.getMeta(),
			]);
			if (!isMountedRef.current) return;
			setCounters(c);
			setLastResetTs(meta.last_reset_ts);
		} catch {}
	}

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
			<View style={styles.content}> 

				<SectionHeader title="USAGE" />
				<View style={styles.cards}> 
					<Card
						iconName="sparkles-outline"
						title="Transformations Used"
						subtitle="Edits performed in app"
						value={`${transformationsUsed}`}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={true}
						isLastInGroup={true}
						showSeparator={false}
					/>
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

				<SectionHeader title="ANALYTICS" />
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
					<Card
						iconName="construct-outline"
						title="Edits Started"
						subtitle="Number of edit sessions"
						value={counters ? String(counters.edit_started) : '—'}
						showChevron={false}
						iconColor={theme.colors.primary}
						isFirstInGroup={false}
						isLastInGroup={false}
						showSeparator={true}
					/>
					<Card
						iconName="checkmark-circle-outline"
						title="Edits Completed"
						subtitle="Finished successfully"
						value={counters ? String(counters.edit_completed) : '—'}
						showChevron={false}
						iconColor={theme.colors.success}
						isFirstInGroup={false}
						isLastInGroup={false}
						showSeparator={true}
					/>
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
					/>
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
			</View>
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
	});

export default StatisticsScreen;
