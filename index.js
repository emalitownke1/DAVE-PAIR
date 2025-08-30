const express = require('express');
const app = express();
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./pair'); // Removed server require
require('events').EventEmitter.defaultMaxListeners = 500;

// ✅ Middleware setup FIRST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ API routes - removed /qr route
app.use('/code', code);

// ✅ HTML routes
app.use('/pair', async (req, res) => {
    res.sendFile(__path + '/pair.html');
});

app.use('/', async (req, res) => {
    res.sendFile(__path + '/main.html');
});

// ✅ Manual static file serving for specific extensions
app.use('/:file(.+\\.(css|js|png|jpg|jpeg|gif|ico|svg))', (req, res) => {
    res.sendFile(__path + '/' + req.params.file);
});

// ✅ Error handling
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
Don't Forget To Give Star
Server running on http://localhost:` + PORT);
});

module.exports = app;