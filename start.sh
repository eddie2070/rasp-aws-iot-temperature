# stop script on error
set -e

# Check to see if root CA file exists, download if not
if [ ! -f ./root-CA.crt ]; then
  printf "\nDownloading AWS IoT Root CA certificate from AWS...\n"
  curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root-CA.crt
fi

# Check to see if AWS Device SDK for Python exists, download if not
if [ ! -d ./aws-iot-device-sdk-python ]; then
  printf "\nCloning the AWS SDK...\n"
  git clone https://github.com/aws/aws-iot-device-sdk-python.git
fi

# Check to see if AWS Device SDK for Python is already installed, install if not
if ! python -c "import AWSIoTPythonSDK" &> /dev/null; then
  printf "\nInstalling AWS SDK...\n"
  pushd aws-iot-device-sdk-python
  python setup.py install
  result=$?
  popd
  if [ $result -ne 0 ]; then
    printf "\nERROR: Failed to install SDK.\n"
    exit $result
  fi
fi

# run pub/sub sample app using certificates downloaded in package
printf "\nRunning pub/sub sample application...\n"
python3 mqtt-dht22-aws.py -t sensor/location1/temp1 -e a24q730gxudk4k-ats.iot.us-east-1.amazonaws.com -r root-CA.crt -c raspberry-temp-wyeth.cert.pem -k raspberry-temp-wyeth.private.key > awstemp2.log & 
python3 mqtt-darksky-aws.py -t sensor/location1/temp1 -e a24q730gxudk4k-ats.iot.us-east-1.amazonaws.com -r root-CA.crt -c raspberry-temp-wyeth.cert.pem -k raspberry-temp-wyeth.private.key > awstempdark.log &
#python mqtt-dht22-aws.py -t sensor/wyeth/temp1 -e a24q730gxudk4k-ats.iot.us-east-1.amazonaws.com -r root-CA.crt -c raspberry-temp-wyeth.cert.pem -k raspberry-temp-wyeth.private.key > awstemp2.log 2>&1 & 
