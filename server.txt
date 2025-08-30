// server.js
const express = require('express');
const axios = require('axios');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace these with your GitHub OAuth app credentials
const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';
const CALLBACK_URL = 'http://localhost:3000/auth/github/callback';

// Simple session setup
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}));

// Route to start GitHub OAuth
app.get('/auth/github', (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user`;
  res.redirect(redirectUrl);
});

// GitHub OAuth callback
app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    req.session.token = accessToken;

    // Fetch user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const user = userResponse.data;
    res.send(`<h1>Hello, ${user.login}!</h1><p>ID: ${user.id}</p>`);
  } catch (err) {
    console.error(err);
    res.send('Error during authentication');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
