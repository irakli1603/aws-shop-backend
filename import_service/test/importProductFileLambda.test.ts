import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lib/lambdas/importProductFileLambda';
import { S3 } from 'aws-sdk';

jest.mock('aws-sdk', () => {
  const mS3 = {
    getSignedUrl: jest.fn(),
  };
  return { S3: jest.fn(() => mS3) };
});

describe('importProductFileLambda Lambda', () => {
  it('should return 400 if "name" query parameter is missing', async () => {
    const event = { queryStringParameters: {} } as unknown as APIGatewayProxyEvent;
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe("{\"message\":\"Missing \\\"name\\\" query parameter.\"}");
  });

  it('should return a signed URL when "name" query parameter is provided', async () => {
    const fileName = 'test.csv';
    const fakeSignedUrl = 'https://signed-url';
    const s3Instance = new S3();
    (s3Instance.getSignedUrl as jest.Mock).mockReturnValue(fakeSignedUrl);

    const event = {
      queryStringParameters: { name: fileName },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(fakeSignedUrl);
    expect(s3Instance.getSignedUrl).toHaveBeenCalledWith(
      'putObject',
      expect.objectContaining({
        Key: `uploaded/${fileName}`,
        ContentType: 'text/csv',
      })
    );
  });
});