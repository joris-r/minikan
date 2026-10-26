import { onMounted, onUnmounted, ref } from 'vue'

// The message of the banner, if it is shown.
export const notice = ref<string>()

const failedChange = 'The change could not be saved; the screen was reloaded.'

// The requests of the changes not yet answered, which a screen waits for before loading.
const pending = new Set<Promise<unknown>>()

// Loads the data of the screen shown, if any.
let reloadScreen: (() => Promise<void>) | undefined

// A request cut off by leaving or reloading the page fails, but is no failure to show.
let leaving = false
window.addEventListener('pagehide', () => (leaving = true))
window.addEventListener('pageshow', () => (leaving = false))

// Sends the request of a change. On success, returns its answer and removes the banner; on failure,
// shows the banner and reloads the screen then shown, and returns undefined.
export async function send<T>(request: () => Promise<T>): Promise<T | undefined> {
  const sent = request()
  pending.add(sent)
  try {
    const answer = await sent
    pending.delete(sent)
    notice.value = undefined
    return answer
  } catch {
    pending.delete(sent)
    if (leaving) return undefined
    notice.value = failedChange
    await reloadScreen?.()
    return undefined
  }
}

// Loads the data of the screen when it is shown, once the pending changes are answered, and again
// after a failed change; `failure` is the banner's message when loading fails.
export function useScreen(load: () => Promise<void>, failure: string): void {
  const run = async () => {
    await Promise.allSettled(pending)
    try {
      await load()
    } catch {
      if (!leaving) notice.value = failure
    }
  }
  onMounted(() => {
    reloadScreen = run
    return run()
  })
  onUnmounted(() => {
    if (reloadScreen === run) reloadScreen = undefined
  })
}
