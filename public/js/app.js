import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://eaqaptssfbcmraeegsny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcWFwdHNzZmJjbXJhZWVnc255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MDIxNjMsImV4cCI6MjA1MDI3ODE2M30.qlSpTDSZlz4VqdUQ7ZsXI7ffn1LqTXR7FqwgTyhDWF8'
const supabase = createClient(supabaseUrl, supabaseKey)

// Fonction pour charger les utilisateurs
async function loadUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true })

    if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        return
    }

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
}

// Fonction pour ajouter un utilisateur
async function addUser(email, name, age) {
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, name, age }])
        .select()

    if (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error)
        return
    }

    await loadUsers()
}

// Fonction pour supprimer un utilisateur
window.deleteUser = async (id) => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erreur lors de la suppression:', error)
        return
    }

    await loadUsers()
}

// Gestionnaire du formulaire
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('email').value
    const name = document.getElementById('name').value
    const age = parseInt(document.getElementById('age').value)

    await addUser(email, name, age)
    
    // Réinitialiser le formulaire
    e.target.reset()
})

// Charger les utilisateurs au démarrage
loadUsers()
