# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

Obsidianプラグイン **Forge Works** (`forge-works`)。4つの機能モジュールを単一プラグインに統合:

- **AI** — Google Gemini AI統合。サイドバーチャット、ナレッジ活用、ファイル操作、チャット保存、インラインテキスト補完
- **Tasks** — タスク管理。リスト/カンバン/アイゼンハワーマトリックスビュー、コードブロックプロセッサ
- **Timer** — ポモドーロタイマー。ステータスバー表示、ログ記録、統計、サウンド/通知
- **Utils** — エディタユーティリティ。`@now` タイムスタンプ置換、フォーカスモード

各モジュールは設定で個別に有効/無効切替可能。

## 技術スタック

- **TypeScript** + **esbuild** (Obsidian公式プラグインパターン)
- **React 19** AI チャットUI・タスク管理UI用 (ObsidianのItemView内にマウント)
- **Google Gemini API** `@google/genai` パッケージ経由
- **CodeMirror 6** インライン補完、タイムスタンプ置換、フォーカスモード

## ビルドコマンド

```bash
cd forge-works
npm run dev      # ウォッチモード (インラインソースマップ付き)
npm run build    # プロダクションビルド (型チェック + minify)
```

または Makefile 経由:

```bash
make forge-works        # ビルド
make forge-works-dev    # ウォッチモード
```

出力: `forge-works/` に `main.js` (バンドル済みプラグイン), `manifest.json`, `styles.css`

## Obsidianでのテスト方法

`forge-works/main.js`, `forge-works/manifest.json`, `forge-works/styles.css` をテスト用Vaultの `.obsidian/plugins/forge-works/` にシンボリックリンクまたはコピーし、Obsidian設定でプラグインを有効化する。開発中の自動リロードには "Hot Reload" コミュニティプラグインを利用。

## アーキテクチャ

### 全体構成

モジュラーアーキテクチャ。各モジュールは `ForgeModule` インターフェースを実装し、統合エントリポイントから動的インポートされる。

```
forge-works/src/
├── main.ts                    # ForgeWorksPlugin (統合エントリポイント)
├── settings/
│   ├── settings.ts            # ForgeWorksSettings (全モジュール設定を包含)
│   └── settingsTab.ts         # セクション分け統合設定タブ
├── types/
│   └── module.ts              # ForgeModule インターフェース
└── modules/
    ├── ai/                    # AI モジュール
    ├── tasks/                 # Tasks モジュール
    ├── timer/                 # Timer モジュール
    └── utils/                 # Utils モジュール
```

### コア

- `src/main.ts` — `ForgeWorksPlugin` クラス。設定読込、モジュール有効/無効に応じた動的インポート・初期化、設定タブ登録
- `src/types/module.ts` — `ForgeModule` インターフェース (`onload(plugin, settings)`, `onunload()`, `onSettingsChange?()`)
- `src/settings/settings.ts` — `ForgeWorksSettings` 型。モジュール有効フラグ + 各モジュール設定のネスト構造
- `src/settings/settingsTab.ts` — 統合設定タブ。モジュール有効/無効トグル + 各モジュールの `render*Settings()` に委譲

### AI モジュール (`src/modules/ai/`)

- `index.ts` — `AIModule` クラス。ビュー、コマンド、イベント、EditorExtension登録
- `views/chatView.ts` — ItemViewサブクラス。Reactルートをマウント/アンマウント
- `views/filePickerModal.ts` — `FuzzySuggestModal` サブクラス。ナレッジファイル選択
- `views/components/` — Reactコンポーネント群。`AppContext.tsx` でObsidianの `App` をコンテキスト提供
- `services/` — `geminiService.ts` (APIストリーミング), `chatService.ts` (セッション/履歴), `fileOperationService.ts` (ファイル操作), `knowledgeService.ts` (ナレッジコンテキスト), `agentService.ts` (エージェント実行)
- `completion/` — ゴーストテキストインライン補完。`ghostText.ts`, `ghostTextState.ts`, `ghostTextWidget.ts`, `ghostTextKeymap.ts`, `completionProvider.ts`
- `utils/` — `commandParser.ts`, `markdownFormatter.ts`

### Tasks モジュール (`src/modules/tasks/`)

- `index.ts` — `TasksModule` クラス。3ビュー、6コマンド、コードブロックプロセッサ登録
- `views/` — `taskView.ts` (リスト), `kanbanView.ts` (カンバン), `matrixView.ts` (アイゼンハワーマトリックス)
- `views/components/` — React コンポーネント群
- `services/taskService.ts` — Vault内タスクの読取・書込・状態管理
- `codeblock/taskCodeBlockProcessor.ts` — `forge-tasks` コードブロックレンダラー

### Timer モジュール (`src/modules/timer/`)

- `index.ts` — `TimerModule` クラス。コマンド、ステータスバー、サウンド登録
- `services/` — `timerService.ts` (タイマーロジック), `logService.ts` (ログ記録), `statsService.ts` (統計集計)
- `ui/` — `statusBarItem.ts` (ステータスバー表示), `statsModal.ts`, `taskInputModal.ts`, `workNoteModal.ts`
- `utils/` — `sounds.ts` (WAVファイルロード), `formatUtils.ts`

