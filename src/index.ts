import express from 'express'
import { config } from './config.js'
import healthRouter from './routes/healthCheck.js'
import getLibraryRouter from './routes/getLibrary.js'
import getAllItemsInSectionRouter from './routes/getAllItemsInSection.js'
import path from 'node:path'

const app = express()
const port = config.port

// Add routes here to display on home page
const routesArray = [
  {
    path: '/health',
    name: 'Health Check',
    description: 'Check server health and uptime',
  },
  {
    path: '/getLibrary',
    name: 'Get Library Sections',
    description:
      'Fetch Plex library sections categorized into movies, shows, music, and other',
  },
  {
    path: '/getAllItemsInSection/:sectionKey',
    name: 'Get All Items in Section',
    description:
      'Fetch all items in a specific Plex library section by providing the sectionKey as a URL parameter',
  },
]

// Function to generate the HTML for the home page, listing available routes and their descriptions
function generateHomePage() {
  const page =
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="UTF-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">` +
    `<title>Plex Critic API</title>` +
    `</head>` +
    `<body>` +
    `<h1>Welcome to the Plex Critic API</h1>` +
    `<p>Available endpoints:</p>` +
    `<ul>` +
    routesArray
      .map(
        (route) =>
          `<li><a href="${route.path}">${route.path}</a> - ${route.description}</li>`,
      )
      .join('') +
    `</ul>` +
    `</body>` +
    `</html>`
  return page
}

app.get('/', (req, res) => {
  res.send(generateHomePage())
})

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}/`)
})

// Routes
app.use('/health', healthRouter)
app.use('/getLibrary', getLibraryRouter)
app.use('/getAllItemsInSection', getAllItemsInSectionRouter)
