const express = require('express');
const app = express();
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const code = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 500;
const fs = require('fs');

// ✅ Middleware setup FIRST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve static files BUT exclude HTML files from automatic serving
app.use(express.static(__path, {
    index: false, // Don't automatically serve index.html
    extensions: ['html', 'htm'] // Don't automatically serve .html files
}));

// ✅ Then setup your routes
app.use('/code', code);

// ✅ Use app.get() for your main route - THIS WILL WORK NOW
app.get('/', async (req, res) => {
    console.log('Serving pair.html from route handler');
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

// ✅ Debug: Check if file exists
console.log('pair.html exists:', fs.existsSync(__path + '/pair.html'));

app.listen(PORT, () => {
    console.log(`
Deployment Successful!
Session-Server Running on http://localhost:` + PORT);
});

module.exports = app;