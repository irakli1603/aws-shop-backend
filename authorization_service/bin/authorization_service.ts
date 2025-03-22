#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '../lib/authorization_service-stack';

const app = new cdk.App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});