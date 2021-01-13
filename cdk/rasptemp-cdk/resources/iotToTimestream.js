const AWS = require('aws-sdk');
 const response = require('cfn-response');
 const iot = new AWS.Iot();
 exports.handler = function(event, context) {
 console.log(JSON.stringify(event,null,2));
 var params = {
        ruleName: 'rasptemprule', /* required */
        topicRulePayload: { /* required */
          actions: [ /* required */
            {
                timestream: {
                databaseName: 'RaspTemperature', /* required */
                roleArn: 'arn:aws:iam::753451452012:role/service-role/timestreamrole', /* required */
                tableName: 'location1', /* required */
                timestamp: {
                  unit: 'MILLISECONDS', /* required */
                  value: '${timestamp()}' /* required */
                },
                dimensions: [ /* required */
                  {
                    name: 'temp', /* required */
                    value: 'temp' /* required */
                  },
                  {
                    name: 'humidity', /* required */
                    value: 'humidity' /* required */
                  },
                  /* more items */
                ],
              }
            }
          ],
          sql: 'SELECT temperature as temp, humidity, getdate() as curdate FROM sensor/location1/temp1', /* required */
          awsIotSqlVersion: '2016-03-23',
          description: 'Rasptemp',
          ruleDisabled: true
  },
};

 iot.createTopicRule(params, function(err, data) { if (err) {
 console.log(err, err.stack);
 response.send(event, context, 'FAILED', {});
 } else {
 console.log(data);
 response.send(event, context, 'SUCCESS', {});
 }
 });
 };
