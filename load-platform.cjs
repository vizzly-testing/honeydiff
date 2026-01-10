const os = require('os');
const path = require('path');

function getPlatformBinary() {
  const platform = os.platform();
  const arch = os.arch();

  let target;
  if (platform === 'darwin' && arch === 'arm64') {
    target = 'aarch64-apple-darwin';
  } else if (platform === 'linux' && arch === 'x64') {
    target = 'x86_64-unknown-linux-gnu';
  } else if (platform === 'linux' && arch === 'arm64') {
    target = 'aarch64-unknown-linux-gnu';
  } else if (platform === 'win32' && arch === 'x64') {
    target = 'x86_64-pc-windows-msvc';
  } else {
    throw new Error(`Unsupported platform: ${platform} ${arch}. Supported: macOS ARM64, Linux x64/ARM64, Windows x64`);
  }

  const binaryPath = path.join(__dirname, 'platforms', `index-${target}.node`);
  return require(binaryPath);
}

module.exports = getPlatformBinary();
