/*
 * This file is for action in course service, including CRUD
 */
var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var qs = require('querystring');
var log = require('./../utils/logMessage');

var serviceType = 'K12';
var tableName = "K12";

// handle create a new student
exports.createStudent = function(req, res) {
    //console.log("In createStudent function");

    // get content from body
    var body = '';
    var uni = req.params.uni;

    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    // handle operations
    req.on('end', function () {
        // get parameters
        //params.LastName = [];
        //params.FirstName = [];
        //params.IQ = [];
        //params.ShoeSize = [];
        //params.SSN = [];
        var params = qs.parse(body);
        params.uni = uni;
        params.operation = log.ADD_STUDENT;

        console.log(params);

        // create new student
        insertStudent(res, params);
    });
};

// handle delete an existing student
exports.deleteStudent = function(req, res) {
    // define parameters
    var params = new Object();
    params.uni = req.params.uni;
    params.operation = log.DELETE_STUDENT;


    console.log(params);
    deleteStudent(res, params);
};

// handle read student information
exports.readStudent = function(req, res) {
    // define parameters
    var params = new Object();
    params.uni = req.params.uni;
    params.operation = log.READ_STUDENT;

    console.log(params);
    getStudent(res, params);
};

// handle update student information
exports.updateStudent = function(req, res) {
    // get content from body
    var body = '';
    var uni = req.params.uni;

    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    // handle operations
    req.on('end', function () {
        // get parameters
        var params = qs.parse(body);
        params.operation = log.UPDATE_STUDENT;
        params.uni = uni;

        console.log(params);

        // update student
        updateStudent(res, params);
    });
};

// function: insert a student entry
function insertStudent(res, params) {
    // define response object
    var response = new Object();
    var uni = params.uni;
    console.log("In insertStudent function");
    //parse parameters
    var FirstName = params.FirstName;
    var LastName = params.LastName;
    var SSN = params.SSN;
    var IQ = params.IQ;
    var ShoeSize = params.ShoeSize;
    if(typeof FirstName == 'undefined' ){
        FirstName = "NULL";
    }
    if(typeof LastName == 'undefined' ){
        LastName = "NULL";
    }
    if(typeof SSN == 'undefined' ){
        SSN = "NULL";
    }
    if(typeof IQ == 'undefined' ){
        IQ = "NULL";
    }
    if(typeof ShoeSize == 'undefined' ){
        ShoeSize = "NULL";
    }

        console.log(ShoeSize);

    //check for duplicate
    var paramsDuplicate = {
        TableName : tableName,
        ProjectionExpression:"#uni",
        KeyConditionExpression: "#uni = :uni",
        ExpressionAttributeNames:{
            "#uni": "uni"
        },
        ExpressionAttributeValues: {
            ":uni": uni
        }
    };
    dynamodbDoc.query(paramsDuplicate, function(err, data) {
        if (err) {
            //query failed
            response.status = "failed";
            response.message = JSON.stringify(err, null, 2);
            res.send(response);
        } else {
            //check duo query succeed
            if(data.Items == ""){
                // no duplication. safe to create
                var params = {
                    TableName: tableName,
                    Item: {
                        "uni":  uni,
                        "LastName": LastName,
                        "FirstName": FirstName,
                        "IQ": IQ,
                        "SSN": SSN,
                        "ShoeSize": ShoeSize
                    }
                };
                console.log("No dup, safe to add student: "+"student ["+ uni + "] " + LastName + " "+ FirstName);

                dynamodbDoc.put(params, function(err, result) {
                    if (err) {
                        //query failed
                        console.log("query failed:"+JSON.stringify(err, null, 2));
                        response.status = "failed";
                        response.message = JSON.stringify(err, null, 2);
                        res.send(response);
                    } else {
                        // add student query succeed
                        response.status = "succeed";
                        response.message = "student ["+ uni + "] " + LastName +" added";

                        // log operation
                        log.logMsg(JSON.stringify(params)+"\n", serviceType);

                        // send back message
                        res.send(response);
                    }
                });

            }
            else{
                // exist conflicts
                response.status = "failed";
                response.message = "uni existed";
                // send back message
                res.send(response);

            }

        }
    });
}

