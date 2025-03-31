# 📹 Linkup

Linkup is a video conferencing platform , offering personal meeting rooms, a waiting room with admin controls, screen sharing, real-time chat, and invitation link sharing. If a meeting ID is leaked, a new one can be generated instantly.

## 🌟 Features

- 🎥 **Personal Meeting Rooms**
- ⏳ **Waiting Room with Admin Controls**
- 🔗 **Copy & Share Invitation Link**
- 🆕 **Generate New Meeting ID** (if leaked)
- 📢 **Real-time Chatting**
- 📺 **Screen Sharing**

## 🛠️  Languages and Frameworks

- **Frontend:** React + Vite , Tailwind CSS
- **Backend:** Node.js
- **Database:** MongoDB

## ⚡ Installation

### 🔹 Frontend Setup

```bash
cd client
npm install
npm run dev # Runs on http://localhost:5173
```

### 🔹 Backend Setup

```bash
cd server
npm install
# Start server
npm run dev # Runs on http://localhost:3000
```

### 🔹 Environment Configuration

```env
# Server Configuration
PORT=
NODE_ENV=

# Database
MONGO_URI=

# Authentication
JWT_SECRET=
JWT_EXPIRE=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRE=

SESSION_SECRET=

# Email
EMAIL_USER=
EMAIL_PASS=
```

## ⚖️ License

LinkUp is licensed under the MIT License. See the LICENSE file for more details.
