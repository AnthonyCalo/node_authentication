//jshint esversion:6
require("dotenv").config();
const express= require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
const alert = require("alert");
const md5 = require("md5");
const bcrypt = require("bcrypt");



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const saltRounds = 10;

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });
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
        let enteredPass = req.body.password;
        if(enteredPass===""){
            console.log("true");
            alert("Don't leave fields blank!");
            res.redirect("/login");
            
        }else{
        User.findOne({email: req.body.username}, function(err, foundUser){
            if(!err){
                bcrypt.compare(enteredPass, foundUser.password, function(err, results){
                    if(results===true){
                        console.log("Signed in succesfully")
                        res.render("secrets");
                    }else{
                        res.redirect("/login");
                    }
                })
                
              
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
        //bcrypt salt. copied from documentation
        bcrypt.hash(pass, saltRounds, function(err, hash){
            //Store hashi in your password DB
            let newUser = new User({
                email: email,
                password: hash
            });
            newUser.save(function(err){
                if(!err){
                console.log("User registered");
                res.render("secrets");
                }else{
                    console.log("There was an error registering: "+ err);
                    res.redirect('/');
                }
            });
        });


        
    })









app.listen(3000, function(){
    console.log("Server started on port 3000");
})




