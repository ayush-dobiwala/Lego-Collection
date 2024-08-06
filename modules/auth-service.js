require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let Schema = mongoose.Schema;



// Define the user schema
let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let user;

// Initialize connection and User model
function initialize() {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection('mongodb+srv://ayushdobby:123@cluster0.rgnmqct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    db.on('error', (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once('open', () => {
      User = db.model("users", userSchema);
      resolve(); // resolve the promise once the connection is successful
    });
  });
}

// Register a new user
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    bcrypt.hash(userData.password, 10)
      .then(hash => {
        userData.password = hash;
        let newUser = new User(userData);

        newUser.save().then(() => {
          resolve();
        }).catch(err=>{
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject("There was an error creating the user: " + err);
            }
        });
      })
      .catch(err => {
        reject("There was an error encrypting the password");
      });
  });
}

// Check user credentials
function checkUser(userData) {
  return new Promise(function (resolve, reject) {
      User.find({userName: userData.userName}).exec().then((users) => {
          if (users.length == 0) {
              reject("Unable to find user: " + userData.userName);
          } else {
              bcrypt.compare(userData.password, users[0].password).then((res) => {
                  if (res == true) {
                      if (users[0].loginHistory.length == 8) {
                          users[0].loginHistory.pop();
                      }

                      users[0].loginHistory.unshift({dateTime: (new Date()).toString(), userAgent: userData.userAgent});

                      User.updateOne({ userName: users[0].userName},
                          {$set: {loginHistory: users[0].loginHistory}}
                      ).exec().then(() => {
                          resolve(users[0]);
                      }).catch((err) => {
                          reject("There was an error verifying the user: " + err);
                      });
                  } else {
                      reject("Incorrect password for user: " + userData.userName);
                  }
              });
          }
      }).catch((err) => {
          reject("Unable to find user: " + userData.userName);
      });
  });
};

module.exports = {initialize, registerUser, checkUser};