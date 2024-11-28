import React, { useContext, useEffect, useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Home from '../components/Dashboard_Home';
import Navbar from '../components/Navbar';
import PersonalRoom from '../components/PersonalRoom';
import Settings from '../components/Settings';
import Sidebar from '../components/Sidebar';
import { AuthContext } from "../helpers/AuthContext";

const AfterLogin_Home = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [activeComponent, setActiveComponent] = useState('Home');
    const navigate = useNavigate();
    const { authState } = useContext(AuthContext);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
        }

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const renderActiveComponent = () => {
        switch (activeComponent) {
            case 'Home':
                return <Home />;
            case 'PersonalRoom':
                return <PersonalRoom />;
            case 'Settings':
                return <Settings />;
            default:
                return <Home />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 overflow-hidden mt-16">  
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    setActiveComponent={setActiveComponent}
                    isMobile={isMobile}
                />
                <div className={`flex-1 flex flex-col ${!isMobile && isSidebarOpen ? 'ml-64' : ''}`}>
                    {isMobile && (
                        <div className="flex items-center p-4">
                            <button onClick={toggleSidebar} className="text-white">
                                <FaBars size={24} />
                            </button>
                        </div>
                    )}
                    <div className="flex-1 p-6 text-white">
                        {renderActiveComponent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AfterLogin_Home;
