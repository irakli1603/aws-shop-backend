import { S3Event } from 'aws-lambda';
import { handler } from '../lib/lambdas/importFileParserLambda';
import { S3 } from 'aws-sdk';
import { PassThrough } from 'stream';


jest.mock('aws-sdk', () => {
  const mS3 = {
    getObject: jest.fn(),
    copyObject: jest.fn(),
    deleteObject: jest.fn(),
  };
  return { S3: jest.fn(() => mS3) };
});

describe('importFileParserLambda', () => {
  const BUCKET_NAME = 'test-bucket';
  beforeAll(() => {
    process.env.BUCKET_NAME = BUCKET_NAME;
  });

  it('should process CSV file and move it from "uploaded" to "parsed"', async () => {
    const csvContent = "col1,col2\nval1,val2\n";
    const stream = new PassThrough();
    
    const s3Instance = new S3();
    (s3Instance.getObject as jest.Mock).mockReturnValue({
      createReadStream: () => {
        process.nextTick(() => {
          stream.write(csvContent);
          stream.end();
        });
        return stream;
      },
    });

    (s3Instance.copyObject as jest.Mock).mockReturnValue({
      promise: () => Promise.resolve(),
    });
    (s3Instance.deleteObject as jest.Mock).mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const event = {
      Records: [
        {
          s3: {
            bucket: { name: BUCKET_NAME },
            object: { key: 'uploaded/test.csv' },
          },
        },
      ],
    } as unknown as S3Event;

    await handler(event, {} as any, () => {});


    expect(s3Instance.copyObject).toHaveBeenCalledWith({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/uploaded/test.csv`,
      Key: 'parsed/test.csv',
    });
    expect(s3Instance.deleteObject).toHaveBeenCalledWith({
      Bucket: BUCKET_NAME,
      Key: 'uploaded/test.csv',
    });
  });
});