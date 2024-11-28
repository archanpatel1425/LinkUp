import React from 'react';
import { Video, Users, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
const Button = ({ children, className, ...props }) => (
  <button 
    className={`px-4 py-2 rounded font-bold transition-colors ${className}`} 
    {...props}
  >
    {children}
  </button>
);

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Connect with Anyone, Anywhere</h2>
          <p className="text-xl text-gray-300 mb-8">Experience seamless video conferencing with LinkUp</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full text-lg">
            Get Started
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <FeatureCard 
            icon={<Video className="w-12 h-12 text-blue-400" />}
            title="Crystal Clear Video"
            description="Enjoy high-quality video calls with advanced compression technology"
          />
          <FeatureCard 
            icon={<Users className="w-12 h-12 text-blue-400" />}
            title="Group Meetings"
            description="Host or join group meetings with up to 100 participants"
          />
          <FeatureCard 
            icon={<MessageCircle className="w-12 h-12 text-blue-400" />}
            title="Instant Chat"
            description="Communicate via text chat during or outside of video calls"
          />
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to LinkUp?</h3>
            <p className="text-gray-300">Join millions of users already connecting on our platform</p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">
            <Link to='/signup'>Sign up Free</Link>
          </Button>
        </div>
      </main>
      
      <footer className="container mx-auto px-4 py-6 text-center text-gray-400">
        © 2024 LinkUp. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default HomePage;