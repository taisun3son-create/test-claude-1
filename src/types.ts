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
}

export interface ServicesSection {
  type: 'services'
  heading: string
  items: ServiceItem[]
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
}

export type Section =
  | HeroSection
  | AboutSection
  | ServicesSection
  | NewsSection
  | ContactSection

export type SectionType = Section['type']

export interface Theme {
  primary: string
  accent: string
  background: string
  text: string
}

export interface Site {
  id: string
  name: string
  templateId: string
  theme: Theme
  sections: Section[]
  updatedAt: string
}
