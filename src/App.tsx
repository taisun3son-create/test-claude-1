import { useEffect, useState } from 'react'
import type { Site } from './types'
import { loadSites, newId, saveSites } from './storage'
import { templates } from './templates'
import { generateSiteContent } from './ai/demoAi'
import Dashboard from './components/Dashboard'
import Editor from './components/Editor'

export default function App() {
  const [sites, setSites] = useState<Site[]>(() => loadSites())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [welcomeReply, setWelcomeReply] = useState<string | null>(null)

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
      fontScale: 1,
      showCallButton: true,
      updatedAt: new Date().toISOString(),
    }
    setSites((prev) => [...prev, site])
    setWelcomeReply(null)
    setEditingId(site.id)
  }

  const createSiteWithAi = (prompt: string, name: string) => {
    const generated = generateSiteContent(prompt)
    const siteName = name.trim() || generated.suggestedName
    const site: Site = {
      id: newId(),
      name: siteName,
      templateId: generated.industryId,
      theme: generated.theme,
      sections: generated.sections.map((s) =>
        s.type === 'hero' ? { ...s, title: siteName } : s,
      ),
      fontScale: 1,
      showCallButton: true,
      updatedAt: new Date().toISOString(),
    }
    setSites((prev) => [...prev, site])
    setWelcomeReply(generated.reply)
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
        initialAssistantMessage={welcomeReply}
        onChange={updateSite}
        onBack={() => {
          setWelcomeReply(null)
          setEditingId(null)
        }}
      />
    )
  }

  return (
    <Dashboard
      sites={sites}
      onCreate={createSite}
      onCreateWithAi={createSiteWithAi}
      onEdit={setEditingId}
      onDelete={deleteSite}
      onDuplicate={duplicateSite}
    />
  )
}
