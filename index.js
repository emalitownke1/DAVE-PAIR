const express = require('express');
const app = express();
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const code = require('./pair'); // Make sure './pair' exports a router
require('events').EventEmitter.defaultMaxListeners = 500;

// ✅ Middleware setup FIRST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve static files (if you have CSS, JS, images)
app.use(express.static(__path));

// ✅ Then setup your routes
app.use('/code', code);

// ✅ Use app.get() instead of app.use() for specific routes
app.get('/', async (req, res) => {
    res.sendFile(__path + '/pair.html');
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// ✅ 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`
Deployment Successful!
Session-Server Running on http://localhost:` + PORT);
});

module.exports = app;