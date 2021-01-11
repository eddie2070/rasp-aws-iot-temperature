const AWS = require('aws-sdk');\n
 const response = require('cfn-response');\n
 const iot = new AWS.Iot();\n
 exports.handler = function(event, context) {\n
 console.log(JSON.stringify(event,null,2));\n
 var params = {\n
        ruleName: 'rasptemprule', /* required */\n
        topicRulePayload: { /* required */\n
          actions: [ /* required */\n
            {\n
                timestream: {\n
                databaseName: 'RaspTemperature', /* required */\n
                dimensions: [ /* required */\n
                  {\n
                    name: 'temp', /* required */\n
                    value: 'temp' /* required */\n
                  },\n
                  {\n
                    name: 'humidity', /* required */\n
                    value: 'humidity' /* required */\n
                  }\n
                  /* more items */\n
                ],\n
                roleArn: 'arn:aws:iam::753451452012:role/service-role/timestreamrole', /* required */\n
                tableName: 'location1', /* required */\n
                timestamp: {\n
                  unit: 'MILLISECONDS', /* required */\n
                  value: '${timestamp()}' /* required */\n
                }\n
              }\n
            }\n
          ]\n
          sql: "SELECT temperature as temp, humidity, getdate() as curdate FROM 'sensor/location1/temp1'", /* required */\n
          awsIotSqlVersion: '2016-03-23',\n
          description: 'Rasptemp',\n
          ruleDisabled: true\n
  },\n
};\n

 iot.createTopicRule(params, function(err, data) { if (err) {\n
 console.log(err, err.stack);\n
 response.send(event, context, 'FAILED', {});\n
 } else {\n
 console.log(data);\n
 response.send(event, context, 'SUCCESS', {});\n
 }\n
 });\n
 };\n
