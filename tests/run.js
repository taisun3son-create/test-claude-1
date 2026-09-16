// 検証用サーバを立てて、全スイートを順に流す。
//   node tests/run.js          全部
//   node tests/run.js tel addr 指定したものだけ
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8770;
const BASE = `http://127.0.0.1:${PORT}/`;
const ALL = ['site', 'func', 'links', 'verify', 'mini', 'carry', 'flow2', 'tel', 'addr'];

const wanted = process.argv.slice(2);
const suites = wanted.length ? wanted : ALL;
const unknown = suites.filter(s => !ALL.includes(s));
if (unknown.length) {
  console.error(`知らないスイート: ${unknown.join(', ')}\n使えるのは: ${ALL.join(' ')}`);
  process.exit(2);
}

const ping = () => new Promise(res => {
  http.get(BASE + 'index.html', r => { r.resume(); res(r.statusCode === 200); })
      .on('error', () => res(false));
});

(async () => {
  // 先にビルドして、生成物とソースがずれた状態で測らないようにする
  const built = spawnSync('python3', ['build.py'], { cwd: ROOT, encoding: 'utf-8' });
  if (built.status !== 0) {
    console.error('build.py が失敗しました\n' + (built.stderr || built.stdout));
    process.exit(1);
  }
  if (/リンク切れ: /.test(built.stdout)) { console.error(built.stdout); process.exit(1); }

  let server = null;
  if (!(await ping())) {
    server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
                   { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 40 && !(await ping()); i++) await new Promise(r => setTimeout(r, 250));
    if (!(await ping())) { console.error('検証用サーバが立ちませんでした'); process.exit(1); }
  }

  let pass = 0, fail = 0, broken = [];
  for (const s of suites) {
    const out = spawnSync('node', [path.join(__dirname, s + '.js')],
                          { cwd: ROOT, encoding: 'utf-8', env: process.env });
    const text = (out.stdout || '') + (out.stderr || '');
    const m = text.match(/(\d+)\/(\d+) passed/);
    for (const line of text.split('\n')) if (line.startsWith('FAIL')) console.log(`  ${s}: ${line}`);
    if (m) {
      pass += +m[1]; fail += +m[2] - +m[1];
      console.log(`${(+m[1] === +m[2] ? 'ok  ' : 'NG  ')}${s.padEnd(7)} ${m[0]}`);
    } else {
      broken.push(s);
      console.log(`NG  ${s.padEnd(7)} スイートが途中で落ちました`);
      console.log(text.split('\n').slice(-6).map(l => '    ' + l).join('\n'));
    }
  }

  if (server) server.kill();
  console.log(`\n合計 ${pass}/${pass + fail} passed`);
  process.exit(fail === 0 && broken.length === 0 ? 0 : 1);
})();
