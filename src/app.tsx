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
const ticketIds = new Set(tickets.map((ticket) => ticket.id))
const ownedTicketStorageKey = 'llll-select-ticket-viewer:owned-ticket-ids'

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

function loadOwnedTicketIds() {
  if (typeof window === 'undefined') return new Set<number>()

  try {
    const rawValue = window.localStorage.getItem(ownedTicketStorageKey)
    if (!rawValue) return new Set<number>()

    const parsedValue: unknown = JSON.parse(rawValue)
    if (!Array.isArray(parsedValue)) return new Set<number>()

    return new Set(
      parsedValue.filter(
        (ticketId): ticketId is number =>
          typeof ticketId === 'number' && ticketIds.has(ticketId),
      ),
    )
  } catch {
    return new Set<number>()
  }
}

function saveOwnedTicketIds(ownedTicketIds: Set<number>) {
  try {
    window.localStorage.setItem(
      ownedTicketStorageKey,
      JSON.stringify(Array.from(ownedTicketIds).sort((a, b) => a - b)),
    )
  } catch {
    // Keep the in-memory selection usable even when storage is unavailable.
  }
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
  const [ownedTicketIds, setOwnedTicketIds] = useState(loadOwnedTicketIds)
  const [showOwnedOnlyLinkedTickets, setShowOwnedOnlyLinkedTickets] =
    useState(false)

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

  function handleOwnedTicketChange(ticketId: number, isOwned: boolean) {
    setOwnedTicketIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (isOwned) {
        nextIds.add(ticketId)
      } else {
        nextIds.delete(ticketId)
      }

      saveOwnedTicketIds(nextIds)
      return nextIds
    })
  }

  function handleSelectAllOwnedTickets() {
    const nextIds = new Set(tickets.map((ticket) => ticket.id))
    saveOwnedTicketIds(nextIds)
    setOwnedTicketIds(nextIds)
  }

  function getVisibleLinkedTickets(linkedTickets: Ticket[]) {
    if (!showOwnedOnlyLinkedTickets) return linkedTickets
    return linkedTickets.filter((ticket) => ownedTicketIds.has(ticket.id))
  }

  function renderLinkedTickets(linkedTickets: Ticket[]) {
    const visibleLinkedTickets = getVisibleLinkedTickets(linkedTickets)

    if (visibleLinkedTickets.length === 0) {
      return (
        <p class="empty-state">
          {showOwnedOnlyLinkedTickets
            ? '所持チケットに対象はありません'
            : '対象チケットはありません'}
        </p>
      )
    }

    return visibleLinkedTickets.map((ticket) => (
      <button
        type="button"
        class="linked-ticket"
        onClick={() => handleTicketChange(ticket.id)}
        key={ticket.id}
      >
        <span>{ticket.name}</span>
        <small>開始日 {ticket.startDate}</small>
      </button>
    ))
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
        <div class="global-search-controls">
          <label class="global-search-field">
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
          <label class="switch-control global-owned-mode">
            <input
              type="checkbox"
              checked={showOwnedOnlyLinkedTickets}
              onChange={(event) =>
                setShowOwnedOnlyLinkedTickets(event.currentTarget.checked)
              }
            />
            <span class="switch-track" aria-hidden="true" />
            <span class="switch-label">所持チケットのみ</span>
          </label>
        </div>
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
                <div>{renderLinkedTickets(selectedSearchCard.tickets)}</div>
              </section>
            )}
          </div>
        )}
      </section>

      <section class="viewer-grid">
        <aside class="ticket-panel" aria-label="セレクトチケット">
          <div class="ticket-panel-header">
            <h2>チケット</h2>
            <button
              type="button"
              class="select-all-tickets"
              onClick={handleSelectAllOwnedTickets}
            >
              全選択
            </button>
          </div>
          <div class="ticket-list">
            {tickets.map((ticket) => (
              <div
                class={
                  ticket.id === selectedTicket.id
                    ? 'ticket-row active'
                    : 'ticket-row'
                }
                key={ticket.id}
              >
                <label class="owned-ticket-toggle">
                  <input
                    type="checkbox"
                    checked={ownedTicketIds.has(ticket.id)}
                    onChange={(event) =>
                      handleOwnedTicketChange(
                        ticket.id,
                        event.currentTarget.checked,
                      )
                    }
                  />
                  <span>所持</span>
                </label>
                <button
                  type="button"
                  class="ticket"
                  onClick={() => handleTicketChange(ticket.id)}
                >
                  <span>{ticket.name}</span>
                  <small>{ticket.cards.length} cards</small>
                </button>
              </div>
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
                    {renderLinkedTickets(ticketsByCardId.get(card.id) ?? [])}
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
