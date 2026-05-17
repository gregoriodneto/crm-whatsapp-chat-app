require('dotenv').config()

const supabase =
  require('./src/config/supabase')

const defaultMessages = [

  {
    type: 'welcome',
    content:
`Olá {name} 👋

Seja bem-vindo(a) à Academia Energia Fitness RN 💪

Qualquer dúvida estamos à disposição.

Bons treinos!`
  },

  {
    type: 'before_2_days',
    content:
`Olá {name} 👋

Sua mensalidade vence em 2 dias.

💳 Valor disponível para pagamento.

Caso já tenha realizado o pagamento, ignore esta mensagem.`
  },

  {
    type: 'before_1_day',
    content:
`Olá {name} 👋

Sua mensalidade vence amanhã.

Evite atrasos realizando o pagamento antecipadamente 💪`
  },

  {
    type: 'due_today',
    content:
`Olá {name} 👋

Sua mensalidade vence hoje.

Após realizar o pagamento envie:
"Paguei" ✅`
  },

  {
    type: 'after_1_day',
    content:
`Olá {name} 👋

Identificamos uma mensalidade em atraso.

Caso já tenha realizado o pagamento envie:
"Paguei" ✅`
  },

  {
    type: 'after_3_days',
    content:
`Olá {name} 👋

Sua mensalidade está em atraso há 3 dias.

Regularize para evitar bloqueio do plano.

Caso já tenha pago envie:
"Paguei" ✅`
  },

  {
    type: 'after_7_days',
    content:
`Olá {name} 👋

Sua mensalidade permanece pendente há 7 dias.

Entre em contato conosco para regularização.

Caso já tenha realizado o pagamento envie:
"Paguei" ✅`
  },

  {
    type: 'payment_confirmed',
    content:
`Pagamento confirmado com sucesso ✅

Obrigado {name} 💪

Tenha um ótimo treino!`
  }
]

async function seedMessages() {

  for (const msg of defaultMessages) {

    // verifica se já existe
    const { data: existing } =
      await supabase
        .from('messages')
        .select('id')
        .eq('type', msg.type)
        .single()

    if (existing) {

      console.log(
        `Mensagem ${msg.type} já existe`
      )

      continue
    }

    const { error } =
      await supabase
        .from('messages')
        .insert(msg)

    if (error) {

      console.error(
        `Erro ao inserir ${msg.type}:`,
        error.message
      )

      continue
    }

    console.log(
      `Mensagem ${msg.type} cadastrada`
    )
  }

  process.exit()
}

seedMessages()