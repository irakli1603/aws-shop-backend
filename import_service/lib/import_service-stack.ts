import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Runtime, LayerVersion, Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Bucket, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

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

    importResource.addMethod('GET', new LambdaIntegration(importProductFileLambda, { proxy: true }), {
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
