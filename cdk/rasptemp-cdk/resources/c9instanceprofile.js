const AWS = require('aws-sdk');\n
 const response = require('cfn-response');\n
 const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});\n\n
 exports.handler = async function(event, context) {\n
 console.log(JSON.stringify(event,null,2));\n
 var paramsa = {\n
 Filters: [\n
 {\n
 Name: 'tag:project', \n
 Values: [\n
 'rasptemp'\n
 ]\n
 }\n
 ]\n
 };\n
 const c9instance = await ec2.describeInstances(paramsa, function(err, data) {\n
 if (err) console.log(err, err.stack);\n
 else     {\n
  var instanceId = JSON.stringify(data.Reservations[0].Instances[0].InstanceId,null,2);\n
  console.log("c9instance logs: ", instanceId);\n
  return instanceId;\n
 }\n
 }).promise();\n
 var instid = JSON.stringify(c9instance.Reservations[0].Instances[0].InstanceId,null,2);\n
 console.log("instid: ",instid.split('\"')[1]);\n
 var paramsb = {\n
 IamInstanceProfile: {\n
 Name: 'AmazonEC2RoleforSSM'\n
 }, \n
 InstanceId: instid.toString().split('\"')[1]\n
 };\n
 await ec2.associateIamInstanceProfile(paramsb, function(err, data) { if (err) {\n
 console.log(err, err.stack);\n
 response.send(event, context, 'FAILED', {});\n
 } else {\n
 console.log(data);\n
 response.send(event, context, 'SUCCESS', {});\n
 }\n
 }).promise();\n
 };\n
