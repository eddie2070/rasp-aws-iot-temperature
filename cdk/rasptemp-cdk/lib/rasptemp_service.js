const core = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const timestream = require("@aws-cdk/aws-timestream");
//const s3 = require("@aws-cdk/aws-s3");
const iam = require("@aws-cdk/aws-iam");
const iot = require("@aws-cdk/aws-iot");
const cloud9 = require("@aws-cdk/aws-cloud9");
const ssm = require("@aws-cdk/aws-ssm");
const custom = require("@aws-cdk/custom-resources");


class RaspService extends core.Construct {
  constructor(scope, id) {
    super(scope, id);

    //const masterOrgAccountID = new core.CfnParameter(this, "masterOrgAccountID", {
    //  type: "String",
    //  description: "The ID of the AWS Organizations master account."});

    const timestreamdb = new timestream.CfnDatabase(this, "RaspTemperature", {
      databaseName: "RaspTemperature",
      kmsKeyId: "a764aee9-70e7-412e-a1ee-aa7fd93547c1"
    })

    const timestreamtable = new timestream.CfnTable(this, "location1", {
      databaseName: "RaspTemperature",
      tableName: "location1",
      retentionProperties: {
        "MemoryStoreRetentionPeriodInHours": "24",
        "MagneticStoreRetentionPeriodInDays": "2555"
      }
    })

    timestreamtable.node.addDependency(timestreamdb);

    const lambdamomentlayer = new lambda.LayerVersion(this, "moment-tz-layer", {
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      code: lambda.Code.asset("resources"),
      /*       content: {
              s3Bucket: "20180302pdfparse",
              s3Key: "moment-layer.zip"
          }, */
      description: 'A layer with moment timezone',
    })

    const handler = new lambda.Function(this, "requestTemperatureFromRasp", {
      runtime: lambda.Runtime.NODEJS_12_X, //
      code: lambda.Code.asset("resources"),
      handler: "requestTemp.handler",
      environment: {
        //BUCKET: bucket.bucketName
      },
      layers: [lambdamomentlayer]
    });

    // handler.addToRolePolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     "timestream:*"
    // ],
    //   resources: [ 'arn:aws:timestream:*:753451452012:database/RaspTemperature/table/location1' ]
    // }));
    //bucket.grantReadWrite(handler); // was: handler.role);

    handler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "timestream:DescribeEndpoints",
        "timestream:ListTables",
        "timestream:CancelQuery",
        "timestream:ListDatabases",
        "timestream:SelectValues"
      ],
      resources: ['arn:aws:timestream:*:753451452012:database/RaspTemperature/table/location1']
    }));

    const iotrule = new iot.CfnTopicRule(this, 'rasptemprule', {
      ruleName: 'rasptemprule',
      topicRulePayload: {
        actions: [
          {
            lambda: { functionArn: handler.functionArn } // replace by timestream when available in CDK/CFN
          }
        ],
        ruleDisabled: true,
        sql: "SELECT temperature as temp, humidity, getdate() as curdate FROM 'sensor/location1/temp1'"
      }
    })

    /* const iotc9sensor = new iot.CfnThing(this, 'cloud9sensor', {
      thingName: 'cloud9sensor'
    })

    const iotsensorpolicy = new iot.CfnPolicy(this, 'cloud9sensor-policy', {
      policyName: 'cloud9sensor-policy',
      policyDocument: {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "iot:Publish",
                "iot:Receive"
              ],
              "Resource": [
                "arn:aws:iot:us-east-1:753451452012:topic/sdk/test/java",
                "arn:aws:iot:us-east-1:753451452012:topic/sdk/test/Python",
                "arn:aws:iot:us-east-1:753451452012:topic/sensor/location1/temp1",
                "arn:aws:iot:us-east-1:753451452012:topic/sensor/location1/temp1/sound",
                "arn:aws:iot:us-east-1:753451452012:topic/topic_1",
                "arn:aws:iot:us-east-1:753451452012:topic/topic_2"
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "iot:Subscribe"
              ],
              "Resource": [
                "arn:aws:iot:us-east-1:753451452012:topicfilter/sdk/test/java",
                "arn:aws:iot:us-east-1:753451452012:topicfilter/sdk/test/Python",
                "arn:aws:iot:us-east-1:753451452012:topicfilter/sensor/location1/temp1",
                "arn:aws:iot:us-east-1:753451452012:topicfilter/sensor/location1/temp1/sound",
                "arn:aws:iot:us-east-1:753451452012:topicfilter/topic_1",
                "arn:aws:iot:us-east-1:753451452012:topicfilter/topic_2"
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "iot:Connect"
              ],
              "Resource": [
                "arn:aws:iot:us-east-1:753451452012:client/sdk-java",
                "arn:aws:iot:us-east-1:753451452012:client/basicPubSub",
                "arn:aws:iot:us-east-1:753451452012:client/sdk-nodejs-*"
              ]
            }
          ]
        }
    }) */

    const c9sensorenv = new cloud9.CfnEnvironmentEC2(this, 'cloud9env', {
      automaticStopTimeMinutes : 15,
      description: "cloud9 sensor env",
      instanceType: "t3.micro",
      name: "c9-temp-sensor",
      subnetId: "subnet-013519962bcda2cba",
      tags: [{key: 'project', value: "rasptemp"}] 
    })


    const lambdaddbiotvending = new lambda.Function(this, "lambdaddbiotvending", {
      runtime: lambda.Runtime.NODEJS_12_X, //
      //code: lambda.Code.asset("resources"),
      code: lambda.Code.fromInline("const AWS = require('aws-sdk');\n const response = require('cfn-response');\n const docClient = new AWS.DynamoDB.DocumentClient();\n exports.handler = function(event, context) {\n console.log(JSON.stringify(event,null,2));\n var params = {\n TableName: 'deviceInfo',\n Item:{\n 'serialNumber': '1234567890',\n 'deviceToken' : 'awsfor2021'\n }\n };\n docClient.put(params, function(err, data) { if (err) {\n response.send(event, context, 'FAILED', {});\n } else {\n response.send(event, context, 'SUCCESS', {});\n }\n });\n }\n"),
      handler: "index.handler",
      environment: {
        //BUCKET: bucket.bucketName
      },
    });

    lambdaddbiotvending.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      resources: ['arn:aws:dynamodb:us-east-1:753451452012:table/deviceInfo']
    }));

    const myProvider = new custom.Provider(this, 'MyProvider', {
      onEventHandler: lambdaddbiotvending
      //isCompleteHandler: isComplete // optional async "waiter"
    });

    const resource = new core.CustomResource(this, 'Resource', {

        serviceToken: myProvider.serviceToken
    });

    const lambdac9profile = new lambda.Function(this, "lambdac9profile", {
      runtime: lambda.Runtime.NODEJS_12_X, //
      //code: lambda.Code.asset("resources"),
      code: lambda.Code.fromInline("const AWS = require('aws-sdk');\n const response = require('cfn-response');\n const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});\n\n exports.handler = async function(event, context) {\n console.log(JSON.stringify(event,null,2));\n var paramsa = {\n Filters: [\n {\n Name: 'tag:project', \n Values: [\n 'rasptemp'\n ]\n },\n {\n Name: 'instance-state-name', \n Values: [\n 'running'\n ]\n }\n ]\n };\n const c9instance = await ec2.describeInstances(paramsa, function(err, data) {\n if (err) console.log(err, err.stack);\n else     {\n var instanceId = JSON.stringify(data.Reservations[0].Instances[0].InstanceId,null,2);\n console.log('c9instance logs: ', instanceId);\n return instanceId;\n }\n }).promise();\n var instid = JSON.stringify(c9instance.Reservations[0].Instances[0].InstanceId,null,2);\n console.log('instid: ',instid.split('\"')[1]);\n var paramsb = {\n IamInstanceProfile: {\n Name: 'AmazonEC2RoleforSSM'\n }, \n InstanceId: instid.toString().split('\"')[1]\n };\n await ec2.associateIamInstanceProfile(paramsb, function(err, data) { if (err) {\n console.log(err, err.stack);\n response.send(event, context, 'FAILED', {});\n } else {\n console.log(data);\n response.send(event, context, 'SUCCESS', {});\n }\n }).promise();\n };\n"),
      handler: "index.handler",
      environment: {
        //BUCKET: bucket.bucketName
      },
    });

    lambdac9profile.node.addDependency(c9sensorenv);

    lambdac9profile.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "ec2:*",
        "iam:PassRole"
      ],
      resources: ['*']
    }));

    const myc9Provider = new custom.Provider(this, 'MyC9Provider', {
      onEventHandler: lambdac9profile
      //isCompleteHandler: isComplete // optional async "waiter"
    });

    const resourcec9 = new core.CustomResource(this, 'Resourcec9', {
      serviceToken: myc9Provider.serviceToken
  });

    const document = new ssm.CfnDocument(this, 'ssmc9bootstrap',{
      name: "ssmc9bootstrap",
      documentType: "Command",
      content: {
        schemaVersion: '2.2',
        description: 'Run a script on C9 instances.',
        parameters: {
            text: {
                default: 'Hello World!',
                description: 'Text to echo',
                type: 'String',
            },
        },
        mainSteps: [
            {
                name: 'bootstrap',
                action: 'aws:runShellScript',
                inputs: {
                    runCommand: [
                      "#!/bin/bash",
                      "yum -y update", 
                      "yum install -y git", 
                      "yum install -y jq",
                      "cd /home/ec2-user/environment", 
                      "touch test.txt", 
                      "curl --location --request GET 'https://yaz9c71d8b.execute-api.us-east-1.amazonaws.com/Prod/getcert?serialNumber=1234567890&deviceToken=awsfor2021' > certificates", 
                      "git clone https://github.com/eddie2070/rasp-aws-iot-temperature.git", 
                      "cd /home/ec2-user/environment/rasp-aws-iot-temperature", 
                      "cat ../certificates | jq -r '.certificatePem' > raspberry-temp-wyeth.cert.pem", 
                      "cat ../certificates | jq -r '.keyPair.PrivateKey' > raspberry-temp-wyeth.private.key",
                      "rm -rf aws-iot-device-sdk-python/",
                      "pip3 install adafruit-circuitpython-dht",
                      "./start.sh" 
                    ]
                },
                precondition: {
                    StringEquals: [
                        'platformType',
                        'Linux',
                    ],
                },
            },
        ],
      }
    })

    const c9command = new ssm.CfnAssociation(this, 'ssmdoctoc9', {
      name: 'ssmc9bootstrap',
      targets: [{
        key: "tag:project",
        values: ["rasptemp"]
      }]
    })

    c9command.node.addDependency(myc9Provider);
    // print the Cloud9 IDE URL in the output
    new core.CfnOutput(this, 'URL', { value: c9sensorenv.toString() });
    new core.CfnOutput(this, 'c9instanceId', { value: c9sensorenv.node.addr });


  }
}

module.exports = { RaspService }
