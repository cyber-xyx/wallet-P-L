const pg = require('pg')
var http = require('http');
var express = require('express');
var path = require('path');
const cookieParser = require('cookie-parser');
var engine = require('ejs-locals')

const session = require('express-session');
var flash = require('connect-flash');
var app = express();
app.locals.baseURL = "http://165.22.215.103:2000/"

const port = 2000;
//API Route Files
app.use(express.urlencoded());
app.use(cookieParser());
app.use(express.json());
/* Express Messages Middleware */

app.use(cookieParser());

app.use(session({
    secret:'flashblog',
    saveUninitialized: true,
    resave: true
}));
app.use(flash());



/* view engine setup */
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* Set Public Folder */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));


app.use('/', require('./routes/index'));
app.set('views', path.join(__dirname, 'views'));
/* Initialize server */
var server = http.createServer(app);
/* Start Server */
server.listen(port, function () {
    console.log('HTTP server listening on port' + port);
});

module.exports = app;