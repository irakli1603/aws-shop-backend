import { OriginAccessControlOriginType } from 'aws-cdk-lib/aws-cloudfront';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const BUCKET_NAME = process.env.BUCKET_NAME!;
const s3 = new S3();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', event);
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body:  JSON.stringify({ message: 'Missing "name" query parameter.' }),
    };
  }

  const s3Params = {
    Bucket: BUCKET_NAME,
    Key: `uploaded/${fileName}`,
    Expires: 180,
    ContentType: 'text/csv',
  };

  try {
    const signedUrl = s3.getSignedUrl('putObject', s3Params);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: signedUrl,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not create signed URL', error }),
    };
  }
};