const express = require("express");
const cookieSession = require('cookie-session')
const app = express();
const bcrypt = require('bcrypt');

app.use(cookieSession({
  name: 'session',
  keys: ["kneel!!!!!!!!!!"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



const PORT = 8080; 
app.set("view engine", "ejs");

//must before all the routes
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


//store and access the users in the app
const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}



const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

app.listen(PORT, () => {
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
  });


app.get("/", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login")
  } else {
    let templateVars = {
      'user_id': user_id,
      "urls": urlsForUser(user_id),
      "email": (users[user_id] ? users[user_id].email : users[user_id])
    };
    res.render("urls_index", templateVars);
  }
});

//check if user is logged in , if the user is logged in they can change their code only
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login")
  } else {
    let templateVars = {
      'user_id': user_id,
      "urls": urlsForUser(user_id),
      "email": (users[user_id] ? users[user_id].email : users[user_id])
    };
    res.render("urls_index", templateVars);
  }

});

//endpoint of login page
app.get("/login", (req,res) =>{
  let templateVars = { 
    user_id: req.session.user_id,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    email: (users[req.session.user_id] ? users[req.session.user_id].email : users[req.session.user_id])
  };
  res.render("url_login",templateVars);
})

//endpoint for register page
app.get("/register",(req, res) =>{
  let templateVars = {
    user_id: req.session.user_id,
    email: (users[req.session.user_id] ? users[req.session.user_id].email : users[req.session.user_id])
  }
  res.render("registration_page",templateVars);
});

//only logged in user can create new urls
app.get("/urls/new", (req, res) => {
 
  if(req.session.user_id){
    let templateVars = {
      user_id: req.session.user_id,
      email: (users[req.session.user_id] ? users[req.session.user_id].email : users[req.session.user_id])

    };
    res.render("urls_new",templateVars);
  } else{
    res.redirect("/urls")
  }
});

//check user logged in or not, if yes they can update their urls
app.get("/urls/:shortURL", (req, res) => {
  if(req.session.user_id){
    let templateVars = { 
    user_id: req.session.user_id,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    email: (users[req.session.user_id] ? users[req.session.user_id].email : users[req.session.user_id])
    };
    res.render("urls_show", templateVars);
  }else{
    res.redirect("/login")
  }
});

//redirect to the actual page
//"/u/" is just a made up path so it doesn't conflict to the url
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  let longURL = url && url.longURL;
  
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send(`${req.params.shortURL} is not a valid short URL`);
  };
});


//created random id and use it as a key to store user input information to url database
app.post("/urls", (req, res) => {
  let newKey = generateRandomString()
  urlDatabase[newKey] = {};
  urlDatabase[newKey]['longURL'] = req.body.longURL;
  urlDatabase[newKey]['userID'] = req.session.user_id;
  
  res.redirect(`/urls`);      
});

//make sure user fullfill register requirement 
app.post("/register",(req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  const newUserID = generateRandomString();
  users[newUserID] = {};


  if(!emailInput || !passwordInput){
    res.status(400)
    res.send("please fill in the email/password")
  }else if(emailChecker(emailInput)){
    res.status(400)
    res.send("This email address already exists")
  } else{
    users[newUserID]["id"] = newUserID
    users[newUserID]["email"] = emailInput
    users[newUserID]["password"] = hasher(passwordInput); 
    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
})

//check login requirement
app.post("/login", (req, res) => {
  const user = emailChecker(req.body.email)
  if(!user) {
    res.status(403)
    res.send("email does not exists! DNE!")
  }else if(!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403)
    res.send("password does not match,try again")
  }else{
    req.session.user_id = user["id"];
    res.redirect('/urls');

  }
})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls")
})

//check login or not , if yes,user able to delete their own urls
app.post("/urls/:shortURL/delete",(req, res) => {
  if(req.session.user_id){
    delete urlDatabase[req.params.shortURL]
    res.redirect("/urls")
  }else{
    res.redirect("/login")
  }
  
})


//edit the url to add new long URL
//update the longurl to database and match with the original url
app.post("/urls/:shortURL/edit", (req,res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  const cookieUserId = req.session.user_id;
  if (!cookieUserId) {
    res.send("Please login first")
  }
  res.redirect("/urls")
})


//check if user's input email is match with the emails saved in database
function emailChecker (email){
  for (id in users) {
    if (email === users[id].email){
      return users[id]
    } 
  }
  return false;
}
//generate an random and unique 6 digit alphanumeric string
function generateRandomString() {
  var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * 6));
  }
  return text;
}

//find the urls made by  current user only
function urlsForUser(id){
  let result = {};
  for(let shortURL in urlDatabase){
    
    if(urlDatabase[shortURL].userID === id){
      result[shortURL] = urlDatabase[shortURL];
    }
  }
  return result;
}

function hasher(password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
}