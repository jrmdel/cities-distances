// Bring all the modules
require('dotenv').config();
const express = require('express');
const { initDb, getDb, closeDb } = require('./connectors/db');

// Start the express instance
const app = express();

// Some middlewares
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

// Init Db
initDb((err)=>{
    if(err) console.error(err.message);
    else {
        console.log("Now connected to the Db");
    }
});

// Routes
app.use('/', require('./routes/main'));


// Launching the server
const PORT = 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

// Listening to events
app.on('close', ()=>{
    closeDb();
})