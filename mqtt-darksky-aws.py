#!/usr/bin/python

'''
/*
 * Copyright 2010-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
 '''

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import boto3
import logging
import time
import sys
sys.path.append('/usr/local/lib/python2.7/dist-packages')
import argparse
import json
import os
import time
import urllib.request as urllib2

ssm = boto3.client('ssm', region_name='us-east-1')

AllowedActions = ['both', 'publish', 'subscribe']

# --------- User Settings ---------

# Data capture and upload interval in seconds. Less interval will eventually hang the DHT22.
INTERVAL=300

CITY = "Cambridge"
GPS_COORDS = "42.373615,-71.109734"
DARKSKY_API_KEY = ssm.get_parameter(Name='darkskyAPIKEY', WithDecryption=False)['Parameter']['Value']
MINUTES_BETWEEN_READS = 2
METRIC_UNITS = False
# ---------------------------------

# Read in command-line parameters
parser = argparse.ArgumentParser()
parser.add_argument("-e", "--endpoint", action="store", required=True, dest="host", help="Your AWS IoT custom endpoint")
parser.add_argument("-r", "--rootCA", action="store", required=True, dest="rootCAPath", help="Root CA file path")
parser.add_argument("-c", "--cert", action="store", dest="certificatePath", help="Certificate file path")
parser.add_argument("-k", "--key", action="store", dest="privateKeyPath", help="Private key file path")
parser.add_argument("-p", "--port", action="store", dest="port", type=int, help="Port number override")
parser.add_argument("-w", "--websocket", action="store_true", dest="useWebsocket", default=False,
                    help="Use MQTT over WebSocket")
parser.add_argument("-id", "--clientId", action="store", dest="clientId", default="basicPubSub",
                    help="Targeted client id")
parser.add_argument("-t", "--topic", action="store", dest="topic", default="sdk/test/Python", help="Targeted topic")
parser.add_argument("-m", "--mode", action="store", dest="mode", default="both",
                    help="Operation modes: %s"%str(AllowedActions))
parser.add_argument("-M", "--message", action="store", dest="message", default="Hello World!",
                    help="Message to publish")

args = parser.parse_args()
host = args.host
rootCAPath = args.rootCAPath
certificatePath = args.certificatePath
privateKeyPath = args.privateKeyPath
port = args.port
useWebsocket = args.useWebsocket
clientId = args.clientId
topic = args.topic
sensor_data = {'temperature': 0, 'humidity': 0}

if args.mode not in AllowedActions:
    parser.error("Unknown --mode option %s. Must be one of %s" % (args.mode, str(AllowedActions)))
    exit(2)

if args.useWebsocket and args.certificatePath and args.privateKeyPath:
    parser.error("X.509 cert authentication and WebSocket are mutual exclusive. Please pick one.")
    exit(2)

if not args.useWebsocket and (not args.certificatePath or not args.privateKeyPath):
    parser.error("Missing credentials for authentication.")
    exit(2)

# Port defaults
if args.useWebsocket and not args.port:  # When no port override for WebSocket, default to 443
    port = 443
if not args.useWebsocket and not args.port:  # When no port override for non-WebSocket, default to 8883
    port = 8883

# Configure logging
logger = logging.getLogger("AWSIoTPythonSDK.core")
logger.setLevel(logging.DEBUG)
streamHandler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

# Init AWSIoTMQTTClient
myAWSIoTMQTTClient = None
if useWebsocket:
    myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId, useWebsocket=True)
    myAWSIoTMQTTClient.configureEndpoint(host, port)
    myAWSIoTMQTTClient.configureCredentials(rootCAPath)
else:
    myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
    myAWSIoTMQTTClient.configureEndpoint(host, port)
    myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

# AWSIoTMQTTClient connection configuration
myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  # 5 sec

# Connect and subscribe to AWS IoT
myAWSIoTMQTTClient.connect()
if args.mode == 'both' or args.mode == 'subscribe':
    #myAWSIoTMQTTClient.subscribe('sensor/wyeth/temp1/sound', 1, customCallback)
    print("MQTT Subscription made")
time.sleep(2)

def isFloat(string):
    try:
        float(string)
        return True
    except ValueError:
        return False

def get_current_conditions():
	api_conditions_url = "https://api.darksky.net/forecast/" + DARKSKY_API_KEY + "/" + GPS_COORDS
	try:
		f = urllib2.urlopen(api_conditions_url)
	except:
		return []
	json_currently = f.read()
	f.close()
	print(json_currently)
	return json.loads(json_currently)

def main():

	sensor_data = {'dark_temperature': 0, 'dark_humidity': 0}
	next_reading = time.time()



	curr_conditions = get_current_conditions()
	if ('currently' not in curr_conditions):
		print("Error! Dark Sky API call failed, check your GPS coordinates and make sure your Dark Sky API key is valid!")
		print(curr_conditions)
		exit()
	else:
		print("good") #streamer = Streamer(bucket_name=BUCKET_NAME, bucket_key=BUCKET_KEY, access_key=ACCESS_KEY))
	while True:

		curr_conditions = get_current_conditions()
		if ('currently' not in curr_conditions):
			print("Error! Dark Sky API call failed. Skipping a reading then continuing ...\n")
			print(curr_conditions)
		else:

			if 'humidity' in curr_conditions['currently'] and isFloat(curr_conditions['currently']['humidity']):
				print(":droplet: Humidity(%), curr_conditions['currently']['humidity']*100)")
				dark_humidity = curr_conditions['currently']['humidity']*100
				print(dark_humidity)

			if 'temperature' in curr_conditions['currently'] and isFloat(curr_conditions['currently']['temperature']):
				print("Temperature,curr_conditions['currently']['temperature'])")
				dark_temperature = curr_conditions['currently']['temperature']
				print(dark_temperature)

			sensor_data['dark_temperature'] = dark_temperature
			sensor_data['dark_humidity'] = dark_humidity

			# Sending humidity and temperature data to ThingsBoard
			myAWSIoTMQTTClient.publish(topic, json.dumps(sensor_data), 1)

			next_reading += INTERVAL
			sleep_time = next_reading-time.time()
			if sleep_time > 0:
				time.sleep(sleep_time)

		#time.sleep(60*MINUTES_BETWEEN_READS)

if __name__ == "__main__":
    main()

#------- END OF DARKSKY API CALL --------
