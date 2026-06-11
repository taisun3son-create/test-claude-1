import { useMemo, useState } from 'react'
import type { Section, Site } from '../types'
import { themePresets } from '../templates'
import { renderSiteHtml } from '../renderHtml'
import SectionForm from './SectionForm'

interface Props {
  site: Site
  onChange: (site: Site) => void
  onBack: () => void
}

export default function Editor({ site, onChange, onBack }: Props) {
  const [device, setDevice] = useState<'pc' | 'sp'>('pc')
  const html = useMemo(() => renderSiteHtml(site), [site])

  const updateSection = (index: number, section: Section) => {
    const sections = site.sections.slice()
    sections[index] = section
    onChange({ ...site, sections })
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= site.sections.length) return
    const sections = site.sections.slice()
    ;[sections[index], sections[target]] = [sections[target], sections[index]]
    onChange({ ...site, sections })
  }

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="editor">
      <header className="app-header">
        <div className="header-left">
          <button className="btn" onClick={onBack}>
            ← 一覧へ戻る
          </button>
          <input
            className="site-name-input"
            value={site.name}
            onChange={(e) => onChange({ ...site, name: e.target.value })}
          />
        </div>
        <div className="header-right">
          <div className="device-toggle">
            <button
              className={`btn ${device === 'pc' ? 'primary' : ''}`}
              onClick={() => setDevice('pc')}
            >
              PC
            </button>
            <button
              className={`btn ${device === 'sp' ? 'primary' : ''}`}
              onClick={() => setDevice('sp')}
            >
              スマホ
            </button>
          </div>
          <button className="btn primary" onClick={downloadHtml}>
            HTMLをダウンロード
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="editor-panel">
          <section className="panel-block">
            <h2>カラーテーマ</h2>
            <div className="theme-list">
              {themePresets.map((preset) => {
                const selected = preset.theme.primary === site.theme.primary
                return (
                  <button
                    key={preset.name}
                    className={`theme-chip ${selected ? 'selected' : ''}`}
                    onClick={() => onChange({ ...site, theme: { ...preset.theme } })}
                    title={preset.name}
                  >
                    <span className="swatch" style={{ background: preset.theme.primary }} />
                    <span className="swatch" style={{ background: preset.theme.accent }} />
                    {preset.name}
                  </button>
                )
              })}
            </div>
          </section>

          {site.sections.map((section, i) => (
            <section key={i} className="panel-block">
              <div className="panel-block-header">
                <h2>{sectionLabel(section)}</h2>
                <div className="move-buttons">
                  <button className="btn small" onClick={() => moveSection(i, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    className="btn small"
                    onClick={() => moveSection(i, 1)}
                    disabled={i === site.sections.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <SectionForm section={section} onChange={(s) => updateSection(i, s)} />
            </section>
          ))}
        </aside>

        <main className="preview-area">
          <iframe
            title="プレビュー"
            className={`preview-frame ${device}`}
            srcDoc={html}
          />
        </main>
      </div>
    </div>
  )
}

function sectionLabel(section: Section): string {
  switch (section.type) {
    case 'hero':
      return 'メインビジュアル'
    case 'about':
      return '紹介文'
    case 'services':
      return 'サービス・メニュー'
    case 'news':
      return 'お知らせ'
    case 'contact':
      return '連絡先・アクセス'
  }
}
