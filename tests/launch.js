// Chromium の場所。ふつうの環境では `npx playwright install chromium` で入るので
// 何も指定しなくて動く。用意済みのブラウザを使いたいときだけ CHROME で渡す。
//   CHROME=/path/to/chrome node tests/site.js
module.exports = process.env.CHROME ? { executablePath: process.env.CHROME } : {};
