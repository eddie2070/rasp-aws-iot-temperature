# rasp-aws-iot-temperature

This project allows to retrieve temperature and humidity from an IoT device (Raspberry with a DHT sensor).
The IoT messages are then stored into a Amazon Timestream database. We can then use an Alexa Skill to call a Lambda function (requestTempStream function) and query the current temperature.

This entire architecture can be deployed via the CDK/CloudFormation provided here. This will deploy a Cloud9 environment that will be used as the IoT device (querying external temperature API to replace the sensor).

## Architecture

<img src="https://github.com/eddie2070/rasp-aws-iot-temperature/blob/main/img/Temperature-sensor.png?raw=true"/>

### Dependencies
On RaspberryPi, you need Python 3.6+ and install:  
- sudo python3.6 -m pip install Adafruit_DHT
- sudo python3.6 -m pip install python-dotenv
- git clone https://github.com/aws/aws-iot-device-sdk-python-v2.git
- python3 -m pip install ./aws-iot-device-sdk-python-v2


### Notes

Timestream IoT rule not yet supported in CloudFormation or CDK. Used a Custom Resource. 
IoT Certificates Vending Machine: https://github.com/awslabs/aws-iot-certificate-vending-machine.  
Cloud9 bootstrap using SSM Command example: https://github.com/aws-quickstart/quickstart-cloud9-ide 
