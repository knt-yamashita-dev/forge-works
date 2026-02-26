import { App, TFile, TAbstractFile, Notice, stringifyYaml } from "obsidian";
import type {
	Task,
	TaskFrontmatter,
	TaskStatus,
	TaskPriority,
	TaskFilter,
	TaskCreateInput,
	SubtaskProgress,
	TaskTreeNode,
} from "../types/task";

const PRIORITY_CYCLE: Record<TaskPriority, TaskPriority> = {
	low: "medium",
	medium: "high",
	high: "urgent",
	urgent: "low",
};

type TaskChangeListener = (tasks: Task[]) => void;

export class TaskService {
	private app: App;
	private taskFolder: string;
	private tasks: Map<string, Task> = new Map();
	private listeners: Set<TaskChangeListener> = new Set();
	private validStatuses: string[] = ["todo", "in-progress", "done"];

	constructor(app: App, taskFolder: string) {
		this.app = app;
		this.taskFolder = taskFolder;
	}

	setValidStatuses(statuses: string[]): void {
		this.validStatuses = statuses;
		this.initialScan();
	}

	initialScan(): void {
		this.tasks.clear();
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			if (this.isTaskFile(file)) {
				const task = this.parseTaskFile(file);
				if (task) {
					this.tasks.set(file.path, task);
				}
			}
		}
		this.notifyListeners();
	}

	isTaskFile(file: TFile | TAbstractFile): boolean {
		if (!(file instanceof TFile)) return false;
		if (file.extension !== "md") return false;
		const folder = this.taskFolder.endsWith("/")
			? this.taskFolder
			: this.taskFolder + "/";
		return file.path.startsWith(folder) || file.path === this.taskFolder;
	}

	private parseTaskFile(file: TFile): Task | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;

		if (!fm || !fm.status) return null;

		if (!this.validStatuses.includes(fm.status)) return null;

		const validPriorities: TaskPriority[] = [
			"low",
			"medium",
			"high",
			"urgent",
		];
		const priority: TaskPriority = validPriorities.includes(fm.priority)
			? fm.priority
			: "medium";

		const frontmatter: TaskFrontmatter = {
			status: fm.status,
			priority: priority,
			due: fm.due || undefined,
			project: fm.project || undefined,
			tags: Array.isArray(fm.tags) ? fm.tags : undefined,
			parent: fm.parent || undefined,
			created: fm.created || this.formatDate(new Date()),
			updated: fm.updated || this.formatDate(new Date()),
		};

		// Extract title from first H1 or filename
		let title = file.basename;
		if (cache?.headings) {
			const h1 = cache.headings.find((h) => h.level === 1);
			if (h1) {
				title = h1.heading;
			}
		}

		// Parse subtask progress from list items
		const subtaskProgress = this.parseSubtaskProgress(cache);

		return {
			filePath: file.path,
			title,
			frontmatter,
			hasSubtasks: subtaskProgress !== undefined,
			subtaskProgress,
		};
	}

	private parseSubtaskProgress(
		cache: ReturnType<typeof this.app.metadataCache.getFileCache>
	): SubtaskProgress | undefined {
		if (!cache?.listItems) return undefined;

		const checklistItems = cache.listItems.filter(
			(item) => item.task !== undefined
		);
		if (checklistItems.length === 0) return undefined;

		const completed = checklistItems.filter(
			(item) => item.task === "x" || item.task === "X"
		).length;

		return {
			completed,
			total: checklistItems.length,
		};
	}

	// --- File watching handlers ---

	handleMetadataChanged(file: TFile): void {
		if (!this.isTaskFile(file)) return;
		const task = this.parseTaskFile(file);
		if (task) {
			this.tasks.set(file.path, task);
		} else {
			this.tasks.delete(file.path);
		}
		this.notifyListeners();
	}

	handleFileDelete(file: TAbstractFile): void {
		if (this.tasks.has(file.path)) {
			this.tasks.delete(file.path);
			this.notifyListeners();
		}
	}

	handleFileRename(file: TAbstractFile, oldPath: string): void {
		const hadOld = this.tasks.has(oldPath);
		if (hadOld) {
			this.tasks.delete(oldPath);
		}

		if (this.isTaskFile(file) && file instanceof TFile) {
			const task = this.parseTaskFile(file);
			if (task) {
				this.tasks.set(file.path, task);
			}
			this.notifyListeners();
		} else if (hadOld) {
			this.notifyListeners();
		}
	}

	// --- CRUD ---

	async createTask(input: TaskCreateInput): Promise<TFile> {
		const today = this.formatDate(new Date());
		const frontmatter: TaskFrontmatter = {
			status: input.status,
			priority: input.priority,
			due: input.due,
			project: input.project,
			tags: input.tags,
			parent: input.parent,
			created: today,
			updated: today,
		};

		const content = this.buildTaskContent(input, frontmatter);
		const fileName = this.sanitizeFileName(input.title);
		let filePath = `${this.taskFolder}/${fileName}.md`;

		// Avoid name collision
		const existing = this.app.vault.getAbstractFileByPath(filePath);
		if (existing) {
			const timestamp = Date.now();
			filePath = `${this.taskFolder}/${fileName}-${timestamp}.md`;
		}

		// Ensure folder exists
		await this.ensureFolder(this.taskFolder);

		const file = await this.app.vault.create(filePath, content);
		return file;
	}

	async updateTaskStatus(
		filePath: string,
		newStatus: TaskStatus
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) return;

		await this.app.fileManager.processFrontMatter(file, (fm) => {
			fm.status = newStatus;
			fm.updated = this.formatDate(new Date());
		});

		// Cascade to child tasks
		const children = this.getChildTasks(filePath);
		for (const child of children) {
			await this.updateTaskStatus(child.filePath, newStatus);
		}
	}

	async updateTaskFrontmatter(
		filePath: string,
		updates: Partial<TaskFrontmatter>
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) return;

		await this.app.fileManager.processFrontMatter(file, (fm) => {
			for (const [key, value] of Object.entries(updates)) {
				if (value !== undefined) {
					fm[key] = value;
				}
			}
			fm.updated = this.formatDate(new Date());
		});
	}

	async updateTaskTitle(
		filePath: string,
		newTitle: string
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) return;

		const trimmedTitle = newTitle.trim();
		if (!trimmedTitle) return;

		await this.app.vault.process(file, (content) => {
			const h1Regex = /^# .+$/m;
			if (h1Regex.test(content)) {
				return content.replace(h1Regex, `# ${trimmedTitle}`);
			}
			// No H1 found: insert after frontmatter
			const fmEndMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
			if (fmEndMatch) {
				const insertPos = fmEndMatch[0].length;
				return (
					content.slice(0, insertPos) +
					`\n# ${trimmedTitle}\n` +
					content.slice(insertPos)
				);
			}
			return `# ${trimmedTitle}\n\n${content}`;
		});

		await this.app.fileManager.processFrontMatter(file, (fm) => {
			fm.updated = this.formatDate(new Date());
		});
	}

	async cycleTaskPriority(filePath: string): Promise<void> {
		const task = this.tasks.get(filePath);
		if (!task) return;

		const nextPriority = PRIORITY_CYCLE[task.frontmatter.priority];
		await this.updateTaskFrontmatter(filePath, {
			priority: nextPriority,
		});
	}

	async deleteTask(filePath: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) return;

		await this.app.vault.trash(file, false);
		new Notice(`Task deleted: ${file.basename}`);
	}

	// --- Queries ---

	getTasks(): Task[] {
		return Array.from(this.tasks.values()).sort((a, b) => {
			return a.frontmatter.updated.localeCompare(
				b.frontmatter.updated
			);
		});
	}

	getTask(filePath: string): Task | undefined {
		return this.tasks.get(filePath);
	}

	getTasksByStatus(status: TaskStatus): Task[] {
		return this.getTasks().filter(
			(t) => t.frontmatter.status === status
		);
	}

	getProjects(): string[] {
		const projects = new Set<string>();
		for (const task of this.tasks.values()) {
			if (task.frontmatter.project) {
				projects.add(task.frontmatter.project);
			}
		}
		return Array.from(projects).sort();
	}

	getChildTasks(filePath: string): Task[] {
		const basename = filePath
			.split("/")
			.pop()
			?.replace(/\.md$/, "");
		if (!basename) return [];

		return Array.from(this.tasks.values()).filter((task) => {
			if (!task.frontmatter.parent) return false;
			const match = task.frontmatter.parent.match(
				/^\[\[(.+?)(?:\|.*)?\]\]$/
			);
			const name = match ? match[1] : task.frontmatter.parent;
			return name === basename;
		});
	}

	getParentTask(filePath: string): Task | undefined {
		const task = this.tasks.get(filePath);
		if (!task?.frontmatter.parent) return undefined;

		const match = task.frontmatter.parent.match(
			/^\[\[(.+?)(?:\|.*)?\]\]$/
		);
		const name = match ? match[1] : task.frontmatter.parent;

		for (const t of this.tasks.values()) {
			const b = t.filePath
				.split("/")
				.pop()
				?.replace(/\.md$/, "");
			if (b === name) return t;
		}
		return undefined;
	}

	buildTree(tasks: Task[]): TaskTreeNode[] {
		// Build basename -> task lookup for parent resolution
		const byBasename = new Map<string, Task>();
		for (const task of this.tasks.values()) {
			const basename = task.filePath
				.split("/")
				.pop()
				?.replace(/\.md$/, "");
			if (basename) {
				byBasename.set(basename, task);
			}
		}

		// Determine which tasks in the input list have parents also in the list
		const taskPaths = new Set(tasks.map((t) => t.filePath));
		const childPaths = new Set<string>();

		const resolveParentPath = (
			parentRef: string
		): string | undefined => {
			// Extract basename from wikilink like "[[some-task]]"
			const match = parentRef.match(/^\[\[(.+?)(?:\|.*)?\]\]$/);
			const name = match ? match[1] : parentRef;
			const parent = byBasename.get(name);
			return parent?.filePath;
		};

		// Find which tasks are children of other tasks in this list
		for (const task of tasks) {
			if (task.frontmatter.parent) {
				const parentPath = resolveParentPath(
					task.frontmatter.parent
				);
				if (parentPath && taskPaths.has(parentPath)) {
					childPaths.add(task.filePath);
				}
			}
		}

		// Build tree recursively
		const buildNodes = (
			parentPath: string | null,
			depth: number
		): TaskTreeNode[] => {
			const nodes: TaskTreeNode[] = [];
			for (const task of tasks) {
				const taskParentPath = task.frontmatter.parent
					? resolveParentPath(task.frontmatter.parent)
					: undefined;

				const isChild =
					parentPath === null
						? !childPaths.has(task.filePath)
						: taskParentPath === parentPath;

				if (isChild) {
					nodes.push({
						task,
						depth,
						children: buildNodes(task.filePath, depth + 1),
					});
				}
			}
			return nodes;
		};

		return buildNodes(null, 0);
	}

	getFilteredTasks(filter: TaskFilter): Task[] {
		return this.getTasks().filter((task) => {
			if (!filter.statusFilter.includes(task.frontmatter.status)) {
				return false;
			}
			if (
				!filter.priorityFilter.includes(task.frontmatter.priority)
			) {
				return false;
			}
			if (
				filter.projectFilter !== null &&
				task.frontmatter.project !== filter.projectFilter
			) {
				return false;
			}
			if (filter.searchQuery) {
				const query = filter.searchQuery.toLowerCase();
				if (!task.title.toLowerCase().includes(query)) {
					return false;
				}
			}
			return true;
		});
	}

	// --- Event system ---

	onChange(listener: TaskChangeListener): void {
		this.listeners.add(listener);
	}

	offChange(listener: TaskChangeListener): void {
		this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		const tasks = this.getTasks();
		for (const listener of this.listeners) {
			listener(tasks);
		}
	}

	// --- Configuration ---

	setTaskFolder(folder: string): void {
		this.taskFolder = folder;
		this.initialScan();
	}

	getTaskFolder(): string {
		return this.taskFolder;
	}

	// --- Utilities ---

	private sanitizeFileName(title: string): string {
		return title
			.replace(/[\\/:*?"<>|#^[\]]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "")
			.substring(0, 100);
	}

	private formatDate(date: Date): string {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	private buildTaskContent(
		input: TaskCreateInput,
		frontmatter: TaskFrontmatter
	): string {
		// Build frontmatter object, omitting undefined fields
		const fmObj: Record<string, unknown> = {
			status: frontmatter.status,
			priority: frontmatter.priority,
		};
		if (frontmatter.due) fmObj.due = frontmatter.due;
		if (frontmatter.project) fmObj.project = frontmatter.project;
		if (frontmatter.tags && frontmatter.tags.length > 0)
			fmObj.tags = frontmatter.tags;
		if (frontmatter.parent) fmObj.parent = frontmatter.parent;
		fmObj.created = frontmatter.created;
		fmObj.updated = frontmatter.updated;

		const yamlStr = stringifyYaml(fmObj).trimEnd();
		let content = `---\n${yamlStr}\n---\n\n# ${input.title}\n`;

		if (input.description) {
			content += `\n${input.description}\n`;
		}

		return content;
	}

	private async ensureFolder(path: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing) return;

		await this.app.vault.createFolder(path);
	}
}
