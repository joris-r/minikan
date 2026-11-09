export type Item = { id: string; title: string }
export type Column = Item & { cards: Item[] }
export type Board = Item & { columns: Column[] }

export type Session = { name: string }

// The API answered 401: there is no session, or it has ended.
export class Unauthorized extends Error {}

let unauthorized = () => {}

// Sets what to do when the API answers 401, before the request throws `Unauthorized`.
export function onUnauthorized(handler: () => void): void {
  unauthorized = handler
}

// The browser sends the session cookie by itself.
function send(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(method, path, body)
  if (response.status === 401) {
    unauthorized()
    throw new Unauthorized(`${method} ${path}: 401`)
  }
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status}`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

// Returns whether the name and password were accepted. A 401 here is no ended session.
async function logIn(name: string, password: string): Promise<boolean> {
  const response = await send('POST', '/login', { name, password })
  if (response.status === 401) return false
  if (!response.ok) throw new Error(`POST /login: ${response.status}`)
  return true
}

export const api = {
  logIn,
  logOut: () => request<void>('POST', '/logout'),
  getSession: () => request<Session>('GET', '/session'),
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
