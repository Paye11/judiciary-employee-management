const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.FRONTEND_PORT || 8080;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend server running on http://localhost:${PORT}`);
    console.log(`📱 Access the application at: http://localhost:${PORT}`);
});