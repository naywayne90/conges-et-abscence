import supabase from './supabaseClient.js'

// Example function to create a new user
async function createUser(email, name, age) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        { email, name, age }
      ])
      .select()
    
    if (error) {
      console.error('Error creating user:', error.message)
      return
    }
    
    console.log('User created successfully:', data)
    return data
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example function to get all users
async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) {
      console.error('Error fetching users:', error.message)
      return
    }
    
    console.log('Users:', data)
    return data
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Test the functions
async function test() {
  // Create a test user
  await createUser('test@example.com', 'Test User', 25)
  
  // Get all users
  await getUsers()
}

test()
