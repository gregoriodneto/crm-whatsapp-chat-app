const supabase =
  require('../config/supabase')

exports.createClient =
  async (client) => {

    const {
      name,
      cpf,
      phone,
      birth_date,
      payment_day
    } = client

    const { data, error } =
      await supabase
        .from('clients')
        .insert([
          {
            name,
            cpf,
            phone,
            birth_date,
            payment_day
          }
        ])
        .select()
        .single()

    if (error) {
      throw error
    }

    return data
  }

exports.getClients =
  async () => {

    const { data, error } =
      await supabase
        .from('clients')
        .select('*')
        .order('id', {
          ascending: false
        })

    if (error) {
      throw error
    }

    return data || []
  }

exports.updateClient =
  async (id, client) => {

    const {
      name,
      cpf,
      phone,
      birth_date,
      payment_day
    } = client

    const { error } =
      await supabase
        .from('clients')
        .update({
          name,
          cpf,
          phone,
          birth_date,
          payment_day
        })
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }

exports.deleteClient =
  async (id) => {

    const { error } =
      await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }