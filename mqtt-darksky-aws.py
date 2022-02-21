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
from awscrt import io, mqtt, auth, http
from awsiot import mqtt_connection_builder
from dotenv import load_dotenv
import logging
import time
import sys
sys.path.append('/usr/local/lib/python2.7/dist-packages')
import argparse
import json
import os
import urllib.request as urllib2
import threading


# logging  
LOG = "/home/pi/Documents/aws/debug.log"                                                     
logging.basicConfig(level=logging.INFO, format="%(asctime)-10s %(name)-12s %(levelname)-8s %(message)s",datefmt='%Y-%m-%d %H:%M:%S', handlers=[
        logging.FileHandler("/home/pi/Documents/aws/debug_ext.log"),
        logging.StreamHandler()
    ])  
# logger = logging.getLogger()
# handler = logging.StreamHandler()
# formatter = logging.Formatter('%(asctime)s %(name)-12s %(levelname)-8s %(message)s')
# handler.setFormatter(formatter)
# logger.addHandler(handler)
# logger.setLevel(logging.DEBUG)
logging.info("-------------------------")
logging.info("---- Starting script ----")
logging.info("Starting debug")

load_dotenv()

received_count = 0
received_all_event = threading.Event()

print("endpoint: ",os.getenv('ENDPOINT'))
print("http_proxy_options: ",os.getenv('HTTP_PROXY_OPTIONS'))
print(os.getenv('TOPIC_EXT'))
print(os.getenv('CERT_FILEPATH'))
print(os.getenv('PRI_KEY_FILEPATH'))
print(os.getenv('CA_FILEPATH'))


# --------- User Settings ---------

# Data capture and upload interval in seconds. Less interval will eventually hang the DHT22.
INTERVAL=300

CITY = "Cambridge"
GPS_COORDS = "42.373615,-71.109734"
DARKSKY_API_KEY = "840d2e2b7946ca7e6ebb4065340e8d82"
MINUTES_BETWEEN_READS = 2
METRIC_UNITS = False
# ---------------------------------

io.init_logging(getattr(io.LogLevel, io.LogLevel.Info.name), 'stderr')


sensor_data = {'temperature': 0, 'humidity': 0}


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
	return json.loads(json_currently.decode('utf-8'))


class mq:
     def __init__(self):
          self._mqm = 0
       
     # function to get value of _mqm
     def get_mqm(self):
         print("getter method called")
         return self._mqm
       
     # function to set value of _mqm
     def set_mqm(self, a):
         print("setter method called")
         self._mqm = a
  
     
     mqm = property(get_mqm, set_mqm) 

# Callback when the subscribed topic receives a message
def on_message_received(topic, payload, dup, qos, retain, **kwargs):
    print("nothing")

# Callback when connection is accidentally lost.
def on_connection_interrupted(connection, error, **kwargs):
    print("Connection interrupted. error: {}".format(error))


# Callback when an interrupted connection is re-established.
def on_connection_resumed(connection, return_code, session_present, **kwargs):
    print("Connection resumed. return_code: {} session_present: {}".format(return_code, session_present))

    if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
        print("Session did not persist. Resubscribing to existing topics...")
        resubscribe_future, _ = connection.resubscribe_existing_topics()

        # Cannot synchronously wait for resubscribe result because we're on the connection's event-loop thread,
        # evaluate result with a callback instead.
        resubscribe_future.add_done_callback(on_resubscribe_complete)


def mqtt_publish(message):
    try:
        pub = mqtt_connection.publish(topic=os.getenv('TOPIC_EXT'), payload=message, qos=mqtt.QoS.AT_LEAST_ONCE)
        return pub
    except Exception as e:
        print('error in pub: ', e)

if __name__ == '__main__':
    sensor_data = {'dark_temperature': 0, 'dark_humidity': 0}
	#next_reading = time.time()

    # Spin up resources
    event_loop_group = io.EventLoopGroup(1)
    host_resolver = io.DefaultHostResolver(event_loop_group)
    client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)
    proxy_options=None

    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=os.getenv('ENDPOINT'),
        port=int(os.getenv('PORT')),
        cert_filepath=os.getenv('CERT_FILEPATH'),
        pri_key_filepath=os.getenv('PRI_KEY_FILEPATH'),
        ca_filepath=os.getenv('CA_FILEPATH'),
        client_bootstrap=client_bootstrap,
        http_proxy_options=proxy_options,
        on_connection_interrupted=on_connection_interrupted,
        on_connection_resumed=on_connection_resumed,
        client_id=os.getenv('CLIENT_ID_EXT'),
        clean_session=False,
        reconnect_min_timeout_secs=10,
        reconnect_max_timeout_secs=20,
        ping_timeout_ms=5000,
        keep_alive_secs=30)

    connect_future = mqtt_connection.connect()
    print (connect_future)

    # Future.result() waits until a result is available
    connect = connect_future.result()
    print("Connected!")
    logging.info("Connected")


    print("connect: ", connect)

    # Subscribe
    """     
    print("Subscribing to topic '{}'...".format(os.getenv('TOPIC_EXT')+"/sound"))
    subscribe_future, packet_id = mqtt_connection.subscribe(
        topic=os.getenv('TOPIC')+"/sound",
        qos=mqtt.QoS.AT_LEAST_ONCE,
        callback=on_message_received)
    
    print('subscribe_future.result to come')

    subscribe_result = subscribe_future.result()
    print("Subscribed with {}".format(str(subscribe_result['qos'])))
    logging.info("Subscribed with {}".format(str(subscribe_result['qos']))) 


    # Wait for all messages to be received.
    # This waits forever if count was set to 0.
    if not received_all_event.is_set():
        print("Waiting for all messages to be received...")

    #received_all_event.wait()
    print("{} message(s) received.".format(received_count))
    """

    # Publish
    curr_conditions = get_current_conditions()
    if ('currently' not in curr_conditions):
        print("Error! Dark Sky API call failed, check your GPS coordinates and make sure your Dark Sky API key is valid!")
        print(curr_conditions)
        exit()
    else:
        print("good") #streamer = Streamer(bucket_name=BUCKET_NAME, bucket_key=BUCKET_KEY, access_key=ACCESS_KEY))
    loopCount = 0
    
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
            
            messageJson = json.dumps(sensor_data)
            print('messageJson is %s' % (messageJson))
            logging.info('messageJson is %s' % (messageJson))
            published = mqtt_publish(messageJson)
            print("published: ", published)
            time.sleep(600)

    # Disconnect
    print("Disconnecting...")
    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()
    print("Disconnected!")
#mqtt_subscribe()
