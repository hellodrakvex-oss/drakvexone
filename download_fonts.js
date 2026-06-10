const https = require('https');
const fs = require('fs');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(download(res.headers.location));
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const regular = await download('https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf');
  const bold = await download('https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf');
  fs.writeFileSync('src/lib/reports/fonts.ts', `export const RobotoRegular = "${regular}";\nexport const RobotoBold = "${bold}";\n`);
  console.log('done');
}
run();
