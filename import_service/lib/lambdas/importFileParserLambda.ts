// lambda/importFileParser.ts
import { S3Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const csvParser = require('/opt/nodejs/csv-parser-utils');

const BUCKET_NAME = process.env.BUCKET_NAME!;
const s3 = new S3();

export const handler: S3Handler = async (event) => {
  console.log('Event received:', event);
  
  for (const record of event.Records) {
    const key = record.s3.object.key;
    console.log(`Processing file: ${key}`);

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const s3Stream = s3.getObject(params).createReadStream();

    await new Promise<void>((resolve, reject) => {
      s3Stream
        .pipe(csvParser())
        .on('data', (data: any) => {
          console.log('Parsed record:', data);
        })
        .on('end', async () => {
          const newKey = key.replace('uploaded/', 'parsed/');
          try {
            await s3.copyObject({
              Bucket: BUCKET_NAME,
              CopySource: `${BUCKET_NAME}/${key}`,
              Key: newKey,
            }).promise();

            await s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: key,
            }).promise();

            console.log(`File moved to ${newKey}`);
            resolve();
          } catch (error) {
            console.error('Error moving file:', error);
            reject(error);
          }
        })
        .on('error', (error: any) => {
          console.error('Error processing CSV stream:', error);
          reject(error);
        });
    });
  }
};