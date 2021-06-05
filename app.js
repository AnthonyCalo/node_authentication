//jshint esversion:6
require("dotenv").config();
const express= require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
var GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();

const CallBackURL = "http://localhost:3000/auth/google/secrets";

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

//would use environment variables for secret if in production environment
app.use(session({
    secret: "I'm built different.",
    resave: false,
    saveUninitialized: true
}));

//middle ware required to initialize passport
app.use(passport.initialize());
//session is required to have a persisent login sesion
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  //accessToken is what lets me get data of user from google. profile contains the info. 
  function(accessToken, refreshToken, profile, cb) {
    //console.log("HER!!!: " + profile.id);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//connect to userDB
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//Simplified passport/ passport-local configuration. copied from passport-local-mongoose documentation @ npmjs.com 
passport.use(User.createStrategy());

//copied from  passportJS docs. This will work with every strategy for serializing/ deserializing users
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get('/', function(req, res){
    res.render("home");
})

app.route("/login")
    .get(function(req, res){
    res.render("login");
    })
    .post(function(req, res){
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        //req.login method comes from passport
        req.login(user, function(err){
            if(err){
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");                    
                })
            }
        });
    })


app.route("/register")
    .get(function(req, res){
    res.render("register");
    })
    .post(function(req, res){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(!err){
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");                    
                })
            }else{
                console.log(err);
                res.redirect("/login");
            }
        })

    })

//use passport to authenticate  with google strategy. scope is what we are getting from google. THe user profile
app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

//callbackURL from line 37. where google sends user after authentication
//app.get('path', middleware, function(req, res))
app.get("/auth/google/secrets", 
    passport.authenticate('google', {failureRedirect: '/login'}), function(req, res){
        res.redirect("/secrets");
})

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    //all thats needed to logout is .logout method from passport
    req.logout();
    res.redirect("/");
})








app.listen(3000, function(){
    console.log("Server started on port 3000");
})




