const AWS = require('aws-sdk');
 const response = require('cfn-response');
 const docClient = new AWS.DynamoDB.DocumentClient();
 exports.handler = function(event, context) {
 console.log(JSON.stringify(event,null,2));
 var params = {
 TableName: 'deviceInfo',
 Item:{
 'serialNumber': '1234567890',
 'deviceToken' : 'awsfor2021'
 }
 };
 docClient.put(params, function(err, data) { if (err) {
 response.send(event, context, 'FAILED', {});
 } else {
 response.send(event, context, 'SUCCESS', {});
 }
 });
 }
