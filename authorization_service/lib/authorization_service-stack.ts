import * as cdk from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import 'dotenv/config';


export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if(!process.env.irakli1603) {
      throw new Error('Environment variable "irakli1603" is required');
    }


    const basicAuthorizerLambda = new NodejsFunction(this, 'basicAuthorizerLambda', {
      entry: 'lib/lambdas/basicAuthorizerLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      environment: {
        'irakli1603': process.env.irakli1603
      },
    })

    basicAuthorizerLambda.grantInvoke(
      new ServicePrincipal("apigateway.amazonaws.com")
    );

    new cdk.CfnOutput(this, 'BasicAuthorizerLambdaArnOutput', {
      value: basicAuthorizerLambda.functionArn,
      exportName: 'BasicAuthorizerLambdaArn',
    });
  }
}
