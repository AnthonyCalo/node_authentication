//jshint esversion:6
require("dotenv").config();
const express= require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const alert = require("alert");



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

console.log(process.env.SECRET);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });
////Encrypts when you call save()
//decrypts when called find()

const User = new mongoose.model("User", userSchema);

app.get('/', function(req, res){
    res.render("home");
})

app.route("/login")
    .get(function(req, res){
    res.render("login");
    })
    .post(function(req, res){
        if(req.body.password===""){
            console.log("true");
            alert("Don't leave fields blank!");
            res.redirect("/login");
            
        }else{
        User.findOne({email: req.body.username}, function(err, foundUser){
            if(!err){
                if(foundUser.password===req.body.password){
                    console.log("Signed in succesfully")
                    res.render("secrets");
                }
                else{
                    res.send("wrong password Dumb Dumb");
                }
            }
        })
        }
    })


app.route("/register")
    .get(function(req, res){
    res.render("register");
    })
    .post(function(req, res){
        const email = req.body.username;
        const pass = req.body.password;
        let newUser = new User({
            email: email,
            password: pass
        });
        newUser.save(function(err){
            if(!err){
            console.log("User registered");
            res.render("secrets")
            }else{
                console.log("There was an error registering: "+ err);
                res.redirect('/');
            }
        });
    })









app.listen(3000, function(){
    console.log("Server started on port 3000");
})




