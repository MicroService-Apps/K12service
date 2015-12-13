/*
 * This file define the method for logging
 */

var path = require('path');
var fs = require('fs');

// define operations
exports.ADD_STUDENT = "add a new student";
exports.READ_STUDENT = "read an existing student";
exports.DELETE_STUDENT = "delete an existing student";
exports.UPDATE_STUDENT = "update an existing student";
exports.ADD_COURSE_INTO_STUDENT = "add a course into a student";
exports.DELETE_COURSE_FROM_STUDENT = "delete a course from a student";
exports.ADD_FIELD = "add a new field";
exports.DELETE_FIELD = "delete an field";

// log message depending on different service
exports.logMsg = function(string, service){
    var logPath = path.join(path.dirname(__dirname),'log/' + service + '.log');

    fs.appendFile(logPath, string, function (err) {
        if (err) throw err;
    });
};
