import { request, type APIRequestContext } from '@playwright/test'

const apiURL = `http://localhost:${process.env.API_PORT ?? '8000'}`

export async function apiAs(user: string): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: apiURL,
    extraHTTPHeaders: { Authorization: `Bearer ${user}` },
  })
}

export async function createBoard(api: APIRequestContext, title: string): Promise<string> {
  const board = await (await api.post('/api/boards')).json()
  await api.patch(`/api/boards/${board.id}`, { data: { title } })
  return board.id
}

export async function createColumn(
  api: APIRequestContext,
  boardId: string,
  title: string,
): Promise<string> {
  const column = await (await api.post(`/api/boards/${boardId}/columns`)).json()
  await api.patch(`/api/columns/${column.id}`, { data: { title } })
  return column.id
}

export async function createCard(
  api: APIRequestContext,
  columnId: string,
  title: string,
): Promise<string> {
  const card = await (await api.post(`/api/columns/${columnId}/cards`)).json()
  await api.patch(`/api/cards/${card.id}`, { data: { title } })
  return card.id
}

export function uniqueTitle(): string {
  return `title ${Math.random().toString(36).slice(2, 10)}`
}
