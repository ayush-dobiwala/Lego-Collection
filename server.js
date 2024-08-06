/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Ayush Dobiwala
*  Student ID: 152879227      
*  Date: 26th July, 2024
*
*  Published URL: lego-collection-ashy.vercel.app
********************************************************************************/

require("pg");
var path = require("path");
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const express = require("express");
const clientSessions = require("client-sessions");
const app = express();
const Sequelize = require('sequelize');

const HTTP_PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configure client-sessions middleware
app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'web322_a6_AYUSH_o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 10 * 60 * 1000, // duration of the session in milliseconds (10 minutes)
    activeDuration: 1000 * 600, // the session will be extended by this many ms each request (10 minutes)
  })
);

// Middleware to add session object to all templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Ensure user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get("/lego/sets", async (req, res) => {
  const theme = req.query.theme;
  try {
    if (theme) {
      const legoSetsByTheme = await legoData.getSetsByTheme(theme);
      if (legoSetsByTheme.length > 0) {
        res.render("sets", { sets: legoSetsByTheme });
      } else {
        res.status(404).render("404", { message: "I'm sorry, there are no sets with that theme." });
      }
    } else {
      const sets = await legoData.getAllSets();
      res.render("sets", { sets: sets });
    }
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/lego/sets/:id", async (req, res) => {
  try {
    const setNumber = req.params.id;
    const set = await legoData.getSetByNum(setNumber);
    res.render("set", { set: set });
  } catch (err) {
    res.status(404).render("404", { message: "I'm sorry, we can't find that set." });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { errorMessage: '', userName: '' });
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/lego/sets');
    })
    .catch((err) => res.render('login', { errorMessage: err, userName: req.body.userName }));
});

app.get('/register', (req, res) => {
  res.render('register', { successMessage: '', errorMessage: '', userName: '' });
});

app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => res.render('register', { successMessage: 'User created', errorMessage: '', userName: '' }))
    .catch((err) => res.render('register', { successMessage: '', errorMessage: err, userName: req.body.userName }));
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.get('/lego/addSet', ensureLogin, async (req, res) => {
    let themes = await legoData.getAllThemes();
    res.render('addSet', { themes: themes });
});

app.post('/lego/addSet', ensureLogin, async(req, res) => {
  try{
    await legoData.addSet(req.body)
    res.redirect('/lego/sets');
  }catch(err) {
   res.render('500', { message: `Error: ${err}` });
  }
});

app.get('/lego/editSet/:num', ensureLogin, async (req, res) => {
  try {
    const setNum = req.params.num;
    const [setData, themeData] = await Promise.all([
      legoData.getSetByNum(setNum),
      legoData.getAllThemes()
    ]);
    res.render('editSet', { set: setData, themes: themeData });
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});

app.post('/lego/editSet', ensureLogin, (req, res) => {
  legoData.editSet(req.body.set_num, req.body)
    .then(() => res.redirect('/lego/sets'))
    .catch((err) => res.render('500', { message: `Error: ${err}` }));
});

app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
  legoData.deleteSet(req.params.num)
    .then(() => res.redirect('/lego/sets'))
    .catch((err) => res.render('500', { message: `Error: ${err}` }));
});

app.use((req, res) => {
  res.status(404).render("404", { message: "I'm sorry, we can't find the page you're looking for." });
});

// Initialize and start server
legoData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Unable to start server: ${err}`);
  });
