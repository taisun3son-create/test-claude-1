import type { Section, Theme } from './types'

export interface Template {
  id: string
  name: string
  description: string
  theme: Theme
  sections: Section[]
}

export const themePresets: { name: string; theme: Theme }[] = [
  { name: 'ネイビー', theme: { primary: '#1e3a5f', accent: '#e8a33d', background: '#ffffff', text: '#333333', fontStyle: 'sans' } },
  { name: 'グリーン', theme: { primary: '#2d6a4f', accent: '#d4a373', background: '#fefae0', text: '#333333', fontStyle: 'sans' } },
  { name: 'ワイン', theme: { primary: '#7b2d3b', accent: '#c9a227', background: '#fff8f0', text: '#3a3a3a', fontStyle: 'sans' } },
  { name: 'モノクロ', theme: { primary: '#212529', accent: '#868e96', background: '#f8f9fa', text: '#212529', fontStyle: 'sans' } },
  { name: 'スカイ', theme: { primary: '#0077b6', accent: '#ffb703', background: '#ffffff', text: '#333333', fontStyle: 'sans' } },
  { name: '和モダン', theme: { primary: '#3a2b22', accent: '#a8893f', background: '#f7f1e6', text: '#3a3128', fontStyle: 'serif' } },
  { name: 'エレガント', theme: { primary: '#1a1a2e', accent: '#c9a227', background: '#faf7f0', text: '#2b2b2b', fontStyle: 'serif' } },
]

export const templates: Template[] = [
  {
    id: 'shop',
    name: 'お店向け',
    description: 'カフェ・飲食店・小売店などの店舗向けテンプレート',
    theme: themePresets[1].theme,
    sections: [
      {
        type: 'hero',
        title: 'お店の名前',
        subtitle: '心を込めたおもてなしで、皆さまのご来店をお待ちしております',
        imageUrl: '',
      },
      {
        type: 'about',
        heading: '当店について',
        body: '地域に愛されるお店を目指して、こだわりの商品とサービスをお届けしています。お気軽にお立ち寄りください。',
      },
      {
        type: 'services',
        heading: 'メニュー・商品',
        items: [
          { title: 'おすすめ商品 A', description: '当店一番人気の商品です。' },
          { title: 'おすすめ商品 B', description: '季節限定のおすすめ商品です。' },
          { title: 'おすすめ商品 C', description: 'こだわりの素材を使用しています。' },
        ],
      },
      {
        type: 'news',
        heading: 'お知らせ',
        items: [
          { date: '2026-06-01', title: 'ホームページを公開しました' },
          { date: '2026-06-10', title: '夏の新メニューが登場しました' },
        ],
      },
      {
        type: 'contact',
        heading: 'アクセス・お問い合わせ',
        address: '東京都〇〇区〇〇 1-2-3',
        phone: '03-1234-5678',
        email: 'info@example.com',
        hours: '10:00〜19:00（水曜定休）',
        showMap: false,
      },
    ],
  },
  {
    id: 'company',
    name: '会社向け',
    description: '中小企業・士業・事務所などの企業向けテンプレート',
    theme: themePresets[0].theme,
    sections: [
      {
        type: 'hero',
        title: '株式会社サンプル',
        subtitle: '信頼と実績で、お客様のビジネスを支えます',
        imageUrl: '',
      },
      {
        type: 'about',
        heading: '会社概要',
        body: '私たちは創業以来、お客様第一の姿勢でサービスを提供してまいりました。確かな技術と豊富な経験で、皆さまの課題解決をお手伝いします。',
      },
      {
        type: 'services',
        heading: '事業内容',
        items: [
          { title: '事業 1', description: '主力事業の説明を記入してください。' },
          { title: '事業 2', description: '事業内容の説明を記入してください。' },
          { title: '事業 3', description: '事業内容の説明を記入してください。' },
        ],
      },
      {
        type: 'news',
        heading: '新着情報',
        items: [{ date: '2026-06-01', title: 'コーポレートサイトを公開しました' }],
      },
      {
        type: 'contact',
        heading: 'お問い合わせ',
        address: '東京都〇〇区〇〇 1-2-3 〇〇ビル 5F',
        phone: '03-1234-5678',
        email: 'contact@example.co.jp',
        hours: '平日 9:00〜18:00',
        showMap: false,
      },
    ],
  },
  {
    id: 'salon',
    name: 'サロン・教室向け',
    description: '美容室・整体・習い事教室などのサービス業向けテンプレート',
    theme: themePresets[2].theme,
    sections: [
      {
        type: 'hero',
        title: 'サロンの名前',
        subtitle: 'あなたらしさを引き出す、くつろぎの空間',
        imageUrl: '',
      },
      {
        type: 'about',
        heading: 'コンセプト',
        body: 'お一人おひとりに寄り添った丁寧なサービスを心がけています。初めての方もお気軽にご相談ください。',
      },
      {
        type: 'services',
        heading: 'メニュー・料金',
        items: [
          { title: 'ベーシックコース', description: '60分 ¥5,000' },
          { title: 'スタンダードコース', description: '90分 ¥7,500' },
          { title: 'プレミアムコース', description: '120分 ¥10,000' },
        ],
      },
      {
        type: 'news',
        heading: 'お知らせ',
        items: [{ date: '2026-06-01', title: 'ご予約はお電話にて受付中です' }],
      },
      {
        type: 'contact',
        heading: 'ご予約・お問い合わせ',
        address: '東京都〇〇区〇〇 1-2-3 2F',
        phone: '03-1234-5678',
        email: 'reserve@example.com',
        hours: '10:00〜20:00（不定休）',
        showMap: false,
      },
    ],
  },
]
