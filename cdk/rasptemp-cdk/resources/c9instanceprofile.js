const AWS = require('aws-sdk');
 const response = require('cfn-response');
 const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
 exports.handler = async function(event, context) {
 console.log(JSON.stringify(event,null,2));
 var paramsa = {
 Filters: [
 {
 Name: 'tag:project', 
 Values: [
 'rasptemp'
 ]
 }
 ]
 };
 const c9instance = await ec2.describeInstances(paramsa, function(err, data) {
 if (err) console.log(err, err.stack);
 else     {
  var instanceId = JSON.stringify(data.Reservations[0].Instances[0].InstanceId,null,2);
  console.log("c9instance logs: ", instanceId);
  return instanceId;
 }
 }).promise();
 var instid = JSON.stringify(c9instance.Reservations[0].Instances[0].InstanceId,null,2);
 console.log("instid: ",instid.split('\"')[1]);
 var paramsb = {
 IamInstanceProfile: {
 Name: 'AmazonEC2RoleforSSM'
 }, 
 InstanceId: instid.toString().split('\"')[1]
 };
 await ec2.associateIamInstanceProfile(paramsb, function(err, data) { if (err) {
 console.log(err, err.stack);
 response.send(event, context, 'FAILED', {});
 } else {
 console.log(data);
 response.send(event, context, 'SUCCESS', {});
 }
 }).promise();
 };
