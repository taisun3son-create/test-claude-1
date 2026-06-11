// デモAIエンジン：APIキーなしで動く、日本語指示の解釈エンジン。
// 将来 OpenAI / Claude などの本物のAIに差し替える場合は、
// この2つの関数（generateSiteContent / applyChatCommand）と同じ
// インターフェースを持つ実装に置き換えるだけでよい。

import type { Section, Site, Theme } from '../types'

export interface GeneratedContent {
  industryId: string
  suggestedName: string
  theme: Theme
  sections: Section[]
  reply: string
}

export interface ChatResult {
  site: Site
  reply: string
}

// ---------------- 業種プリセット ----------------

interface Industry {
  id: string
  keywords: RegExp
  label: string
  suggestedName: string
  theme: Theme
  catchcopies: string[]
  subtitle: string
  aboutHeading: string
  aboutBody: string
  servicesHeading: string
  services: { title: string; description: string }[]
  productsHeading: string
  products: { name: string; description: string; price: string }[]
  hours: string
}

const industries: Industry[] = [
  {
    id: 'tools',
    keywords: /工具|金物|ホームセンター|資材|建材/,
    label: '工具店',
    suggestedName: '〇〇工具店',
    theme: { primary: '#1e3a5f', accent: '#e8a33d', background: '#f7f9fb', text: '#2b2b2b' },
    catchcopies: [
      '確かな道具を、確かな目利きで。',
      'プロの仕事を支える、頼れる工具がここに。',
      '欲しい工具が、きっと見つかる。',
    ],
    subtitle: 'プロから日曜大工まで、道具のことなら何でもご相談ください',
    aboutHeading: '当店について',
    aboutBody:
      '創業以来、地域の職人さんとものづくりを愛する皆さまに支えられてきた工具専門店です。電動工具から手工具、消耗品まで幅広く取り揃え、用途に合わせた道具選びをスタッフが丁寧にご案内します。',
    servicesHeading: 'サービス',
    services: [
      { title: '工具販売', description: '電動工具・手工具・測定器など、プロ仕様の工具を豊富に在庫しています。' },
      { title: '中古工具買取', description: '使わなくなった工具を査定・買取いたします。出張買取もご相談ください。' },
      { title: '修理・メンテナンス', description: '電動工具の修理や刃物の研ぎ直しなど、道具の手入れもお任せください。' },
    ],
    productsHeading: 'おすすめ商品',
    products: [
      { name: '充電式インパクトドライバー', description: 'プロ仕様18Vモデル。バッテリー2個付き。', price: '¥29,800' },
      { name: 'ツールセット 56点組', description: 'これ一つでご家庭の修理はほぼ対応可能。', price: '¥9,800' },
      { name: '作業手袋（背抜きタイプ）', description: '耐久性とフィット感を両立した人気商品。', price: '¥380' },
    ],
    hours: '8:00〜18:00（日曜・祝日定休）',
  },
  {
    id: 'restaurant',
    keywords: /飲食|レストラン|ラーメン|食堂|カフェ|喫茶|居酒屋|寿司|焼肉|パン|ベーカリー|弁当|うどん|そば/,
    label: '飲食店',
    suggestedName: '〇〇食堂',
    theme: { primary: '#7b2d12', accent: '#e8a33d', background: '#fff8f0', text: '#3a3a3a' },
    catchcopies: [
      '今日もまた食べたくなる、あの味を。',
      '素材と手間ひまが、おいしさの理由です。',
      'ほっとできる味と空間を、あなたに。',
    ],
    subtitle: '心を込めた手作りの味で、皆さまのご来店をお待ちしております',
    aboutHeading: 'お店のこだわり',
    aboutBody:
      '毎朝仕入れる新鮮な食材と、開店当初から守り続けてきた手作りの味が自慢です。お一人さまでも、ご家族でも、気軽に立ち寄れるお店を目指しています。',
    servicesHeading: '当店の特徴',
    services: [
      { title: '厳選素材', description: '地元の生産者から直接仕入れた旬の食材を使用しています。' },
      { title: 'テイクアウト対応', description: '人気メニューはお持ち帰りいただけます。お電話でのご予約も承ります。' },
      { title: '宴会・貸切', description: '歓送迎会や各種ご宴会に。コース料理をご用意しています。' },
    ],
    productsHeading: 'おすすめメニュー',
    products: [
      { name: '日替わり定食', description: '主菜＋小鉢2品＋ご飯・味噌汁付き。', price: '¥900' },
      { name: '特製からあげ', description: '外はカリッと中はジューシー。一番人気の看板メニュー。', price: '¥680' },
      { name: '本日のデザート', description: '手作りデザートを日替わりでご用意。', price: '¥450' },
    ],
    hours: '11:00〜21:00（月曜定休）',
  },
  {
    id: 'salon',
    keywords: /美容|サロン|ヘア|ネイル|エステ|まつげ|理容|床屋/,
    label: '美容室',
    suggestedName: 'ヘアサロン〇〇',
    theme: { primary: '#7b2d3b', accent: '#c9a227', background: '#fff8f5', text: '#3a3a3a' },
    catchcopies: [
      'あなたらしさを、もっと素敵に。',
      '髪が変わると、毎日が変わる。',
      'なりたい自分に出会える場所。',
    ],
    subtitle: 'お一人おひとりに寄り添う、丁寧なカウンセリングとデザイン',
    aboutHeading: 'コンセプト',
    aboutBody:
      '髪質やライフスタイルに合わせて、再現性の高いスタイルをご提案します。リラックスできる空間づくりを大切にしていますので、初めての方もお気軽にご来店ください。',
    servicesHeading: 'メニュー',
    services: [
      { title: 'カット', description: '骨格と髪質に合わせた、扱いやすいスタイルをご提案します。' },
      { title: 'カラー', description: 'ダメージを抑えた薬剤で、透明感のある色味に仕上げます。' },
      { title: 'パーマ・縮毛矯正', description: '朝のセットが楽になる、ナチュラルな質感が人気です。' },
    ],
    productsHeading: '料金表',
    products: [
      { name: 'カット', description: 'シャンプー・ブロー込み。', price: '¥4,400' },
      { name: 'カット＋カラー', description: '人気No.1の組み合わせメニュー。', price: '¥9,900' },
      { name: 'ヘッドスパ（20分）', description: '頭皮ケアとリラクゼーションに。', price: '¥3,300' },
    ],
    hours: '9:00〜19:00（火曜定休）',
  },
  {
    id: 'seitai',
    keywords: /整体|接骨|整骨|鍼灸|マッサージ|カイロ|リラクゼーション/,
    label: '整体院',
    suggestedName: '〇〇整体院',
    theme: { primary: '#2d6a4f', accent: '#d4a373', background: '#f6faf7', text: '#333333' },
    catchcopies: [
      'つらい痛みに、根本からアプローチ。',
      '体が軽くなると、心も軽くなる。',
      '我慢しないで、まずはご相談ください。',
    ],
    subtitle: '肩こり・腰痛・骨盤の歪みなど、お体の悩みに寄り添います',
    aboutHeading: '当院について',
    aboutBody:
      '痛みの出ている場所だけでなく、原因となる体の使い方や姿勢から見直す施術を行っています。国家資格を持つスタッフが、お一人おひとりの状態に合わせた施術プランをご提案します。',
    servicesHeading: '施術メニュー',
    services: [
      { title: '全身整体', description: '筋肉と関節のバランスを整え、体本来の動きを取り戻します。' },
      { title: '骨盤矯正', description: '産後の歪みや姿勢の悩みに。ソフトな矯正で安心です。' },
      { title: 'スポーツケア', description: '部活動や競技をされている方のコンディショニングに。' },
    ],
    productsHeading: '料金のご案内',
    products: [
      { name: '初回検査＋施術', description: 'カウンセリング・検査・施術込み。', price: '¥5,500' },
      { name: '全身整体（60分）', description: '2回目以降の標準メニュー。', price: '¥6,600' },
      { name: '回数券（5回分）', description: '継続ケアにお得な回数券。', price: '¥29,700' },
    ],
    hours: '9:00〜20:00（日曜定休・予約優先）',
  },
  {
    id: 'company',
    keywords: /会社|企業|法人|事務所|士業|建設|工務店|不動産|コンサル/,
    label: '会社',
    suggestedName: '株式会社〇〇',
    theme: { primary: '#1e3a5f', accent: '#e8a33d', background: '#ffffff', text: '#333333' },
    catchcopies: [
      '信頼と実績で、お客様のビジネスを支えます。',
      '地域とともに、未来をつくる。',
      '確かな技術で、課題を解決へ。',
    ],
    subtitle: 'お客様第一の姿勢で、確かなサービスをお届けします',
    aboutHeading: '会社概要',
    aboutBody:
      '私たちは創業以来、お客様第一の姿勢でサービスを提供してまいりました。確かな技術と豊富な経験で、皆さまの課題解決をお手伝いします。',
    servicesHeading: '事業内容',
    services: [
      { title: '事業 1', description: '主力事業の説明を記入してください。' },
      { title: '事業 2', description: '事業内容の説明を記入してください。' },
      { title: '事業 3', description: '事業内容の説明を記入してください。' },
    ],
    productsHeading: 'サービス・料金',
    products: [
      { name: '基本プラン', description: 'まずはこちらからご相談ください。', price: 'お見積り' },
      { name: 'サポートプラン', description: '導入後の保守・運用までサポート。', price: '月額 ¥30,000〜' },
    ],
    hours: '平日 9:00〜18:00',
  },
]

