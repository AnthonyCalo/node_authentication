//jshint esversion:6
require("dotenv").config();
const express= require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();

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

//connect to userDB
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//Simplified passport/ passport-local configuration. copied from passport-local-mongoose documentation @ npmjs.com 
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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




