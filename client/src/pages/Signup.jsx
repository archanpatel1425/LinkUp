import axios from 'axios';
import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast'; 
import { AuthContext } from "../helpers/AuthContext";

const Signup = () => {
  const { setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const { showToast } = useToast();
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    const formDataToSend = new FormData();
    for (const key in data) {
      formDataToSend.append(key, data[key]);
    }

    try {
      const response = await axios.post('http://localhost:5000/auth/signup', formDataToSend);
      if (response.data.error) {
        showToast(`${response.data.error}`)
      }
      else {
        localStorage.setItem('jwt_token', response.data.accessToken);
        setAuthState({
          username: response.data.username,
          user_id: response.data.userId,
          email: response.data.email,
          status: true,
        });
        showToast(`Successfully Signup`, 'success')
        navigate('/');
      }
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  return (
    <>

      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-[#14172B]">
        <div className="bg-[#1B1F36] p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Sign Up</h1>
          <p className="text-white text-center mb-6">Create your Account</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* First Name Input */}
            <div className="form-group">
              <input
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#89C2FF]"
                type="text"
                placeholder="First Name*"
                {...register('first_name', {
                  required: "First name is required",
                  pattern: {
                    value: /^[A-Za-z\d]+$/,
                    message: "First name must contain only alphabets and digits",
                  },
                })}
              />
              {errors.first_name && <p className="text-red-500">{errors.first_name.message}</p>}
            </div>

            {/* Last Name Input */}
            <div className="form-group">
              <input
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#89C2FF]"
                type="text"
                placeholder="Last Name*"
                {...register('last_name', {
                  required: "Last name is required",
                  pattern: {
                    value: /^[A-Za-z\d]+$/,
                    message: "Last name must contain only alphabets and digits",
                  },
                })}
              />
              {errors.last_name && <p className="text-red-500">{errors.last_name.message}</p>}
            </div>

            {/* Email Input */}
            <div className="form-group">
              <input
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#89C2FF]"
                type="email"
                placeholder="Email*"
                {...register('email', {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
              />
              {errors.email && <p className="text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password Input */}
            <div className="form-group">
              <input
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#89C2FF]"
                type="password"
                placeholder="Password*"
                {...register('password', {
                  required: "Password is required",
                  validate: (value) =>
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(value) ||
                    "Password must be at least 8 characters long, contain one uppercase, one lowercase, one digit, and one special character.",
                })}
              />
              {errors.password && <p className="text-red-500">{errors.password.message}</p>}
            </div>

            {/* Phone Number Input */}
            <div className="form-group">
              <input
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#89C2FF]"
                type="text"
                placeholder="Phone Number*"
                {...register('phone_no', {
                  required: "Phone number is required",
                  minLength: {
                    value: 10,
                    message: "Phone number must be 10 digits",
                  },
                  maxLength: {
                    value: 10,
                    message: "Phone number must be 10 digits",
                  },
                  pattern: {
                    value: /^[0-9]+$/,
                    message: "Phone number must only contain digits",
                  },
                })}
              />
              {errors.phone_no && <p className="text-red-500">{errors.phone_no.message}</p>}
            </div>


            {/* Signup Button */}
            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-[#89C2FF] transition duration-300"
              type="submit"
            >
              Signup
            </button>
          </form>

          <p className="mt-4 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
