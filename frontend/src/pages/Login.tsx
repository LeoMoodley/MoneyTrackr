import React, { useState } from 'react';
import { Wallet, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FormType = 'login' | 'signup' | 'reset';

function Login() {
  const [formType, setFormType] = useState<FormType>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  // const [token, setToken] = useState(null);

  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(formType == "signup") {
      if(formData.password != formData.confirmPassword) {
        return;
      }

      const response = await fetch('https://api.moneytrackr.ca/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log(response);
      const data = await response.json();
      
      if (response.ok) {
        alert('Account created successfully');
        // setToken(data.access);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // You can then redirect or log in the user
        navigate('/dashboard');  // Programmatically navigate to the dashboard page
      } else {
        alert(data.error || 'Something went wrong');
      }
    } else if(formType == "login") {
      const response = await fetch('https://api.moneytrackr.ca/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.email, password: formData.password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // setToken(data.access);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        console.log('Logged in successfully!');
        navigate('/dashboard');  // Programmatically navigate to the dashboard page
      } else {
        alert('Login failed');
      }
    } else if(formType == "reset") {
      const response = await fetch('https://api.moneytrackr.ca/api/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const renderForm = () => {
    switch (formType) {
      case 'reset':
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Reset Password</h2>
              <p className="text-gray-600 mt-2">
                Enter your email address to receive a password reset link
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Send Reset Link
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setFormType('login')}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          </>
        );
      
      case 'signup':
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Create Account</h2>
              <p className="text-gray-600 mt-2">Sign up to start tracking your finances</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div> */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Sign Up
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setFormType('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>
          </>
        );

      default: // login
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Welcome!</h2>
              <p className="text-gray-600 mt-2">Enter your credentials to access your account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setFormType('reset')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Sign In
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setFormType('signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Wallet className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">MoneyTrackr</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}

export default Login;
