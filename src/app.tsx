import { useMemo, useState } from 'preact/hooks'
import ticketData from './data/select-tickets.json'
import './app.css'

type Card = {
  id: number
  name: string
  characterId: number
  characterName: string
  rarity: number
  isParallel: boolean
}

type Ticket = {
  id: number
  name: string
  itemName: string
  description: string
  startDate: string
  cards: Card[]
}

const tickets = ticketData.tickets as Ticket[]
const totalCards = tickets.reduce((sum, ticket) => sum + ticket.cards.length, 0)
const characterColors: Record<number, string> = {
  1021: '#68be8d',
  1022: '#ba2636',
  1023: '#c8c2c6',
  1031: '#f8b500',
  1032: '#5383c3',
  1033: '#e7609e',
  1041: '#a2d7dd',
  1042: '#fad764',
  1043: '#9d8de2',
  1051: '#1ebecd',
  1052: '#f56455',
}

function rarityLabel(rarity: number) {
  if (rarity === 9) return 'BR'
  if (rarity === 7) return 'LR'
  if (rarity === 5) return 'UR'
  if (rarity === 4) return 'SR'
  return `Rarity ${rarity}`
}

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase('ja-JP').replaceAll(/\s+/g, '')
}

export function App() {
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id ?? 0)
  const [query, setQuery] = useState('')
  const [characterName, setCharacterName] = useState('all')
  const [rarity, setRarity] = useState('all')

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0]

  const characterOptions = useMemo(() => {
    return Array.from(
      new Set(selectedTicket.cards.map((card) => card.characterName)),
    ).sort((a, b) => a.localeCompare(b, 'ja-JP'))
  }, [selectedTicket])

  const rarityOptions = useMemo(() => {
    return Array.from(new Set(selectedTicket.cards.map((card) => card.rarity))).sort(
      (a, b) => b - a,
    )
  }, [selectedTicket])

  const filteredCards = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)

    return selectedTicket.cards.filter((card) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeSearchText(`${card.name}${card.characterName}${card.id}`).includes(
          normalizedQuery,
        )
      const matchesCharacter =
        characterName === 'all' || card.characterName === characterName
      const matchesRarity = rarity === 'all' || String(card.rarity) === rarity

      return matchesQuery && matchesCharacter && matchesRarity
    })
  }, [characterName, query, rarity, selectedTicket])

  function handleTicketChange(ticketId: number) {
    setSelectedTicketId(ticketId)
    setQuery('')
    setCharacterName('all')
    setRarity('all')
  }

  return (
    <main class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Link! Like! Love Live!</p>
          <h1>セレクトチケット交換カード一覧</h1>
          <p class="lead">
            セレクトチケットごとに交換対象カードを検索・絞り込みできます。
          </p>
        </div>
        <dl class="summary">
          <div>
            <dt>Tickets</dt>
            <dd>{tickets.length}</dd>
          </div>
          <div>
            <dt>Cards</dt>
            <dd>{totalCards.toLocaleString('ja-JP')}</dd>
          </div>
        </dl>
      </header>

      <section class="viewer-grid">
        <aside class="ticket-panel" aria-label="セレクトチケット">
          <h2>チケット</h2>
          <div class="ticket-list">
            {tickets.map((ticket) => (
              <button
                type="button"
                class={ticket.id === selectedTicket.id ? 'ticket active' : 'ticket'}
                onClick={() => handleTicketChange(ticket.id)}
                key={ticket.id}
              >
                <span>{ticket.name}</span>
                <small>{ticket.cards.length} cards</small>
              </button>
            ))}
          </div>
        </aside>

        <section class="card-panel">
          <div class="ticket-detail">
            <div>
              <p class="eyebrow">{selectedTicket.itemName}</p>
              <h2>{selectedTicket.name}</h2>
              <p>{selectedTicket.description}</p>
            </div>
            <p class="date-range">開始日 {selectedTicket.startDate}</p>
          </div>

          <div class="filters" aria-label="カード絞り込み">
            <label>
              <span>検索</span>
              <input
                type="search"
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
                placeholder="カード名・メンバー名・Card ID"
              />
            </label>
            <label>
              <span>メンバー</span>
              <select
                value={characterName}
                onChange={(event) => setCharacterName(event.currentTarget.value)}
              >
                <option value="all">すべて</option>
                {characterOptions.map((name) => (
                  <option value={name} key={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>レアリティ</span>
              <select
                value={rarity}
                onChange={(event) => setRarity(event.currentTarget.value)}
              >
                <option value="all">すべて</option>
                {rarityOptions.map((value) => (
                  <option value={value} key={value}>
                    {rarityLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="result-bar">
            <strong>{filteredCards.length.toLocaleString('ja-JP')}</strong>
            <span> / {selectedTicket.cards.length.toLocaleString('ja-JP')} cards</span>
          </div>

          <div class="card-grid">
            {filteredCards.map((card) => (
              <article class="card-item" key={card.id}>
                <div>
                  <p
                    class="card-character"
                    style={{ '--character-color': characterColors[card.characterId] }}
                  >
                    {card.characterName}
                  </p>
                  <h3>{card.name}</h3>
                </div>
                <dl>
                  <div>
                    <dt>Rarity</dt>
                    <dd>{rarityLabel(card.rarity)}</dd>
                  </div>
                </dl>
                {card.isParallel && <span class="badge">Parallel</span>}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
