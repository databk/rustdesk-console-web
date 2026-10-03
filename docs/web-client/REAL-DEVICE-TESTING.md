# 可重复的真实设备会话验证

使用 Node 24 和项目锁定的依赖。该测试工具驱动由生产会话／Worker／媒体模块构建的私有冒烟测试入口，验证原生互通、持续传帧、画面尺寸和会话清理。生产 Console 的登录、设备可见性、全屏／输入界面以及部署测试需要单独执行，不能用冒烟页面通过代替这些验收。

## 准备环境

1. 执行 node scripts/build-web-client-smoke.cjs 构建私有入口。文件写入被 Git 忽略的 node_modules/.cache/web-client-smoke，不进入生产 dist 目录。
2. 通过 HTTPS 提供该目录，并设置正确的 HTML／JavaScript MIME。使用测试浏览器信任的证书，并配置可用的 ID 服务和中继服务 WSS 路由。服务配置契约见 README.md。
3. 使用独立配置目录启动 Chrome 或 Edge，调试端口仅监听本机回环地址，例如 9222。不要使用日常浏览器的配置目录。测试工具只创建并关闭自己的新标签页，不负责启动／终止浏览器，不修改原生配置，也不安装证书。
4. 准备已获授权的 Windows RustDesk 被控端，在桌面显示持续变化的合成测试画面，并将实际分辨率设为验收尺寸。工具检查解码后 canvas 的实际尺寸，不采用向操作系统申请的尺寸作为结果。连续 45 秒没有新帧会判定失败，因此完全静止的桌面不适合此项持续传帧检查。

将私有连接配置保存在被版本控制忽略的本地文件中，例如 node_modules/.cache/web-client-session.json：

~~~json
{
  "id": "YOUR_TEST_DEVICE_ID",
  "profile": {
    "idServerUrl": "wss://your-test-server.example/id",
    "relayServerUrl": "wss://your-test-server.example/relay",
    "serverPublicKey": "YOUR_SERVER_PUBLIC_KEY"
  }
}
~~~

通过 WEB_CLIENT_TEST_PASSWORD 环境变量提供测试设备密码，也可以在该私有 JSON 文件中提供 password 字符串。如果两者都没有配置，请在原生鉴权截止时间内到被控端批准连接。配置中不得放入 Console JWT 或服务器私钥。工具只向 Worker 发送三个公开服务配置字段；测试密码不得进入版本控制。

## 执行验证

~~~sh
node scripts/web-client/validate-session.cjs --config node_modules/.cache/web-client-session.json --page https://your-test-server.example/ --browser http://127.0.0.1:9222 --kx 1 --seconds 1800 --cycles 10 --width 1920 --height 1080
~~~

经过认证的旧协议被控端使用 --kx 0；经过认证的新协议被控端使用 --kx 1。这是对实际协商结果的断言，不是强制协议或允许降级的开关；实际结果不匹配时验证失败。每个浏览器／原生端组合应单独执行，并记录准确版本。

默认报告写入 node_modules/.cache/web-client-validation/。可使用 --output PATH 指定新的报告文件；已存在的文件不会被覆盖。配置、鉴权、协议、分辨率、持续传帧或调试连接失败时，命令以非零状态退出。完整参数见 --help。

开发测试工具时可以使用短时长和少量循环，但五秒检查不满足三十分钟验收要求。

## 证据与清理

报告包含浏览器／原生端版本、实际 KX、真实画面尺寸、鉴权／首帧耗时、帧计数、队列指标、时间戳和成功／失败状态，不包含目标 ID、被控端名称、密码、密钥、剪贴板文本、光标图像或屏幕截图。工具有意省略 CDP 异常详情，因为被执行的表达式可能含有测试凭据。报告在运行期间持续更新，只有完整时长成功执行并断开连接后，才会设置 complete: true。

测试页面绘制后立即关闭帧并发送确认。页面中的事件历史属于测试观测数据，因此测得的该页面堆内存不等于生产应用内存占用。CPU、操作系统内存、Worker 底层内存和网络流量需要另行测量；记录并发情况、观测方式，以及流量字节数是否包含 TCP／TLS 开销。

完成测试后，停止自己启动的隔离服务／浏览器，并恢复准备环境时修改的原生配置和显示模式。该工具只清理自己的页面与会话。部分完成的报告、候选版本字符串、加密单元测试或合成视频样本，都不能作为完整真实设备验收矩阵通过的证据。
