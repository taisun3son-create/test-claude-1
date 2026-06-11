import type { Site } from './types'

const STORAGE_KEY = 'homepage-builder/sites'

// 旧バージョンで保存されたデータに不足しているフィールドを補う
function normalizeSite(raw: Partial<Site> & { sections?: unknown[] }): Site {
  const site = {
    fontScale: 1,
    showCallButton: true,
    ...raw,
  } as Site
  site.sections = (site.sections ?? []).map((s) =>
    s.type === 'contact' && s.showMap === undefined ? { ...s, showMap: false } : s,
  )
  return site
}

export function loadSites(): Site[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Site>[]
    return parsed.map((s) => normalizeSite(s as Partial<Site> & { sections?: unknown[] }))
  } catch {
    return []
  }
}

export function saveSites(sites: Site[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
  } catch {
    alert(
      '保存容量がいっぱいです。大きな画像を減らすか、不要なサイトを削除してください。',
    )
  }
}

export function newId(): string {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
