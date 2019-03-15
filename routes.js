// 'use strict';

// var express = require("express");
// var router = express.Router();

// var bcryptjs = require('bcryptjs');

// // Models
// var User = require("./models").User;
// var Course = require("./models").Course;

// //check if valid user input like email
// //const { check, validationResult } = require('express-validator/check');

// //basic auth Authorization header
// const auth = require('basic-auth');

// //mongoose
// var mongoose = require('mongoose');

// //global variable
// let message = null;

// // Authentication 
// const authenticateUser = (req, res, next) => {
//     // Parse the user's credentials from the Authorization header.
//     const credentials = auth(req);

//     // If the user's credentials are available...
//     if (credentials) {
//         User.findOne({ emailAddress: credentials.name }, function (err, user) {

//             // If a user was successfully retrieved from the data store...
//             if (user) {
//                 const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

//                 if (authenticated) {
//                     req.currentUser = user;
//                 }
//                 else {
//                     message = `Authentication failure for username: ${user.emailAddress}`;
//                 }
//             }
//             else {
//                 message = `User not found for username: ${credentials.name}`;
//             }
//             return next()
//         });
//     }
//     else {
//         message = 'Auth header not found';
//     }

//     // If user authentication failed...
//     if (message) {
//         console.warn(message);

//         // Return a response with a 401 Unauthorized HTTP status code.
//         res.status(401).json({ message: 'Access Denied' });
//     } else {
//         next();
//     }
// }

// //get users

// router.get('/users', authenticateUser, (req, res) => {
//     // get and return the current user...
//     //const user = req.currentUser;
//     User.find({})
//         .exec(function (err, users) {
//             if (err) return next(err);
//             res.json(users);
//         });
// });

// // create new user

// router.post("/users", function (req, res, ) {
//     const user = new User({
//         firstName: req.body.firstName,
//         lastName: req.body.lastName,
//         emailAddress: req.body.emailAddress,
//         password: bcryptjs.hashSync(req.body.password),
//     });
//     user.save().then(result => {
//         console.log(result);
//         res.location('/api');
//         res.status(201).json('User Created!');
//     })
//         .catch(err => {
//             console.log(err);
//             res.status(400).json({ error: err });
//         });
// });


// //Returns a list of courses

// router.get("/courses", function (req, res, next) {
//     Course.find({})
//         //execute query and call callback function
//         .exec(function (err, courses) {
//             if (err) return next(err);
//             // send back to client
//             res.json(courses)
//         })
// })

// //Returns a the course (including the user that owns the course) for the provided course ID

// router.param("ID", function (req, res, next, id) {
//     Course.findById(id, function (err, doc) {
//         if (err) return next(err);
//         if (!doc) {
//             err = new Error("Not Found");
//             err.status = 404;
//             return next(err);
//         }
//         // res.json(doc);
//         req.course = doc;
//         //trigger next middleware
//         return next();
//     })
// })

// // Returns a course (including the user that owns the course) for the provided course ID
// router.get("/courses/:ID", function (req, res, next) {
//     //send document to client
//     res.json(req.course);
// })

// //Creates a course, sets the Location header to the URI for the course, and returns no content
// router.post("/courses", function (req, res, next) {
//     //question already loaded by param
//     //mongoose automatically creates document => to save: call save on question document
//     req.course.save(function (err, course) {
//         if (err) return next(err);
//         //document was successfully saved 
//         res.status(201)
//         //return document as json to the client
//         res.json(course)
//     })
// })

// //Updates a course and returns no content
// router.put("/courses/:ID", function (req, res, next) {

//     //req.course from router.param???
//     req.course.update(req.body, function (err, result) {
//         if (err) return next(err);
//         //send results in question document back to client
//         res.send(course)
//     });
// })

// //Deletes a course and returns no content
// router.delete("/courses/:ID", function (req, res) {
//     //remove method of mongoose
//     req.course.remove(function (err) {
//         res.json();
//     });
// })

// module.exports = router;



'use strict';

const express = require('express');
const router = express.Router();
const Course = require('./models').Course;
const User = require('./models').User;
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// Authentication Middleware
const authUser = (req, res, next) => {
    const credentials = auth(req); // get user inputs
    if (credentials.name && credentials.pass) {
        console.log(credentials)
        User.findOne({ emailAddress: credentials.name }, function (err, user) { // check db for email
            if (user) {
                const auth = bcryptjs.compareSync(credentials.pass, user.password); // compare hashed password & given password
                if (auth) {
                    console.log('USER AUTHORIZED') // if match
                    req.currentUser = user; // pass to next middleware

                } else {
                    // passwords not a match
                    err = new Error('Password');
                    err.status = 401;
                    res.status(err.status)
                        .json({ message: 'Access Denied: ' + err.message });
                    //next(err);
                }
            } else {
                // IF NO USER
                err = new Error('User not found');
                err.status = 401;
                res.status(err.status)
                    .json({ message: 'Access Denied: ' + err.message });
                //next(err);
            }
        })
    } else { // no creds
        const err = new Error('Missing user/password');
        err.status = 401;
        res.status(err.status)
            .json({ message: 'Access Denied: ' + err.message });
        //next(err);
    }
    next();
}; // end middleware



router.param("id", function (req, res, next, id) {
    Course.findById(id, function (err, doc) {
        if (err) return next(err);
        if (!doc) {
            err = new Error("Not Found");
            err.status = 404;
            return next(err)
        }
        req.course = doc;
        return next();
    })
        .populate('user')
});



// GET USERS - working
router.get('/users', authUser, (req, res, next) => {
    /// this block replaced authUser block
    User.find({})
        .exec(function (err) {
            if (err) return next(err);
            res.json(req.currentUser)
        });
});

// POST USERS - working validation complete
router.post('/users', (req, res, next) => {
    const user = new User(req.body);

    if (user.password) {
        // hash new user password
        user.password = bcryptjs.hashSync(user.password);
    };

    user.save(function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.location('/');
        // set status to 201 created
        res.sendStatus(201);

    });
});

// GET COURSES - working
router.get('/courses', (req, res, next) => {
    Course.find({}, { title: true, description: true, user: true })
        .populate('user')
        .exec(function (err, courses) {
            if (err) return next(err);
            res.json(courses)
        });
});

// GET COURSES:id - working
router.get('/courses/:id', (req, res, next) => {
    res.json(req.course)
});

// POST COURSES - working and valid
router.post('/courses', authUser, (req, res, next) => {

    const newCourse = new Course({
        //user: req.currentUser._id, // <---- should hold user id
        user: req.body.user,
        title: req.body.title,
        description: req.body.description,
        estimatedTime: req.body.estimatedTime,
        materialsNeeded: req.body.materialsNeeded,
    });

    const course = new Course(newCourse);
    course.save(function (err) {
        if (err) return next(err);
        else {
            res.location('/' + course.id)
            res.sendStatus(201)
        };
    });
});

// PUT COURSES:id - working and valid 
router.put('/courses/:id', authUser, (req, res) => {
    req.course.update(req.body, function (err) {
        if (err) return res.status(400).json({ errors: err.message });
        res.sendStatus(204);
    });
});

// DELETE COURSES - working
router.delete('/courses/:id', authUser, (req, res) => {
    req.course.remove(function (err) {
        req.course.save(function (err, course) {
            if (err) return next(err);
            res.sendStatus(204)
        });
    });
});

module.exports = router;