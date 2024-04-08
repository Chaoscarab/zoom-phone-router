//require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

//initializing express app
const app = express()


port = 88

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.listen(port, console.log("server running on " + port))