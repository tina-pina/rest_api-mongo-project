'use strict';

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    firstName: String,
    lastName: String,
    emailAddress: String,
    password: String
})

var CourseSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title: String,
    description: String,
    estimatedTime: String,
    materialsNeeded: String
})

const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);

module.exports.User = User;
module.exports.Course = Course;