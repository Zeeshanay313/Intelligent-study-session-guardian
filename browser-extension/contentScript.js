const sendAuthToken = () => {
  try {
    const token = window.localStorage.getItem('authToken')
    chrome.runtime.sendMessage({ type: 'authToken', token })
  } catch (error) {
    // Ignore storage access errors
  }
}

sendAuthToken()

window.addEventListener('storage', (event) => {
  if (event.key === 'authToken') {
    sendAuthToken()
  }
})
