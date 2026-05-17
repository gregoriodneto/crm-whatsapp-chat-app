const supabase =
  require('../config/supabase')

exports.getMessageByType =
  async (type) => {

    const { data, error } =
      await supabase
        .from('messages')
        .select('*')
        .eq('type', type)
        .single()

    if (error) {
      return null
    }

    return data
  }