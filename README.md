# Cardif Pilot｜法巴智慧保險服務導覽助手

2026 第四屆法國巴黎人壽校園黑客松　題目 2-2「智慧知識與服務導覽助手」競賽原型。
**本專案為大學競賽原型，非法國巴黎人壽官方產品。**

> 問一句，就到位：使用者用自己的話提問，系統依法國巴黎人壽官方頁面回答「去哪裡、怎麼辦、要準備什麼」，並附上資料來源。

## 快速開始

```bash
npm install
cp .env.example .env     # Gemini 金鑰為選填；未設定時仍可完整示範
npm run dev              # http://localhost:3000
```

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發模式（Express + Vite） |
| `npm run build` && `npm start` | 正式模式 |
| `npm test` | 執行 50 項自動測試 |
| `npm run lint` | TypeScript 型別檢查 |

需要 Node.js 20 以上。

## 系統架構

```
接觸層    官網訪客 ／ My Cardif・App 會員 ／ 通路夥伴（理專）   ← 前端可切換三種入口
   │
API 閘道  通路識別（channel）・通路金鑰（X-Api-Key）・速率限制・輸入長度限制
   │
對話編排  ① 個資遮罩 → ② 安全防護 → ③ 模糊請求澄清 → ④ 混合檢索
          → ⑤（選用）Gemini 在候選中判斷意圖、改寫標題摘要 → ⑥ 組成回答卡
   │
能力服務  問答（附來源）・導航（深連結）・流程引導（步驟＋應備文件）・轉真人／預約回電
   │
知識資料  20 項服務 × 8 個官方頁面；每句事實都標註來源
治理      稽核紀錄（只存遮罩後問句）・滿意度回饋・熱點與無解問題報表
```

### 檔案結構

```
server.ts                      伺服器進入點
src/shared/                    前後端共用型別與官方聯絡資訊
src/data/officialSources.ts    官方資料來源（附核對日期）
src/data/knowledgeBase.ts      服務功能知識庫（每句事實皆有 sourceId）
src/core/text.ts               正規化與中文 bigram 斷詞
src/core/retrieval.ts          混合檢索（關鍵詞片語 + BM25）
src/core/guardrails.ts         個資遮罩、理賠保證／投資建議／提示注入攔截
src/core/businessHours.ts      客服時間判斷與轉真人
src/core/navigator.ts          對話編排與回答卡組裝
src/server/geminiService.ts    Gemini 意圖判斷與改寫（含事實檢查）
src/server/infra.ts            LRU 快取、速率限制、工作階段、稽核與洞察
src/server/app.ts              REST API
src/client/                    React 前端
tests/                         自動測試
```

## 設計重點：只根據官方內容回答

1. **知識庫每句事實都有出處。** `knowledgeBase.ts` 中每一句摘要、步驟、文件、注意事項都標註 `sourceId`，對應 `officialSources.ts` 的官方頁面與核對日期。測試會檢查沒有出處的事實與非官方網址。
2. **步驟、文件與連結一律來自知識庫。** Gemini 只能（a）在檢索候選中挑選服務、（b）改寫標題與摘要。
3. **改寫內容會做事實檢查。** 不得出現網址；其中的數字必須都出現在知識庫事實裡，否則捨棄改寫、改用原文（`isGroundedRewrite`）。
4. **資訊不足就不硬答。** 官方頁面沒寫清楚的服務標示「需要進一步確認」並建議轉真人；查無對應服務時回覆「目前無法確認」，並提供客服專線或預約回電。

