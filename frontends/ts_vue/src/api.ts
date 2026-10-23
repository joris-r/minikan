export type Item = { id: string; title: string }
export type Column = Item & { cards: Item[] }
export type Board = Item & { columns: Column[] }

// The frontend acts as this user.
const USER = 'demo'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${USER}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status}`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export const api = {
  listBoards: () => request<Item[]>('GET', '/boards'),
  getBoard: (id: string) => request<Board>('GET', `/boards/${id}`),
  createBoard: () => request<Item>('POST', '/boards'),
  createColumn: (boardId: string) => request<Item>('POST', `/boards/${boardId}/columns`),
  createCard: (columnId: string) => request<Item>('POST', `/columns/${columnId}/cards`),
  setBoardTitle: (id: string, title: string) => request<Item>('PATCH', `/boards/${id}`, { title }),
  setColumnTitle: (id: string, title: string) =>
    request<Item>('PATCH', `/columns/${id}`, { title }),
  setCardTitle: (id: string, title: string) => request<Item>('PATCH', `/cards/${id}`, { title }),
  deleteBoard: (id: string) => request<void>('DELETE', `/boards/${id}`),
  deleteColumn: (id: string) => request<void>('DELETE', `/columns/${id}`),
  deleteCard: (id: string) => request<void>('DELETE', `/cards/${id}`),
  moveColumn: (id: string, position: number) =>
    request<void>('POST', `/columns/${id}/move`, { position }),
  moveCard: (id: string, columnId: string, position: number) =>
    request<void>('POST', `/cards/${id}/move`, { columnId, position }),
}
