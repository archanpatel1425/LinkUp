// utils/cookies.js

const jwt = require('jsonwebtoken');

exports.setTokens = (res, user) => {
  const accessToken = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '2h' });
  const refreshToken = jwt.sign({ id: user.user_id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });


  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken };
};

exports.clearTokens = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};