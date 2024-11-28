// server.js
const http = require('http');
const app = require('./app'); // Import the Express app
const initializeSocket = require('./config/socketConfig'); // Import socket configuration
const dotenv = require('dotenv');
dotenv.config();

// Create HTTP server using the Express app
const server = http.createServer(app);
// Initialize socket configuration
initializeSocket(server);

// Start the server
const PORT = process.env.PORT || 5000;
function startServer() {
  try {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
  catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
startServer();