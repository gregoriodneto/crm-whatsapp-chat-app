const API = ''

// UTILS
function goBack() {
  window.location.href = '/'
}

function formatDate(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 10)
}

function convertDateToISO(date) {
  const [day, month, year] = date.split('/')

  return `${year}-${month}-${day}`
}

// ========================
// FORMATADORES
// ========================

function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

// ========================
// EVENTOS DE INPUT
// ========================

document.addEventListener('DOMContentLoaded', () => {

  if (document.getElementById('cpf')) {
    document.getElementById('cpf').addEventListener('input', (e) => {
      e.target.value = formatCPF(e.target.value)
    })
  }

  if (document.getElementById('phone')) {
    document.getElementById('phone').addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value)
    })
  }

  if (document.getElementById('birth_date')) {
    document.getElementById('birth_date').addEventListener('input', (e) => {
      e.target.value = formatDate(e.target.value)
    })
  }
})

// ========================
// VALIDAÇÃO
// ========================

function validateForm(data) {
  if (!data.name) return 'Nome é obrigatório'
  if (!data.phone) return 'Telefone é obrigatório'
  if (!data.cpf) return 'CPF é obrigatório'
  if (!data.birth_date) return 'Data de nascimento obrigatória'

  const day = Number(data.payment_day)
  if (!day || day < 1 || day > 31) {
    return 'Dia de pagamento deve ser entre 1 e 31'
  }

  return null
}

// ========================
// CLIENTES
// ========================

async function loadClients() {
  const res = await fetch(`${API}/clients`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = await res.json()

  const container = document.getElementById('clients')

  container.innerHTML = data.map(c => `
    <div class="client-item">
      <strong>${c.name}</strong>
      CPF: ${c.cpf || '-'} <br>
      Telefone: ${c.phone} <br>
      Dia pagamento: ${c.payment_day}
      
      <br><br>

      <button onclick="editClient(${c.id}, '${c.name}', '${c.phone}', '${c.cpf}', '${c.birth_date}', ${c.payment_day})">
        Editar
      </button>

      <button onclick="deleteClient(${c.id})" style="background:#e74c3c;">
        Excluir
      </button>
    </div>
  `).join('')
}

let editingId = null

function editClient(id, name, phone, cpf, birth_date, payment_day) {
  editingId = id

  document.getElementById('name').value = name
  document.getElementById('phone').value = phone
  document.getElementById('cpf').value = cpf
  document.getElementById('birth_date').value = birth_date
  document.getElementById('payment_day').value = payment_day

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function createClient() {
  const errorDiv = document.getElementById('error')
  errorDiv.innerText = ''

  const data = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    birth_date: convertDateToISO(
      document.getElementById('birth_date').value
    ),
    payment_day: document.getElementById('payment_day').value
  }

  const error = validateForm(data)

  if (error) {
    errorDiv.innerText = error
    return
  }

  try {
    if (editingId) {
      // UPDATE
      await fetch(`${API}/clients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      })

      editingId = null
    } else {
      // CREATE
      await fetch(`${API}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
    }

    clearForm()
    loadClients()

  } catch (err) {
    errorDiv.innerText = 'Erro ao salvar cliente'
  }
}

async function deleteClient(id) {
  if (!confirm('Deseja realmente excluir este cliente?')) return

  await fetch(`${API}/clients/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  loadClients()
}

// ========================
// AUXILIARES
// ========================

function clearForm() {
  document.getElementById('name').value = ''
  document.getElementById('phone').value = ''
  document.getElementById('cpf').value = ''
  document.getElementById('birth_date').value = ''
  document.getElementById('payment_day').value = ''
}

// ================= PAGAMENTOS =================
let editingPaymentId = null
let allClients = []
async function loadClientsSelect() {
  const res = await fetch(`${API}/clients`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  allClients = await res.json()

  renderClients(allClients)
}

function renderClients(clients) {
  const container = document.getElementById('clients-list')

  let html = ''

  clients.forEach(c => {
    html += `
      <label class="client-checkbox">
        <input class="client-check" type="checkbox" value="${c.id}">
        <span class="client-name">${c.name}</span>
        <span class="client-day">(${c.payment_day})</span>
      </label>
    `
  })

  container.innerHTML = html
}

function selectAllClients() {
  document.querySelectorAll('#clients-list input')
    .forEach(cb => cb.checked = true)
}

async function loadPayments() {
  const res = await fetch(`${API}/payments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = await res.json()

  const container = document.getElementById('payments')
  container.innerHTML = ''

  data.forEach(p => {
    const div = document.createElement('div')

    div.className = `payment-item ${p.paid ? 'paid' : ''}`

    div.innerHTML = `
      <label>
        <input type="checkbox" value="${p.id}">
        <strong>${p.name}</strong>
      </label><br>

      Vencimento: ${p.due_date}<br>
      Pago em: ${p.paid_at || '-'}<br>
      Status: ${p.paid ? 'Pago' : 'Pendente'}<br><br>

      <button class="btn-small btn-delete" onclick="deletePayment(${p.id})">
        Excluir
      </button>

      ${!p.paid ? `
        <button class="btn-small btn-pay" onclick="markAsPaid(${p.id})">
          Marcar pago
        </button>
      ` : ''}
    `

    container.appendChild(div)
  })
}

function editPayment(id, client_id, month, due_date) {
  editingPaymentId = id

  document.getElementById('client_id').value = client_id
  document.getElementById('month').value = month
  document.getElementById('due_date').value = due_date

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function createPayment() {
  const errorDiv = document.getElementById('error')
  errorDiv.innerText = ''

  const checkboxes = document.querySelectorAll('#clients-list input:checked')

  if (checkboxes.length === 0) {
    errorDiv.innerText = 'Selecione pelo menos um cliente'
    return
  }

  // 👇 gera mês automaticamente
  const today = new Date()
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  try {
    for (const cb of checkboxes) {
      await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: cb.value,
          month
        })
      })
    }

    loadPayments()

  } catch (err) {
    errorDiv.innerText = 'Erro ao criar pagamentos'
  }
}

