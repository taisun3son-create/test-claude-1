import type { Section } from '../types'

interface Props {
  section: Section
  onChange: (section: Section) => void
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
            サブタイトル
            <input
              value={section.subtitle}
              onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            />
          </label>
          <label>
            背景画像URL（空欄の場合はテーマカラー背景）
            <input
              value={section.imageUrl}
              onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </label>
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
            </div>
          ))}
          <button
            className="btn small"
            onClick={() =>
              onChange({ ...section, items: [...section.items, { title: '', description: '' }] })
            }
          >
            ＋ 項目を追加
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
