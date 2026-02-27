export const en = {
	// === Main settings ===
	"modules.title": "Modules",
	"modules.ai.name": "AI Chat & Completion",
	"modules.ai.desc":
		"AI-powered chat assistant with knowledge context and inline completion (requires restart)",
	"modules.tasks.name": "Task Management",
	"modules.tasks.desc":
		"Kanban board, matrix view, and task list with 1-task-1-file principle (requires restart)",
	"modules.timer.name": "Pomodoro Timer",
	"modules.timer.desc":
		"Pomodoro timer with session logging and statistics (requires restart)",
	"modules.utils.name": "Editor Utilities",
	"modules.utils.desc":
		"@now timestamp replacement, focus mode, and more (requires restart)",

	// Tab labels
	"tab.ai": "AI",
	"tab.tasks": "Tasks",
	"tab.timer": "Timer",
	"tab.utils": "Utils",

	// === AI settings ===
	"ai.apiKey.name": "Gemini API Key",
	"ai.apiKey.desc": "Enter your API key from Google AI Studio",
	"ai.model.name": "Model",
	"ai.model.desc": "Gemini model to use",
	"ai.systemPrompt.name": "System Prompt",
	"ai.systemPrompt.desc": "System prompt that defines AI behavior",
	"ai.savePath.name": "Chat save folder",
	"ai.savePath.desc": "Folder path for saving chat files",
	"ai.confirmOps.name": "Confirm file operations",
	"ai.confirmOps.desc":
		"Show confirmation before AI creates or edits files",
	"ai.maxKnowledge.name": "Max knowledge files",
	"ai.maxKnowledge.desc":
		"Maximum number of files to attach as context per session",
	"ai.webSearch.heading": "Web Search",
	"ai.webSearch.name": "Enable web search",
	"ai.webSearch.desc":
		"Allow AI to search the web using Google Search when answering questions. Uses the existing Gemini API key.",
	"ai.completion.heading": "Inline Completion",
	"ai.completion.enable.name": "Enable inline completion",
	"ai.completion.enable.desc":
		"Show AI-powered text completions while typing in the editor",
	"ai.completion.delay.name": "Completion delay",
	"ai.completion.delay.desc":
		"Milliseconds to wait after typing stops before requesting completion (100-2000)",
	"ai.completion.streaming.name": "Streaming completion",
	"ai.completion.streaming.desc":
		"Show completion text progressively as it streams from the AI (lower latency)",
	"ai.agent.heading": "Agent Mode",
	"ai.agent.enable.name": "Enable agent mode",
	"ai.agent.enable.desc":
		"Allow AI to autonomously execute multi-step tasks with file operations",
	"ai.agent.maxSteps.name": "Max agent steps",
	"ai.agent.maxSteps.desc":
		"Maximum number of steps the agent can execute in a single task (1-20)",
	"ai.agent.autoApprove.name": "Auto-approve file operations",
	"ai.agent.autoApprove.desc":
		"Automatically execute file operations without confirmation (agent mode only)",
	"ai.agent.pauseOnError.name": "Pause on error",
	"ai.agent.pauseOnError.desc":
		"Pause agent execution when an error occurs instead of failing completely",
	"ai.maxOps.name": "Max operations per message",
	"ai.maxOps.desc":
		"Maximum number of file operations allowed in a single AI response (1-20)",

	// === Tasks settings ===
	"tasks.folder.name": "Task folder",
	"tasks.folder.desc": "Folder path where task files are stored",
	"tasks.priority.name": "Default priority",
	"tasks.priority.desc": "Default priority for new tasks",
	"tasks.priority.low": "Low",
	"tasks.priority.medium": "Medium",
	"tasks.priority.high": "High",
	"tasks.priority.urgent": "Urgent",
	"tasks.status.name": "Default status",
	"tasks.status.desc": "Default status for new tasks",
	"tasks.project.name": "Default project",
	"tasks.project.desc": "Default project for new tasks (empty = none)",
	"tasks.tags.name": "Default tags",
	"tasks.tags.desc":
		"Default tags for new tasks, comma-separated (empty = none)",
	"tasks.showCompleted.name": "Show completed tasks",
	"tasks.showCompleted.desc":
		"Show tasks with 'Done' status in the task list",
	"tasks.retention.name": "Completed task retention (days)",
	"tasks.retention.desc":
		"Hide completed tasks older than this many days (0 = never hide)",
	"tasks.customStatuses.heading": "Custom Statuses",
	"tasks.customStatuses.builtIn": "(built-in)",
	"tasks.customStatuses.moveUp": "Move up",
	"tasks.customStatuses.moveDown": "Move down",
	"tasks.customStatuses.remove": "Remove",
	"tasks.customStatuses.add": "Add custom status",
	"tasks.customStatuses.addBtn": "Add",
	"tasks.kanban.heading": "Kanban / Matrix Columns",
	"tasks.kanban.desc":
		"Choose which statuses appear as columns in Kanban and Matrix views.",

	// === Timer settings ===
	"timer.timer.heading": "Timer",
	"timer.workDuration.name": "Work duration",
	"timer.workDuration.desc": "Focus session length in minutes",
	"timer.shortBreak.name": "Short break duration",
	"timer.shortBreak.desc": "Short break length in minutes",
	"timer.longBreak.name": "Long break duration",
	"timer.longBreak.desc": "Long break length in minutes",
	"timer.pomodorosBeforeLong.name": "Pomodoros before long break",
	"timer.pomodorosBeforeLong.desc":
		"Number of work sessions before a long break",
	"timer.autoStart.heading": "Auto-start",
	"timer.autoStartBreak.name": "Auto-start break",
	"timer.autoStartBreak.desc":
		"Automatically start break after work session ends",
	"timer.autoStartWork.name": "Auto-start work",
	"timer.autoStartWork.desc":
		"Automatically start work session after break ends",
	"timer.logging.heading": "Logging",
	"timer.enableLogging.name": "Enable logging",
	"timer.enableLogging.desc": "Record completed pomodoro sessions",
	"timer.workNote.name": "Ask for work note",
	"timer.workNote.desc":
		"Show a modal to record what you did after each focus session",
	"timer.logPath.name": "Log file path",
	"timer.logPath.desc": "Path for the log file (e.g. Pomodoro/Log.md)",
	"timer.dailyNote.name": "Log to daily note",
	"timer.dailyNote.desc":
		"Append log entries to the daily note instead of the log file",
	"timer.logFormat.name": "Log format",
	"timer.logFormat.desc": "Format for log entries",
	"timer.logFormat.table": "Table",
	"timer.logFormat.list": "List",
	"timer.dailyHeading.name": "Daily note heading",
	"timer.dailyHeading.desc": "Heading to append under in the daily note",
	"timer.sound.heading": "Sound",
	"timer.enableSound.name": "Enable sound",
	"timer.enableSound.desc": "Play a sound when a phase completes",
	"timer.soundWorkEnd.name": "Work end sound",
	"timer.soundWorkEnd.desc": "Play sound when a focus session ends",
	"timer.soundBreakEnd.name": "Break end sound",
	"timer.soundBreakEnd.desc": "Play sound when a break ends",
	"timer.volume.name": "Volume",
	"timer.volume.desc": "Sound volume (0-100)",
	"timer.notifications.heading": "Notifications",
	"timer.notice.name": "Show notice",
	"timer.notice.desc":
		"Show an Obsidian notice when a phase completes",
	"timer.systemNotification.name": "System notification",
	"timer.systemNotification.desc":
		"Send an OS-level notification when a phase completes. Visible even when Obsidian is not focused.",
	"timer.task.heading": "Task",
	"timer.defaultTask.name": "Default task",
	"timer.defaultTask.desc": "Default task name for new sessions",
	"timer.rememberTask.name": "Remember last task",
	"timer.rememberTask.desc":
		"Restore the last used task name on plugin load",

	// === Utils settings ===
	"utils.dateFormat.name": "Date format",
	"utils.dateFormat.desc":
		"Format for @now replacement. Tokens: YYYY, MM, DD, HH, mm, ss",
	"utils.dateFormat.preview": "Preview",
	"utils.focusMode.heading": "Focus Mode",
	"utils.focusMode.enable.name": "Enable Focus Mode",
	"utils.focusMode.enable.desc":
		"Dim all paragraphs except the one your cursor is in. Can also be toggled via command palette.",
	"utils.focusMode.opacity.name": "Dimmed text opacity",
	"utils.focusMode.opacity.desc":
		"Opacity for non-focused paragraphs (0.0 = invisible, 1.0 = fully visible)",
	"utils.floatingToc.heading": "Floating TOC",
	"utils.floatingToc.enable.name": "Enable Floating TOC",
	"utils.floatingToc.enable.desc":
		"Show a floating table of contents when scrolling. Headings are highlighted based on current position. Can also be toggled via command palette.",
	"utils.floatingToc.fadeDelay.name": "Fade delay",
	"utils.floatingToc.fadeDelay.desc":
		"Seconds to wait after scrolling stops before hiding the TOC (1–10)",
} as const;

export type TranslationKey = keyof typeof en;
