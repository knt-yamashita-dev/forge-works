# プラグイン配布方法

コミュニティプラグイン登録以外の配布手段をまとめる。

作成日: 2026-02-26

---

## 1. BRAT (Beta Reviewer's Auto-update Tool) 経由

[BRAT](https://github.com/TfTHacker/obsidian42-brat) はコミュニティプラグインとして公開されているツールで、未登録のプラグインをGitHubリポジトリのURLだけでインストール・自動更新できる。

- ユーザーがBRATをインストール済みであれば、`knt-yamashita-dev/forge-ai` のようにリポジトリパスを入力するだけ
- GitHub Releaseに `main.js`, `manifest.json`, `styles.css` が公開されていれば動作する
- コミュニティ審査前のベータ配布に最適
- 自動アップデートも対応

## 2. 手動インストール

GitHub Releasesページから直接ファイルをダウンロードしてもらう方法。

1. ユーザーがGitHub Releasesから `main.js`, `manifest.json`, `styles.css` をダウンロード
2. Vaultの `.obsidian/plugins/forge-ai/` にコピー
3. Obsidian設定でプラグインを有効化

技術に慣れたユーザー向けだが、審査不要で即配布可能。

## 3. 自サイト / プロモーションサイトでの配布

`promotion/` の Next.js サイトからダウンロードリンクやインストール手順を案内する。

---

## おすすめの戦略

| フェーズ | 方法 | 目的 |
|----------|------|------|
| 開発中〜審査前 | BRAT + 手動インストール | 早期ユーザーからフィードバック収集 |
| 審査中 | BRAT + プロモーションサイト | 待ち時間中もユーザー獲得 |
| 審査通過後 | コミュニティプラグイン | 最大のリーチ |

コミュニティ申請に必要なGitHub Releaseの準備（公開計画の Phase 4）は、BRATや手動インストールにもそのまま使える。Phase 1〜4 を進めれば、コミュニティ審査を待たずにすぐ配布を開始できる。

## 参考リンク

- [BRAT - GitHub](https://github.com/TfTHacker/obsidian42-brat)
- [How to install plugins from GitHub - Obsidian Forum](https://forum.obsidian.md/t/how-to-install-plugins-from-github/50505/2)
- [Plugin Submission Guide - DeepWiki](https://deepwiki.com/obsidianmd/obsidian-releases/6.1-plugin-submission-guide)
