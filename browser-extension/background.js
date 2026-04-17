const STORAGE_KEYS = {
  authToken: 'authToken',
  apiBase: 'apiBase'
}

const DEFAULT_API_BASE = 'http://localhost:5004'
const SYNC_ALARM = 'syncBlocklist'
const MAX_RULES = 1000

const normalizeSite = (value) => {
  if (!value) return null
  let site = String(value).trim().toLowerCase()
  if (!site) return null
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '')
  site = site.split('/')[0]
  return site || null
}

const dedupe = (items = []) => Array.from(new Set(items.filter(Boolean)))

const buildRules = (sites = [], keywords = []) => {
  const rules = []
  let ruleId = 1

  const siteFilters = dedupe(sites.map(normalizeSite))
  siteFilters.forEach((site) => {
    if (!site || ruleId > MAX_RULES) return
    rules.push({
      id: ruleId,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${site}`,
        resourceTypes: ['main_frame']
      }
    })
    ruleId += 1
  })

  const keywordFilters = dedupe(keywords.map((keyword) => String(keyword).trim().toLowerCase()))
  keywordFilters.forEach((keyword) => {
    if (!keyword || ruleId > MAX_RULES) return
    rules.push({
      id: ruleId,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: keyword,
        resourceTypes: ['main_frame']
      }
    })
    ruleId += 1
  })

  return rules
}

const setBadge = async (text, color) => {
  try {
    await chrome.action.setBadgeText({ text })
    if (color) {
      await chrome.action.setBadgeBackgroundColor({ color })
    }
  } catch (error) {
    // Ignore badge errors
  }
}

const getConfig = async () => {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.authToken, STORAGE_KEYS.apiBase])
  return {
    authToken: stored[STORAGE_KEYS.authToken] || null,
    apiBase: stored[STORAGE_KEYS.apiBase] || DEFAULT_API_BASE
  }
}

const fetchStatus = async (authToken, apiBase) => {
  const response = await fetch(`${apiBase}/api/distraction/status`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Status request failed with ${response.status}`)
  }

  return response.json()
}

const applyRules = async (blockingActive, sites, keywords) => {
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeRuleIds = existing.map((rule) => rule.id)

  if (!blockingActive) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds })
    await setBadge('OFF', '#6B7280')
    return
  }

  const rules = buildRules(sites, keywords)
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: rules
  })

  await setBadge('ON', '#10B981')
}

const syncBlocklist = async () => {
  const { authToken, apiBase } = await getConfig()

  if (!authToken) {
    await applyRules(false, [], [])
    return
  }

  try {
    const status = await fetchStatus(authToken, apiBase)
    const data = status?.data || {}
    await applyRules(Boolean(data.blockingActive), data.blockedSites || [], data.blockedKeywords || [])
  } catch (error) {
    await setBadge('ERR', '#EF4444')
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 })
  await syncBlocklist()
})

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 })
  await syncBlocklist()
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM) {
    await syncBlocklist()
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'authToken') return
  chrome.storage.local.set({ [STORAGE_KEYS.authToken]: message.token || null }).then(() => {
    syncBlocklist()
  })
})
