const path = require('path')
const express = require('express')

const viewEngine = (app) => {
    app.set('views', path.join('./src', 'views'))
    app.set('view engine', 'ejs')
    //static file path
    app.use(express.static(path.join('./src', 'public')))
}
module.exports = viewEngine