import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTERS_KEY = 'analytics:counters:v1';
const CONSENT_KEY = 'analytics:consent:v1';
const META_KEY = 'analytics:meta:v1';

type Counters = {
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
	},
	addDurationMs: async (ms: number): Promise<void> => {
		const counters = await readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
		counters.total_edit_duration_ms = (counters.total_edit_duration_ms ?? 0) + Math.max(0, Math.floor(ms));
		await writeJSON(COUNTERS_KEY, counters);
	},
	getCounters: async (): Promise<Counters> => {
		return readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
	},
	reset: async (): Promise<void> => {
		await writeJSON(COUNTERS_KEY, DEFAULT_COUNTERS);
		const meta = await readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
		meta.last_reset_ts = Date.now();
		await writeJSON(META_KEY, meta);
	},
	export: async (): Promise<{ counters: Counters; exported_at_ts: number }> => {
		const counters = await readJSON<Counters>(COUNTERS_KEY, DEFAULT_COUNTERS);
		const meta = await readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
		meta.last_export_ts = Date.now();
		await writeJSON(META_KEY, meta);
		return { counters, exported_at_ts: meta.last_export_ts! };
	},
	getMeta: async (): Promise<Meta> => {
		return readJSON<Meta>(META_KEY, { last_export_ts: null, last_reset_ts: null });
	},
};
