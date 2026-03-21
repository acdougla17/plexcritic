import express from 'express'
import { config } from './config.js'
import healthRouter from './routes/healthCheck.js'
import getAllEpisodesForShowRouter from './routes/getFromPlex.js'
import refreshLibraryRouter from './routes/refreshLibrary.js'
import testRouter from './routes/test.js'
import dbRouter from './routes/db.js'
import path from 'node:path'

const app = express()
const port = config.port

// Add routes here to display on home page
const routesArray = [
  {
    path: '/health',
    hasParams: false,
    name: 'Health Check',
    description: 'Check server health and uptime',
  },
  {
    path: '/test',
    hasParams: false,
    name: 'Test',
    description: 'Runs whatever current test code I am working on',
  },
  {
    path: '/getFromPlex/getAllLibraries',
    hasParams: false,
    name: 'Get Library Sections',
    description:
      'Fetch Plex library sections categorized into movies, shows, music, and other',
  },
  {
    path: '/getFromPlex/allLibraryItems/2',
    hasParams: true,
    name: 'Get All Items in Section',
    description:
      'Fetch all items in a specific Plex library section by providing the sectionKey as a URL parameter',
  },
  {
    path: '/getFromPlex/allEpisodes/56412',
    hasParams: true,
    name: 'Get All Episodes for Show',
    description:
      "Fetch all episodes for a specific show by providing the show's ratingKey as a URL parameter",
  },
  {
    path: '/getFromPlex/itemDetails/56412',
    hasParams: true,
    name: 'Get Item Details',
    description:
      'Fetch detailed information for a specific Plex library item by providing the ratingKey as a URL parameter',
  },
  {
    path: '/refreshLibrary/:sectionKey',
    hasParams: true,
    name: 'Refresh Library Section',
    description:
      'Refresh a specific Plex library section by providing the sectionKey as a URL parameter. You can also provide multiple section keys separated by commas, or use "ALL" to refresh all sections.',
  },
  {
    path: '/db/removeAll',
    hasParams: true,
    name: 'Clear out entire local database',
    description:
      'Deletes all rows from local SQLite database tables',
  },
  {
    path: '/db/remove/:tableName',
    hasParams: true,
    name: 'Clear out local database table',
    description:
      'Deletes all rows from local SQLite database table',
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
      .map((route) => {
        if (route.hasParams) {
          return `<li>
                <a href="${route.path}">${route.path}</a> - ${route.description} (Requires URL parameters)
              </li>`
        } else {
          return `<li><a href="${route.path}">${route.path}</a> - ${route.description}</li>`
        }
      })
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
app.use('/getFromPlex', getAllEpisodesForShowRouter)
app.use('/refreshLibrary', refreshLibraryRouter)
app.use('/test', testRouter)
app.use('/db', dbRouter)
