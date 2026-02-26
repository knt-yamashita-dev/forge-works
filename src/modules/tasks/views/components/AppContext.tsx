import * as React from "react";
import type { App } from "obsidian";
import type { TaskService } from "../../services/taskService";
import { DEFAULT_SETTINGS, type ForgeTasksSettings } from "../../settings/settings";

interface AppContextValue {
	app: App | null;
	taskService: TaskService | null;
	settings: ForgeTasksSettings;
	onCreateTask: () => void;
	onCreateChildTask: (parentFilePath: string) => void;
	onOpenTask: (filePath: string) => void;
	onEditTask: (filePath: string) => void;
	onUpdateSettings: (updates: Partial<ForgeTasksSettings>) => void;
}

export const AppContext = React.createContext<AppContextValue>({
	app: null,
	taskService: null,
	settings: { ...DEFAULT_SETTINGS },
	onCreateTask: () => {},
	onCreateChildTask: () => {},
	onOpenTask: () => {},
	onEditTask: () => {},
	onUpdateSettings: () => {},
});

export function useAppContext(): AppContextValue {
	return React.useContext(AppContext);
}
