const Router = require('express-promise-router')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const db = require('../db')

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

router.get('/', async (req, res) => {
  const token = req.headers['authorization']
  console.log("test")
  if (!token) return res.status(401).send({auth: false, message: 'No token provided'})
  
  try {
    const {id} = jwt.verify(token.split(" ")[1], process.env.SESSION_SECRET)
    const { rows } = await db.query('SELECT name, email, phone_num FROM "user" WHERE user_id = $1', [id])
    res.send(rows[0])
  } catch (e) {
    console.log(e)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
  }
})

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body 
  if (email && password && phone) {
    const hashedPassword = bcrypt.hashSync(password, 8)

    try {
      const { rows } = await db.query('INSERT INTO "user" (name, email, password, phone_num) VALUES($1, $2, $3, $4) RETURNING *', [name, email, hashedPassword, phone])
      const userId = rows[0].user_id

      const token = jwt.sign({id: userId}, process.env.SESSION_SECRET, {
        expiresIn: 86400 // expires in 24 hours
      })

      res.status(200).send({auth: true, token: token})
    } catch (e) {
      console.log(e)
      if (e.routine == '_bt_check_unique')
        return res.status(409).send({auth: false, error: 'User with the same email already exists.'})
      res.status(500).send({auth: false, error: 'There was an error creating your account.'})
    }
  }
})


router.post('/login', async (req, res) => {
  const { email, password } = req.body 
  if (email && password) {
    let { rows } = await db.query('SELECT user_id, email, password FROM "user" WHERE email = $1', [email])
 
    if (!rows[0]) {
      return res.status(404).send('No user found.')
    }

    if(bcrypt.compareSync(password, rows[0].password)) {
      let token = jwt.sign({id: rows[0].user_id}, process.env.SESSION_SECRET, {
        expiresIn: 86400 // expires in 24 hours
      })
      res.status(200).send({auth: true, token: token})
    } else {
      res.status(401).send({ auth: false, token: null })
    }
  }
})