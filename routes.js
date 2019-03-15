'use strict';

var express = require("express");
var router = express.Router();

// Models
var User = require("./models").User;
var Course = require("./models").Course;

//check if valid user input like email
const { check, validationResult } = require('express-validator/check');

//password hashing
const bcryptjs = require('bcryptjs');

//basic auth Authorization header
const auth = require('basic-auth');


// start user routes
router.post('/users', [
    check('firstName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "last Name"'),
    check('lastName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "first Name"'),
    check('emailAddress')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "email"'),
    check('password')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "password"'),
], (req, res) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);

        // Return the validation errors to the client.
        return res.status(400).json({ errors: errorMessages });
    }

    // Get the user from the request body.
    var user = new User(req.body);

    let message;
    // Authentication 
    const authenticateUser = (req, res, next) => {
        // Parse the user's credentials from the Authorization header.
        const credentials = auth(req);

        // If the user's credentials are available...
        if (credentials) {
            // Attempt to retrieve the user from the database
            // by their email (i.e. the user's "username"
            // from the Authorization header).

            // let user = User.findOne(u => u.emailAddress === credentials.name)
            // console.log(user)
            User.findOne({ emailAddress: credentials.name }, function (err, user) {

                //                 // If a user was successfully retrieved from the data store...
                //                 if (user) {
                //                     // Use the bcryptjs npm package to compare the user's password
                //                     // (from the Authorization header) to the user's password
                //                     // that was retrieved from the data store.
                //                     const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

                //                     // If the passwords matcsh...
                //                     if (authenticated) {
                //                         // Then store the retrieved user object on the request object
                //                         // so any middleware functions that follow this middleware function
                //                         // will have access to the user's information.
                //                         req.currentUser = user;

                //                     }
                //                     else {
                //                         message = `Authentication failure for username: ${user.emailAddress}`;
                //                     }
                //                 }
                //                 else {
                //                     message = `User not found for username: ${credentials.name}`;
                //                 }
                //                 return next()

            });



        }
        else {
            message = 'Auth header not found';
        }

        // If user authentication failed...
        if (message) {
            console.warn(message);

            // Return a response with a 401 Unauthorized HTTP status code.
            res.status(401).json({ message: 'Access Denied' });
        } else {
            // Or if user authentication succeeded...
            // Call the next() method.
            next();
        }
    }

    router.get('/users', authenticateUser, (req, res) => {
        // get and return the current user...
        const user = req.currentUser;

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
        });
    });

    //hash the user's password before the user is added to the users array

    user.password = bcryptjs.hashSync(user.password);

    // Add the user to the database

    user.save(function (err, user) {
        if (err) return next(err);
        //return document as json to the client
        res.location('/')
        res.status(201)
        res.json(user)
    })
});

// end user routes


// start courses routes

//Returns a list of courses

router.get("/courses", function (req, res, next) {
    Course.find({})
        //execute query and call callback function
        .exec(function (err, courses) {
            if (err) return next(err);
            // send back to client
            res.json(courses)
        })
})

//Returns a the course (including the user that owns the course) for the provided course ID

router.param("ID", function (req, res, next, id) {
    Course.findById(id, function (err, doc) {
        if (err) return next(err);
        if (!doc) {
            err = new Error("Not Found");
            err.status = 404;
            return next(err);
        }
        // res.json(doc);
        req.course = doc;
        //trigger next middleware
        return next();
    })
})

// Returns a course (including the user that owns the course) for the provided course ID
router.get("/courses/:ID", function (req, res, next) {
    //send document to client
    res.json(req.course);
})

//Creates a course, sets the Location header to the URI for the course, and returns no content
router.post("/courses", function (req, res, next) {
    //question already loaded by param
    //mongoose automatically creates document => to save: call save on question document
    req.course.save(function (err, course) {
        if (err) return next(err);
        //document was successfully saved 
        res.status(201)
        //return document as json to the client
        res.json(course)
    })
})

//Updates a course and returns no content
router.put("/courses/:ID", function (req, res, next) {

    //req.course from router.param???
    req.course.update(req.body, function (err, result) {
        if (err) return next(err);
        //send results in question document back to client
        res.send(course)
    });
})

//Deletes a course and returns no content
router.delete("/courses/:ID", function (req, res) {
    //remove method of mongoose
    req.course.remove(function (err) {
        res.json();
    });
})

module.exports = router;