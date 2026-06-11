import type { Site } from './types'

const STORAGE_KEY = 'homepage-builder/sites'

export function loadSites(): Site[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Site[]
  } catch {
    return []
  }
}

export function saveSites(sites: Site[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
}

export function newId(): string {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
