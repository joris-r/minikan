<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Item } from '../api'
import AddButton from '../components/AddButton.vue'
import TitleInput from '../components/TitleInput.vue'
import TitleText from '../components/TitleText.vue'

const boards = ref<Item[]>([])
const editing = ref<string>()

onMounted(async () => {
  boards.value = await api.listBoards()
})

async function addBoard() {
  const board = await api.createBoard()
  boards.value.push(board)
  editing.value = board.id
}

async function record(board: Item, title: string) {
  board.title = (await api.setBoardTitle(board.id, title)).title
  editing.value = undefined
}
</script>

<template>
  <h1>Boards</h1>
  <ul class="boards">
    <li v-for="board in boards" :key="board.id">
      <TitleInput v-if="editing === board.id" @record="record(board, $event)" />
      <RouterLink v-else :to="`/boards/${board.id}`"><TitleText :title="board.title" /></RouterLink>
    </li>
  </ul>
  <AddButton label="Add board" @click="addBoard" />
</template>

<style scoped>
.boards {
  list-style: none;
  padding: 0;
}

.boards li {
  padding: 0.25rem 0;
}
</style>
