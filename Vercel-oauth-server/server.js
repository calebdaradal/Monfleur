import express from "express";
import fetch from "node-fetch";

const app = express();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// Step 1: Redirect user to GitHub OAuth
app.get("/auth", (req, res) => {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=repo,user`;
  res.redirect(redirect);
});

// Step 2: GitHub calls back with code → exchange for token
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: CALLBACK_URL,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ error: data.error_description });
  }

  // Send token to Decap CMS
  res.json({
    token: data.access_token,
    provider: "github",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth server running at http://localhost:${PORT}`);
});
