import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const inputPath = resolve(root, 'rawdata/raw.json')
const outputPath = resolve(root, 'src/data/select-tickets.json')

const raw = JSON.parse(await readFile(inputPath, 'utf8'))

const toDate = (value) => value.split(' ')[0]

const tickets = raw.tickets
  .map((ticket) => ({
    id: ticket.select_ticket_series_id,
    name: ticket.ticket_name,
    itemName: ticket.ticket_item_name,
    description: ticket.description,
    startDate: toDate(ticket.start_time_utc),
    cards: ticket.exchangeable_cards.map((card) => ({
      id: card.card_data_id,
      name: card.name,
      characterId: card.characters_id,
      characterName: card.character_name,
      rarity: card.rarity,
      isParallel: Boolean(card.is_parallel_card),
    })),
  }))
  .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)

const output = {
  source: {
    exportedAtUtc: raw.source?.exported_at_utc ?? null,
    tables: raw.source?.tables ?? [],
  },
  tickets,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