// function: get student information
function getStudent(res, params) {
    // define response
    var response = new Object();

    var uni = params.uni;
    if(params.uni == "all") {
        // get all cids
        var params = {
            TableName : tableName
        };

        dynamodbDoc.scan(params, function(err, results) {
            if(err) {
                response.status = "failed";
                console.log("query failed"+JSON.stringify(err, null, 2));
                response.message = JSON.stringify(err, null, 2);
            } else {
                response.status = "succeed";
                response.message = "list all students uni";
                console.log("succeed! list all students");
                response.body = results;
            }

            // log operation
            log.logMsg(JSON.stringify(params) + "\n");
            // send back message
            res.send(response);
        });
    } else {
        // get information according to uni
        var params = {
            TableName : tableName,
            KeyConditionExpression: "#uni = :uni",
            ExpressionAttributeNames:{
                "#uni": "uni"
            },
            ExpressionAttributeValues: {
                ":uni": uni
            }
        };
        dynamodbDoc.query(params, function(err, data) {
            if(err) {
                response.status = "failed";
                response.message = JSON.stringify(err, null, 2);

            }
            else{
                if (data.Items=="") {
                    response.status = "failed";
                    response.message = "no student match your request";
                    console.log("no student match your request");

                    // log history
                    log.logMsg(JSON.stringify(params) + "\n", serviceType);

                } else {
                    console.log("succeed! list the info of student: ["+uni+"]");
                    response.status = "succeed";
                    response.message = " Student:["+uni + "] found";
                    response.body = data;
                    // log history
                    log.logMsg(JSON.stringify(params) + "\n", serviceType);
                }
            }
            // send back response
            res.send(response)
        });


    }
}

// function: delete an existing student
function deleteStudent(res, params) {
    var response = new Object();
    var uni = params.uni;

    var paramsIfExist = {
        TableName: tableName,
        ProjectionExpression: "#uni",
        KeyConditionExpression: "#uni = :uni",
        ExpressionAttributeNames: {
            "#uni": "uni"
        },
        ExpressionAttributeValues: {
            ":uni": uni
        }
    };
    dynamodbDoc.query(paramsIfExist, function (err, data) {
        if (err) {
            //query failed
            response.status = "failed";
            response.message = JSON.stringify(err, null, 2);
            res.send(response);
        } else {
            //query succeed
            if (data.Items == "") {
                response.status = "failed";
                response.message = "no student match your request";
                // send back response
                res.send(response);
            }
            else {
                console.log("Safe to delete student: [" + uni + "] ");
                var params = {
                    TableName: tableName,
                    Key: {
                        "uni": uni
                    }
                };
                dynamodbDoc.delete(params, function (err, data) {
                    if (err) {
                        response.status = "failed";
                        response.message = JSON.stringify(err, null, 2);
                        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        return;
                    } else {
                        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        response.status = "succeed";
                        response.message = "student " + uni + " removed";
                        // log history
                        log.logMsg(JSON.stringify(params) + "\n", serviceType);
                    }
                    // send back response
                    res.send(response);
                });
            }
        }
    });
}



// function: update student
function updateStudent(res, params) {
    var uni = params['uni'];
    var fieldParams = new Object();
    var response = new Object();

    // build query
    for(var key in params) {
        if(key != 'uni' && key != 'operation' && key != 'oldParam') {
            fieldParams[key] = params[key];
        }
    }
    var paramsIfExist = {
        TableName: tableName,
        ProjectionExpression: "#uni",
        KeyConditionExpression: "#uni = :uni",
        ExpressionAttributeNames: {
            "#uni": "uni"
        },
        ExpressionAttributeValues: {
            ":uni": uni
        }
    };
    dynamodbDoc.query(paramsIfExist, function (err, data) {
        if (err) {
            //query failed
            response.status = "failed";
            response.message = JSON.stringify(err, null, 2);
            res.send(response);
        } else {
            //query succeed
            if (data.Items == "") {
                response.status = "failed";
                response.message = "no student match your request";
                // send back response
                res.send(response);
            }
            else {
                console.log("Safe to update student: [" + uni + "] ");
                for(var key in fieldParams) {

                    var params = {
                        TableName: tableName,
                        Key: {
                            "uni": uni
                        },
                        UpdateExpression: "set " + key + "  = :keyValue ",

                        ExpressionAttributeValues: {
                            ":keyValue": fieldParams[key]
                        },
                        ReturnValues: "UPDATED_NEW"
                    }
                    dynamodbDoc.update(params, function (err, data) {
                        if (err) {
                            response.status = "failed";
                            response.message = JSON.stringify(err, null, 2);
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                            return;
                        }
                    });
                };

                console.log("update item succeeded");
                response.status = "succeed";
                response.message = "student " + uni + " updated";
                // log history
                log.logMsg(JSON.stringify(params) + "\n", serviceType);
                //send back response
                res.send(response);

            }
        }
    });
}