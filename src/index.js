const express = require('express')
const bodyparser = require('body-parser')
const mysql = require('mysql')
const tabRouter = require('./tabrouter')
const path = require('path')

const app = express()

const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

function nocache (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  next()
}

app.use(nocache)
app.use(bodyparser.json())
app.use('/v1/tab', tabRouter(dbPool))

app.use('/', express.static(path.join(__dirname, '../www')))

app.listen(process.env.APP_PORT, () => {
  console.log('Running on port', process.env.APP_PORT)
})
