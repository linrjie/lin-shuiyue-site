import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [url, selector, output = 'section-preview.png', widthArg = '1440', heightArg = '1000', waitArg = '700', clickSelector] = process.argv.slice(2);
const viewportWidth = Number(widthArg);
const viewportHeight = Number(heightArg);
const settleTime = Number(waitArg);
if (!url || !selector) {
  throw new Error('Usage: node tools/capture-section.mjs <url> <selector> [output]');
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const profilePath = path.resolve('tmp', `cdp-profile-${Date.now()}`);
const safeTmpRoot = path.resolve('tmp') + path.sep;
if (!profilePath.startsWith(safeTmpRoot)) throw new Error('Unsafe temporary profile path');

fs.mkdirSync(profilePath, { recursive: true });
const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-prefers-reduced-motion=no-preference',
  '--no-first-run',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profilePath}`,
  `--window-size=${viewportWidth},${viewportHeight}`,
  'about:blank'
], { stdio: 'ignore' });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === 'page');
      if (page) return page;
    } catch {
      // Browser is still starting.
    }
    await delay(125);
  }
  throw new Error('Unable to connect to Edge debugging target');
}

let socket;
try {
  const target = await getPageTarget();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await call('Runtime.enable');
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 1,
    mobile: viewportWidth < 700
  });
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  });
  await call('Page.navigate', { url });
  await delay(700);
  if (clickSelector) {
    await call('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(clickSelector)})?.click()`
    });
    await delay(400);
  }
  await call('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'start',behavior:'instant'})`
  });
  await delay(settleTime);
  const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(path.resolve(output), Buffer.from(screenshot.data, 'base64'));
  console.log(path.resolve(output));
} finally {
  socket?.close();
  edge.kill();
  await delay(250);
  fs.rmSync(profilePath, { recursive: true, force: true });
}
