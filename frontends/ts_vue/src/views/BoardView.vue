<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Board, type Column, type Item } from '../api'
import AddButton from '../components/AddButton.vue'
import TitleInput from '../components/TitleInput.vue'
import TitleButton from '../components/TitleButton.vue'

const props = defineProps<{ id: string }>()

const board = ref<Board>()
const editing = ref<string>()

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

// Editing ends before the request, so that a title clicked meanwhile stays in editing.
async function record(item: Item, title: string, setTitle: typeof api.setColumnTitle) {
  editing.value = undefined
  item.title = (await setTitle(item.id, title)).title
}
</script>

<template>
  <template v-if="board">
    <h1>
      <TitleInput
        v-if="editing === board.id"
        :title="board.title"
        @record="record(board, $event, api.setBoardTitle)"
        @cancel="editing = undefined"
      />
      <TitleButton v-else :title="board.title" @click="editing = board.id" />
    </h1>
    <div class="columns">
      <section v-for="column in board.columns" :key="column.id" class="column">
        <h2>
          <TitleInput
            v-if="editing === column.id"
            :title="column.title"
            @record="record(column, $event, api.setColumnTitle)"
            @cancel="editing = undefined"
          />
          <TitleButton v-else :title="column.title" @click="editing = column.id" />
        </h2>
        <ul class="cards">
          <li v-for="card in column.cards" :key="card.id" class="card">
            <TitleInput
              v-if="editing === card.id"
              :title="card.title"
              @record="record(card, $event, api.setCardTitle)"
              @cancel="editing = undefined"
            />
            <TitleButton v-else :title="card.title" @click="editing = card.id" />
          </li>
        </ul>
        <AddButton label="Add card" @click="addCard(column)" />
      </section>
      <AddButton label="Add column" @click="addColumn(board)" />
    </div>
  </template>
</template>

<style scoped>
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
  margin: 0 0 0.5rem;
}

.cards {
  list-style: none;
  padding: 0;
  margin: 0 0 0.5rem;
}

.card {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 4px;
}
</style>
