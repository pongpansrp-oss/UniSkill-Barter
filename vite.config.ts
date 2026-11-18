import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function jsonDbPlugin(): Plugin {
  const dbPath = path.resolve(process.cwd(), 'src/data/db.json')

  return {
    name: 'vite-plugin-json-db',
    configureServer(server) {
      server.middlewares.use('/api/db', (req, res, next) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

        if (req.method === 'GET') {
          try {
            const raw = fs.existsSync(dbPath) ? fs.readFileSync(dbPath, 'utf-8').trim() : ''
            const safeJson = raw ? raw : JSON.stringify({ users: [], reviews: [], requests: [], reports: [] })
            res.statusCode = 200
            res.end(safeJson)
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonDbPlugin()],
  server: {
    watch: {
      ignored: ['**/src/data/db.json'],
    },
  },
})
