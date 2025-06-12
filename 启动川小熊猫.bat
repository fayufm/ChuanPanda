@echo off
echo 正在启动川小熊猫应用程序...
echo.

:: 获取当前脚本所在目录
cd /d "%~dp0"

:: 检查是否安装了Electron
if exist "node_modules\.bin\electron.cmd" (
    echo 使用Electron启动...
    call node_modules\.bin\electron.cmd .
) else (
    :: 检查是否安装了Node.js
    where node >nul 2>nul
    if %errorlevel% equ 0 (
        echo 使用Node.js启动...
        node app.js
    ) else (
        :: 如果Node.js也未安装，则尝试使用默认浏览器打开
        echo Node.js未找到，尝试使用默认浏览器打开...
        
        if exist "index.html" (
            start index.html
        ) else (
            echo 错误: 找不到应用程序入口文件!
            echo 请确保您在正确的目录中运行此脚本。
            pause
            exit /b 1
        )
    )
)

echo.
echo 川小熊猫已启动!
timeout /t 3 