import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, LambdaRestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductListLambda = new NodejsFunction(
      this,
      "getProductListLambda",
      {
        entry: "lib/lambdas/getProductListLambda.ts",
        handler: "handler",
        runtime: Runtime.NODEJS_LATEST
      }
    )

    const getProductsByIdLambda = new NodejsFunction(this, 'getProductsByIdLambda', {
      entry: 'lib/lambdas/getProductByIdLambda.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
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

    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new LambdaIntegration(getProductsByIdLambda));
    
  }
}
