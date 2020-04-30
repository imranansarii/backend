const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'root',
        database: 'smart-detect'
    }
});

db.select('*').from('users').then(data => {
    console.log(data);
})


const app = express();
app.use(cors());
app.use(bodyParser.json());



app.get('/', (req, res) => {
    res.send("it is working")
})


app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('error sigining in')
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('unable to get user'))
            } else {
                res.status(400).json('wrong credentials')
            }
        })

        .catch(err => res.status(400).json('unable to get user'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('submission failed');
    }


    const hash = bcrypt.hashSync(password);

    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginemail => {
                return trx("users")
                    .returning('*')
                    .insert({
                        email: loginemail[0],
                        name: name,
                        joined: new Date()
                    }).then(response => res.json(response[0]))
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })


        .catch(err => res.status(400).json("unable to register"))
})


app.get("/profile/:id", (req, res) => {
    const { id } = req.params;
    let found = false;
    database.users.forEach(user => {
        if (user.id == id) {
            found = true;
            return res.json(user);
        }
    })

    if (!found) {
        res.status(404).json("id not found")
    }
})

app.put("/image", (req, res) => {
    const { id } = req.body;
    let found = false;
    database.users.forEach(user => {
        if (user.id === id) {
            found = true;
            user.entries++;
            return res.json(user.entries);
        }
    })

    if (!found) {
        res.status(404).json("id not found");
    }
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`App running on port ${process.env.PORT || 3000}`)
})