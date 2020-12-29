const core = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const timestream = require("@aws-cdk/aws-timestream");
//const s3 = require("@aws-cdk/aws-s3");
const iam = require("@aws-cdk/aws-iam");
const iot = require("@aws-cdk/aws-iot");

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
      resources: [ 'arn:aws:timestream:*:753451452012:database/RaspTemperature/table/location1' ]
    }));

    const iotrule = new iot.CfnTopicRule(this, 'rasptemprule', {
      ruleName: 'rasptemprule',
      topicRulePayload: {
        actions : [
          {
          lambda: { functionArn: handler.functionArn } // replace by timestream when available in CDK/CFN
      }
        ],
        ruleDisabled : true,
        sql : "SELECT temperature as temp, humidity, getdate() as curdate FROM 'sensor/location1/temp1'"
      }
    })
    
  }
}

module.exports = { RaspService }
