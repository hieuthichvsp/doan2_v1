require('dotenv').config()
const express = require('express')
const loginRouter = require('./routes/loginRouter')
const viewEngine = require('./configs/viewEngine')
const adminRouter = require('./routes/adminRouter')
const teacherRouter = require('./routes/teacherRouter')
const studentRouter = require('./routes/studentRouter')
const session = require('express-session')

const app = express()
const port = process.env.port || 3000

app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true,
}))

// use req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

viewEngine(app)

app.use('/', loginRouter)
app.use('/admin', adminRouter)
app.use('/teacher', teacherRouter)
// app.use('/student', studentRouter)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})