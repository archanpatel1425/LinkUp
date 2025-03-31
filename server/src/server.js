const http = require('http');
const app = require('./app'); 
const initializeSocket = require('./config/socketConfig'); 
const dotenv = require('dotenv');
dotenv.config();

const server = http.createServer(app);
initializeSocket(server);

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