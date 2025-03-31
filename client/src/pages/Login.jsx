import axios from 'axios';
import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast'; 
import { AuthContext } from "../helpers/AuthContext";

const Login = () => {
    const { setAuthState } = useContext(AuthContext);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            navigate('/login');
        }
    }, [navigate]);

    const onSubmit = async (data) => {
        const { email, password } = data;
        try {
            const response = await axios.post(`http://localhost:5000/auth/login`, { email, password });
            if (response.data.error) {
                showToast(`${response.data.error}`, 'error');
            } else {
                showToast('Login successful', 'success');
                localStorage.setItem('jwt_token', response.data.accessToken);
                setAuthState({
                    username: response.data.username,
                    user_id: response.data.userId, 
                    email: email,
                    status: true,
                });
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex justify-center items-center bg-gray-900">
                <div className="bg-[#1B1F36] p-8 rounded-xl shadow-lg w-full max-w-md">
                    <h1 className="text-3xl font-bold text-white mb-4 text-center">Linkup</h1>
                    <p className="text-gray-400 text-center mb-6">Sign into your account</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="form-group">
                            <input
                                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="email"
                                placeholder="Email address"
                                {...register('email', {
                                    required: 'Email is required',
                                })}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="form-group">
                            <input
                                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="password"
                                placeholder="Password"
                                {...register('password', {
                                    required: 'Password is required',
                                })}
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            Login
                        </button>
                    </form>

                    <p className="mt-4 text-center text-gray-400">
                        No account?{' '}
                        <Link to="/signup" className="text-blue-500 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

        </>
    );
};

export default Login;
