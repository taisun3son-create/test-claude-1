import { useState } from 'react'
import type { Site } from '../types'
import { templates } from '../templates'

interface Props {
  sites: Site[]
  onCreate: (templateId: string, name: string) => void
  onCreateWithAi: (prompt: string, name: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export default function Dashboard({
  sites,
  onCreate,
  onCreateWithAi,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const [showNew, setShowNew] = useState(false)
  const [mode, setMode] = useState<'ai' | 'template'>('ai')
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState(templates[0].id)

  const canCreate = mode === 'ai' ? prompt.trim().length > 0 : name.trim().length > 0

  const handleCreate = () => {
    if (!canCreate) return
    if (mode === 'ai') {
      onCreateWithAi(prompt.trim(), name.trim())
    } else {
      onCreate(templateId, name.trim())
    }
    setName('')
    setPrompt('')
    setShowNew(false)
  }

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>AIホームページビルダー</h1>
        <button className="btn primary" onClick={() => setShowNew(true)}>
          ＋ 新しいサイトを作る
        </button>
      </header>

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>新しいサイトを作成</h2>

            <div className="mode-toggle">
              <button
                className={`btn ${mode === 'ai' ? 'primary' : ''}`}
                onClick={() => setMode('ai')}
              >
                🤖 AIにおまかせ
              </button>
              <button
                className={`btn ${mode === 'template' ? 'primary' : ''}`}
                onClick={() => setMode('template')}
              >
                テンプレートから選ぶ
              </button>
            </div>

            {mode === 'ai' ? (
              <>
                <label>
                  どんなホームページを作りたいですか？
                  <textarea
                    autoFocus
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例：工具店向けの、青色を基調にした信頼感のあるホームページを作って"
                  />
                </label>
                <label>
                  お店・会社の名前（省略可）
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：田中工具店"
                  />
                </label>
                <p className="hint">
                  対応業種の例：工具店・飲食店・美容室・整体院・会社。色の希望（青、高級感など）も書けます。
                </p>
              </>
            ) : (
              <>
                <label>
                  サイト名（お店・会社の名前）
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="例：カフェさくら"
                  />
                </label>
                <p className="field-label">テンプレートを選択</p>
                <div className="template-list">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      className={`template-card ${t.id === templateId ? 'selected' : ''}`}
                      onClick={() => setTemplateId(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>{t.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowNew(false)}>
                キャンセル
              </button>
              <button className="btn primary" onClick={handleCreate} disabled={!canCreate}>
                作成する
              </button>
            </div>
          </div>
        </div>
      )}

      {sites.length === 0 ? (
        <div className="empty-state">
          <p>まだサイトがありません。</p>
          <p>「＋ 新しいサイトを作る」から始めましょう。</p>
        </div>
      ) : (
        <div className="site-grid">
          {sites.map((site) => (
            <div key={site.id} className="site-card">
              <h3>{site.name}</h3>
              <p className="site-meta">
                更新：{new Date(site.updatedAt).toLocaleString('ja-JP')}
              </p>
              <div className="site-actions">
                <button className="btn primary" onClick={() => onEdit(site.id)}>
                  編集
                </button>
                <button className="btn" onClick={() => onDuplicate(site.id)}>
                  複製
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (confirm(`「${site.name}」を削除しますか？この操作は取り消せません。`)) {
                      onDelete(site.id)
                    }
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
