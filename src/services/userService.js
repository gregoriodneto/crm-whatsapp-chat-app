const supabase =
  require('../config/supabase')

async function findByUsername(
  username
) {

  const {
    data,
    error
  } =
    await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle()

  if (error) {
    return null
  }

  return data
}

async function updatePassword(
  userId,
  password
) {

  const { error } =
    await supabase
      .from('users')
      .update({
        password
      })
      .eq('id', userId)

  if (error) {
    throw error
  }

  return true
}

async function disableFirstLogin(
  userId
) {

  const { error } =
    await supabase
      .from('users')
      .update({
        first_login: 0
      })
      .eq('id', userId)

  if (error) {
    throw error
  }

  return true
}

module.exports = {
  findByUsername,
  updatePassword,
  disableFirstLogin
}