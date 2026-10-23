<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Item } from '../api'
import ActionsMenu from '../components/ActionsMenu.vue'
import AddButton from '../components/AddButton.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import TitleInput from '../components/TitleInput.vue'
import TitleText from '../components/TitleText.vue'

const boards = ref<Item[]>([])
const editing = ref<string>()
// The board waiting for confirmation of its deletion, if any.
const confirming = ref<Item>()

onMounted(async () => {
  boards.value = await api.listBoards()
})

async function addBoard() {
  const board = await api.createBoard()
  boards.value.push(board)
  editing.value = board.id
}

async function remove(board: Item) {
  await api.deleteBoard(board.id)
  boards.value = boards.value.filter((b) => b.id !== board.id)
}

// The list does not tell whether a board holds columns, so the board is fetched to know.
async function deleteBoard(board: Item) {
  if ((await api.getBoard(board.id)).columns.length === 0) await remove(board)
  else confirming.value = board
}

async function confirmed(board: Item) {
  confirming.value = undefined
  await remove(board)
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
      <article class="board" :aria-labelledby="`title-${board.id}`">
        <span :id="`title-${board.id}`">
          <TitleInput
            v-if="editing === board.id"
            @record="record(board, $event)"
            @cancel="editing = undefined"
          />
          <RouterLink v-else :to="`/boards/${board.id}`"
            ><TitleText :title="board.title"
          /></RouterLink>
        </span>
        <ActionsMenu @delete="deleteBoard(board)" />
      </article>
    </li>
  </ul>
  <AddButton label="Add board" @click="addBoard" />
  <ConfirmDialog
    v-if="confirming"
    message="Delete this board, its columns and their cards?"
    action="Delete"
    @confirm="confirmed(confirming)"
    @cancel="confirming = undefined"
  />
</template>

<style scoped>
.boards {
  list-style: none;
  padding: 0;
}

.board {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}
</style>
