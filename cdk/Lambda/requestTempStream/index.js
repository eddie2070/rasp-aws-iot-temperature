const AWS = require("aws-sdk");
const timestreamquery = new AWS.TimestreamQuery();

exports.handler =  async event => {
  console.log("event: ", event);
  console.log("event supportedInterfaces: ", event.context);
  //console.log("event supportedInterfaces: ", event.context.System.device.supportedInterfaces);
  
  const params = {
  QueryString: 'SELECT * FROM "TempWyeth"."Temp1"  WHERE measure_name = temp ORDER BY time DESC LIMIT 1', /* required */
  //ClientToken: 'STRING_VALUE',
  //MaxRows: '1',
  //NextToken: 'STRING_VALUE'
};

try {
var timeresp = await timestreamquery.query(params).promise();
console.log("timestreamquery :", timeresp.Rows[0]);
var dataproc = JSON.stringify(timeresp.Rows[0].Data[2].ScalarValue, null, 2);
var datadate = JSON.stringify(timeresp.Rows[0].Data[4].ScalarValue, null, 2);
var timereq = datadate.substr(datadate.indexOf(' ')+1);
var houreq = timereq.substr(0,timereq.indexOf(':')+3);
console.log("houreq: ", houreq);

//var offset = 5;
//var usaTime = utc - (3600000*offset);
console.log("usaTime: ",houreq);  
console.log("data: ",dataproc);           // successful response
var responseJson =  {
    version: "1.0",
    response: {
      outputSpeech: 
       {
         type: "PlainText",
         text: "The temperature inside is " + dataproc + " degrees farenheit at " + houreq, 
       },
      shouldEndSession: true
      },
      sessionAttributes: {}
    };
return responseJson;
//return {
//    'statusCode': 200,
//    'headers': {'Content-Type': 'application/json', 'Cache-Control': 'max-age=2400'},
//    'body': JSON.stringify(responseJson)
//};
  }
catch (e) {
    return e;
    //{
    //  statusCode: 500,
  //};
  }
};

