require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const session = require('express-session');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;
const PASSWORD = process.env.DASHBOARD_PASSWORD || 'changeme123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// auth middleware
function requireAuth(req, res, next) {
  if (req.session.authed) return next();
  res.redirect('/login');
}

// login page
app.get('/login', (req, res) => {
  if (req.session.authed) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.authed = true;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// main dashboard
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// api routes
app.use('/api', requireAuth, apiRoutes);

app.listen(PORT, () => {
  console.log(`[Dashboard] running at http://localhost:${PORT}`);
  console.log(`[Dashboard] password is set in .env (DASHBOARD_PASSWORD)`);
});
