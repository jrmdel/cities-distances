// Bring all the modules
require('dotenv').config();
const express = require('express');

// Start the express instance
const app = express();

// Some middlewares
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

// Routes
app.use('/', require('./routes/main'));


// Launching the server
const PORT = 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));