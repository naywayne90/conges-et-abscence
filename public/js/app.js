import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://eaqaptssfbcmraeegsny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcWFwdHNzZmJjbXJhZWVnc255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MDIxNjMsImV4cCI6MjA1MDI3ODE2M30.qlSpTDSZlz4VqdUQ7ZsXI7ffn1LqTXR7FqwgTyhDWF8'

// Création du client Supabase avec retry automatique
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 2
        }
    }
})

// Fonction pour afficher les messages d'erreur ou de succès
function showMessage(message, isError = false) {
    const alertDiv = document.createElement('div')
    alertDiv.className = `alert alert-${isError ? 'danger' : 'success'} alert-dismissible fade show`
    alertDiv.role = 'alert'
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.card'))
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => alertDiv.remove(), 5000)
}

// Fonction pour charger les utilisateurs avec retry
async function loadUsers(retryCount = 3) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: true })

        if (error) throw error

        const usersList = document.getElementById('usersList')
        usersList.innerHTML = ''

        data.forEach(user => {
            usersList.innerHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${user.name}</td>
                    <td>${user.age}</td>
                    <td>
                        <button onclick="deleteUser(${user.id})" class="btn btn-danger btn-sm">Supprimer</button>
                    </td>
                </tr>
            `
        })
    } catch (error) {
        console.error('Erreur de chargement:', error)
        if (retryCount > 0) {
            showMessage('Tentative de reconnexion...', true)
            setTimeout(() => loadUsers(retryCount - 1), 2000)
        } else {
            showMessage('Impossible de charger les utilisateurs. Veuillez rafraîchir la page.', true)
        }
    }
}

// Fonction pour ajouter un utilisateur avec retry
async function addUser(email, name, age, retryCount = 3) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ email, name, age }])
            .select()

        if (error) throw error

        showMessage('Utilisateur ajouté avec succès!')
        await loadUsers()
    } catch (error) {
        console.error('Erreur d\'ajout:', error)
        if (retryCount > 0) {
            showMessage('Nouvelle tentative d\'ajout...', true)
            setTimeout(() => addUser(email, name, age, retryCount - 1), 2000)
        } else {
            showMessage('Impossible d\'ajouter l\'utilisateur. Veuillez réessayer.', true)
        }
    }
}

// Fonction pour supprimer un utilisateur avec retry
window.deleteUser = async (id, retryCount = 3) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)

        if (error) throw error

        showMessage('Utilisateur supprimé avec succès!')
        await loadUsers()
    } catch (error) {
        console.error('Erreur de suppression:', error)
        if (retryCount > 0) {
            showMessage('Nouvelle tentative de suppression...', true)
            setTimeout(() => deleteUser(id, retryCount - 1), 2000)
        } else {
            showMessage('Impossible de supprimer l\'utilisateur. Veuillez réessayer.', true)
        }
    }
}

// Gestionnaire du formulaire avec validation
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('email').value.trim()
    const name = document.getElementById('name').value.trim()
    const age = parseInt(document.getElementById('age').value)

    // Validation
    if (!email || !name || !age) {
        showMessage('Veuillez remplir tous les champs', true)
        return
    }

    if (age < 16 || age > 100) {
        showMessage('L\'âge doit être entre 16 et 100 ans', true)
        return
    }

    await addUser(email, name, age)
    e.target.reset()
})

// Vérification de la connexion et chargement initial
async function checkConnection() {
    try {
        const { error } = await supabase.from('users').select('count').limit(1)
        if (error) throw error
        showMessage('Connexion à la base de données établie')
        await loadUsers()
    } catch (error) {
        console.error('Erreur de connexion:', error)
        showMessage('Problème de connexion à la base de données. Tentative de reconnexion...', true)
        setTimeout(checkConnection, 3000)
    }
}

// Démarrage de l'application
checkConnection()
