// Python の呼び名を OS ごとに切り替える。Windows では python3 が使えない。
//   node tests/python.js build.py   python3 build.py と同じ
const { spawnSync } = require('child_process');

const PY = process.platform === 'win32' ? 'python' : 'python3';
module.exports = PY;

if (require.main === module) {
  const r = spawnSync(PY, process.argv.slice(2), { stdio: 'inherit' });
  process.exit(r.status === null ? 1 : r.status);
}
