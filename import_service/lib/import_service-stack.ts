import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Runtime, LayerVersion, Code, Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Bucket, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { RestApi, LambdaIntegration, TokenAuthorizer, IdentitySource, GatewayResponse, ResponseType, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'ProductBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST
          ],
          allowedOrigins: ["*"]
        }
      ]
    })

    const  importProductFileLambda = new NodejsFunction(this, 'importProductFileLambda', {
      entry: 'lib/lambdas/importProductFileLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    })

    const csvParserLayer = new LayerVersion(this, 'csv-parser-layer', {
      compatibleRuntimes: [
        Runtime.NODEJS_LATEST
      ],
      code: Code.fromAsset('src/layers/csv-parser-utils'),
      description: 'Uses a 3rd party js library called csv-parser',
    });


    const importFileParserLambda = new NodejsFunction(this, 'importFileParserLambda', {
      entry: 'lib/lambdas/importFileParserLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      bundling: {
        minify: false,
        externalModules: ['aws-cdk', 'csv-parser']
      },
      environment: {
        BUCKET_NAME: bucket.bucketName,
        SQS_QUEUE_NAME: 'catalogItemsQueue'
      },
      layers: [csvParserLayer]
    })

    bucket.grantWrite(importProductFileLambda);
    bucket.grantReadWrite(importFileParserLambda);

    importFileParserLambda.addToRolePolicy(new PolicyStatement({
      actions: ['sqs:GetQueueUrl', 'sqs:SendMessage'],
      resources: [
        `arn:aws:sqs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:catalogItemsQueue`
      ]
    }))

    const importApi = new RestApi(this, 'ImportProductsApi', {
      restApiName: 'Import Service Api',
      description: 'API for importing product CSV files',
    })

    const importResource = importApi.root.addResource('import');
    
    importResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['*'],
      allowCredentials: true,
    })

    new GatewayResponse(this, 'Unauthorized', {
      restApi: importApi,
      type: ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
        'Access-Control-Allow-Credentials': "'true'"
      },
      templates: {
        'application/json': JSON.stringify({ message: 'No Authorization header provided' })
      },
      statusCode: '401'
    })

    new GatewayResponse(this, 'Forbidden', {
      restApi: importApi,
      type: ResponseType.ACCESS_DENIED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
        'Access-Control-Allow-Credentials': "'true'",
      },
      templates: {
        'application/json': JSON.stringify({ message: "$context.authorizer.message" })
      },
      statusCode: '403'
    })

    const basicAuthorizerLambda = Function.fromFunctionArn(
      this,
      'BasicAuthorizerLambda',
      cdk.Fn.importValue('BasicAuthorizerLambdaArn')
    )

    const lambdaAuthorizer = new TokenAuthorizer(this, 'LambdaAuthorizer', {
      handler: basicAuthorizerLambda,
      identitySource: IdentitySource.header('Authorization')
    })

    importResource.addMethod('GET', new LambdaIntegration(importProductFileLambda), {
      authorizationType: AuthorizationType.CUSTOM,
      authorizer: lambdaAuthorizer,
      requestParameters: {
        'method.request.querystring.name': true,
      }
    })

    bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    )

  }
}
