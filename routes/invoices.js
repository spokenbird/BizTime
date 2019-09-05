const express = require("express");
const router = new express.Router();
const db = require("../db");
const app = express();
const ExpressError = require("../expressError");

app.use(express.json());

router.get('/', async function (req, res, next) {
  try {
    const results = await db.query(`
      SELECT id, comp_code
      FROM invoices`)
    return res.json({
      invoices: results.rows
    })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', async function (req, res, next) {
  try {
    const id = req.params.id
    const result = await db.query(`
      SELECT id, amt, paid, add_date, paid_date, companies.code, companies.name, companies.description
      FROM invoices
      JOIN companies ON comp_code=companies.code
      WHERE id=$1`, [id])
    if (!result.rows.length) {
      throw new ExpressError(`No invoice found`, 404);
    }
    const invoice = result.rows[0]
    return res.json({
      invoice: {
        id: invoice.id,
        amt: invoice.amt,
        paid: invoice.paid,
        add_date: invoice.add_date,
        paid_date: invoice.paid_date,
        company: {
          code: invoice.code,
          name: invoice.name,
          description: invoice.description
        }
      }
    })
  } catch (err) {
    return next(err)
  }
})

router.post('/', async function (req, res, next) {
  try {
    const {
      comp_code,
      amt
    } = req.body;

    const result = await db.query(`
      INSERT INTO invoices
      (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, amt, paid, add_date, paid_date
    `, [comp_code, amt])

    return res.json({
      invoice: result.rows[0]
    }, 201)
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', async function (req, res, next) {
  try {
    const amt = req.body.amt

    const result = await db.query(`
      UPDATE invoices SET amt=$1
      WHERE id=$2
      RETURNING id, amt, paid, add_date, paid_date
    `, [amt, req.params.id])
    if (!result.rows.length) {
      throw new ExpressError(`No invoice was found}`, 404);
    }
    return res.json({ invoice: result.rows[0]})
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id', async function(req, res, next){
  try {
      const result = await db.query(`
      DELETE FROM invoices
      WHERE id=$1
    `, [req.params.id])

    if (!result.rowCount) {
      throw new ExpressError(`No invoice was found`, 404);
    }
    return res.json({ status: 'deleted'})
  }
  catch(err) {
    return next(err)
  }
})

module.exports = router