// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import { S3 } from 'aws-sdk'
import { config } from '../src/lib/config'

const s3 = new S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
})

async function updateContentType(bucketName, prefix = '') {
  let isTruncated = true;
  let continuationToken;

  // Regular expression to match file names like 1.png, 2.png, 3.png, etc.
  const pattern = /^\d+\.png$/;

  while (isTruncated) {
    const listParams = {
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    };

    const data = await s3.listObjectsV2(listParams).promise();

    for (const item of data.Contents) {
      // Only update the ContentType for files that match the pattern
      if (pattern.test(item.Key)) {
        const copyParams = {
          Bucket: bucketName,
          CopySource: `${bucketName}/${item.Key}`,
          Key: item.Key,
          ContentType: 'image/png',
          MetadataDirective: 'REPLACE'
        };

        await s3.copyObject(copyParams).promise();
        console.log(`Updated ContentType for ${item.Key}`);
      }
    }

    isTruncated = data.IsTruncated;
    continuationToken = data.NextContinuationToken;
  }
}

updateContentType(config.aws.imageBucket)
  .then(() => console.log('Update complete'))
  .catch(err => console.error(err));
