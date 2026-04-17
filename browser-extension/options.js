const apiBaseInput = document.getElementById('apiBase')
const saveButton = document.getElementById('save')
const status = document.getElementById('status')

const STORAGE_KEY = 'apiBase'
const DEFAULT_API_BASE = 'http://localhost:5004'

const loadSettings = async () => {
  const stored = await chrome.storage.local.get([STORAGE_KEY])
  apiBaseInput.value = stored[STORAGE_KEY] || DEFAULT_API_BASE
}

const saveSettings = async () => {
  const apiBase = apiBaseInput.value.trim()
  if (!apiBase) {
    status.textContent = 'Please enter an API base URL.'
    return
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: apiBase })
  status.textContent = 'Saved.'
  setTimeout(() => {
    status.textContent = ''
  }, 1500)
}

saveButton.addEventListener('click', saveSettings)

loadSettings()
