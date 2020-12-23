var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({endpoint: 'a24q730gxudk4k.iot.us-east-1.amazonaws.com'});
exports.handler = function(event, context) {
    
    console.log("event: ",event);
    var clickType = event.deviceEvent.buttonClicked.clickType;
    console.log("clickType: ", clickType)
 
    var params = {
        topic: 'sensor/wyeth/temp1/sound',
        payload: clickType,
        qos: 0
        };
        
 
    iotdata.publish(params, function(err, data){
        if(err){
            console.log(err);
        }
        else{
            console.log("success?");
            //context.succeed(event);
        }
    });
    
};