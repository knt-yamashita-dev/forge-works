export interface ForgeUtilsSettings {
	dateFormat: string;
	focusModeEnabled: boolean;
	focusModeOpacity: number;
	floatingTocEnabled: boolean;
	floatingTocFadeDelay: number;
}

export const DEFAULT_SETTINGS: ForgeUtilsSettings = {
	dateFormat: "YYYY-MM-DD HH:mm",
	focusModeEnabled: false,
	focusModeOpacity: 0.3,
	floatingTocEnabled: false,
	floatingTocFadeDelay: 2,
};
