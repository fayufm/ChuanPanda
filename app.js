const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 应用程序名称
const appName = '川小熊猫';

console.log(`正在启动${appName}...`);

// 检查是否是Windows系统
if (os.platform() === 'win32') {
  // 如果已经安装了Electron，则直接启动
  const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
  
  if (fs.existsSync(electronPath)) {
    console.log('使用已安装的Electron启动应用...');
    const mainJsPath = path.join(__dirname, 'main.js');
    exec(`"${electronPath}" "${__dirname}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行错误: ${error}`);
        console.log('尝试使用默认浏览器打开应用...');
        const indexPath = path.join(__dirname, 'index.html');
        exec(`start ${indexPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`执行错误: ${error}`);
            return;
          }
        });
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  } else {
    // 如果没有安装Electron，则尝试使用系统默认浏览器打开
    console.log('Electron未安装，使用默认浏览器打开应用...');
    const indexPath = path.join(__dirname, 'index.html');
    exec(`start ${indexPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行错误: ${error}`);
        return;
      }
    });
  }
} else {
  // 非Windows系统
  console.log('非Windows系统，使用默认浏览器打开应用...');
  const indexPath = path.join(__dirname, 'index.html');
  exec(`open ${indexPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行错误: ${error}`);
      return;
    }
  });
}

console.log(`${appName}已启动！`); 