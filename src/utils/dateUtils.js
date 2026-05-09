// ==============================
// REGRAS DE DATA
// ==============================

// Feriados FIXOS (dia/mês)
const FIXED_HOLIDAYS = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalhador
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25'  // Natal
]

// ==============================
// FUNÇÕES AUXILIARES
// ==============================

const formatDayMonth = (date) => {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${m}-${d}`
}

// ==============================
// CÁLCULO DA PÁSCOA (algoritmo)
// ==============================

function getEasterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

// ==============================
// FERIADOS MÓVEIS
// ==============================

function getMovableHolidays(year) {
  const easter = getEasterDate(year)

  const carnaval = new Date(easter)
  carnaval.setDate(easter.getDate() - 47)

  const sextaSanta = new Date(easter)
  sextaSanta.setDate(easter.getDate() - 2)

  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)

  return [
    carnaval,
    sextaSanta,
    corpusChristi
  ]
}

// ==============================
// VALIDAÇÕES
// ==============================

const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const isHoliday = (date) => {
  const year = date.getFullYear()

  // Feriados fixos
  const isFixed = FIXED_HOLIDAYS.includes(formatDayMonth(date))

  // Feriados móveis
  const movable = getMovableHolidays(year).some(d =>
    d.toDateString() === date.toDateString()
  )

  return isFixed || movable
}

const isBusinessHour = () => {
  const hour = new Date().getHours()
  return hour >= 8 && hour < 23
}

module.exports = {
  isWeekend,
  isHoliday,
  isBusinessHour
}