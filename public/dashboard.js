const statsContainer = document.getElementById('statsContainer')
const librarySelect = document.getElementById('librarySelect')
const refreshSelectedButton = document.getElementById('refreshSelected')
const refreshAllButton = document.getElementById('refreshAll')
const refreshCustomButton = document.getElementById('refreshCustom')
const manualKeysInput = document.getElementById('manualKeys')
const statusMessage = document.getElementById('statusMessage')
const endpointInput = document.getElementById('endpointInput')
const testEndpointButton = document.getElementById('testEndpointButton')
const endpointResultContainer = document.getElementById('endpointResultContainer')

function setStatus(message, isError = false) {
  if (!statusMessage) return
  statusMessage.textContent = message
  statusMessage.style.background = isError ? '#ffe8e0' : '#eef6ff'
  statusMessage.style.color = isError ? '#a12a14' : '#0f4c81'
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

async function loadStats() {
  try {
    const stats = await fetchJson('/db/stats')
    if (!statsContainer) return
    const rows = Object.entries(stats)
      .map(
        ([table, count]) =>
          `<tr><td>${table}</td><td>${count}</td></tr>`,
      )
      .join('')
    statsContainer.innerHTML = `<table><thead><tr><th>Table</th><th>Rows</th></tr></thead><tbody>${rows}</tbody></table>`
  } catch (err) {
    setStatus(`Unable to load stats: ${err.message}`, true)
    if (statsContainer) statsContainer.textContent = 'Failed to load stats.'
  }
}

function getLibraryOptionText(section, type) {
  return `${type.toUpperCase()} — ${section.title} (${section.key})`
}

async function loadLibraries() {
  try {
    const libraries = await fetchJson('/getFromPlex/getAllLibraries/')
    if (!librarySelect) return
    librarySelect.innerHTML = ''

    const groups = [
      { key: 'movies', label: 'Movies' },
      { key: 'shows', label: 'Shows' },
      { key: 'music', label: 'Music' },
      { key: 'other', label: 'Other' },
    ]

    groups.forEach((group) => {
      const items = libraries[group.key] || []
      if (items.length === 0) return
      const optGroup = document.createElement('optgroup')
      optGroup.label = group.label
      items.forEach((section) => {
        const option = document.createElement('option')
        option.value = section.key
        option.textContent = getLibraryOptionText(section, group.label)
        optGroup.appendChild(option)
      })
      librarySelect.appendChild(optGroup)
    })

    if (!librarySelect.querySelector('option')) {
      librarySelect.innerHTML = '<option value="">No libraries available</option>'
    }
  } catch (err) {
    setStatus(`Unable to load libraries: ${err.message}`, true)
    if (librarySelect) librarySelect.innerHTML = '<option value="">Failed to load libraries</option>'
  }
}

async function refreshSection(sectionKey) {
  if (!sectionKey) {
    setStatus('Please choose a section key or enter one manually.', true)
    return
  }

  setStatus(`Refreshing library section: ${sectionKey}...`)

  try {
    await fetchJson(`/refreshLibrary/${encodeURIComponent(sectionKey)}`)
    setStatus(`Refresh request sent for: ${sectionKey}`)
    await loadStats()
  } catch (err) {
    setStatus(`Refresh failed: ${err.message}`, true)
  }
}

if (refreshSelectedButton) {
  refreshSelectedButton.addEventListener('click', () => {
    const selectedKey = librarySelect?.value
    refreshSection(selectedKey)
  })
}

if (refreshCustomButton) {
  refreshCustomButton.addEventListener('click', () => {
    const custom = manualKeysInput?.value.trim()
    refreshSection(custom)
  })
}

if (refreshAllButton) {
  refreshAllButton.addEventListener('click', () => {
    refreshSection('ALL')
  })
}

async function testPlexEndpoint() {
  const endpoint = endpointInput?.value.trim()
  if (!endpoint) {
    setStatus('Please enter a Plex endpoint.', true)
    return
  }

  if (!endpoint.startsWith('/')) {
    setStatus('Endpoint must start with /', true)
    return
  }

  setStatus(`Testing endpoint: ${endpoint}...`)

  try {
    const url = `/getFromPlex/raw?endpoint=${encodeURIComponent(endpoint)}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      if (endpointResultContainer) {
        endpointResultContainer.className = 'result-box error'
        endpointResultContainer.textContent = `Error: ${data.error || res.statusText}`
      }
      setStatus(`Endpoint test failed: ${data.error || res.statusText}`, true)
      return
    }

    if (endpointResultContainer) {
      endpointResultContainer.className = 'result-box success'
      endpointResultContainer.textContent = JSON.stringify(data, null, 2)
    }
    setStatus(`Endpoint test successful: ${endpoint}`)
  } catch (err) {
    setStatus(`Endpoint test error: ${err.message}`, true)
    if (endpointResultContainer) {
      endpointResultContainer.className = 'result-box error'
      endpointResultContainer.textContent = `Error: ${err.message}`
    }
  }
}

if (testEndpointButton) {
  testEndpointButton.addEventListener('click', testPlexEndpoint)
  endpointInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') testPlexEndpoint()
  })
}

loadStats()
loadLibraries()