### Utils モジュール (`src/modules/utils/`)

- `index.ts` — `UtilsModule` クラス。CM6 Extension 登録、フォーカスモードトグルコマンド
- `features/` — `timestampReplacer.ts` (`@now` 置換), `focusMode.ts` (フォーカスモード)
- `utils/dateFormatter.ts` — 日付フォーマット

## 主要なObsidian APIパターン

- **サイドバービュー**: `ItemView` をサブクラス化、`Plugin.registerView()` で登録、`Workspace.getRightLeaf()` で開く
- **Reactマウント**: `onOpen()` で `createRoot(this.contentEl)`、`onClose()` で `root.unmount()`
- **ファイル操作**: `Vault.create()`, `Vault.modify()`, `Vault.read()`, `Vault.process()` (アトミックな読み取り→変更→保存)
- **ファジー検索モーダル**: `FuzzySuggestModal<T>` をサブクラス化。ナレッジファイル選択UIに使用
- **インライン補完**: CodeMirror 6 の `ViewPlugin` + `StateField` + `Decoration.widget()` でゴーストテキスト表示。`Plugin.registerEditorExtension()` で登録
- **設定**: `PluginSettingTab` をサブクラス化、`Plugin.loadData()` / `Plugin.saveData()` で永続化。各モジュールの設定描画は `render*Settings(containerEl, settings, save)` 関数に委譲
- **モジュールパターン**: `ForgeModule` インターフェース実装。`onload(plugin, settings)` で `plugin.registerView()`, `plugin.addCommand()` 等を呼び出し。設定変更時は `onSettingsChange()` で再適用

## esbuild設定

- エントリ: `src/main.ts`
- フォーマット: CJS (Obsidianの要件)
- External: `obsidian`, `electron`, `@codemirror/*`, Node組み込みモジュール
- JSX: React (`tsx`/`ts` ローダー)
- Loader: `.wav`/`.mp3` → `dataurl` (Timer モジュールのサウンドファイル)

## 設計上の決定事項

- 4プラグインを1プラグインに統合し、配布を簡素化。各モジュールは設定で個別に有効/無効可能（変更後はリロード要）
- モジュールは `ForgeModule` インターフェースで統一。各モジュールの `index.ts` が `onload(plugin, settings)` でObsidian APIに登録
- 設定はネスト構造 (`ForgeWorksSettings.ai`, `.tasks`, `.timer`, `.utils`)。`loadSettings()` で deep merge して全キーを保証
- モジュールからの設定保存は `(this.plugin as any).saveSettings()` パターンで親プラグインに委譲
- AIによるファイル操作は実行前に必ずユーザーの明示的な確認が必要
- ナレッジファイルはユーザーが手動で選択する方式 (自動ではない)。セッション単位で保持。`FuzzySuggestModal` でファジー検索、Geminiプロンプトにコンテキストとして付加
- インライン補完はGitHub Copilot/Cursor風のゴーストテキスト方式。カーソル位置にグレーテキストで補完候補を表示。Tab で全文受け入れ、Esc で破棄、Cmd+→ で単語単位受け入れ。デバウンス制御 (デフォルト500ms)、ストリーミング表示、予測継続キャッシュ。コードブロック・フロントマター内では無効化。IME入力中は干渉しない
- ストリーミング応答は `generateContentStream()` でチャンク単位のリアルタイム表示
- `__prompt__.md` をVault内の任意のディレクトリに配置すると、システムプロンプトの先頭に追加。ルートの `__prompt__.md` は常に読み込まれる。サブディレクトリの `__prompt__.md` はチャットセッション内で +File / +Folder で明示的に追加したコンテキストのディレクトリにある場合のみ読み込まれる。ファイル変更・作成・削除・リネームを自動検知
- ウェブ検索はGemini APIの Google Search Grounding (`tools: [{ googleSearch: {} }]`) を利用。追加APIキー不要。設定でオン/オフ切替可能（デフォルト: オフ）。チャット・エージェント両方に適用。検索ソースはメッセージ下部にリンク表示
- 設計ドキュメントと決定記録は `docs/` に保管

## リポジトリ構成

```
obsidian-plugin/
├── forge-works/          # 統合プラグイン (メイン)
├── forge-ai/             # 旧AIプラグイン (非推奨・統合済み)
├── forge-tasks/          # 旧タスクプラグイン (非推奨・統合済み)
├── forge-timer/          # 旧タイマープラグイン (非推奨・統合済み)
├── forge-utils/          # 旧ユーティリティプラグイン (非推奨・統合済み)
├── promotion/            # プロモーションサイト
├── Makefile              # 全プラグイン統合ビルド
└── CLAUDE.md             # このファイル
```

## 開発を進める上での注意点
- 1コミット1機能を原則とする
- 機能追加の度にドキュメント類（README.md、 docs/）などを最新に更新する
- コミットの際は[feat/fix/chore/refactor/docs]などのプレフィックスを先頭につける

## 言語方針
- ドキュメント (`docs/`, `CLAUDE.md`) は日本語
- コード中の変数名・コメントは英語
- コミットメッセージは日本語
