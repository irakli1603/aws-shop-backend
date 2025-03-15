#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ImportServiceStack } from '../lib/import_service-stack';

const app = new cdk.App();
new ImportServiceStack(app, 'ImportServiceStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});