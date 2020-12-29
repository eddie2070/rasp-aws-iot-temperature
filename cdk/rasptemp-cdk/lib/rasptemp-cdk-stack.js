const cdk = require('@aws-cdk/core');
const rasptemp_service = require('../lib/rasptemp_service');

class RasptempCdkStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new rasptemp_service.RaspService(this, 'Rasptemp');
  }
}

module.exports = { RasptempCdkStack }
