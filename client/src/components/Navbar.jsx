import axios from 'axios';
import { Menu, X } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from "../helpers/AuthContext";
import { useToast } from './Toast'; // Ad

const Navbar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profilePhotoUrl, setprofilePhotoUrl] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const mobileMenuRef = useRef();
  const profileMenuRef = useRef();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const { showToast } = useToast();
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsLogin(true);
      fatch_profile_photo()
    }
  }, []);
  useEffect(() => {

  }, [profilePhotoUrl])
  const fatch_profile_photo = () => {
    axios.post('http://localhost:5000/user/fatch-profile-photo', { user_id: authState.user_id })
      .then((response) => {
        setprofilePhotoUrl(response.data.profilePic)
      })
  }
  const logout_user = () => {
    localStorage.removeItem('jwt_token');
    setIsLogin(false);
    setIsProfileMenuOpen(false);
    showToast("Successfully logged out!", "success");
    navigate('/login');

  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="bg-gray-800 p-4 w-full z-10 fixed top-0">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white text-3xl font-bold order-1 md:order-none">Linkup</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 order-2">
            {isLogin && (
              <Link
                to="/"
                className="text-white text-lg hover:text-gray-300 relative group"
              >
                Dashboard
                <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-gray-300 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
              </Link>
            )}

            {!isLogin ? (
              <>
                <Link
                  to="/login"
                  className="text-white text-lg hover:text-gray-300 relative group"
                >
                  Login
                  <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-gray-300 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
                </Link>
                <Link
                  to="/signup"
                  className="text-white text-lg hover:text-gray-300 relative group"
                >
                  Sign up
                  <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-gray-300 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
                </Link>
              </>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center focus:outline-none "
                >
                  <img src={profilePhotoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-600 text-white rounded-md shadow-lg py-1 z-10">


                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-sm hover:bg-gray-700 focus:outline-none appearance-none text-left"
                      onClick={logout_user}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center space-x-2 md:hidden order-2">
            <button onClick={toggleMobileMenu} className="text-white">
              <Menu size={24} />
            </button>
            {isLogin && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <img src={profilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-600 text-white rounded-md shadow-lg py-1 z-10"> {/* Dark-themed profile menu */}


                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-sm hover:bg-gray-700 focus:outline-none appearance-none text-left"
                      onClick={logout_user}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Side Menu */}
        <div
          ref={mobileMenuRef}
          className={`fixed top-0 right-0 h-full w-64  bg-gray-700 p-5 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            } md:hidden`}
        >
          <button onClick={toggleMobileMenu} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X size={24} />
          </button>
          <div className="flex flex-col space-y-4 mt-12">
            {isLogin && <Link to="/" className="text-white text-lg hover:text-gray-300">Dashboard</Link>}
            {!isLogin ? (
              <>
                <Link to="/login" className="text-white text-lg hover:text-gray-300">Login</Link>
                <Link to="/signup" className="text-white text-lg hover:text-gray-300">Sign up</Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