async function markSelectedAsPaid() {
  const checkboxes = document.querySelectorAll('#payments input:checked')

  if (checkboxes.length === 0) {
    alert('Selecione pelo menos um pagamento')
    return
  }

  for (const cb of checkboxes) {
    await fetch(`${API}/payments/${cb.value}/pay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  loadPayments()
}

async function deletePayment(id) {
  if (!confirm('Deseja excluir este pagamento?')) return

  await fetch(`${API}/payments/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  loadPayments()
}

async function markAsPaid(id) {
  await fetch(`/payments/${id}/pay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  loadPayments()
}

// ================= MENSAGENS =================
let editingMessageId = null
async function loadMessages() {
  const res = await fetch(`${API}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = await res.json()

  const list = document.getElementById('messages')
  list.innerHTML = ''

  data.forEach(m => {
    const li = document.createElement('li')

    li.innerHTML = `
      <div class="type">${formatType(m.type)}</div>
      <div class="content">${m.content}</div>

      <br>

      <button class="btn-sm" onclick="editMessage(${m.id}, '${m.type}', \`${m.content}\`)">
        Editar
      </button>

      <button class="btn-sm btn-danger" onclick="deleteMessage(${m.id})">
        Excluir
      </button>
    `

    list.appendChild(li)
  })
}

function formatType(type) {
  const map = {
    before_2_days: '2 dias antes',
    before_1_day: '1 dia antes',
    due_today: 'No dia do vencimento',
    after_1_day: '1 dia após'
  }
  return map[type] || type
}

async function createMessage() {
  const errorDiv = document.getElementById('error')
  errorDiv.innerText = ''

  const type = document.getElementById('type').value
  const content = document.getElementById('content').value.trim()

  if (!type) {
    errorDiv.innerText = 'Selecione o tipo da mensagem'
    return
  }

  if (!content || content.length < 5) {
    errorDiv.innerText = 'Mensagem deve ter pelo menos 5 caracteres'
    return
  }

  try {
    if (editingMessageId) {
      // UPDATE
      await fetch(`/messages/${editingMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, content })
      })

      editingMessageId = null
    } else {
      // CREATE
      await fetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, content })
      })
    }

    document.getElementById('content').value = ''
    document.getElementById('type').value = ''

    loadMessages()

  } catch (err) {
    errorDiv.innerText = 'Erro ao salvar mensagem'
  }
}

function editMessage(id, type, content) {
  editingMessageId = id

  document.getElementById('type').value = type
  document.getElementById('content').value = content

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteMessage(id) {
  if (!confirm('Deseja excluir esta mensagem?')) return

  await fetch(`/messages/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  loadMessages()
}

// ================= AUTO LOAD =================
window.onload = () => {
  if (document.getElementById('clients')) {
    loadClients()
  }

  if (document.getElementById('messages')) {
    loadMessages()
  }

  if (document.getElementById('clients-list')) {
    loadClientsSelect()
  }

  if (document.getElementById('payments')) {
    loadPayments()
  }

}

const token = localStorage.getItem('token')

if (!token) {
  window.location.href = '/'
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-client')

  if (input) {
    input.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase()

      const filtered = allClients.filter(c =>
        c.name.toLowerCase().includes(term)
      )

      renderClients(filtered)
    })
  }
})