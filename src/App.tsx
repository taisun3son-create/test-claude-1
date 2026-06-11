import { useEffect, useState } from 'react'
import type { Site } from './types'
import { loadSites, newId, saveSites } from './storage'
import { templates } from './templates'
import Dashboard from './components/Dashboard'
import Editor from './components/Editor'

export default function App() {
  const [sites, setSites] = useState<Site[]>(() => loadSites())
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    saveSites(sites)
  }, [sites])

  const createSite = (templateId: string, name: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    const site: Site = {
      id: newId(),
      name,
      templateId,
      theme: { ...template.theme },
      sections: structuredClone(template.sections),
      updatedAt: new Date().toISOString(),
    }
    setSites((prev) => [...prev, site])
    setEditingId(site.id)
  }

  const updateSite = (updated: Site) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : s,
      ),
    )
  }

  const deleteSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id))
  }

  const duplicateSite = (id: string) => {
    const original = sites.find((s) => s.id === id)
    if (!original) return
    const copy: Site = {
      ...structuredClone(original),
      id: newId(),
      name: `${original.name}のコピー`,
      updatedAt: new Date().toISOString(),
    }
    setSites((prev) => [...prev, copy])
  }

  const editingSite = sites.find((s) => s.id === editingId)

  if (editingSite) {
    return (
      <Editor
        site={editingSite}
        onChange={updateSite}
        onBack={() => setEditingId(null)}
      />
    )
  }

  return (
    <Dashboard
      sites={sites}
      onCreate={createSite}
      onEdit={setEditingId}
      onDelete={deleteSite}
      onDuplicate={duplicateSite}
    />
  )
}
