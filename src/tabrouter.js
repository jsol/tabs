const express = require('express')
const uuid = require('uuid/v4')

module.exports = db => {
  const router = express.Router()
  const validate = entry => {
    Object.keys(entry).forEach(key => {
      if (!entry[key]) {
        const err = new Error(`${key} is not set`)
        err.statusCode = 400
        throw err
      }
    })
  }

  router.post('/', (req, res) => {
    const t = {
      uuid: uuid(),
      title: req.body.title,
      progression: req.body.progression
    }

    try {
      validate(t)

      db.query('INSERT INTO `tabs` SET ?', t, (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).end()
        }

        res.json(t).end()
      })
    } catch (err) {
      console.log(err)
      res.status(err.statusCode || 500).end()
    }
  })

  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM `tabs` WHERE  uuid = ? LIMIT 1', [req.params.id], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).end()
      }
      return res.status(200).json({
        uuid: req.params.id,
        status: 'removed'
      }).end()
    })
  })

  router.put('/:id', (req, res) => {
    const t = {
      title: req.body.title,
      progression: req.body.progression
    }
    try {
      validate(t)

      db.query('UPDATE `tabs` SET ? WHERE uuid = ?', [t, req.params.id], (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).end()
        }

        t.uuid = req.params.id
        res.json(t).end()
      })
    } catch (err) {
      console.log(err)
      res.status(err.statusCode || 500).end()
    }
  })

  router.get('/:id', (req, res) => {
    try {
      db.query('SELECT uuid, title, progression FROM `tabs` WHERE uuid = ?', [req.params.id], (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).end()
        }

        res.json(result).end()
      })
    } catch (err) {
      console.log(err)
      res.status(err.statusCode || 500).end()
    }
  })

  router.get('/', (req, res) => {
    try {
      db.query('SELECT uuid, title, progression FROM `tabs`', [], (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).end()
        }

        res.json(result).end()
      })
    } catch (err) {
      console.log(err)
      res.status(err.statusCode || 500).end()
    }
  })

  return router
}
