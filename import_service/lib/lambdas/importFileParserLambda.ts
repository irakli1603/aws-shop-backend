import { S3Handler } from 'aws-lambda';
import { S3, SQS } from 'aws-sdk';

const csvParser = require('/opt/nodejs/csv-parser-utils');

const BUCKET_NAME = process.env.BUCKET_NAME!;
const SQS_QUEUE_NAME  = process.env.SQS_QUEUE_NAME!;
const s3 = new S3();
const sqs = new SQS();

let cachedQueueUrl: string | undefined;
const getQueueUrl = async (): Promise<string> => {
  if (cachedQueueUrl) return cachedQueueUrl;
  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: SQS_QUEUE_NAME }).promise();
  cachedQueueUrl = QueueUrl!
  return cachedQueueUrl;
}

export const handler: S3Handler = async (event) => {
  console.log('Incoming event:', event);
  const queueUrl = await getQueueUrl();

  for (const record of event.Records) {
    const key = record.s3.object.key;
    console.log(`Processing file: ${key}`);

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const s3Stream = s3.getObject(params).createReadStream();

    await new Promise<void>((resolve, reject) => {
      const sqsPromises: Promise<any>[] = [];

      s3Stream
        .pipe(csvParser())
        .on('data', (data: any) => {
          const sqsParams = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(data),
          };
          sqsPromises.push(sqs.sendMessage(sqsParams).promise());
        })
        .on('end', async () => {
          try {
            await Promise.all(sqsPromises);

            const newKey = key.replace('uploaded/', 'parsed/');
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
            console.error('Error processing CSV stream promises:', error);
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