## API

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/health` | 系統狀態、Gemini 是否啟用、知識庫核對日期 |
| POST | `/api/v1/navi/sessions` | 建立對話，body：`{ channel: "web" \| "app" \| "partner" }` |
| POST | `/api/v1/navi/sessions/:id/messages` | body：`{ query }` 或 `{ selectedServiceId }`，回傳回答卡 |
| GET | `/api/v1/navi/catalog/functions?q=&channel=` | 服務功能目錄（可搜尋） |
| GET | `/api/v1/navi/sources` | 官方資料來源清單 |
| POST | `/api/v1/navi/handoff` | 營業時間內回傳撥打資訊；非營業時間建立預約回電單 |
| POST | `/api/v1/navi/feedback` | `{ messageId, rating: "up" \| "down" }` |
| GET | `/api/v1/navi/insights` | 熱點服務、無解問題、回饋統計（需 `X-Admin-Key`） |

通路夥伴模式需在 header 帶 `X-Api-Key`（環境變數 `PARTNER_API_KEYS`）。

回答卡（`AnswerCard`）主要欄位：`type`（SERVICE／CLARIFY／NO_MATCH／GUARDRAIL）、`status`、`headline`、`summary`、`steps`、`documents`、`notes`、`primaryAction`、`citations`、`clarificationOptions`、`handoff`、`maskedPiiTypes`、`engine`、`latencyMs`（實際量測）、`retrieval`（檢索分數）。

## 與提案簡報的對應

| 簡報內容 | 實作狀態 |
|---|---|
| 一個大腦、三個入口 | ✅ 同一個知識庫與 API，前端可切換官網／會員／理專 |
| 問答・導航・引導・轉接四種能力 | ✅ 回答卡含摘要＋來源、深連結、步驟與文件、轉真人／預約回電 |
| 混合檢索（Hybrid） | ✅ 關鍵詞片語比對＋BM25（字元 bigram）；向量檢索列為後續擴充 |
| 服務功能目錄（唯一網址、登入需求、通路） | ✅ `knowledgeBase.ts`＋`/catalog/functions` |
| 意圖判斷＋信心門檻＋澄清 | ✅ 檢索分數門檻與相近度判斷；模糊請求提供選項 |
| 個資遮罩 | ✅ 身分證、手機、卡號、Email、長數字，送出前即遮罩 |
| 金管會 AI 指引：揭露 AI、附來源、可轉真人、稽核 | ✅ |
| 通路夥伴模式 | ✅ 金鑰驗證、理專專屬注意事項 |
| 回饋與熱點報表 | ✅ `/feedback`、`/insights` |
| OAuth2、資料庫、正式客服系統串接 | ⏳ 原型以記憶體與 API 金鑰示範 |
| 截圖診斷 | ⏳ 未實作，列為後續擴充 |

## 維護知識庫

1. 開啟官方頁面核對內容，只寫頁面上明確出現的資訊。
2. 在 `knowledgeBase.ts` 新增或修改服務，每句事實都要附 `sourceId`。
3. 更新 `officialSources.ts` 的 `KNOWLEDGE_VERIFIED_AT`。
4. 在 `tests/navigator.test.ts` 加入新的問句與預期服務，執行 `npm test`。

## 已知限制

- 紀念日及連續假期的客服時間（9:00–18:00）需人工維護假日表，原型僅判斷平日與週六。
- 工作階段、快取、預約單與稽核紀錄存在伺服器記憶體，重啟後清空。
- 預約回電單為示範，未串接法國巴黎人壽客服系統。
- 官方網站內容可能變動，請定期重新核對並更新核對日期。

## 2.0 版主要修正（相較 AI Studio 初版）

- 修正客服時間（平日 9:00–20:00、週六 9:00–12:00）與地址（79 樓）。
- 「忘記繳費」不再指向與寬限期無關的 a330 頁面；改為引導查繳費明細並轉真人。
- 移除官方頁面查不到的細節（補扣次數、虛擬帳號、處理天數、選單名稱等）。
- 新增部分提領、會員註冊、國外 OTP、密碼鎖定、配息查詢、進度查詢、電子單據、海外急難救援等服務。
- 改以混合檢索取代關鍵字 if-else；Gemini 輸出加上候選限制與事實檢查。
- 修正 Gemini 失敗結果被快取一小時、快取無上限、處理時間寫死 2 ms 等問題。
- 新增個資遮罩、通路金鑰、速率限制、轉真人、回饋與洞察 API。
- 修正 `npm install` 相依版本衝突；測試由 7 項增加到 50 項。
