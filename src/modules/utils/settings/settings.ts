export interface ForgeUtilsSettings {
	dateFormat: string;
	focusModeEnabled: boolean;
	focusModeOpacity: number;
}

export const DEFAULT_SETTINGS: ForgeUtilsSettings = {
	dateFormat: "YYYY-MM-DD HH:mm",
	focusModeEnabled: false,
	focusModeOpacity: 0.3,
};