function findIndustry(text: string): Industry {
  return industries.find((i) => i.keywords.test(text)) ?? industries[industries.length - 1]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------- サイト生成 ----------------

export function generateSiteContent(prompt: string): GeneratedContent {
  const industry = findIndustry(prompt)
  // 「〇〇」という名前で / 店名は〇〇 のような指定を拾う
  const nameMatch = prompt.match(/[「『]([^」』]{1,30})[」』]/)
  const suggestedName = nameMatch ? nameMatch[1] : industry.suggestedName

  const today = new Date().toISOString().slice(0, 10)
  const sections: Section[] = [
    { type: 'hero', title: suggestedName, subtitle: pick(industry.catchcopies), imageUrl: '' },
    { type: 'about', heading: industry.aboutHeading, body: industry.aboutBody },
    { type: 'services', heading: industry.servicesHeading, items: industry.services },
    {
      type: 'products',
      heading: industry.productsHeading,
      items: industry.products.map((p) => ({ ...p, imageUrl: '' })),
    },
    {
      type: 'news',
      heading: 'お知らせ',
      items: [{ date: today, title: 'ホームページを公開しました' }],
    },
    {
      type: 'contact',
      heading: 'アクセス・お問い合わせ',
      address: '東京都〇〇区〇〇 1-2-3',
      phone: '03-1234-5678',
      email: 'info@example.com',
      hours: industry.hours,
      showMap: false,
    },
  ]

  // 色の指定があれば反映
  const color = matchColor(prompt)
  const theme = color ? color.theme : industry.theme

  const replyParts = [`${industry.label}向けのホームページを作成しました。`]
  if (color) replyParts.push(color.note + 'にしました。')
  replyParts.push(
    'チャットで「文字を大きくして」「赤色にして」「地図を表示して」のように話しかけると修正できます。住所や電話番号は「直接編集」タブから書き換えてください。',
  )

  return {
    industryId: industry.id,
    suggestedName,
    theme,
    sections,
    reply: replyParts.join(''),
  }
}

// ---------------- 色の解釈 ----------------

interface ColorRule {
  pattern: RegExp
  note: string
  theme: Theme
}

const colorRules: ColorRule[] = [
  {
    pattern: /高級|ラグジュアリー|上品|エレガント/,
    note: '黒と金を基調にした高級感のある配色',
    theme: { primary: '#1a1a2e', accent: '#c9a227', background: '#faf7f0', text: '#2b2b2b' },
  },
  {
    pattern: /青|ブルー|ネイビー|紺|信頼/,
    note: '青を基調にした信頼感のある配色',
    theme: { primary: '#1e3a5f', accent: '#e8a33d', background: '#f7f9fb', text: '#2b2b2b' },
  },
  {
    pattern: /赤|レッド|情熱|ワイン/,
    note: '赤を基調にした情熱的な配色',
    theme: { primary: '#9b1c31', accent: '#e8a33d', background: '#fff8f5', text: '#3a3a3a' },
  },
  {
    pattern: /緑|グリーン|ナチュラル|自然|オーガニック/,
    note: '緑を基調にしたナチュラルな配色',
    theme: { primary: '#2d6a4f', accent: '#d4a373', background: '#f6faf7', text: '#333333' },
  },
  {
    pattern: /オレンジ|暖か|温か|親しみ|元気/,
    note: 'オレンジを基調にした親しみやすい配色',
    theme: { primary: '#d35400', accent: '#1e3a5f', background: '#fffaf3', text: '#3a3a3a' },
  },
  {
    pattern: /ピンク|かわいい|可愛い|やさしい|優しい/,
    note: 'ピンクを基調にしたやわらかい配色',
    theme: { primary: '#b5536b', accent: '#7a9e7e', background: '#fff7f8', text: '#4a4a4a' },
  },
  {
    pattern: /黒|モノクロ|シック|クール|スタイリッシュ/,
    note: 'モノトーンのシックな配色',
    theme: { primary: '#212529', accent: '#868e96', background: '#f8f9fa', text: '#212529' },
  },
]

function matchColor(text: string): ColorRule | null {
  // 「〜色にして」「〜な感じ」など、配色に関する言葉が含まれるかどうかだけで判定する
  return colorRules.find((r) => r.pattern.test(text)) ?? null
}

// ---------------- チャットによる修正 ----------------

type Rule = (site: Site, msg: string) => { site: Site; note: string } | null

const rules: Rule[] = [
  // 業種を指定した作り直し
  (site, msg) => {
    if (!/作り直|作って|作成して|一から|ゼロから/.test(msg)) return null
    const generated = generateSiteContent(msg)
    return {
      site: {
        ...site,
        templateId: generated.industryId,
        theme: generated.theme,
        sections: generated.sections.map((s) =>
          s.type === 'hero' ? { ...s, title: site.name } : s,
        ),
      },
      note: '内容を作り直しました',
    }
  },
  // 配色の変更
  (site, msg) => {
    if (!/色|カラー|デザイン|感じ|雰囲気|高級|信頼|かわいい|可愛い|シック|ナチュラル/.test(msg)) return null
    const color = matchColor(msg)
    if (!color) return null
    return { site: { ...site, theme: { ...color.theme } }, note: color.note + 'に変更しました' }
  },
  // 文字サイズ
  (site, msg) => {
    if (!/文字|フォント|字/.test(msg)) return null
    if (/大き|おおき|でかく/.test(msg)) {
      const fontScale = Math.min(1.4, Math.round((site.fontScale + 0.1) * 10) / 10)
      return { site: { ...site, fontScale }, note: '文字を大きくしました' }
    }
    if (/小さ|ちいさ/.test(msg)) {
      const fontScale = Math.max(0.8, Math.round((site.fontScale - 0.1) * 10) / 10)
      return { site: { ...site, fontScale }, note: '文字を小さくしました' }
    }
    return null
  },
  // 電話ボタン
  (site, msg) => {
    if (!/電話/.test(msg)) return null
    if (/消|非表示|いらない|不要|外して/.test(msg)) {
      return { site: { ...site, showCallButton: false }, note: '電話ボタンを非表示にしました' }
    }
    if (/ボタン|表示|付けて|つけて|追加/.test(msg)) {
      return { site: { ...site, showCallButton: true }, note: '「今すぐ電話する」ボタンを表示しました' }
    }
    return null
  },
  // 地図
  (site, msg) => {
    if (!/地図|マップ|アクセス/.test(msg)) return null
    const hide = /消|非表示|いらない|不要/.test(msg)
    let touched = false
    const sections = site.sections.map((s) => {
      if (s.type !== 'contact') return s
      touched = true
      return { ...s, showMap: !hide }
    })
    if (!touched) return null
    return {
      site: { ...site, sections },
      note: hide ? '地図を非表示にしました' : '住所のGoogleマップを表示しました（住所は「直接編集」で変更できます）',
    }
  },
  // セクション追加
  (site, msg) => {
    if (!/追加|入れて|作って|載せて|のせて/.test(msg)) return null
    const sections = site.sections.slice()
    const has = (t: string) => sections.some((s) => s.type === t)
    const today = new Date().toISOString().slice(0, 10)

    if (/商品|メニュー|料金/.test(msg) && !has('products')) {
      sections.push({
        type: 'products',
        heading: '商品・メニュー',
        items: [{ name: '商品名', description: '商品の説明を入力してください。', price: '¥0', imageUrl: '' }],
      })
      return { site: { ...site, sections }, note: '商品・メニューのセクションを追加しました' }
    }
    if (/お知らせ|ニュース|新着/.test(msg) && !has('news')) {
      sections.push({
        type: 'news',
        heading: 'お知らせ',
        items: [{ date: today, title: 'お知らせを入力してください' }],
      })
      return { site: { ...site, sections }, note: 'お知らせのセクションを追加しました' }
    }
    if (/問い合わせ|連絡先|アクセス/.test(msg) && !has('contact')) {
      sections.push({
        type: 'contact',
        heading: 'お問い合わせ',
        address: '住所を入力してください',
        phone: '03-0000-0000',
        email: 'info@example.com',
        hours: '営業時間を入力してください',
        showMap: false,
      })
      return { site: { ...site, sections }, note: 'お問い合わせのセクションを追加しました' }
    }
    if (/概要|紹介|について/.test(msg) && !has('about')) {
      sections.push({ type: 'about', heading: '私たちについて', body: '紹介文を入力してください。' })
      return { site: { ...site, sections }, note: '紹介文のセクションを追加しました' }
    }
    return null
  },
  // タイトル変更
  (site, msg) => {
    const m = msg.match(/タイトル(?:を|は)[「『]?([^」』]+?)[」』]?(?:に(?:して|変えて|変更)|で)/)
    if (!m) return null
    const title = m[1].trim()
    const sections = site.sections.map((s) => (s.type === 'hero' ? { ...s, title } : s))
    return { site: { ...site, sections, name: title }, note: `タイトルを「${title}」に変更しました` }
  },
  // キャッチコピー
  (site, msg) => {
    if (!/キャッチコピー|キャッチフレーズ|コピー/.test(msg)) return null
    const industry = industries.find((i) => i.id === site.templateId) ?? findIndustry(site.name)
    const current = site.sections.find((s) => s.type === 'hero')
    const candidates = industry.catchcopies.filter(
      (c) => !(current && current.type === 'hero' && current.subtitle === c),
    )
    const copy = pick(candidates.length > 0 ? candidates : industry.catchcopies)
    const sections = site.sections.map((s) => (s.type === 'hero' ? { ...s, subtitle: copy } : s))
    return { site: { ...site, sections }, note: `キャッチコピーを「${copy}」に変更しました` }
  },
]

const helpReply = `すみません、その指示はまだ理解できませんでした（現在はデモAIで動作しています）。
こんな指示ができます：
・「青色を基調に信頼感のあるデザインにして」
・「高級感のある感じにして」
・「文字を大きくして」
・「タイトルを「カフェさくら」にして」
・「キャッチコピーを変えて」
・「メニューを追加して」「地図を表示して」
・「電話ボタンを消して」
細かい文章の修正は「直接編集」タブからどうぞ。`

export function applyChatCommand(site: Site, message: string): ChatResult {
  let current = site
  const notes: string[] = []
  for (const rule of rules) {
    const result = rule(current, message)
    if (result) {
      current = result.site
      notes.push(result.note)
      // 作り直しが起きた場合は他のルールを重ねがけしない（色は生成時に反映済み）
      if (notes[0] === '内容を作り直しました') break
    }
  }
  if (notes.length === 0) {
    return { site, reply: helpReply }
  }
  return { site: current, reply: notes.join('。') + '。プレビューをご確認ください！' }
}
