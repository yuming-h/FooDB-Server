const Router = require('express-promise-router')
var format = require('pg-format');
const db = require('../db')

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

router.get('/:id/menu-items', async (req, res) => {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM menu_item WHERE restaurant_id = $1', [id])
    res.send(rows)
})

router.get('/list', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM restaurant') // SHOULD USE VIEW THAT SHOWS ONLY HOURS,ADDRESS, RATING
    res.send(rows)
  })

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM restaurant WHERE restaurant_id = $1', [id])
    res.send(rows[0])
})

// for restaurant managers, gets all orders of the restaurant
router.get('/:id/orders', async (req, res) => {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM "restaurant", "order" WHERE "restaurant".restaurant_id = "order".restaurant_id AND "order".restaurant_id = $1 AND prepared_datetime IS NULL', [id]);
    res.send(rows)
})

// gets all reviews for that restaurant
router.get('/:id/reviews', async (req, res) => {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM restaurant_review WHERE restaurant_review.restaurant_id = $1', [id]);
    res.send(rows)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params.id
    const { rows } = await db.query('SELECT COUNT(*), category FROM restaurant WHERE category = $1 GROUP BY category', [id]);
    res.send(rows)
})

/* GET FOOD ITEMS WHICH WERE INCLUDED IN ALL ORDERS OF THE RESTAURANT */

router.get('/:id/division', async (req, res) => {
    const { id } = req.params
    await db.query(format(`
    CREATE OR REPLACE VIEW foods_ordered AS
        (SELECT name from
        order_item o2, menu_item m2
    WHERE m2.restaurant_id = o2.restaurant_id
        AND m2.name = o2.menuitem_name
        AND o2.restaurant_id = %L)`, id))
        

    const division = await db.query(`

    SELECT name FROM foods_ordered

    EXCEPT 

    SELECT name FROM /* Gets all the unique food items which were not included in every order */ 
    (
    (SELECT order_id, name FROM "order" o, foods_ordered
        WHERE o.restaurant_id = $1) /* get cross product of food items and order_item (all possible combinations of food_item and order) */
        EXCEPT
        (SELECT order_id, name FROM menu_item m1, order_item o1
            WHERE m1.name = o1.menuitem_name AND m1.restaurant_id = $1)) /* get actual food items in each order*/
    AS bad_foods;
    `, [id])

    console.log(division.rows)
    res.send(division.rows)
})

router.post("/", async (req, res) => {
    // Verify user is signed in with a proper authentication token
    const token = req.headers['authorization']
    if (!token) return res.status(401).send({auth: false, message: 'No token provided'})
    try {
      const {id} = jwt.verify(token.split(" ")[1], process.env.SESSION_SECRET)
  
      const { restaurant_id, stars, content} = req.body

      const review_id = (await db.query('INSERT INTO "restaurant_review" (restaurant_id, user_id, restaurant_review.stars, restaurant_review.content) VALUES ($1, $2, $3, $4)', [restaurant_id, id, stars, content])).rows[0].review_id
  
      console.log(review_id)
      res.status(200).send({review_id})
      const { rows } = await db.query('SELECT name, email, phone_num FROM "user" WHERE user_id = $1', [id])
      res.send(rows[0])
    } catch (e) {
      console.log(e)
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
  })

// router.post('/:id/review', async (req, res) => {
//     const { id } = req.params
//     const { restaurant_id, user_id } = req.body
//     const { rows } = await db.query('INSERT INTO restaurant_review VALUES (restaurant_review.stars, restaurant_review.content)', [id], [restaurant_id], [user_id]);
//     res.send(rows[0])
//       const review_id = (await db.query('INSERT INTO "restaurant_review" (restaurant_id, user_id, restaurant_review.stars, restaurant_review.content) VALUES ($1, $2, $3, $4)', [restaurant_id, id, stars, content])).rows[0].review_id
  
//       console.log(review_id)
//       res.status(200).send({review_id})
//       const { rows } = await db.query('SELECT name, email, phone_num FROM "user" WHERE user_id = $1', [id])
//       res.send(rows[0])
//     } catch (e) {
//       console.log(e)
//       return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
//     }
//   )