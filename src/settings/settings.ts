import type { ForgeAISettings } from "../modules/ai/settings/settings";
import { DEFAULT_SETTINGS as AI_DEFAULTS } from "../modules/ai/settings/settings";
import type { ForgeTasksSettings } from "../modules/tasks/settings/settings";
import { DEFAULT_SETTINGS as TASKS_DEFAULTS } from "../modules/tasks/settings/settings";
import type { PomodoroSettings } from "../modules/timer/settings/settings";
import { DEFAULT_SETTINGS as TIMER_DEFAULTS } from "../modules/timer/settings/settings";
import type { ForgeUtilsSettings } from "../modules/utils/settings/settings";
import { DEFAULT_SETTINGS as UTILS_DEFAULTS } from "../modules/utils/settings/settings";

export interface ForgeWorksSettings {
	enableAI: boolean;
	enableTasks: boolean;
	enableTimer: boolean;
	enableUtils: boolean;
	ai: ForgeAISettings;
	tasks: ForgeTasksSettings;
	timer: PomodoroSettings;
	utils: ForgeUtilsSettings;
}

export const DEFAULT_SETTINGS: ForgeWorksSettings = {
	enableAI: true,
	enableTasks: true,
	enableTimer: true,
	enableUtils: true,
	ai: AI_DEFAULTS,
	tasks: TASKS_DEFAULTS,
	timer: TIMER_DEFAULTS,
	utils: UTILS_DEFAULTS,
};
