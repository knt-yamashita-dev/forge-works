import { en, type TranslationKey } from "./en";
import { ja } from "./ja";
import { moment } from "obsidian";

const locales: Record<string, Record<TranslationKey, string>> = { en, ja };

export function t(key: TranslationKey): string {
	const lang = moment.locale().startsWith("ja") ? "ja" : "en";
	return locales[lang]?.[key] ?? en[key];
}

export type { TranslationKey };
