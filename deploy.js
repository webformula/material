import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const files = await getFiles('dist');

const { Contents } = await s3.listObjects({ Bucket: 'material.webformula.io' }).promise();
if (Contents.length) {
  await s3.deleteObjects({
    Bucket: 'material.webformula.io',
    Delete: {
      Objects: Contents.map(({ Key }) => ({ Key }))
    }
  }).promise();
}


await Promise.all(files.map(async Key => {
  const Body = await readFile(`dist/${Key}`);
  const ContentEncoding = (!Key.includes('favicon.ico') && !Key.includes('material.js')) ? 'gzip' : undefined;
  const CacheControl = (!Key.includes('favicon.ico') || Key.includes('.html')) ? 'max-age=31536000' : undefined;
  const ContentType = getMimeType(Key);
  if (Key.includes('.html') && !Key.includes('index.html')) Key = Key.replace('.html', '');

  await s3.upload({
    Bucket: 'material.webformula.io',
    Key,
    Body,
    ContentEncoding,
    CacheControl,
    ContentType,
    ACL: 'public-read'
  }).promise();
}));


function getMimeType(url) {
  switch (getExtension(url)) {
    case 'js':
      return 'application/javascript';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'json':
      return 'text/json';
    case 'jpg':
      return 'image/jpeg';
    case 'ico':
      return 'image/x-icon';
    case 'woff2':
      return 'font/woff2';
  }
}

function getExtension(url) {
  if (!url.includes('.')) return '';
  const split = url.split(/[#?]/)[0].split('.');
  let ext = split.pop().trim().toLowerCase();
  if (ext === 'gz') ext = split.pop();
  return ext;
}

async function getFiles(dir = config.outdir, arr = []) {
  const files = await readdir(dir);
  await Promise.all(files.map(async file => {
    const filePath = path.join(dir, file);
    if ((await stat(filePath)).isDirectory()) return getFiles(filePath, arr);
    arr.push(filePath.replace('dist/', ''));
  }));
  return arr;
}
