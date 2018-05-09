const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/database');
const request = require('request');

// Connect To Database
mongoose.connect(config.database);
// On Connection
mongoose.connection.on('connected',()=>{
    console.log('Connected to database '+config.database);
});
// On Connection Error
mongoose.connection.on('error',(err)=>{
    console.log('Database error: '+err);
});


const app = express();

// Port Number
const port = process.env.PORT || 8080;

// Cors Middleware
app.use(cors());

// Body Parser Middleware
app.use(bodyParser.json());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

const options = {
    
    url: 'https://api-fxpractice.oanda.com/v3/instruments/EUR_USD/candles?count=500&price=M&granularity=M1',
    auth: {
        'bearer':'69577430ab5926403faac0a3055bb498-c05dde36b7a31e93661a07185ff6295e'
    },
}

// Index Route
app.get('/', (req, res) => {
    request(options, (error, response, body) =>{
        if(!error && response.statusCode == 200) {
            let info = JSON.parse(body);
            res.send(info);
        }  
    })
});

// Start Server
app.listen(port, () => {
    console.log('server started on port : ' + port );
});