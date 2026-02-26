# コミュニティプラグイン公開計画

対象プラグイン: **forge-ai**, **forge-tasks**

作成日: 2026-02-26

---

## 現状の課題

### リポジトリ構造の問題

現在はモノレポ（`obsidian-plugin/` に forge-ai, forge-tasks, forge-utils, forge-timer が同居）だが、Obsidianコミュニティプラグインの公開にはプラグインごとに独立したGitHubリポジトリが必要（`community-plugins.json` に `repo: "user/repo"` を登録するため）。

### 不足しているもの

| 項目 | forge-ai | forge-tasks |
|------|----------|-------------|
| LICENSE ファイル | なし | なし |
| README.md | なし | あり（日本語） |
| `authorUrl` in manifest | なし | なし |
| GitHub Actions (リリース自動化) | なし | なし |
| ネットワーク利用の開示 (README) | - | - |
| `minAppVersion` の正確性 | 要確認 | 要確認 |

---

## Phase 1: リポジトリ分離

各プラグインを独立したGitHubリポジトリに分離する。

1. `forge-ai` 用の新リポジトリ作成 — `knt-yamashita-dev/forge-ai`
2. `forge-tasks` 用の新リポジトリ作成 — `knt-yamashita-dev/forge-tasks`
3. 各プラグインディレクトリの内容を新リポジトリに移行（`git subtree split` または手動コピー）
4. 元のモノレポはプライベートのまま開発用に残すか、アーカイブする

## Phase 2: 必須ファイルの整備

### 両プラグイン共通

5. **LICENSE ファイル追加** — MIT License が一般的（https://choosealicense.com で選択）
6. **manifest.json の更新**
   - `description` をガイドラインに準拠（動詞で始める、250文字以内、末尾ピリオド、"Obsidian" を含めない）
   - `minAppVersion` を実際に使用しているAPIに合わせて更新（CodeMirror 6拡張を使うなら `1.0.0` 以上が必要）
   - `authorUrl` を追加（任意）
7. **versions.json 作成** — バージョンごとの最低Obsidianバージョンを記録

### forge-ai 固有

8. **README.md 作成**
   - プラグインの目的と機能説明
   - インストール方法・使い方
   - **Google Gemini APIへの接続を開示**（開発者ポリシーで必須）
   - APIキーの取得方法と設定手順
   - スクリーンショット

### forge-tasks 固有

9. **README.md の英語化 or バイリンガル化** — 国際的なユーザーベース向け
10. スクリーンショット追加

## Phase 3: コード品質レビュー

Obsidianレビュアーのチェック項目に沿ってコードを確認・修正。

11. **セキュリティ確認** — `innerHTML` / `outerHTML` の不使用、DOM要素はプログラマティックに生成
12. **リソース管理** — `onunload()` で全リソース解放、`registerEvent()` / `addCommand()` の使用
13. **コード品質** — `var` 不使用、不要な `console.log` 削除、テンプレートコード残存なし
14. **モバイル互換性** — `isDesktopOnly: false` なら Node.js/Electron API 不使用を確認
15. **UI ガイドライン** — sentence case の使用、ハードコードスタイル排除、デフォルトホットキー未設定

## Phase 4: GitHub Release 作成

16. **GitHub Actions ワークフロー追加** — タグプッシュで自動リリース
    ```yaml
    on:
      push:
        tags: ["*"]
    ```
17. **バージョンを `1.0.0` に更新**（manifest.json, package.json）
18. **タグ作成とプッシュ** — `git tag 1.0.0 && git push origin 1.0.0`
19. **リリースを公開** — `main.js`, `manifest.json`, `styles.css` が個別アセットとして含まれることを確認

## Phase 5: 動作テスト

20. **マルチプラットフォームテスト**
    - macOS（メイン開発環境）
    - Windows（可能であれば）
    - Linux（可能であれば）
    - モバイル（`isDesktopOnly: false` の場合）
21. GitHubリリースからの手動インストールテスト（BRAT プラグイン利用も可）

## Phase 6: コミュニティプラグイン申請

22. [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) をフォーク
23. `community-plugins.json` の末尾にエントリ追加
    ```json
    {
      "id": "forge-ai",
      "name": "ForgeAI",
      "author": "yamashita",
      "description": "Chat with AI using knowledge context and get inline text completion powered by Google Gemini.",
      "repo": "knt-yamashita-dev/forge-ai"
    }
    ```
24. PR作成 — タイトル `Add plugin: ForgeAI`
25. PRテンプレートのチェックリストを完了
26. 自動バリデーションの通過を確認
27. レビュアーのフィードバックに対応
28. forge-tasks も同様に別PRで申請

## Phase 7: 公開後

29. [Obsidian Forum](https://forum.obsidian.md/c/share-showcase/9) で告知
30. Obsidian Discord の `#updates` チャンネルで告知（`developer` ロール取得後）
31. プロモーションサイト（`promotion/`）の更新

---

## 注意事項

- PRが30日間放置されると stale ラベル、45日で自動クローズされるため、レビューコメントには迅速に対応
- forge-ai はネットワーク通信の開示が必須（Google Gemini API）
- **forge-tasks を先に申請するのがおすすめ**（外部API依存がなくレビューが通りやすい）
- Plugin ID (`forge-ai`, `forge-tasks`) の重複がないか [community-plugins.json](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json) で事前確認が必要

## 参考リンク

- [Submit your plugin - 公式ドキュメント](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Submission requirements](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Developer policies](https://docs.obsidian.md/Developer+policies)
- [Release your plugin with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)
- [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases)
- [Manifest reference](https://docs.obsidian.md/Reference/Manifest)
