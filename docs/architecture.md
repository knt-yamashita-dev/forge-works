# アーキテクチャ概要

> 最終更新: 2026-02-13

---

## 1. レイヤー構成

本プラグインは3層構造で設計する。

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                        │
│  chatView.ts (ItemView) → React Components      │
│  inlineCompletionSuggest.ts (EditorSuggest)     │
│  settingsTab.ts (PluginSettingTab)              │
├─────────────────────────────────────────────────┤
│                Service Layer                     │
│  geminiService.ts    … Gemini APIとの通信        │
│  chatService.ts      … チャットセッション管理    │
│  knowledgeService.ts … Vaultファイル読み取り      │
│  fileOperationService.ts … ファイル作成・編集    │
├─────────────────────────────────────────────────┤
│              Obsidian Platform                   │
│  app.vault (ファイル操作)                        │
│  app.workspace (UI操作)                          │
│  Plugin lifecycle (onload / onunload)            │
└─────────────────────────────────────────────────┘
```

**各レイヤーの責務:**
- **UI Layer**: ユーザーとのインタラクション。表示と入力の管理
- **Service Layer**: ビジネスロジック。API通信、データ変換、セッション管理
- **Obsidian Platform**: Obsidianが提供するAPI群。直接は触らずService経由で使う

---

## 2. ファイル構成とモジュール責務

```
src/
├── main.ts                         # エントリポイント
│                                    # - Plugin サブクラス
│                                    # - 各ビュー、コマンド、サービスの登録
│                                    # - プラグインのライフサイクル管理
│
├── settings/
│   ├── settings.ts                 # 設定の型定義 (AIAssistantSettings)
│   │                                # デフォルト値 (DEFAULT_SETTINGS)
│   └── settingsTab.ts              # 設定画面の描画 (PluginSettingTab)
│
├── services/
│   ├── geminiService.ts            # Gemini API通信
│   │                                # - generateResponse(): ストリーミング応答
│   │                                # - getCompletion(): インライン補完
│   │                                # - summarize(): テキスト要約
│   │
│   ├── chatService.ts              # チャットセッション管理
│   │                                # - メッセージ履歴の保持
│   │                                # - Gemini API形式への変換
│   │                                # - セッションの作成・切り替え
│   │
│   ├── knowledgeService.ts         # ナレッジファイル管理
│   │                                # - Vaultファイルの検索
│   │                                # - ファイル内容の読み取り
│   │                                # - コンテキスト構築
│   │
│   └── fileOperationService.ts     # ファイル操作
│                                    # - ファイル作成 / 編集 / 追記
│                                    # - パスのバリデーション
│
├── views/
│   ├── chatView.ts                 # サイドバーチャットビュー
│   │                                # - ItemView サブクラス
│   │                                # - React ルートのマウント/アンマウント
│   │
│   └── components/                 # Reactコンポーネント群
│       ├── AppContext.tsx           # Obsidian App をReactコンテキストで共有
│       ├── ChatContainer.tsx       # チャットUI全体のルートコンポーネント
│       ├── ChatMessage.tsx         # 1件のメッセージ表示
│       ├── ChatInput.tsx           # メッセージ入力欄
│       ├── StreamingMessage.tsx    # ストリーミング中のメッセージ表示
│       ├── KnowledgeSelector.tsx   # ナレッジファイル選択UI
│       └── FileOperationConfirm.tsx # ファイル操作確認ダイアログ
│
├── completion/
│   └── inlineCompletionSuggest.ts  # EditorSuggest によるインライン補完
│                                    # - デバウンス制御
│                                    # - 周辺テキストのコンテキスト取得
│
├── types/
│   ├── chat.ts                     # ChatMessage, ChatSession 型定義
│   └── fileOperation.ts            # FileOperationRequest 型定義
│
└── utils/
    ├── commandParser.ts            # AI応答からファイル操作コマンドを検出・解析
    └── markdownFormatter.ts        # ChatMessage[] → Markdown文字列 変換
```

---

## 3. データフロー

### 3.1 チャットメッセージの流れ

```
[ユーザー入力]
    │
    ▼
ChatInput.tsx  ─── メッセージテキスト ──→  ChatContainer.tsx
                                              │
                                              ▼
                                         chatService.ts
                                         (履歴にメッセージ追加)
                                              │
                                              ▼
                                         geminiService.ts
                                         (ストリーミングAPI呼び出し)
                                              │
                                    チャンクごとにコールバック
                                              │
                                              ▼
                                     StreamingMessage.tsx
                                     (リアルタイム表示)
                                              │
                                         完了後
                                              │
                                              ▼
                                     ChatMessage.tsx
                                     (確定メッセージとして表示)
```

### 3.2 ナレッジ活用の流れ

```
[ファイル選択UI]
    │
    ▼
KnowledgeSelector.tsx ── 選択ファイルパス ──→ knowledgeService.ts
                                                  │
                                            ファイル内容読み取り
                                                  │
                                                  ▼
                                             geminiService.ts
                                             (プロンプトにファイル内容を含めて送信)
```

### 3.3 ファイル操作の流れ

```
[AI応答]
    │
    ▼
commandParser.ts ── 操作コマンド検出 ──→ FileOperationConfirm.tsx
                                              │
                                        ユーザーが承認
                                              │
                                              ▼
                                       fileOperationService.ts
                                       (Vault APIでファイル操作実行)
```

---

## 4. 主要な型定義

```typescript
// チャットメッセージ
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  knowledgeFiles?: string[];      // コンテキストに使ったファイルパス
  isStreaming?: boolean;          // ストリーミング中フラグ
  fileOperation?: FileOperationRequest;
}

// チャットセッション
interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  title?: string;
}

// ファイル操作リクエスト
interface FileOperationRequest {
  type: 'create' | 'edit' | 'append';
  targetPath: string;
  content: string;
  reason: string;
  confirmed: boolean;
}

// プラグイン設定
interface AIAssistantSettings {
  apiKey: string;
  model: 'gemini-2.0-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  enableInlineCompletion: boolean;
  completionDebounceMs: number;
  maxKnowledgeFiles: number;
  defaultSavePath: string;
  confirmFileOperations: boolean;
  streamingEnabled: boolean;
}
```

---

## 5. ビルド成果物

esbuildが `src/main.ts` を起点に全モジュールをバンドルし、以下を出力する:

```
プロジェクトルート/
├── main.js        ← バンドルされたプラグインコード (これをObsidianが読む)
├── manifest.json  ← プラグインメタデータ
└── styles.css     ← スタイルシート
```

Obsidianは `.obsidian/plugins/<plugin-id>/` 配下の `main.js` + `manifest.json` を読み込んでプラグインとして実行する。
