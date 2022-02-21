from awscrt import io, mqtt, auth, http
from awsiot import mqtt_connection_builder
from dotenv import load_dotenv
import time
import threading
import os
from uuid import uuid4
import json
import logging

# logging  
LOG = "/Users/kedouard/Documents/SA/Labs/button_farm/aws/debug.log"                                                     
logging.basicConfig(level=logging.INFO, format="%(asctime)-10s %(name)-12s %(levelname)-8s %(message)s",datefmt='%Y-%m-%d %H:%M:%S', handlers=[
        logging.FileHandler("/Users/kedouard/Documents/SA/Labs/button_farm/aws/debug.log"),
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
print(os.getenv('TOPIC'))
print(os.getenv('CERT_FILEPATH'))
print(os.getenv('PRI_KEY_FILEPATH'))
print(os.getenv('CA_FILEPATH'))

sensor_data = {'temperature': 0, 'humidity': 0}

io.init_logging(getattr(io.LogLevel, io.LogLevel.Info.name), 'stderr')

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
    print("Received message from topic '{}': {}".format(topic, payload))
    logging.info("Received message from topic '{}': {}".format(topic, payload))
    global received_count
    received_count += 1
    if received_count == 10:
        received_all_event.set()
    print("Received a new message: ")
    payl = payload.decode("utf-8")
    print(payl)
    print("from topic: ")
    print(topic)
    #logging.debug(message.topic)
    print("--------------\n\n")
    if payl == 'SINGLE':
        print("playing rooster")
        #logging.debug("playing rooster")
        #os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/Rooster.ogg')
        os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/church-bells-bells-ring-10.mp3')
    elif payl == 'DOUBLE':
        print("playing cows")
        #logging.debug("playing cows")
        os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/cows.wav')
    elif payl == 'LONG':
        print("playing stallone")
        os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/Lion-Roar.wav')
        #os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/OverTheTop.mp3')
    elif payl == 'PS5Xmas':
        print("playing PS5Xmas")
        os.system('/usr/local/bin/ffplay -nodisp -autoexit /Users/kedouard/Documents/SA/Labs/button_farm/aws/sounds/ps5.wav')
        #os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/Lion-Roar.wav')
        #os.system('/usr/bin/omxplayer /home/pi/Documents/aws/sounds/OverTheTop.mp3')
    else:
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
        pub = mqtt_connection.publish(topic=os.getenv('TOPIC'), payload=message, qos=mqtt.QoS.AT_LEAST_ONCE)
        return pub
    except Exception as e:
        print('error in pub: ', e)

if __name__ == '__main__':
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
        client_id=os.getenv('CLIENT_ID'),
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
    print("Subscribing to topic '{}'...".format(os.getenv('TOPIC')+"/sound"))
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

    # Publish
    while True:
        humidity,temperature = 43.123,20.1321
        humidity = round(humidity, 2)
        temperature = temperature * 9/5.0 + 32  # Convert to Fahrenheit
        temperature = round(temperature, 2)
        sensor_data['temperature'] = temperature
        sensor_data['humidity'] = humidity
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

