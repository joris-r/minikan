<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, type Board, type Column, type Item } from '../api'
import ActionsMenu from '../components/ActionsMenu.vue'
import AddButton from '../components/AddButton.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import TitleInput from '../components/TitleInput.vue'
import TitleButton from '../components/TitleButton.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const board = ref<Board>()
const editing = ref<string>()
// The column or card being dragged, if any.
const dragged = ref<{ column: Column } | { card: Item; from: Column }>()
// The deletion waiting for confirmation, if any.
const confirming = ref<{ message: string; run: () => Promise<void> }>()

onMounted(async () => {
  board.value = await api.getBoard(props.id)
})

async function addColumn(board: Board) {
  const column = await api.createColumn(board.id)
  board.columns.push({ ...column, cards: [] })
  editing.value = column.id
}

async function addCard(column: Column) {
  const card = await api.createCard(column.id)
  column.cards.push(card)
  editing.value = card.id
}

async function confirmed() {
  const run = confirming.value?.run
  confirming.value = undefined
  await run?.()
}

async function deleteBoard(board: Board) {
  const run = async () => {
    await api.deleteBoard(board.id)
    await router.push('/')
  }
  if (board.columns.length === 0) await run()
  else confirming.value = { message: 'Delete this board, its columns and their cards?', run }
}

async function deleteColumn(board: Board, column: Column) {
  const run = async () => {
    await api.deleteColumn(column.id)
    board.columns = board.columns.filter((c) => c.id !== column.id)
  }
  if (column.cards.length === 0) await run()
  else confirming.value = { message: 'Delete this column and its cards?', run }
}

async function deleteCard(column: Column, card: Item) {
  await api.deleteCard(card.id)
  column.cards = column.cards.filter((c) => c.id !== card.id)
}

// Moves `item` from `source` into `target`, possibly the same list, at a position counted from 1,
// as the API does.
function place<T>(source: T[], target: T[], item: T, position: number) {
  source.splice(source.indexOf(item), 1)
  target.splice(Math.min(Math.max(position, 1), target.length + 1) - 1, 0, item)
}

function startDrag(event: DragEvent, item: NonNullable<typeof dragged.value>) {
  event.stopPropagation()
  event.dataTransfer?.setData('text/plain', '')
  dragged.value = item
}

// A column takes the position of the column it is dropped onto; a card dropped onto a column,
// outside its cards, goes last.
async function dropOnColumn(board: Board, column: Column) {
  const item = dragged.value
  dragged.value = undefined
  if (item && 'column' in item) {
    if (item.column === column) return
    const position = board.columns.indexOf(column) + 1
    place(board.columns, board.columns, item.column, position)
    await api.moveColumn(item.column.id, position)
  } else if (item) {
    const position = column.cards.length + 1
    place(item.from.cards, column.cards, item.card, position)
    await api.moveCard(item.card.id, column.id, position)
  }
}

// A card takes the position of the card it is dropped onto. A column dropped onto a card is left
// to the card's column.
async function dropOnCard(event: DragEvent, column: Column, card: Item) {
  const item = dragged.value
  if (!item || !('card' in item)) return
  event.stopPropagation()
  dragged.value = undefined
  if (item.card === card) return
  const position = column.cards.indexOf(card) + 1
  place(item.from.cards, column.cards, item.card, position)
  await api.moveCard(item.card.id, column.id, position)
}

// Editing ends before the request, so that a title clicked meanwhile stays in editing.
async function record(item: Item, title: string, setTitle: typeof api.setColumnTitle) {
  editing.value = undefined
  item.title = (await setTitle(item.id, title)).title
}
</script>

<template>
  <article v-if="board" :aria-labelledby="`title-${board.id}`">
    <div class="header">
      <h1 :id="`title-${board.id}`">
        <TitleInput
          v-if="editing === board.id"
          :title="board.title"
          @record="record(board, $event, api.setBoardTitle)"
          @cancel="editing = undefined"
        />
        <TitleButton v-else :title="board.title" @click="editing = board.id" />
      </h1>
      <ActionsMenu @delete="deleteBoard(board)" />
    </div>
    <div class="columns">
      <article
        v-for="column in board.columns"
        :key="column.id"
        class="column"
        :aria-labelledby="`title-${column.id}`"
        :draggable="editing === undefined"
        @dragstart="startDrag($event, { column })"
        @dragend="dragged = undefined"
        @dragover="dragged && $event.preventDefault()"
        @drop="dropOnColumn(board, column)"
      >
        <div class="header">
          <h2 :id="`title-${column.id}`">
            <TitleInput
              v-if="editing === column.id"
              :title="column.title"
              @record="record(column, $event, api.setColumnTitle)"
              @cancel="editing = undefined"
            />
            <TitleButton v-else :title="column.title" @click="editing = column.id" />
          </h2>
          <ActionsMenu @delete="deleteColumn(board, column)" />
        </div>
        <ul class="cards">
          <li v-for="card in column.cards" :key="card.id">
            <article
              class="card header"
              :aria-labelledby="`title-${card.id}`"
              :draggable="editing === undefined"
              @dragstart="startDrag($event, { card, from: column })"
              @dragend="dragged = undefined"
              @drop="dropOnCard($event, column, card)"
            >
              <span :id="`title-${card.id}`">
                <TitleInput
                  v-if="editing === card.id"
                  :title="card.title"
                  @record="record(card, $event, api.setCardTitle)"
                  @cancel="editing = undefined"
                />
                <TitleButton v-else :title="card.title" @click="editing = card.id" />
              </span>
              <ActionsMenu @delete="deleteCard(column, card)" />
            </article>
          </li>
        </ul>
        <AddButton label="Add card" @click="addCard(column)" />
      </article>
      <AddButton label="Add column" @click="addColumn(board)" />
    </div>
    <ConfirmDialog
      v-if="confirming"
      :message="confirming.message"
      action="Delete"
      @confirm="confirmed"
      @cancel="confirming = undefined"
    />
  </article>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.columns {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.column {
  min-width: 14rem;
  padding: 0.5rem;
  background: #f2f2f2;
  border-radius: 4px;
}

.column h2 {
  font-size: 1rem;
  margin: 0;
}

.column > .header {
  margin-bottom: 0.5rem;
}

.cards {
  list-style: none;
  padding: 0;
  margin: 0 0 0.5rem;
}

[draggable='true'] {
  cursor: grab;
}

.card {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 4px;
}
</style>
