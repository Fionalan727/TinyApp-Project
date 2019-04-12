var express = require("express");
var app = express();

var cookieParser = require('cookie-parser')

app.use(cookieParser())

var PORT = 8080; // default port 8080
app.set("view engine", "ejs");

//must before all the routes
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//create a random string as a special key to store the url from input 
//store into the urlDatabase
//to urls.show and show website information
app.post("/urls", (req, res) => {
  let newKey = generateRandomString()
  urlDatabase[newKey] = req.body.longURL;
  res.redirect(`/urls`);      
});

//http://localhost:8080/urls
app.get("/urls", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    urls: urlDatabase,
    email: (users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : users[req.cookies["user_id"]])
  };

  res.render("urls_index", templateVars);
});

//http://localhost:8080/urls/new
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render("urls_new",templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
  shortURL: req.params.shortURL, 
  longURL: urlDatabase[req.params.shortURL] 
};
  res.render("urls_show", templateVars);
});

app.get("/login", (req,res) =>{
  let templateVars = { 
    user_id: req.cookies["user_id"],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("url_login",templateVars)
})

app.get("/register",(req, res) =>{
  let templateVars = {user_id: req.cookies["user_id"]}
  res.render("registration_page",templateVars)
})

app.post("/register",(req, res) => {
  const emailInput = req.body.email
  const passwordInput = req.body.password
  const newKey = generateRandomString()
  users[newKey] = {}


  if(!emailInput || !passwordInput){
    res.status(400)
    res.send("please fill in the email/password")
  }else if(emailChecker(emailInput)){
    res.status(400)
    res.send("This email adress already exists")
  } else{
    users[newKey]["id"] = newKey
    users[newKey]["email"] = emailInput
    users[newKey]["password"] = passwordInput
  }
  res.cookie("user_id", users[newKey]["id"])
  console.log(users)
  res.redirect("/urls")
})


app.post("/login", (req, res) => {
  console.log(users)
  user = emailChecker(req.body.email)
  if(!user) {
    res.status(403)
    res.send("email does not exists! DNE!")
  }else if(req.body.password !== user.password) {
    res.status(403)
    res.send("password does not match,try again")
  }else{
  res.cookie("user_id", user["id"])
    res.redirect('/urls');

  }
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
})

//delete the urls 
//redirect /urls
app.post("/urls/:shortURL/delete",(req, res) => {

  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
})


//edit the url to add new long URL
//update the longurl to database and match with the original url
app.post("/urls/:shortURL/edit", (req,res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls")
})

//redirect to the actual page
//"/u/" is just a made up path so it doesn't conflict to the url
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  longURL
  ? res.redirect(longURL) 
  : res.send(`${req.params.shortURL} is not a valid short URL`);
});

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

//object used to store unique short url and long url
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
  });


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

