# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

Obsidianプラグイン **VaultSense** (`vaultsense`)。Google Gemini AIを統合し、サイドバーチャット、ナレッジ活用、ファイル操作、チャット保存、インラインテキスト補完を提供する。

## 技術スタック

- **TypeScript** + **esbuild** (Obsidian公式プラグインパターン)
- **React 18** サイドバーチャットUI用 (ObsidianのItemView内にマウント)
- **Google Gemini API** `@google/genai` パッケージ経由

## ビルドコマンド

```bash
npm run dev      # ウォッチモード (インラインソースマップ付き)
npm run build    # プロダクションビルド (型チェック + minify)
```

出力: プロジェクトルートに `main.js` (バンドル済みプラグイン), `manifest.json`, `styles.css`

## Obsidianでのテスト方法

`main.js`, `manifest.json`, `styles.css` をテスト用Vaultの `.obsidian/plugins/vaultsense/` にシンボリックリンクまたはコピーし、Obsidian設定でプラグインを有効化する。開発中の自動リロードには "Hot Reload" コミュニティプラグインを利用。

## アーキテクチャ

3層構造: **UI Layer** → **Service Layer** → **Obsidian Platform**

- `src/main.ts` — プラグインエントリポイント。ビュー、コマンド、設定、EditorSuggestを登録
- `src/views/chatView.ts` — ItemViewサブクラス。`this.contentEl` にReactルートをマウント/アンマウント
- `src/views/filePickerModal.ts` — `FuzzySuggestModal` サブクラス。ナレッジファイル選択用のファジー検索モーダル
- `src/views/components/` — Reactコンポーネント群。`AppContext.tsx` でObsidianの `App` をReactコンテキストとして提供
- `src/services/` — ビジネスロジック。`geminiService.ts` (APIストリーミング), `chatService.ts` (セッション/履歴), `fileOperationService.ts` (ファイル作成/編集/追記), `knowledgeService.ts` (ナレッジファイル読み取り・コンテキスト構築)
- `src/types/` — 共有TypeScript型定義。`chat.ts` (`ChatMessage`, `ChatSession`), `fileOperation.ts` (`FileOperationRequest`, `FileOperationStatus`)
- `src/completion/` — `inlineCompletionSuggest.ts` (`EditorSuggest` サブクラス。デバウンス付きAIインライン補完)
- `src/utils/` — `commandParser.ts` (AI応答からファイル操作コマンドを検出・パース・除去), `markdownFormatter.ts` (チャットをMarkdownに変換)

## 主要なObsidian APIパターン

- **サイドバービュー**: `ItemView` をサブクラス化、`Plugin.registerView()` で登録、`Workspace.getRightLeaf()` で開く
- **Reactマウント**: `onOpen()` で `createRoot(this.contentEl)`、`onClose()` で `root.unmount()`
- **ファイル操作**: `Vault.create()`, `Vault.modify()`, `Vault.read()`, `Vault.process()` (アトミックな読み取り→変更→保存)
- **ファジー検索モーダル**: `FuzzySuggestModal<T>` をサブクラス化。ナレッジファイル選択UIに使用
- **インライン補完**: `EditorSuggest` をサブクラス化、`Plugin.registerEditorSuggest()` で登録
- **設定**: `PluginSettingTab` をサブクラス化、`Plugin.loadData()` / `Plugin.saveData()` で永続化

## esbuild設定

- エントリ: `src/main.ts`
- フォーマット: CJS (Obsidianの要件)
- External: `obsidian`, `electron`, `@codemirror/*`, Node組み込みモジュール
- JSX: React (`tsx`/`ts` ローダー)

## 設計上の決定事項

- AIによるファイル操作は実行前に必ずユーザーの明示的な確認が必要
- ナレッジファイルはユーザーが手動で選択する方式 (自動ではない)。セッション単位で保持。`FuzzySuggestModal` でファジー検索、Geminiプロンプトにコンテキストとして付加
- インライン補完はデバウンス制御 (デフォルト500ms) でAPI呼び出しを抑制。コードブロック内では無効化。`onTrigger()` 内でデバウンスを管理し、入力中は `null` を返してサジェストサイクルを停止。デバウンス完了後にエディタをナッジ (ゼロ幅スペースの挿入＆削除) して `onTrigger()` を再評価させ、`getSuggestions()` が1回だけ呼ばれる方式
- ストリーミング応答は `generateContentStream()` でチャンク単位のリアルタイム表示
- `__prompt__.md` をVault内の任意のディレクトリに配置すると、システムプロンプトの先頭に自動読み込み。サブディレクトリにも配置可能で、エディタでアクティブなファイルのパス階層に基づき、ルートから該当ディレクトリまでの全 `__prompt__.md` を連結。深い階層のファイルが後に追加されるため優先度が高い。ファイル変更・作成・削除・リネームを自動検知
- 設計ドキュメントと決定記録は `docs/` に保管

## 開発を進める上での注意点
- 1コミット1機能を原則とする
- 機能追加の度にドキュメント類（README.md、 docs/）などを最新に更新する
- コミットの際は[feat/fix/chore/refactor/docs]などのプレフィックスを先頭につける

## 言語方針
- ドキュメント (`docs/`, `CLAUDE.md`) は日本語
- コード中の変数名・コメントは英語
- コミットメッセージは日本語
