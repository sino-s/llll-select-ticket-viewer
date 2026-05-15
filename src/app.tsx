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
const ticketsByCardId = new Map<number, Ticket[]>()

for (const ticket of tickets) {
  for (const card of ticket.cards) {
    ticketsByCardId.set(card.id, [...(ticketsByCardId.get(card.id) ?? []), ticket])
  }
}

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
  const [globalQuery, setGlobalQuery] = useState('')
  const [selectedSearchCardId, setSelectedSearchCardId] = useState<number | null>(
    null,
  )
  const [expandedTicketCardId, setExpandedTicketCardId] = useState<number | null>(
    null,
  )
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

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(globalQuery)

    if (normalizedQuery.length === 0) return []

    const resultsByCardId = new Map<number, Card>()

    for (const ticket of tickets) {
      for (const card of ticket.cards) {
        if (!normalizeSearchText(card.name).includes(normalizedQuery)) continue
        resultsByCardId.set(card.id, card)
      }
    }

    return Array.from(resultsByCardId.values())
      .map((card) => ({ ...card, tickets: ticketsByCardId.get(card.id) ?? [] }))
      .sort(
        (a, b) =>
          a.characterName.localeCompare(b.characterName, 'ja-JP') ||
          a.name.localeCompare(b.name, 'ja-JP'),
      )
  }, [globalQuery])

  const selectedSearchCard =
    searchResults.find((card) => card.id === selectedSearchCardId) ?? null

  const filteredCards = useMemo(() => {
    return selectedTicket.cards.filter((card) => {
      const matchesCharacter =
        characterName === 'all' || card.characterName === characterName
      const matchesRarity = rarity === 'all' || String(card.rarity) === rarity

      return matchesCharacter && matchesRarity
    })
  }, [characterName, rarity, selectedTicket])

  function handleTicketChange(ticketId: number) {
    setSelectedTicketId(ticketId)
    setCharacterName('all')
    setRarity('all')
    setExpandedTicketCardId(null)
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

      <section class="global-search" aria-label="カード全体検索">
        <label>
          <span>カード全体検索</span>
          <input
            type="search"
            value={globalQuery}
            onInput={(event) => {
              setGlobalQuery(event.currentTarget.value)
              setSelectedSearchCardId(null)
            }}
            placeholder="カード名から検索"
          />
        </label>
        {globalQuery.length > 0 && (
          <div class="search-results">
            <p>
              <strong>{searchResults.length.toLocaleString('ja-JP')}</strong>
              <span> cards</span>
            </p>
            <div>
              {searchResults.slice(0, 80).map((card) => (
                <button
                  type="button"
                  class={
                    card.id === selectedSearchCardId
                      ? 'search-result active'
                      : 'search-result'
                  }
                  onClick={() =>
                    setSelectedSearchCardId((currentId) =>
                      currentId === card.id ? null : card.id,
                    )
                  }
                  key={card.id}
                >
                  <span
                    class="card-character"
                    style={{
                      '--character-color': characterColors[card.characterId],
                    }}
                  >
                    {card.characterName}
                  </span>
                  <strong>{card.name}</strong>
                  <small>{card.tickets.length} tickets</small>
                </button>
              ))}
            </div>
            {selectedSearchCard && (
              <section class="linked-tickets" aria-label="検索カードの対象チケット">
                <h2>{selectedSearchCard.name}</h2>
                <div>
                  {selectedSearchCard.tickets.map((ticket) => (
                    <button
                      type="button"
                      class="linked-ticket"
                      onClick={() => handleTicketChange(ticket.id)}
                      key={ticket.id}
                    >
                      <span>{ticket.name}</span>
                      <small>開始日 {ticket.startDate}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>

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
              <article
                class={
                  card.id === expandedTicketCardId ? 'card-item active' : 'card-item'
                }
                key={card.id}
              >
                <button
                  type="button"
                  class="card-main"
                  onClick={() =>
                    setExpandedTicketCardId((currentId) =>
                      currentId === card.id ? null : card.id,
                    )
                  }
                >
                  <p
                    class="card-character"
                    style={{ '--character-color': characterColors[card.characterId] }}
                  >
                    {card.characterName}
                  </p>
                  <h3>{card.name}</h3>
                  <dl>
                    <div>
                      <dt>Rarity</dt>
                      <dd>{rarityLabel(card.rarity)}</dd>
                    </div>
                  </dl>
                </button>
                {card.isParallel && <span class="badge">Parallel</span>}
                {card.id === expandedTicketCardId && (
                  <div class="card-linked-tickets">
                    {(ticketsByCardId.get(card.id) ?? []).map((ticket) => (
                      <button
                        type="button"
                        class="linked-ticket"
                        onClick={() => handleTicketChange(ticket.id)}
                        key={ticket.id}
                      >
                        <span>{ticket.name}</span>
                        <small>開始日 {ticket.startDate}</small>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
