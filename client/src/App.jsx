import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthContext } from "./helpers/AuthContext";
import AfterLogin_Home from './pages/AfterLogin_Home';
import Home from './pages/Home';
import JoinMeeting from './pages/JoinMeeitng';
import Login from './pages/Login';
import NotFound from "./pages/NotFound";
import Signup from './pages/Signup';
import VideoChat from './pages/VideoChat';
import WaitingRoom from './pages/WaitingRoom';
const App = () => {
  const [authState, setAuthState] = useState({
    user_id: '',
    email: '',
    status: false,
  });
  const [loading, setLoading] = useState(true); // Start with loading set to true

  useEffect(() => {
    const accessToken = localStorage.getItem("jwt_token");
    if (accessToken) {
      get_details(accessToken);
    } else {
      setLoading(false); // No token, stop loading
    }
  }, []);

  const get_details = async (accessToken) => {
    console.log("Fetching user details...");
    try {
      const response = await axios.post("http://localhost:5000/auth/validation", { accessToken });
      if (response.data.error) {
        if (response.data.error == 'TokenExpiredError') {
          localStorage.removeItem('jwt_token')
        }
        setAuthState({ username: '', user_id: '', email: '', status: false });
      } else {
        setAuthState({
          username: response.data.username,
          user_id: response.data.userId,
          email: response.data.email,
          status: true,
        });
        console.log({
          username: response.data.username,
          user_id: response.data.userId,
          email: response.data.email,
          status: true,
        })
      }
    } catch (error) {
      console.error("Error during token validation", error);
      setAuthState({ username: '', user_id: '', email: '', status: false });
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  };

  return (
    <div>
      {loading ? (
        <h1>Loading....</h1>
      ) : (
        <AuthContext.Provider value={{ authState, setAuthState }}>
          <Router>
            <ToastProvider>
              <Routes>
                <Route exact path='/' element={<Home />} />
                <Route exact path='/dashboard' element={<AfterLogin_Home />} />
                <Route exact path='/login' element={<Login />} />
                <Route exact path='/signup' element={<Signup />} />
                <Route exact path='/meet/:roomId' element={<VideoChat />} />
                <Route exact path='/joinmeet' element={<JoinMeeting />} />
                <Route exact path='/:meetingId' element={<WaitingRoom />} />
                <Route path='*' element={<NotFound />} />
              </Routes>
            </ToastProvider>

          </Router>
        </AuthContext.Provider>
      )
      }
    </div >
  );
};

export default App;

/*

import React, { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import About from './pages/About';
import Home from './pages/Home';
import VideoChat from './pages/VideoChat';
const App = () => {
 const [roomId, setRoomId] = useState('');
 const [username, setUsername] = useState(''); // New state for username
 const [isConnected, setIsConnected] = useState(false);

 const handleJoinRoom = (e) => {
   e.preventDefault();
   if (roomId.trim() && username.trim()) { // Check both room ID and username
     setIsConnected(true);
     sessionStorage.setItem('user_details', 'Archan')
   }
 };

 return (
   <div>
     <Router>

       {!isConnected ? (
         <div>
           <h1>Join a Meeting</h1>
           <form onSubmit={handleJoinRoom}>
             <input
               type="text"
               placeholder="Username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               required
             />
             <input
               type="text"
               placeholder="Room ID"
               value={roomId}
               onChange={(e) => setRoomId(e.target.value)}
               required
             />
             <button type="submit">Join Room</button>
           </form>
         </div>
       ) : (
         <VideoChat roomId={roomId} username={username} />
       )}
       <Routes>
         <Route exact path='/' element={<Home />} />
         <Route exact path='/About' element={<About />} />
       </Routes>

     </Router>
   </div>
 );
};
export default App; */


