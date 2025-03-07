import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LambdaIntegration, LambdaRestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { Runtime, LayerVersion, Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = dynamodb.Table.fromTableName(
      this,
      'ProductTable',
      'products'
    );

    const stockTable = dynamodb.Table.fromTableName(
      this,
      'StockTable',
      'stocks'
    )

    const readLambdaRole = new iam.Role(this, 'ReadLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    })

    readLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:BatchGetItem'],
      resources: [productTable.tableArn, stockTable.tableArn],
    }))

    const writeLambdaRole = new iam.Role(this, 'WriteLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
         iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    writeLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:TransactWriteItems'
      ],
      resources: [productTable.tableArn, stockTable.tableArn],
    }));

    const uuidLayer = new LayerVersion(this, 'uuid-layer', {
      compatibleRuntimes: [
        Runtime.NODEJS_LATEST
      ],
      code: Code.fromAsset('src/layers/uuid-utils'),
      description: 'Uses a 3rd party library called uuid',
    });

    const createProductLambda = new NodejsFunction(this, 'createProductLambda', {
      entry: 'lib/lambdas/createProductLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      role: writeLambdaRole,
      bundling: {
        minify: false,
        externalModules: ['aws-cdk', 'uuid']
      },
      environment: {
        PRODUCT_TABLE: productTable.tableName,
        STOCKS_TABLE: stockTable.tableName,
      },
      layers: [uuidLayer]
    });

    const getProductListLambda = new NodejsFunction(
      this,
      "getProductListLambda",
      {
        entry: "lib/lambdas/getProductListLambda.ts",
        handler: "handler",
        runtime: Runtime.NODEJS_LATEST,
        role: readLambdaRole,
        environment: {
          PRODUCT_TABLE: productTable.tableName,
          STOCKS_TABLE: stockTable.tableName
        }
      }
    )

    const getProductsByIdLambda = new NodejsFunction(this, 'getProductsByIdLambda', {
      entry: 'lib/lambdas/getProductByIdLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      role: readLambdaRole,
      environment: {
        PRODUCT_TABLE: productTable.tableName,
        STOCKS_TABLE: stockTable.tableName
      }
    });


    const api = new LambdaRestApi(this, 'ProductServiceApi', {
      handler: getProductListLambda, 
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS
      }
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new LambdaIntegration(getProductListLambda));
    products.addMethod('POST', new LambdaIntegration(createProductLambda));

    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new LambdaIntegration(getProductsByIdLambda));
    
  }
}
