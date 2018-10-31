# serverless-log-forwarding-kinesis

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/amplify-education/serverless-domain-manager/master/LICENSE)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb1e50c048434012bd57eb73225a089e)](https://www.codacy.com/app/CFER/serverless-log-forwarding?utm_source=github.com&utm_medium=referral&utm_content=amplify-education/serverless-log-forwarding&utm_campaign=badger)
[![Build Status](https://travis-ci.org/amplify-education/serverless-log-forwarding.svg?branch=master)](https://travis-ci.org/amplify-education/serverless-log-forwarding)
[![npm version](https://badge.fury.io/js/serverless-log-forwarding.svg)](https://badge.fury.io/js/serverless-log-forwarding)
[![npm downloads](https://img.shields.io/npm/dt/serverless-log-forwarding.svg?style=flat)](https://www.npmjs.com/package/serverless-log-forwarding)

Serverless plugin for forwarding CloudWatch logs to a Kinesis Stream

# Getting Started

## Prerequisites

**This plugin only works for Serverless deployments to AWS**

Make sure you have the following installed before starting:
* [nodejs](https://nodejs.org/en/download/)
* [npm](https://www.npmjs.com/get-npm)
* [serverless](https://serverless.com/framework/docs/providers/aws/guide/installation/)

You will need a Kinesis Stream ARN, and the ARN to a role with a policy like:

```yaml
CloudWatchLogsRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service:
              - logs.amazonaws.com
          Action:
            - sts:AssumeRole
    Policies:
      - PolicyName: root
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - kinesis:PutRecords
                - kinesis:PutRecord
              Resource:
                Fn::GetAtt:
                  - KinesisStream
                  - Arn
    RoleName: kinesis-forwarder-cloudwatchrole
```

Note the above is just an example cloudformation resource, and you will need to create one appropriate for your use case.

## Installing

To install the plugin, run:

```shell
npm install serverless-log-forwarding-kinesis
```

Then make the following edits to your `serverless.yaml` file:

```yaml
plugins:
  - serverless-log-forwarding-kinesis

custom:
  logForwardingKinesis:
    destinationARN: '[ARN of Kinesis stream to forward logs to]'
    roleARN: '[ARN of the role to use when forwading logs]'
    # optional:
    filterPattern: '[filter pattern for logs that are sent to Kinesis]'
    normalizedFilterID: true # whether to use normalized function name as filter ID
    stages:
      - '[name of the stage to apply log forwarding]'
      - '[another stage name to filter]'

functions:
  myFunction:
    handler: src/someHandler
    # optional properties for per-function configuration:
    logForwarding:
      # set enabled to false to disable log forwarding for a single given function
      enabled: false

```

## Running Tests

To run the test:

```shell
npm test
```

All tests should pass.

If there is an error update the node_module inside the serverless-log-forwarding-kinesis folder:

```shell
npm install
```

## Deploying
---------
The plugin will be packaged with the lambda when deployed as normal using Serverless:

```shell
serverless deploy
```

# Responsible Disclosure

If you have any security issue to report, contact project maintainers privately.

# Contributing

We welcome pull requests! For your pull request to be accepted smoothly, we suggest that you:
1. For any sizable change, first open a GitHub issue to discuss your idea.
2. Create a pull request.  Explain why you want to make the change and what it’s for.
We’ll try to answer any PRs promptly.
