'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp/lib/sharp');
const S3 = new AWS.S3();
const { basename, extname } = require('path');

module.exports.handle = async ({ Records: records }, context) => {
  try {
    await Promise.all(records.map(async Record => {
      const { key } = record.s3.object;
      const image = await S3.getObject({
        Bucket: process.env.bucket,
        key: key,
      }).promise();
      const optimized = await sharp(image.Body)
        .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toBuffer()

      await S3.putObject({
        Body: optimized,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        Key: 'compressed/${basename(key,extname(key))}'
      }).promise()

    }))

    return {
      statusCode: 301,
      body: {}
    };
  } catch (error) {
    return error;
  }
};
