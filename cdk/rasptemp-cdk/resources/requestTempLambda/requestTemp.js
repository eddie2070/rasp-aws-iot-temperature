const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
const timestreamquery = new AWS.TimestreamQuery();
var moment = require("moment-timezone");

//const smallImg = 'https://i.etsystatic.com/11598164/r/il/a180b4/824313786/il_1588xN.824313786_qt51.jpg';
//const largeImg = 'https://i.etsystatic.com/11598164/r/il/a180b4/824313786/il_1588xN.824313786_qt51.jpg';


        
function buildtempreq() {
        var params = {
                QueryString: 'SELECT * FROM "TempWyeth"."Temp1"  WHERE measure_name = temp ORDER BY time DESC LIMIT 1', /* required */
                //ClientToken: 'STRING_VALUE
                //MaxRows: '1',
                //NextToken: 'STRING_VALUE'
                };

        var timeresp = timestreamquery.query(params);
        console.log("timestreamquery :", timeresp);
        return timeresp;
}

function buildtempreqext() {
        var paramsb = {
            QueryString: 'SELECT * FROM "TempWyeth"."ext"  WHERE measure_name = temp ORDER BY time DESC LIMIT 1', /* required */
            //ClientToken: 'STRING_VALUE',
            //MaxRows: '1',
            //NextToken: 'STRING_VALUE'
};
        var timerespext = timestreamquery.query(paramsb);
        console.log("timestreamqueryext :", timerespext);
        return timerespext;
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        //const request = handlerInput.requestEnvelope.request;
        //let currentIntent = request.intent;
        let tempf = await buildtempreq().promise();
        // optional: logged to CloudWatch Logs
        console.log('tempf: ', tempf.Rows[0]);
        var dataproc = JSON.stringify(tempf.Rows[0].Data[0].ScalarValue, null, 2);
        console.log("data: ",dataproc);           // successful response
        
        //date from request
        var datadate = JSON.stringify(tempf.Rows[0].Data[2].ScalarValue, null, 2);
        var timereq = datadate.substr(datadate.indexOf(' ')+1);
        var houreq = timereq.substr(0,timereq.indexOf(':')+3);
        console.log("houreq: ", houreq);
        //Conver to time in EST
        var timeutc = moment.tz(datadate, 'Europe/London');
        var newyork = timeutc.clone().tz("America/New_York").format('HH:mm');
        console.log("EST time: ",newyork);
        
        let tempfext = await buildtempreqext().promise();
        console.log('tempfext: ', tempfext);
        var dataprocext = JSON.stringify(tempfext.Rows[0].Data[0].ScalarValue, null, 2);
        const speechText = "The temperature inside is " + dataproc + " degrees farenheit at "+ newyork +". The temperature outside is " + dataprocext;
        
        return handlerInput.responseBuilder
            .withSimpleCard('House Temp Wyeth', "The temperature inside is " + dataproc + "°F") // <--
            .speak(speechText)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
    },
    async handle(handlerInput) {
        //const request = handlerInput.requestEnvelope.request;
        //let currentIntent = request.intent;
        let tempf = await buildtempreq().promise();
        // optional: logged to CloudWatch Logs
        console.log('tempf: ', tempf.Rows[0]);
        var dataproc = JSON.stringify(tempf.Rows[0].Data[0].ScalarValue, null, 2);
        console.log("data: ",dataproc);           // successful response
        
        //date from request
        var datadate = JSON.stringify(tempf.Rows[0].Data[2].ScalarValue, null, 2);
        var timereq = datadate.substr(datadate.indexOf(' ')+1);
        var houreq = timereq.substr(0,timereq.indexOf(':')+3);
        console.log("houreq: ", houreq);
        //Conver to time in EST
        var timeutc = moment.tz(datadate, 'Europe/London');
        var newyork = timeutc.clone().tz("America/New_York").format('HH:mm');
        console.log("EST time: ",newyork);
        
        let tempfext = await buildtempreqext().promise();
        console.log('tempfext: ', tempfext);
        var dataprocext = JSON.stringify(tempfext.Rows[0].Data[0].ScalarValue, null, 2);
        const speechText = "The temperature inside is " + dataproc + " degrees farenheit at "+ newyork +". The temperature outside is " + dataprocext;
        
        return handlerInput.responseBuilder
            .withSimpleCard('House Temp Wyeth', "The temperature inside is " + dataproc + "°F") // <--
            .speak(speechText)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = '<lang xml:lang="en-US">You can say hello. How can I help you?</lang> <lang xml:lang="es-ES">Puedes decir hola. Cómo te puedo ayudar?</lang>';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = '<lang xml:lang="en-US">Bye bye</lang>';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = 'Error!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(require('./aplcard').APLHomeCardRequestInterceptor) // <---
    .addErrorHandlers(
        ErrorHandler)
    .lambda();