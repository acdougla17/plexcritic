import express from 'express'
import { config } from './config.js'
import healthRouter from './routes/healthCheck.js'
import getAllEpisodesForShowRouter from './routes/getFromPlex.js'
import refreshLibraryRouter from './routes/refreshLibrary.js'
import testRouter from './routes/test.js'
import dbRouter from './routes/db.js'
import formatsRouter from './routes/formats.js'
import tuners from './routes/tuners.js'
import path from 'node:path'
import fs from 'node:fs'

const app = express()
const port = config.port
const publicDir: string = path.join(process.cwd(), 'public')
const clientIndex: string = path.join(publicDir, 'index.html')

app.use(express.static(publicDir))

// Routes (registered before SPA fallback)
app.use('/health', healthRouter)
app.use('/getFromPlex', getAllEpisodesForShowRouter)
app.use('/refreshLibrary', refreshLibraryRouter)
app.use('/test', testRouter)
app.use('/db', dbRouter)
app.use('/formats', formatsRouter)
app.use('/tuners', tuners)

app.get('/api', (_req, res) => {
  res.json({
    name: 'Plex Critic API',
    endpoints: [
      '/health',
      '/health/sync',
      '/db/stats',
      '/db/media',
      '/db/remove/:tableName',
      '/db/removeAll',
      '/formats/summary',
      '/formats/candidates',
      '/formats/preferences',
      '/getFromPlex/getAllLibraries',
      '/refreshLibrary/:sectionKey',
      '/tuners',
    ],
  })
})

// SPA: serve built React app when present; otherwise point at Vite dev server
app.get('/{*splat}', (_req, res) => {
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex)
    return
  }
  res
    .status(200)
    .type('html')
    .send(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
        <h1>Plex Critic</h1>
        <p>UI not built yet. Run <code>npm run dev</code> and open the Vite URL, or <code>npm run build</code> then restart.</p>
        <p><a href="/api">API index</a></p>
      </body></html>`,
    )
})

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}/`)
})
