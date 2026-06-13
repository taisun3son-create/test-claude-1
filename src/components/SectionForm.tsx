import { useRef, useState } from 'react'
import type { Section } from '../types'
import { fileToCompressedDataUrl } from '../imageUtils'

interface Props {
  section: Section
  onChange: (section: Section) => void
}

// 画像のURL入力＋ファイルアップロード（自動圧縮）兼用の入力欄
function ImageInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (url: string) => void
  label: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const isDataUrl = value.startsWith('data:')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToCompressedDataUrl(file))
    } catch {
      alert('画像を読み込めませんでした。別のファイルをお試しください。')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="image-input">
      <span className="image-input-label">{label}</span>
      {value && (
        <div className="image-preview">
          <img src={value} alt="" />
          <button className="btn small danger" onClick={() => onChange('')}>
            画像を削除
          </button>
        </div>
      )}
      <div className="image-input-row">
        <button
          className="btn small"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? '処理中…' : '📁 画像をアップロード'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {!isDataUrl && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="または画像URLを入力 https://..."
        />
      )}
    </div>
  )
}

export default function SectionForm({ section, onChange }: Props) {
  switch (section.type) {
    case 'hero':
      return (
        <div className="form">
          <label>
            タイトル
            <input
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
            />
          </label>
          <label>
            キャッチコピー
            <input
              value={section.subtitle}
              onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            />
          </label>
          <ImageInput
            label="背景画像（空欄の場合はテーマカラー背景）"
            value={section.imageUrl}
            onChange={(imageUrl) => onChange({ ...section, imageUrl })}
          />
        </div>
      )
    case 'about':
      return (
        <div className="form">
          <label>
            見出し
            <input
              value={section.heading}
              onChange={(e) => onChange({ ...section, heading: e.target.value })}
            />
          </label>
          <label>
            本文
            <textarea
              rows={4}
              value={section.body}
              onChange={(e) => onChange({ ...section, body: e.target.value })}
            />
          </label>
        </div>
      )
    case 'services':
      return (
        <div className="form">
          <label>
            見出し
            <input
              value={section.heading}
              onChange={(e) => onChange({ ...section, heading: e.target.value })}
            />
          </label>
          {section.items.map((item, i) => (
            <div key={i} className="list-item">
              <div className="list-item-header">
                <span>項目 {i + 1}</span>
                <button
                  className="btn small danger"
                  onClick={() =>
                    onChange({ ...section, items: section.items.filter((_, j) => j !== i) })
                  }
                >
                  削除
                </button>
              </div>
              <input
                value={item.title}
                placeholder="タイトル"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, title: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <textarea
                rows={2}
                value={item.description}
                placeholder="説明"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, description: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <ImageInput
                label="写真"
                value={item.imageUrl ?? ''}
                onChange={(imageUrl) => {
                  const items = section.items.slice()
                  items[i] = { ...item, imageUrl }
                  onChange({ ...section, items })
                }}
              />
            </div>
          ))}
          <button
            className="btn small"
            onClick={() =>
              onChange({
                ...section,
                items: [...section.items, { title: '', description: '', imageUrl: '' }],
              })
            }
          >
            ＋ 項目を追加
          </button>
        </div>
      )
    case 'products':
      return (
        <div className="form">
          <label>
            見出し
            <input
              value={section.heading}
              onChange={(e) => onChange({ ...section, heading: e.target.value })}
            />
          </label>
          {section.items.map((item, i) => (
            <div key={i} className="list-item">
              <div className="list-item-header">
                <span>商品 {i + 1}</span>
                <button
                  className="btn small danger"
                  onClick={() =>
                    onChange({ ...section, items: section.items.filter((_, j) => j !== i) })
                  }
                >
                  削除
                </button>
              </div>
              <input
                value={item.name}
                placeholder="商品名"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, name: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <textarea
                rows={2}
                value={item.description}
                placeholder="説明文"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, description: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <input
                value={item.price}
                placeholder="価格（例：¥1,000）"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, price: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <ImageInput
                label="商品画像"
                value={item.imageUrl}
                onChange={(imageUrl) => {
                  const items = section.items.slice()
                  items[i] = { ...item, imageUrl }
                  onChange({ ...section, items })
                }}
              />
            </div>
          ))}
          <button
            className="btn small"
            onClick={() =>
              onChange({
                ...section,
                items: [...section.items, { name: '', description: '', price: '', imageUrl: '' }],
              })
            }
          >
            ＋ 商品を追加
          </button>
        </div>
      )
    case 'news':
      return (
        <div className="form">
          <label>
            見出し
            <input
              value={section.heading}
              onChange={(e) => onChange({ ...section, heading: e.target.value })}
            />
          </label>
          {section.items.map((item, i) => (
            <div key={i} className="list-item">
              <div className="list-item-header">
                <span>お知らせ {i + 1}</span>
                <button
                  className="btn small danger"
                  onClick={() =>
                    onChange({ ...section, items: section.items.filter((_, j) => j !== i) })
                  }
                >
                  削除
                </button>
              </div>
              <input
                type="date"
                value={item.date}
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, date: e.target.value }
                  onChange({ ...section, items })
                }}
              />
              <input
                value={item.title}
                placeholder="お知らせの内容"
                onChange={(e) => {
                  const items = section.items.slice()
                  items[i] = { ...item, title: e.target.value }
                  onChange({ ...section, items })
                }}
              />
            </div>
          ))}
          <button
            className="btn small"
            onClick={() =>
              onChange({
                ...section,
                items: [
                  ...section.items,
                  { date: new Date().toISOString().slice(0, 10), title: '' },
                ],
              })
            }
          >
            ＋ お知らせを追加
          </button>
        </div>
      )
    case 'contact':
      return (
        <div className="form">
          <label>
            見出し
            <input
              value={section.heading}
              onChange={(e) => onChange({ ...section, heading: e.target.value })}
            />
          </label>
          <label>
            住所
            <input
              value={section.address}
              onChange={(e) => onChange({ ...section, address: e.target.value })}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={section.showMap}
              onChange={(e) => onChange({ ...section, showMap: e.target.checked })}
            />
            住所のGoogleマップを表示する
          </label>
          <label>
            電話番号
            <input
              value={section.phone}
              onChange={(e) => onChange({ ...section, phone: e.target.value })}
            />
          </label>
          <label>
            メールアドレス
            <input
              value={section.email}
              onChange={(e) => onChange({ ...section, email: e.target.value })}
            />
          </label>
          <label>
            営業時間
            <input
              value={section.hours}
              onChange={(e) => onChange({ ...section, hours: e.target.value })}
            />
          </label>
        </div>
      )
  }
}
