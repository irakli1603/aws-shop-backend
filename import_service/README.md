# Import Service

This service creates a S3 Bucket with an AWS Gateway endpoint with `importFileParserLambda` handler which responds with Sigend URL for uploading a CSV binary. To upload a binary, just make a `PUT` request to the URL returned by this endpoint with body that includes said CSV binary. After that, uploaded Data in S3 triggers an object creation event that fires `importProductFileLambda` which parses data stream and logs every entry in CloudWatch and moves s3 objects from `uploaded` to `parsed` prefix.

## Exposded endpoint:
- `https://lc8f8xjhj6.execute-api.eu-central-1.amazonaws.com/prod/import?name=<your_csv_file_name_here>.csv`

***NOTE:*** *Query param name is required*

# Test
There are also tests present for both lambda functions. Use `npm run test` to run tests.

