### [設計チェック]
- [ ] PR本文に目的とスコープが明記され、plan から逸脱していない
- [ ] PR本文に変更点を要約し、互換性リスクとロールバック方法を記載
- [ ] 設計書は実装イシューの実行指示書として完結しており、追加の設計・検討を要求する記述を含んでいない
- [ ] PR本文に判断が必要な点・未確定事項・今後の課題を明記している
- [ ] ドキュメント（SSOT / ADR）が必要に応じて更新済み

### [コーディング(製造)チェック]
- [ ] `npm run lint` が 0 violations
- [ ] `npm run typecheck` が成功
- [ ] `npm run compile` が成功
- [ ] `npm test`（`vscode-test`）が PASS
- [ ] `npm audit` で脆弱性がない（または許容済みの根拠を記載）
- [ ] UI層（tree/commands）は `api/` の具象クライアントを直接 `new` していない
- [ ] Extension Hostのイベントループをブロックする同期的重い処理を追加していない（外部I/Oは`async/await`）
- [ ] Secrets/PII（Personal Access Token等の実値）がコード・ログ・テストデータに含まれていない
- [ ] planに記載のない変更を含んでいない
