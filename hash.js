const bcrypt = require('bcrypt')

bcrypt.hash(process.env.PASSWORD_ADMIN_BASE, 10)
  .then(console.log)