export interface HeroSection {
  type: 'hero'
  title: string
  subtitle: string
  imageUrl: string
}

export interface AboutSection {
  type: 'about'
  heading: string
  body: string
}

export interface ServiceItem {
  title: string
  description: string
  imageUrl?: string
}

export interface ServicesSection {
  type: 'services'
  heading: string
  items: ServiceItem[]
}

export interface ProductItem {
  name: string
  description: string
  price: string
  imageUrl: string
}

export interface ProductsSection {
  type: 'products'
  heading: string
  items: ProductItem[]
}

export interface NewsItem {
  date: string
  title: string
}

export interface NewsSection {
  type: 'news'
  heading: string
  items: NewsItem[]
}

export interface ContactSection {
  type: 'contact'
  heading: string
  address: string
  phone: string
  email: string
  hours: string
  showMap: boolean
}

export type Section =
  | HeroSection
  | AboutSection
  | ServicesSection
  | ProductsSection
  | NewsSection
  | ContactSection

export type SectionType = Section['type']

export interface Theme {
  primary: string
  accent: string
  background: string
  text: string
  // 'serif' = 明朝体（和風・上品）、'sans' = ゴシック体（モダン・信頼感）。省略時は sans。
  fontStyle?: 'serif' | 'sans'
}

export interface Site {
  id: string
  name: string
  templateId: string
  theme: Theme
  sections: Section[]
  fontScale: number
  showCallButton: boolean
  updatedAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}
