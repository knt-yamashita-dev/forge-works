import type { TranslationKey } from "./en";

export const ja: Record<TranslationKey, string> = {
	// === メイン設定 ===
	"modules.title": "モジュール",
	"modules.ai.name": "AIチャット & 補完",
	"modules.ai.desc":
		"AIチャットアシスタント。ナレッジコンテキスト、インライン補完対応（要再起動）",
	"modules.tasks.name": "タスク管理",
	"modules.tasks.desc":
		"カンバンボード、マトリックスビュー、1タスク1ファイル方式のタスクリスト（要再起動）",
	"modules.timer.name": "ポモドーロタイマー",
	"modules.timer.desc":
		"セッションログと統計機能付きポモドーロタイマー（要再起動）",
	"modules.utils.name": "エディタユーティリティ",
	"modules.utils.desc":
		"@now タイムスタンプ置換、フォーカスモードなど（要再起動）",

	// タブラベル
	"tab.ai": "AI",
	"tab.tasks": "タスク",
	"tab.timer": "タイマー",
	"tab.utils": "ユーティリティ",

	// === AI設定 ===
	"ai.apiKey.name": "Gemini APIキー",
	"ai.apiKey.desc": "Google AI StudioのAPIキーを入力",
	"ai.model.name": "モデル",
	"ai.model.desc": "使用するGeminiモデル",
	"ai.systemPrompt.name": "システムプロンプト",
	"ai.systemPrompt.desc": "AIの動作を定義するシステムプロンプト",
	"ai.savePath.name": "チャット保存フォルダ",
	"ai.savePath.desc": "チャットファイルの保存先フォルダパス",
	"ai.confirmOps.name": "ファイル操作の確認",
	"ai.confirmOps.desc":
		"AIがファイルを作成・編集する前に確認ダイアログを表示",
	"ai.maxKnowledge.name": "最大ナレッジファイル数",
	"ai.maxKnowledge.desc":
		"セッションごとにコンテキストとして添付できる最大ファイル数",
	"ai.webSearch.heading": "ウェブ検索",
	"ai.webSearch.name": "ウェブ検索を有効化",
	"ai.webSearch.desc":
		"質問への回答時にGoogle検索でウェブを検索することを許可。既存のGemini APIキーを使用。",
	"ai.completion.heading": "インライン補完",
	"ai.completion.enable.name": "インライン補完を有効化",
	"ai.completion.enable.desc":
		"エディタでの入力中にAIによるテキスト補完を表示",
	"ai.completion.delay.name": "補完遅延",
	"ai.completion.delay.desc":
		"入力停止から補完リクエストまでの待機時間（ミリ秒、100-2000）",
	"ai.completion.streaming.name": "ストリーミング補完",
	"ai.completion.streaming.desc":
		"AIからのストリーミングに合わせて補完テキストを逐次表示（低遅延）",
	"ai.agent.heading": "エージェントモード",
	"ai.agent.enable.name": "エージェントモードを有効化",
	"ai.agent.enable.desc":
		"AIがファイル操作を含む複数ステップのタスクを自律的に実行することを許可",
	"ai.agent.maxSteps.name": "最大エージェントステップ数",
	"ai.agent.maxSteps.desc":
		"1タスクでエージェントが実行できる最大ステップ数（1-20）",
	"ai.agent.autoApprove.name": "ファイル操作の自動承認",
	"ai.agent.autoApprove.desc":
		"確認なしでファイル操作を自動実行（エージェントモードのみ）",
	"ai.agent.pauseOnError.name": "エラー時に一時停止",
	"ai.agent.pauseOnError.desc":
		"エラー発生時に完全に失敗せず、エージェントの実行を一時停止",
	"ai.maxOps.name": "メッセージあたり最大操作数",
	"ai.maxOps.desc":
		"1回のAI応答で許可されるファイル操作の最大数（1-20）",

	// === タスク設定 ===
	"tasks.folder.name": "タスクフォルダ",
	"tasks.folder.desc": "タスクファイルの保存先フォルダパス",
	"tasks.priority.name": "デフォルト優先度",
	"tasks.priority.desc": "新規タスクのデフォルト優先度",
	"tasks.priority.low": "低",
	"tasks.priority.medium": "中",
	"tasks.priority.high": "高",
	"tasks.priority.urgent": "緊急",
	"tasks.status.name": "デフォルトステータス",
	"tasks.status.desc": "新規タスクのデフォルトステータス",
	"tasks.project.name": "デフォルトプロジェクト",
	"tasks.project.desc":
		"新規タスクのデフォルトプロジェクト（空欄 = なし）",
	"tasks.tags.name": "デフォルトタグ",
	"tasks.tags.desc":
		"新規タスクのデフォルトタグ（カンマ区切り、空欄 = なし）",
	"tasks.showCompleted.name": "完了タスクを表示",
	"tasks.showCompleted.desc":
		"タスクリストに「完了」ステータスのタスクを表示",
	"tasks.retention.name": "完了タスク保持期間（日）",
	"tasks.retention.desc":
		"指定日数より古い完了タスクを非表示（0 = 常に表示）",
	"tasks.customStatuses.heading": "カスタムステータス",
	"tasks.customStatuses.builtIn": "（組み込み）",
	"tasks.customStatuses.moveUp": "上に移動",
	"tasks.customStatuses.moveDown": "下に移動",
	"tasks.customStatuses.remove": "削除",
	"tasks.customStatuses.add": "カスタムステータスを追加",
	"tasks.customStatuses.addBtn": "追加",
	"tasks.kanban.heading": "カンバン / マトリックス カラム",
	"tasks.kanban.desc":
		"カンバンビューとマトリックスビューにカラムとして表示するステータスを選択。",

	// === タイマー設定 ===
	"timer.timer.heading": "タイマー",
	"timer.workDuration.name": "作業時間",
	"timer.workDuration.desc": "集中セッションの長さ（分）",
	"timer.shortBreak.name": "短い休憩",
	"timer.shortBreak.desc": "短い休憩の長さ（分）",
	"timer.longBreak.name": "長い休憩",
	"timer.longBreak.desc": "長い休憩の長さ（分）",
	"timer.pomodorosBeforeLong.name": "長い休憩までのポモドーロ数",
	"timer.pomodorosBeforeLong.desc":
		"長い休憩を取るまでの作業セッション数",
	"timer.autoStart.heading": "自動開始",
	"timer.autoStartBreak.name": "休憩を自動開始",
	"timer.autoStartBreak.desc":
		"作業セッション終了後に自動的に休憩を開始",
	"timer.autoStartWork.name": "作業を自動開始",
	"timer.autoStartWork.desc": "休憩終了後に自動的に作業セッションを開始",
	"timer.logging.heading": "ログ",
	"timer.enableLogging.name": "ログを有効化",
	"timer.enableLogging.desc": "完了したポモドーロセッションを記録",
	"timer.workNote.name": "作業メモを記録",
	"timer.workNote.desc":
		"各集中セッション後に作業内容を記録するモーダルを表示",
	"timer.logPath.name": "ログファイルパス",
	"timer.logPath.desc":
		"ログファイルのパス（例: Pomodoro/Log.md）",
	"timer.dailyNote.name": "デイリーノートに記録",
	"timer.dailyNote.desc":
		"ログファイルの代わりにデイリーノートにログを追記",
	"timer.logFormat.name": "ログ形式",
	"timer.logFormat.desc": "ログエントリの形式",
	"timer.logFormat.table": "テーブル",
	"timer.logFormat.list": "リスト",
	"timer.dailyHeading.name": "デイリーノート見出し",
	"timer.dailyHeading.desc":
		"デイリーノートでログを追記する見出し",
	"timer.sound.heading": "サウンド",
	"timer.enableSound.name": "サウンドを有効化",
	"timer.enableSound.desc": "フェーズ完了時にサウンドを再生",
	"timer.soundWorkEnd.name": "作業終了サウンド",
	"timer.soundWorkEnd.desc": "集中セッション終了時にサウンドを再生",
	"timer.soundBreakEnd.name": "休憩終了サウンド",
	"timer.soundBreakEnd.desc": "休憩終了時にサウンドを再生",
	"timer.volume.name": "音量",
	"timer.volume.desc": "サウンドの音量（0-100）",
	"timer.notifications.heading": "通知",
	"timer.notice.name": "通知を表示",
	"timer.notice.desc": "フェーズ完了時にObsidianの通知を表示",
	"timer.systemNotification.name": "システム通知",
	"timer.systemNotification.desc":
		"フェーズ完了時にOS通知を送信。Obsidianが非アクティブでも表示されます。",
	"timer.task.heading": "タスク",
	"timer.defaultTask.name": "デフォルトタスク",
	"timer.defaultTask.desc": "新規セッションのデフォルトタスク名",
	"timer.rememberTask.name": "最後のタスクを記憶",
	"timer.rememberTask.desc":
		"プラグイン起動時に最後に使用したタスク名を復元",

	// === ユーティリティ設定 ===
	"utils.dateFormat.name": "日付フォーマット",
	"utils.dateFormat.desc":
		"@now 置換のフォーマット。トークン: YYYY, MM, DD, HH, mm, ss",
	"utils.dateFormat.preview": "プレビュー",
	"utils.focusMode.heading": "フォーカスモード",
	"utils.focusMode.enable.name": "フォーカスモードを有効化",
	"utils.focusMode.enable.desc":
		"カーソルのある段落以外を暗くする。コマンドパレットからも切替可能。",
	"utils.focusMode.opacity.name": "暗転テキストの不透明度",
	"utils.focusMode.opacity.desc":
		"非フォーカス段落の不透明度（0.0 = 非表示、1.0 = 完全表示）",
	"utils.floatingToc.heading": "フローティング目次",
	"utils.floatingToc.enable.name": "フローティング目次を有効化",
	"utils.floatingToc.enable.desc":
		"スクロール時にフローティング目次を表示。現在位置の見出しをハイライト。コマンドパレットからも切替可能。",
	"utils.floatingToc.fadeDelay.name": "フェード遅延",
	"utils.floatingToc.fadeDelay.desc":
		"スクロール停止後にTOCを非表示にするまでの秒数（1–10）",
};
