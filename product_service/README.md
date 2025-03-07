# Task 3 (First API with AWS API Gateway and AWS Lambda)

This is a Product Service implemented with AWS API Gateway and Lambda functions `getProductByIdLambda`, `getProductListLambda` and `createProductLambda` using `DynamoDB` as Database for tables `product` and `stock` (See [Task 4](https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/04_integration_with_nosql_database/task.md))

To create a Product, you must make a POST request to the URL below with the following body json data: 
- title - text, not null
- description - text
- price - integer
- count - integer
e.g
```json
{
  title: 'Product Title',
  description: 'This product ...',
  price: 200,
  count: 2
}
```

Exsposed endpoint URL:
- GET https://1vleujqwhb.execute-api.eu-central-1.amazonaws.com/prod/products handled by `getProductListLambda`
- POST https://1vleujqwhb.execute-api.eu-central-1.amazonaws.com/prod/products handled by `createProductByIdLambda`
- GET https://1vleujqwhb.execute-api.eu-central-1.amazonaws.com/prod/products/{productId} handled by `getProductByIdLambda`

FE URL
- https://dk03xi1yghc1x.cloudfront.net/


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
