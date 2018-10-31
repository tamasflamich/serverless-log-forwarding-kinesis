'use strict';

const _ = require('underscore');

class LogForwardingPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');

    /* Hooks tell Serverless when to do what */
    this.hooks = {
      'package:initialize': this.updateResources.bind(this),
    };
  }

  /**
   * Updates CloudFormation resources with log forwarding
   */
  updateResources() {
    // check if stage is specified in config
    const service = this.serverless.service;
    const stage = this.options.stage && this.options.stage.length > 0
      ? this.options.stage
      : service.provider.stage;
    if (service.custom.logForwardingKinesis.stages &&
      service.custom.logForwardingKinesis.stages.indexOf(stage) === -1) {
      this.serverless.cli.log(`Log Forwarding is ignored for ${stage} stage`);
      return;
    }

    this.serverless.cli.log('Updating Log Forwarding Resources...');
    const resourceObj = this.createResourcesObj();
    if (this.serverless.service.resources === undefined) {
      this.serverless.service.resources = {
        Resources: {},
      };
    } else if (this.serverless.service.resources.Resources === undefined) {
      this.serverless.service.resources.Resources = {};
    }
    _.extend(this.serverless.service.resources.Resources, resourceObj);
    this.serverless.cli.log('Log Forwarding Resources Updated');
  }

  /**
   * Creates CloudFormation resources object with log forwarding
   * @return {Object} resources object
   */
  createResourcesObj() {
    const service = this.serverless.service;
    // Checks if the serverless file is setup correctly
    if (service.custom.logForwardingKinesis.destinationARN == null || service.custom.logForwardingKinesis.roleARN == null) {
      throw new Error('Serverless-log-forwarding-kinesis is not configured correctly. Please see README for proper setup.');
    }
    const filterPattern = service.custom.logForwardingKinesis.filterPattern || '';
    const normalizedFilterID = !(service.custom.logForwardingKinesis.normalizedFilterID === false);
    // Get options and parameters to make resources object
    const arn = service.custom.logForwardingKinesis.destinationARN;
    const roleArn = service.custom.logForwardingKinesis.roleARN;

    /* get list of all functions in this lambda
      and filter by those which explicitly declare logForwardingKinesis.enabled = false
    */
    const resourceObj = {};
    _.keys(service.functions)
      .filter((func) => {
        const { logForwardingKinesis = {} } = this.serverless.service.getFunction(func);
        return typeof logForwardingKinesis.enabled === 'undefined' || logForwardingKinesis.enabled === true;
      })
      .forEach((func) => {
        const subscriptionFilter = this.makeSubscriptionFilter(func, {
          arn,
          roleArn,
          filterPattern,
          normalizedFilterID,
        });
        /* merge new SubscriptionFilter with current resources object */
        _.extend(resourceObj, subscriptionFilter);
      });
    return resourceObj;
  }

  /**
   * Makes a Subscription Filter object for given function name
   * @param  {String} functionName name of function to make SubscriptionFilter for
   * @param  {Object} options with
   *                          arn: arn of the kinesis stream to forward to
   *                          filterPattern: filter pattern for the Subscription
   *                          normalizedFilterID: whether to use normalized FuncName as filter ID
   * @return {Object}               SubscriptionFilter
   */
  makeSubscriptionFilter(functionName, options) {
    const functionObject = this.serverless.service.getFunction(functionName);
    const logGroupName = this.provider.naming.getLogGroupName(functionObject.name);
    const filterName = options.normalizedFilterID ?
      this.provider.naming.getNormalizedFunctionName(functionName)
      : functionName;
    const filterLogicalId = `SubscriptionFilter${filterName}`;
    const functionLogGroupId = this.provider.naming.getLogGroupLogicalId(functionName);
    const filter = {};
    filter[filterLogicalId] = {
      Type: 'AWS::Logs::SubscriptionFilter',
      Properties: {
        DestinationArn: options.arn,
        RoleArn: options.roleArn,
        FilterPattern: options.filterPattern, // '[timestamp=*Z, request_id="*-*", event]'
        LogGroupName: logGroupName,
      },
      DependsOn: [
        functionLogGroupId,
      ],
    };
    return filter;
  }
}

module.exports = LogForwardingPlugin;
