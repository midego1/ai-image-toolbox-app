import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTERS_KEY = 'analytics:counters:v1';
const CONSENT_KEY = 'analytics:consent:v1';
const META_KEY = 'analytics:meta:v1';
const DAILY_KEY = 'analytics:daily:v1';
const MODE_KEY = 'analytics:by_mode:v1';

export type Counters = {
	app_open: number;
	session_start: number;
	session_end: number;
	edit_started: number;
	edit_completed: number;
	image_saved: number;
	image_shared: number;
	errors: number;
	total_edit_duration_ms: number;
};

export type DailyBuckets = Record<string, Partial<Counters>>; // YYYY-MM-DD -> partial counters
export type ModeCounters = Record<string, { edit_started: number; edit_completed: number }>;

type Meta = {
	last_reset_ts: number | null;
	last_export_ts: number | null;
};

const DEFAULT_COUNTERS: Counters = {
	app_open: 0,
	session_start: 0,
	session_end: 0,
	edit_started: 0,
	edit_completed: 0,
	image_saved: 0,
	image_shared: 0,
	errors: 0,
	total_edit_duration_ms: 0,
};

function todayKey(): string {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
	try {
		const raw = await AsyncStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
	await AsyncStorage.setItem(key, JSON.stringify(value));
}

function sum(a: number | undefined, b: number): number {
	return (a ?? 0) + b;
}

export const AnalyticsService = {
	setConsent: async (optedIn: boolean): Promise<void> => {
		await AsyncStorage.setItem(CONSENT_KEY, optedIn ? '1' : '0');
	},
	getConsent: async (): Promise<boolean> => {
		const v = await AsyncStorage.getItem(CONSENT_KEY);
		return v === '1';
	},
	increment: async (key: keyof Counters, by: number = 1): Promise<void> => {
		const counters = await readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
		counters[key] = (counters[key] ?? 0) + by;
		await writeJSON(COUNTERS_KEY, counters);
		// daily bucket
		const daily = await readJSON<DailyBuckets>(DAILY_KEY, {});
		const tk = todayKey();
		daily[tk] = daily[tk] || {};
		daily[tk][key] = sum(daily[tk][key], by);
		await writeJSON(DAILY_KEY, daily);
	},
	addDurationMs: async (ms: number): Promise<void> => {
		const counters = await readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
		counters.total_edit_duration_ms = (counters.total_edit_duration_ms ?? 0) + Math.max(0, Math.floor(ms));
		await writeJSON(COUNTERS_KEY, counters);
		// daily bucket
		const daily = await readJSON<DailyBuckets>(DAILY_KEY, {});
		const tk = todayKey();
		daily[tk] = daily[tk] || {};
		daily[tk].total_edit_duration_ms = sum(daily[tk].total_edit_duration_ms, Math.max(0, Math.floor(ms)));
		await writeJSON(DAILY_KEY, daily);
	},
	incrementByMode: async (mode: string, type: 'edit_started' | 'edit_completed', by: number = 1): Promise<void> => {
		const modes = await readJSON<ModeCounters>(MODE_KEY, {});
		modes[mode] = modes[mode] || { edit_started: 0, edit_completed: 0 };
		modes[mode][type] = (modes[mode][type] ?? 0) + by;
		await writeJSON(MODE_KEY, modes);
	},
	getCounters: async (): Promise<Counters> => {
		return readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
	},
	getDailyBuckets: async (): Promise<DailyBuckets> => {
		return readJSON<DailyBuckets>(DAILY_KEY, {});
	},
	getModeCounters: async (): Promise<ModeCounters> => {
		return readJSON<ModeCounters>(MODE_KEY, {});
	},
	getLastNDaysTotals: async (n: number): Promise<Partial<Counters>> => {
		const daily = await readJSON<DailyBuckets>(DAILY_KEY, {});
		const totals: Partial<Counters> = {};
		const now = new Date();
		for (let i = 0; i < n; i++) {
			const d = new Date(now);
			d.setDate(now.getDate() - i);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			const bucket = daily[key];
			if (!bucket) continue;
			for (const k of Object.keys(bucket) as (keyof Counters)[]) {
				// @ts-ignore
				totals[k] = (totals[k] ?? 0) + (bucket[k] ?? 0);
			}
		}
		return totals;
	},
	reset: async (): Promise<void> => {
		await writeJSON(COUNTERS_KEY, DEFAULT_COUNTERS);
		await writeJSON(DAILY_KEY, {} as DailyBuckets);
		await writeJSON(MODE_KEY, {} as ModeCounters);
		const meta = await readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
		meta.last_reset_ts = Date.now();
		await writeJSON(META_KEY, meta);
	},
	export: async (): Promise<{ counters: Counters; daily: DailyBuckets; modes: ModeCounters; exported_at_ts: number }> => {
		const [counters, daily, modes] = await Promise.all([
			readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS),
			readJSON<DailyBuckets>(DAILY_KEY, {}),
			readJSON<ModeCounters>(MODE_KEY, {}),
		]);
		const meta = await readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
		meta.last_export_ts = Date.now();
		await writeJSON(META_KEY, meta);
		return { counters, daily, modes, exported_at_ts: meta.last_export_ts! };
	},
	getMeta: async (): Promise<Meta> => {
		return readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
	},
};
