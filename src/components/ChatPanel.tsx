import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Site } from '../types'
import { applyChatCommand } from '../ai/demoAi'

interface Props {
  site: Site
  initialAssistantMessage?: string | null
  onChange: (site: Site) => void
}

const defaultGreeting = `こんにちは！チャットでホームページを修正できます。例えば：
・「青色を基調に信頼感のあるデザインにして」
・「文字を大きくして」
・「キャッチコピーを変えて」
・「地図を表示して」「電話ボタンを消して」
と話しかけてみてください。`

export default function ChatPanel({ site, initialAssistantMessage, onChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: initialAssistantMessage || defaultGreeting },
  ])
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const result = applyChatCommand(site, text)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: result.reply },
    ])
    if (result.site !== site) {
      onChange(result.site)
    }
    setInput('')
  }

  return (
    <div className="chat-panel">
      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="例：文字を大きくして"
        />
        <button className="btn primary" onClick={send} disabled={!input.trim()}>
          送信
        </button>
      </div>
      <p className="chat-note">
        ※ 現在はデモAI（APIキー不要）で動作中。本物のAIへの切り替えは今後対応予定です。
      </p>
    </div>
  )
}
