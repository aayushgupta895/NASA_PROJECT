require('dotenv').config()
const express = require('express');
const cors = require('cors');

const app = express();
const path = require('path');
const morgan = require('morgan');

const api = require('./routes/api')

app.use(cors({
    origin: 'http://localhost:3000'
}))
 app.use(morgan('combined'));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public", "build")));

app.use('/v1/', api);

app.get('/*', (req, res) =>{
    res.sendFile(path.join(__dirname, '..','public','build','index.html'))
})

module.exports = app;