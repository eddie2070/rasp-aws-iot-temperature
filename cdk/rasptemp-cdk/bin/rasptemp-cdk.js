#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { RasptempCdkStack } = require('../lib/rasptemp-cdk-stack');

const app = new cdk.App();
new RasptempCdkStack(app, 'RasptempCdkStack');
