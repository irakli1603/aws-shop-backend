# Task 3 (First API with AWS API Gateway and AWS Lambda)

This is a Product Service implemented with AWS API Gateway and Lambda functions `getProductByIdLambda` and `getProductListLambda` (See [Task 3](https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/03_serverless_api/task.md))

- API usage is described in `openapi.json` placed in root folder. (Just copy paste this json in [Swagger Editor](https://editor.swagger.io/) tool online to view it)
- Basic unit tests for lambdas can be found in `test` dir. Run script `npm run test` to perform jest unit tests.
- Both lambdas currently have in-memory hardcoded mock data for display.
- Main error scenarios for `getProductById` are implemented. (e.g. not providing productId or providing non-exsiting productId)

Exsposed endpoint URL:
- https://i6ok5isnzd.execute-api.eu-central-1.amazonaws.com/prod/products handled by `getProductListLambda`
- https://i6ok5isnzd.execute-api.eu-central-1.amazonaws.com/prod/products/{productId} handled by `getProductByIdLambda`


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
