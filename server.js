import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 3000

// Gestion des erreurs serveur
process.on('uncaughtException', (error) => {
    console.error('Erreur non gérée:', error)
    // Le serveur continuera de fonctionner
})

process.on('unhandledRejection', (error) => {
    console.error('Promesse rejetée non gérée:', error)
    // Le serveur continuera de fonctionner
})

// Middleware pour gérer les erreurs de timeout
app.use((req, res, next) => {
    req.setTimeout(30000, () => {
        res.status(408).send('Délai d\'attente dépassé')
    })
    next()
})

// Middleware pour la gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur middleware:', err)
    res.status(500).send('Une erreur est survenue, veuillez réessayer')
})

// Servir les fichiers statiques du dossier public
app.use(express.static('public'))

// Démarrage du serveur avec gestion d'erreur
const server = app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})

// Gestion des erreurs de connexion
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log('Port déjà utilisé, tentative sur un autre port...')
        setTimeout(() => {
            server.close()
            server.listen(port + 1)
        }, 1000)
    }
})

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Serveur arrêté proprement')
        process.exit(0)
    })
})
