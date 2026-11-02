/**
 * Cardif Pilot — 服務功能知識庫
 *
 * 規則：
 * 1. 每一句 summary／steps／documents／notes 都必須附 sourceId（對應 officialSources.ts）。
 * 2. 只寫官方頁面上明確出現的內容；頁面沒寫的細節（處理天數、選單名稱等）一律不寫，
 *    改以 needsHumanConfirmation 引導使用者洽客服。
 * 3. 新增服務後請執行 `npm test`，測試會檢查出處與網址是否合規。
 */
import type { ServiceEntry } from '../shared/types';
import { CARDIF_FORMS_URL, CARDIF_OVERVIEW_URL, CARDIF_PORTAL_URL } from '../shared/constants';

const ALL = ['web', 'app', 'partner'] as const;

export const KNOWLEDGE_BASE: ServiceEntry[] = [
  // ───────────── 會員與登入 ─────────────
  {
    id: 'member-signup',
    name: '加入巴黎線上 My Cardif 會員',
    category: '會員與登入',
    summary: [
      { text: '持有本公司至少 1 張有效保單、具行為能力的要保人，即可申請成為網路保險服務會員，加入後可 24 小時線上查詢保單與辦理保單變更。', sourceId: 'f8' },
    ],
    steps: [
      { text: '至「保戶專區」點選「加入會員」。', sourceId: 'f8' },
      { text: '閱讀並同意網路保險服務定型化契約、網路保險服務聲明事項暨會員條款、個資法告知事項共 3 份文件。', sourceId: 'f8' },
      { text: '輸入身分證號與生日完成身分驗證，再以手機簡訊一次性密碼（OTP）完成驗證。', sourceId: 'f8' },
      { text: '同一組帳號密碼也可登入法國巴黎人壽 APP。', sourceId: 'f8' },
    ],
    documents: [
      { text: '要保人身分證號與生日', sourceId: 'f8' },
      { text: '可收簡訊的手機（預設為最新保單約定的聯絡電話，申請過程中不可更改）', sourceId: 'f8' },
    ],
    notes: [
      { text: '若約定的手機號碼需要更新，請先致電客服 0800-012-899 處理。', sourceId: 'f8' },
    ],
    primaryAction: { label: '前往保戶專區加入會員', url: CARDIF_PORTAL_URL, loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '查看網路保險服務說明', url: CARDIF_OVERVIEW_URL, loginRequired: false, isDirectLink: false }],
    channels: [...ALL],
    keywords: ['加入會員', '註冊', '申請會員', '開通', '會員資格', '網路保險服務', '巴黎線上', 'my cardif', 'mycardif', '帳號申請', '怎麼登入', '如何登入', '開通網路', 'app登入', '線上服務申請'],
  },
  {
    id: 'member-overseas-otp',
    name: '人在國外收不到簡訊驗證碼',
    category: '會員與登入',
    summary: [
      { text: '本公司不提供國外手機號碼的簡訊一次性密碼（OTP）發送服務。已是會員、從國外登入收不到簡訊時，請致電客服協助。', sourceId: 'f8' },
    ],
    steps: [
      { text: '確認您的驗證手機是否為國外門號。', sourceId: 'f8' },
      { text: '已有會員帳號者：致電客服 0800-012-899 由專人協助。', sourceId: 'f8' },
      { text: '尚未註冊者：以國外手機號碼新註冊時無法收到 OTP 簡訊，請洽客服詢問其他辦理方式。', sourceId: 'f8' },
    ],
    documents: [],
    notes: [
      { text: '為保障個人權益與資安，申請過程中驗證用的電話號碼不可自行更改。', sourceId: 'f8' },
    ],
    primaryAction: { label: '查看網路保險服務 FAQ', url: CARDIF_OVERVIEW_URL, loginRequired: false, isDirectLink: false },
    channels: [...ALL],
    keywords: ['國外', '海外', '出國', '人在國外', '收不到簡訊', '收不到驗證碼', '驗證碼', 'otp', '一次性密碼', '國外手機', '簡訊密碼', '國外門號', '外國號碼'],
    needsHumanConfirmation: true,
  },
  {
    id: 'member-password',
    name: '密碼設定、忘記密碼與帳號鎖定',
    category: '會員與登入',
    summary: [
      { text: '密碼須為 8–16 位英數字混合，英文區分大小寫；密碼輸入錯誤達 5 次帳號即被鎖住，需致電客服解除鎖定。', sourceId: 'f8' },
    ],
    steps: [
      { text: '帳號被鎖：致電客服 0800-012-899 解除帳號鎖定。', sourceId: 'f8' },
      { text: '沒收到「密碼重新設定」通知信：先檢查垃圾郵件，仍找不到請致電客服。', sourceId: 'f8' },
      { text: '超過五年未登入網頁版或 APP：依法規需重新註冊。', sourceId: 'f8' },
      { text: '操作中斷導致需要重新閱讀條款：重新閱讀後直接進行下一步即可。', sourceId: 'f8' },
    ],
    documents: [],
    notes: [],
    primaryAction: { label: '前往保戶專區登入頁', url: CARDIF_PORTAL_URL, loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '查看會員 FAQ', url: CARDIF_OVERVIEW_URL, loginRequired: false, isDirectLink: false }],
    channels: [...ALL],
    keywords: ['密碼', '忘記密碼', '重設密碼', '鎖住', '鎖定', '被鎖', '解鎖', '登不進去', '無法登入', '登入不了', '錯誤五次', '錯太多次', '重新註冊', '五年沒登入', '重設信', '密碼規則'],
    needsHumanConfirmation: true,
  },

  // ───────────── 保單查詢 ─────────────
  {
    id: 'policy-inquiry',
    name: '查詢保單內容與繳費明細',
    category: '保單查詢',
    summary: [
      { text: '登入巴黎線上 My Cardif 後，可即時查詢我的保單內容、繳費明細與保單績效通知。', sourceId: 'f8' },
    ],
    steps: [
      { text: '登入巴黎線上 My Cardif（尚未加入會員者請先註冊）。', sourceId: 'f8' },
      { text: '於保單查詢服務中選擇「我的保單內容」或「繳費明細查詢」。', sourceId: 'f8' },
    ],
    documents: [{ text: '會員帳號與密碼', sourceId: 'f8' }],
    notes: [
      { text: '本助手不會、也不能在對話中顯示您的個人保單資料，請登入官方保戶專區查詢。', sourceId: 'f8' },
    ],
    primaryAction: { label: '登入保戶專區查詢保單', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    channels: [...ALL],
    keywords: ['查保單', '查詢保單', '保單內容', '我的保單', '看保單', '保障內容', '保單明細', '保單資料', '繳費明細', '繳費紀錄', '保額', '有效嗎', '保單號碼'],
  },
  {
    id: 'progress-inquiry',
    name: '理賠進度與保單變更進度查詢',
    category: '保單查詢',
    summary: [
      { text: '會員登入巴黎線上 My Cardif 後，可使用「保單變更進度及理賠進度查詢」功能。', sourceId: 'f8' },
    ],
    steps: [
      { text: '登入巴黎線上 My Cardif。', sourceId: 'f8' },
      { text: '於保單查詢服務中選擇「保單變更進度及理賠進度查詢」。', sourceId: 'f8' },
    ],
    documents: [{ text: '會員帳號與密碼', sourceId: 'f8' }],
    notes: [
      { text: '理賠文件齊備後，保險公司應於 15 天內給付理賠金。', sourceId: 'a314' },
    ],
    primaryAction: { label: '登入保戶專區查詢進度', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    channels: [...ALL],
    keywords: ['理賠進度', '進度查詢', '變更進度', '審核進度', '案件進度', '理賠到哪', '審到哪', '進度如何', '辦好了沒', '處理進度', '查進度'],
  },

  // ───────────── 投資型保單 ─────────────
  {
    id: 'investment-inquiry',
    name: '投資表現與配息查詢',
    category: '投資型保單',
    summary: [
      { text: '會員可於巴黎線上查詢我的投資表現、標的變更與交易紀錄、配息歷史紀錄及配息歸戶。', sourceId: 'f8' },
    ],
    steps: [
      { text: '登入巴黎線上 My Cardif。', sourceId: 'f8' },
      { text: '選擇「我的投資表現」「標的變更紀錄／標的交易紀錄」或「配息歷史紀錄及配息歸戶查詢」。', sourceId: 'f8' },
      { text: '公開的基金與 ETF 資訊，可至官網「投資理財」選單中的基金及 ETF 專區查詢。', sourceId: 'f8' },
    ],
    documents: [{ text: '會員帳號與密碼', sourceId: 'f8' }],
    notes: [
      { text: '本助手不提供投資建議或標的推薦。', sourceId: 'f8' },
    ],
    primaryAction: { label: '登入保戶專區查詢投資表現', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    secondaryActions: [{ label: '基金及 ETF 專區', url: 'https://cardif.moneydj.com/', loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['投資表現', '投資報酬', '績效', '配息', '配息紀錄', '配息歸戶', '基金淨值', '淨值', '帳戶價值', '交易紀錄', '投資保單', '投資型', 'etf', '基金'],
  },
  {
    id: 'investment-change',
    name: '標的轉換、增額申購與投資內容變更',
    category: '投資型保單',
    summary: [
      { text: '會員可於巴黎線上辦理標的轉換、變更下期投資標的、單筆增額申購、暫停／恢復扣款與保戶投資風險屬性變更。', sourceId: 'f8' },
      { text: '書面辦理可使用投資型商品表單中的「投資內容異動申請書」。', sourceId: 'a311' },
    ],
    steps: [
      { text: '登入巴黎線上 My Cardif，於保單變更服務選擇對應項目。', sourceId: 'f8' },
      { text: '書面辦理：至常用表單下載「投資內容異動申請書」或「單筆增額申請書」（投資型商品表單）。', sourceId: 'a311' },
    ],
    documents: [
      { text: '投資內容異動申請書／單筆增額申請書（每份有唯一文件編號，不得影印使用）', sourceId: 'a311' },
    ],
    notes: [
      { text: '本助手不提供投資建議或標的推薦，投資決定請自行評估。', sourceId: 'f8' },
    ],
    primaryAction: { label: '登入保戶專區辦理', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    secondaryActions: [{ label: '常用表單下載', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['標的轉換', '轉換標的', '換基金', '變更標的', '下期投資標的', '增額', '單筆增額', '加碼', '暫停扣款', '恢復扣款', '風險屬性', '投資內容異動'],
  },

  // ───────────── 借款與提領 ─────────────
  {
    id: 'partial-withdrawal',
    name: '保單價值部分提領（投資型）',
    category: '借款與提領',
    summary: [
      { text: '投資型保單的「保單價值部分提領」可由會員透過巴黎線上 My Cardif 線上辦理，24 小時免出門。', sourceId: 'f8' },
    ],
    steps: [
      { text: '確認已加入巴黎線上會員；若原本只有查詢權限，重新登入並同意會員權益告知事項、完成身分驗證，即可開通保單變更服務。', sourceId: 'f8' },
      { text: '登入後於保單變更服務選擇「保單價值部分提領」。', sourceId: 'f8' },
    ],
    documents: [{ text: '會員帳號與密碼（需已開通保單變更服務）', sourceId: 'f8' }],
    notes: [
      { text: '官網表單頁未列出部分提領專用表單；如需書面辦理，請致電客服確認適用表單。', sourceId: 'a311' },
    ],
    primaryAction: { label: '登入保戶專區辦理部分提領', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    channels: [...ALL],
    keywords: ['部分提領', '提領', '領錢', '領一些錢', '領出來', '拿錢出來', '錢領出', '提出來', '提款', '保單價值', '把錢拿回來', '領部分'],
  },
  {
    id: 'policy-loan',
    name: '保單借款',
    category: '借款與提領',
    summary: [
      { text: '保單借款可線上、郵寄、親自或委託他人辦理；線上借款限要保人與被保險人為同一人的台幣保單，單筆上限新台幣 50 萬元。', sourceId: 'a313' },
    ],
    steps: [
      { text: '線上：成為網路保險服務會員並開通線上保單變更功能，可 24 小時辦理。', sourceId: 'a313' },
      { text: '郵寄：填寫保險單借款合約書（一張保單填一張），附上應備文件寄至客戶服務中心。', sourceId: 'a313' },
      { text: '親自辦理：要保人攜帶保單、身分證正本及存摺面頁至公司辦理。', sourceId: 'a313' },
      { text: '委託他人代辦：另附借款委託書及受託人身分證影本；委託代辦不受理郵寄。', sourceId: 'a313' },
    ],
    documents: [
      { text: '保險單借款合約書', sourceId: 'a313' },
      { text: '要保人身分證影本', sourceId: 'a313' },
      { text: '要保人本人活期儲蓄帳戶存摺影本（指定匯款者）', sourceId: 'a313' },
    ],
    notes: [
      { text: '審核無誤後約 5 至 7 個工作天撥款；線上申請須於工作日下午 5:30 前完成受理。', sourceId: 'a313' },
      { text: '未償還借款本息超過保單價值準備金時，保險契約效力將停止。', sourceId: 'a313' },
      { text: '借款利率依險種不同，請參考官網利率看板。', sourceId: 'a313' },
    ],
    partnerNotes: [
      { text: '表單「保險單借款合約書」每份有唯一文件編號，不得影印使用。', sourceId: 'a311' },
    ],
    primaryAction: { label: '查看官方保單借款說明', url: 'https://life.cardif.com.tw/a313', loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '登入保戶專區線上借款', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['借款', '保單借款', '借錢', '保單貸款', '貸款', '借款利率', '借款額度', '可以借多少', '還款', '借款合約書'],
  },

  // ───────────── 繳費與扣款 ─────────────
  {
    id: 'premium-missed',
    name: '忘記繳費、扣款失敗與停效復效',
    category: '繳費與扣款',
    summary: [
      { text: '本助手無法查詢您的個人欠費。請先登入巴黎線上查看「繳費明細」，再致電客服確認補繳方式；寬限期與停效規定以您的保單條款為準。', sourceId: 'f8' },
    ],
    steps: [
      { text: '登入巴黎線上 My Cardif，於「繳費明細查詢」確認未扣款的期別。', sourceId: 'f8' },
      { text: '致電客服 0800-012-899，由專人確認補繳方式與保單目前狀態。', sourceId: 'f8' },
    ],
    documents: [],
    notes: [
      { text: '投資型保單若需辦理復效，新台幣保單的復效最低應繳保險費為 20,000 元。', sourceId: 'a330' },
    ],
    primaryAction: { label: '登入保戶專區查看繳費明細', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    secondaryActions: [{ label: '查看最低保費繳交規範', url: 'https://life.cardif.com.tw/a330', loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['忘記繳', '沒繳', '未繳', '逾期', '遲繳', '扣款失敗', '扣不到', '沒扣到', '補繳', '寬限期', '停效', '復效', '繳費失敗', '保費沒扣', '催告', '沒繳錢', '保費失敗', '繳保費失敗', '刷卡失敗', '扣繳失敗'],
    needsHumanConfirmation: true,
  },
  {
    id: 'minimum-premium',
    name: '投資型保單最低保費規範',
    category: '繳費與扣款',
    summary: [
      { text: '投資型保單分期繳納第二期以後的保費，新台幣保單每期最低 3,000 元、年繳最低 12,000 元，外幣保單換算為等值外幣。', sourceId: 'a330' },
    ],
    steps: [{ text: '查看官網「最低保費繳交規範」了解各幣別標準。', sourceId: 'a330' }],
    documents: [],
    notes: [{ text: '新台幣保單復效最低應繳保險費為 20,000 元。', sourceId: 'a330' }],
    primaryAction: { label: '查看最低保費繳交規範', url: 'https://life.cardif.com.tw/a330', loginRequired: false, isDirectLink: true },
    channels: [...ALL],
    keywords: ['最低保費', '最少繳多少', '最低繳費', '每期最低', '繳費規範', '最低金額'],
  },
  {
    id: 'change-credit-card',
    name: '變更扣款信用卡',
    category: '繳費與扣款',
    summary: [
      { text: '會員可於巴黎線上辦理「信用卡卡效卡號變更」。', sourceId: 'f8' },
      { text: '書面辦理可使用常用表單中的「信用卡代繳保險費授權書」。', sourceId: 'a311' },
    ],
    steps: [
      { text: '線上：登入巴黎線上 My Cardif，於保單變更服務選擇「信用卡卡效卡號變更」。', sourceId: 'f8' },
      { text: '書面：至常用表單下載（保障型商品表單）「信用卡代繳保險費授權書」，依表單說明填寫後送件。', sourceId: 'a311' },
    ],
    documents: [{ text: '信用卡代繳保險費授權書（書面辦理時）', sourceId: 'a311' }],
    notes: [
      { text: '本助手只提供流程導覽，不會也無法替您變更扣款資料；請勿在對話中輸入卡號。', sourceId: 'f8' },
    ],
    primaryAction: { label: '登入保戶專區變更信用卡', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    secondaryActions: [{ label: '下載信用卡代繳授權書', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['信用卡', '換卡', '卡號', '新卡', '卡片過期', '信用卡過期', '信用卡扣款', '刷卡', '信用卡授權', '有效期限', '卡效'],
  },
  {
    id: 'change-payment-method',
    name: '變更繳費方式與金融機構扣款',
    category: '繳費與扣款',
    summary: [
      { text: '「變更繳費方式、繳別」為保單變更項目之一，多數項目需備妥「保險契約內容變更申請書」。', sourceId: 'a312' },
      { text: '改由金融機構帳戶代繳時，可參考常用表單中的「委託金融機構代繳保險費約定條款」。', sourceId: 'a311' },
    ],
    steps: [
      { text: '至常用表單下載「保險契約內容變更申請書」。', sourceId: 'a312' },
      { text: '如改由金融機構帳戶代繳，一併參閱「委託金融機構代繳保險費約定條款」。', sourceId: 'a311' },
      { text: '依表單說明填寫、簽名後送件；應備文件如有疑問請洽客服。', sourceId: 'a312' },
    ],
    documents: [
      { text: '保險契約內容變更申請書', sourceId: 'a312' },
      { text: '委託金融機構代繳保險費約定條款（改由帳戶扣款時）', sourceId: 'a311' },
    ],
    notes: [],
    primaryAction: { label: '前往常用表單下載', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '查看保單變更說明', url: 'https://life.cardif.com.tw/a312', loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['銀行帳戶', '轉帳', '扣款帳戶', '存摺', '帳戶扣款', '換帳戶', '自動轉帳', '金融機構代繳', '繳費方式', '繳別', '年繳', '月繳', '季繳', '改繳費'],
    needsHumanConfirmation: true,
  },

  // ───────────── 保單變更 ─────────────
  {
    id: 'change-contact',
    name: '變更通訊地址、電話與 Email',
    category: '保單變更',
    summary: [
      { text: '已開通網路變更功能的會員，可透過巴黎線上「保全聯盟鏈」線上變更通訊地址、電子郵件、行動電話與住家電話；戶籍地址、收費地址則需書面申請。', sourceId: 'a312' },
    ],
    steps: [
      { text: '線上：登入巴黎線上 My Cardif，透過保全聯盟鏈變更通訊資料，並可選擇同意轉送給其他保險公司。', sourceId: 'a312' },
      { text: '戶籍地址／收費地址：填寫「保險契約內容變更申請書」以書面申請。', sourceId: 'a312' },
    ],
    documents: [{ text: '保險契約內容變更申請書（書面辦理時）', sourceId: 'a312' }],
    notes: [],
    primaryAction: { label: '登入保戶專區變更通訊資料', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true },
    secondaryActions: [{ label: '查看保單變更說明', url: 'https://life.cardif.com.tw/a312', loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['地址', '搬家', '通訊地址', '戶籍地址', '收費地址', '電話', '手機號碼', '改手機', '換手機', 'email', '電子郵件', '信箱', '聯絡方式', '聯絡資料', '保全聯盟鏈'],
  },
  {
    id: 'change-beneficiary',
    name: '變更受益人',
    category: '保單變更',
    summary: [
      { text: '變更受益人屬保單變更項目，可使用常用表單中的「受益人變更申請書」辦理。', sourceId: 'a312' },
    ],
    steps: [
      { text: '至常用表單下載「受益人變更申請書」。', sourceId: 'a311' },
      { text: '依申請書說明填寫並簽名後送件。', sourceId: 'a312' },
    ],
    documents: [{ text: '受益人變更申請書', sourceId: 'a311' }],
    notes: [
      { text: '簽名人與應備文件以申請書說明為準，如有疑問請洽客服 0800-012-899。', sourceId: 'a312' },
    ],
    partnerNotes: [
      { text: '同頁另有「要保人變更專用表單」，要保人變更與受益人變更為不同表單，請勿混用。', sourceId: 'a311' },
    ],
    primaryAction: { label: '下載受益人變更申請書', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '查看保單變更說明', url: 'https://life.cardif.com.tw/a312', loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['受益人', '身故受益人', '改受益人', '換受益人', '指定受益人', '受益比例', '受益人變更'],
  },
  {
    id: 'change-other',
    name: '其他保單資料變更（姓名、職業、紅利給付等）',
    category: '保單變更',
    summary: [
      { text: '要保人與被保險人姓名、被保險人 ID／生日／性別、保單紅利給付方式、職業內容與補充健康告知等變更，多數需備妥「保險契約內容變更申請書」。', sourceId: 'a312' },
    ],
    steps: [
      { text: '確認要變更的項目，至常用表單下載「保險契約內容變更申請書」（依投資型、保障型、分紅型分類）。', sourceId: 'a311' },
      { text: '依申請書說明填寫並送件。', sourceId: 'a312' },
    ],
    documents: [{ text: '保險契約內容變更申請書（每份有唯一文件編號，不得影印使用）', sourceId: 'a311' }],
    notes: [],
    primaryAction: { label: '查看保單變更說明', url: 'https://life.cardif.com.tw/a312', loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '前往常用表單下載', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['改姓名', '姓名變更', '改名', '職業變更', '換工作', '職業', '紅利', '紅利給付', '健康告知', '生日錯誤', '性別', '契約內容變更', '變更申請書'],
  },

  // ───────────── 理賠 ─────────────
  {
    id: 'claim-application',
    name: '申請理賠',
    category: '理賠',
    summary: [
      { text: '理賠可透過郵寄送件，或經巴黎線上使用理賠聯盟鏈／保險理賠醫起通申請；文件齊備後，保險公司應於 15 天內給付理賠金。', sourceId: 'a314' },
    ],
    steps: [
      { text: '確認投保險種，下載並填寫「理賠申請書」（官網附填寫範例與申請須知）。', sourceId: 'a311' },
      { text: '郵寄送件：寄至台北市信義區信義路五段 7 號 79 樓 理賠部。', sourceId: 'a314' },
      { text: '線上送件：註冊巴黎線上會員後使用理賠聯盟鏈（適用部分健康、傷害醫療、失能及重大／特定傷病險種，須匯款給付被保險人本人帳戶），影像送件後 10 日內須寄回正本。', sourceId: 'a314' },
    ],
    documents: [
      { text: '保險金申請書', sourceId: 'a314' },
      { text: '診斷書正本，或加蓋原醫療院所紅色印章的副本（不接受影印本）', sourceId: 'a314' },
      { text: '理賠金匯入帳戶的存摺影本', sourceId: 'a314' },
      { text: '其他文件依事故類型而定（如骨折需 X 光片、失能需事故 180 天後開立的診斷證明）', sourceId: 'a314' },
    ],
    notes: [
      { text: '實際所需文件以保單條款為準，承辦人員可能另行通知補件。', sourceId: 'a314' },
      { text: '官網理賠頁註明的理賠諮詢時間為上班時間 09:00–18:00，專線 0800-012-899。', sourceId: 'a314' },
      { text: '本助手無法保證或預先核准任何理賠，所有案件均由理賠人員依保單條款審核。', sourceId: 'a314' },
    ],
    partnerNotes: [
      { text: '身故或完全失能受益人，可能需依 FATCA 規定填寫 W-9 或 W-8BEN-E 相關表格。', sourceId: 'a314' },
    ],
    primaryAction: { label: '查看官方理賠程序', url: 'https://life.cardif.com.tw/a314', loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '下載理賠申請書', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['理賠', '申請理賠', '住院', '開刀', '手術', '意外', '骨折', '醫療費', '診斷書', '理賠申請書', '保險金', '身故', '失能', '重大傷病', '理賠文件', '理賠聯盟鏈'],
  },

  // ───────────── 其他服務 ─────────────
  {
    id: 'e-documents',
    name: '電子單據服務',
    category: '其他服務',
    summary: [
      { text: '申請後，保單相關單據與通知會寄到要保人留存的電子郵件，不另寄紙本；目前項目包含投資型商品保單帳戶價值季對帳單與海外所得／營利事業所得。', sourceId: 'a316' },
    ],
    steps: [
      { text: '網路申請：已是巴黎線上會員且留有會員行動電話者，登入後至「電子單據服務申請」專區。', sourceId: 'a316' },
      { text: '郵寄申請：至官網下載「電子單據服務申請書」，或致電 0800-012-899 索取。', sourceId: 'a316' },
    ],
    documents: [{ text: '電子單據服務申請書（郵寄申請時）', sourceId: 'a316' }],
    notes: [
      { text: '申請人須為要保人；要保人變更時原服務自動終止，新要保人須重新申請。', sourceId: 'a316' },
    ],
    primaryAction: { label: '查看電子單據服務說明', url: 'https://life.cardif.com.tw/a316', loginRequired: false, isDirectLink: true },
    secondaryActions: [{ label: '登入保戶專區申請', url: CARDIF_PORTAL_URL, loginRequired: true, isDirectLink: true }],
    channels: [...ALL],
    keywords: ['電子單據', '電子對帳單', '對帳單', '電子帳單', '不要紙本', '紙本', 'email通知', '季對帳單', '海外所得'],
  },
  {
    id: 'overseas-assistance',
    name: '海外急難救援',
    category: '其他服務',
    summary: [
      { text: '24 小時海外急難諮詢華語服務專線：+886-2-2531-8363（台北服務中心），提供醫療協助、旅遊協助與旅遊地資訊等服務。', sourceId: 'a315' },
    ],
    steps: [
      { text: '撥打 +886-2-2531-8363。', sourceId: 'a315' },
      { text: '提供中英文姓名（與護照相同）、保單號碼、身分證字號與出生日期。', sourceId: 'a315' },
      { text: '需住院時應儘速就近住院並立即通知；自行住院且未於出院前通知者，公司不提供支援服務。', sourceId: 'a315' },
    ],
    documents: [],
    notes: [
      { text: '醫療與旅遊協助限臺灣、澎湖、金門、馬祖以外地區，且每次旅遊連續期間不超過九十天。', sourceId: 'a315' },
      { text: '服務僅提供推薦或協助安排，相關第三人費用由用戶負擔。', sourceId: 'a315' },
    ],
    primaryAction: { label: '查看海外急難救援說明', url: 'https://life.cardif.com.tw/a315', loginRequired: false, isDirectLink: true },
    channels: [...ALL],
    keywords: ['海外急難', '急難救援', '國外生病', '國外受傷', '國外住院', '出國受傷', '旅遊協助', '護照遺失', '海外救援'],
  },
  {
    id: 'forms-download',
    name: '常用表單下載',
    category: '其他服務',
    summary: [
      { text: '官網常用表單分為投資風險屬性評估、契約變更申請（投資型／保障型／分紅型）、其他、網路保險服務與理賠申請等類別。', sourceId: 'a311' },
    ],
    steps: [
      { text: '前往常用表單下載頁，依商品類型與申辦項目選擇表單。', sourceId: 'a311' },
      { text: '標有唯一文件編號的表單不得影印使用，請每次重新下載。', sourceId: 'a311' },
    ],
    documents: [],
    notes: [],
    primaryAction: { label: '前往常用表單下載', url: CARDIF_FORMS_URL, loginRequired: false, isDirectLink: true },
    channels: [...ALL],
    keywords: ['表單', '下載表單', '申請書', '表格', '文件下載', '空白表單', '常用表單'],
  },
];

export function getService(id: string): ServiceEntry | undefined {
  return KNOWLEDGE_BASE.find((s) => s.id === id);
}

/** 「我想改資料」這類模糊請求時，提供使用者選擇的服務 */
export const CHANGE_CLARIFICATION_IDS = [
  'change-credit-card',
  'change-payment-method',
  'change-contact',
  'change-beneficiary',
  'change-other',
];
