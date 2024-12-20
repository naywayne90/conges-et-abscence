import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 3000

// Servir les fichiers statiques du dossier public
app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})
