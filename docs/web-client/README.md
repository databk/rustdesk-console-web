# Console Web Client 使用与维护说明

五项扩展已完成实现、生产构建及 Windows/Chrome 本机开发验收，见[操作与统一试用清单](EXTENSIONS-2026-09-30.md)和[本批验收报告](EXTENSIONS-ACCEPTANCE-2026-09-30.md)。真实 Android/iOS 与维护者试用尚未进行；首版报告对应历史产物。

首版验收结果见[最终验收报告](FINAL-ACCEPTANCE-2026-09-30.md)。已批准的首版实现与最终浏览器／原生客户端专项验收均已完成。独立审查和构建结果见[收尾审查记录](COMPLETION-REVIEW-2026-09-29.md)；更早的实测报告仍对应各自记录的产物。

Console 现已包含由项目自行维护的实验性浏览器远程桌面客户端。它不是 RustDesk 官方 V2 Web 应用。请在明确启用后，按已验证范围使用；最终验收报告列出了已测组合和保留限制。相关验收不等于正式安全认证，也不代表已经批准生产部署。

协议更新（2026-09-30，Asia/Shanghai）：身份验证通过且支持 KX 1 的被控端会协商方向独立的会话密钥。经过认证的旧 KX 0 被控端仍可连接，并持续显示不阻断连接的风险与升级提示，全屏状态也会显示。该提示不会修复旧协议的密钥／nonce 重用问题。两种握手均已有真实原生互通与最终回归证据；按批准的兼容政策，本功能仍保持实验版、默认关闭。详见 SECURITY.md 和 FINAL-ACCEPTANCE-2026-09-30.md。

当前交互见[顶部菜单与文件浮窗](TOOLBAR-2026-10-01.md)。该说明覆盖旧侧栏和剪贴板中转界面，历史报告继续对应原产物。

## 文档目录

- [VPS 验收镜像部署](VPS-DEPLOYMENT.md)：自有仓库镜像、配套后端、配置与回退。

- [五项扩展操作](EXTENSIONS-2026-09-30.md)与[本批验收](EXTENSIONS-ACCEPTANCE-2026-09-30.md)：功能边界、最终产物及统一试用清单。
- [首版最终验收](FINAL-ACCEPTANCE-2026-09-30.md)：最终产物、真实回归及验收边界。
- [真实设备测试说明](REAL-DEVICE-TESTING.md)：复现环境、配置及运行命令。
- [安全审查](SECURITY.md)：KX 兼容策略、旧版风险及应用层加固。
- [真实设备验收记录](LIVE-VALIDATION-2026-09-30.md)：持续会话、功能与资源观测。
- [输入权限恢复验收](INPUT-RECOVERY-2026-09-30.md)：撤权与恢复授权时的按下状态处理。
- [收尾审查记录](COMPLETION-REVIEW-2026-09-29.md)与[历史验证记录](VALIDATION.md)：分阶段修复及测试证据。
- [协议源码来源声明](../../vendor/rustdesk-protocol/NOTICE.md)与[第三方许可证中文导读及原文](THIRD-PARTY-NOTICES.txt)：来源、署名及许可说明。

## 功能范围

控制端支持具备安全上下文和 VP9 WebCodecs 解码能力的桌面 Chrome／Edge。Windows RustDesk 1.4.9 和 LIVE-VALIDATION-2026-09-30.md 中固定的官方 1.5.0 nightly 产物，已分别验证 KX 0 和 KX 1；不能据此推断所有使用相同版本号的二进制都已通过验证。

每个页面支持一个桌面会话，仅通过中继传输，提供画面显示、鼠标键盘操作、远端光标和双向文本剪贴板。本机内容在聚焦画面后直接粘贴；远端文字/受支持 PNG 在前台、聚焦且权限允许时同步到本机剪贴板，浏览器拒绝时提供轻量点击复制。浏览器／系统保留快捷键和本地输入法的限制，通过明确的“发送文本”操作提供可用路径。

本次扩展接入音频、独立文件会话、PNG/RGBA 剪贴板、多显示器选择及移动触控。能力、资源上限与未验证平台见扩展说明。直连／P2P、WebRTC、任意指定服务器、匿名 Console 入口和官方 V2 成品资源仍不在范围内。

## 启用配置

在后端设置以下环境变量，不要写入前端构建配置：

    WEB_CLIENT_ENABLED=true
    WEB_CLIENT_ID_SERVER_URL=wss://rd.example.com/id
    WEB_CLIENT_RELAY_SERVER_URL=wss://rd.example.com/relay
    WEB_CLIENT_SERVER_PUBLIC_KEY=<hbbs 的 id_ed25519.pub 文件完整内容>

服务器公钥必须是规范的 base64 编码，解码后恰好为 32 字节。这里不能填写 id_ed25519 私钥、设备密码或 Console JWT。功能开关默认关闭。启用后，配置校验会拒绝缺失公钥、非 WSS 地址、URL 中的用户凭据、空白字符、查询参数和片段。hbbs 通告的中继主机名必须与配置的中继 WSS 主机名一致；浏览器始终连接配置地址，不采用被控端提供的路径或端口。

GET /api/web-client/config 复用现有 JWT 与令牌撤销校验，响应设置 Cache-Control: no-store，只返回 enabled 和三个公开配置字段。关闭时返回 enabled: false；开启但配置无效时返回不含敏感细节的 503；匿名请求返回 401。普通登录用户输入 ID 不需要 devices.view 权限，页面不会查询设备元数据或自动纳管目标。可见设备快捷入口只传递已经可见的设备 ID，原生连接入口仍保留。

Console 登录控制页面和公开配置的访问；Windows 被控端仍通过自己的密码或本机确认决定是否接受连接。Console 权限不是 WSS 授权网关，也不替代原生远控鉴权。关闭开关会影响新入口和新配置获取，不会集中撤销已经建立的原生会话。

## TLS 与反向代理

前端必须通过 HTTPS 提供服务。WSS 使用浏览器信任的证书终止 TLS，再转发到 hbbs WebSocket（通常为 21118）和 hbbr WebSocket（通常为 21119）。以下配置可放入已有的 TLS server 中：

    location = /id {
        proxy_pass http://hbbs:21118/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 130s;
        proxy_send_timeout 130s;
    }
    location = /relay {
        proxy_pass http://hbbr:21119/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 130s;
        proxy_send_timeout 130s;
    }

这里执行普通协议转发，不做转码，也不需要修改原生应用。原生客户端仍使用正常的原生服务端口和公钥。请确保 hbbs／hbbr 通告的主机名与浏览器 DNS 解析一致，不要通过关闭身份校验或 TLS 校验绕过不匹配问题。

生产构建使用项目已安装的同一套 Mako 编译器，生成带内容哈希、依赖完整打包的 Worker，并包含 sodium 运行时。scripts/write-web-client-manifest.cjs 在 max build 之后运行：若缺少该步骤，Mako 0.11.10 会保留不带哈希的 Worker URL，Umi granularChunks 还可能移除其依赖。页面以 no-store 获取 web-client-worker.json，只加载其中经过校验的同源文件名。发布时必须同时提供 manifest 和它引用的 Worker；请使用 npm run build，不要只执行 max build。

运行时不下载官方 V2 二进制，也不依赖外部 CDN。JavaScript 应使用正确的 JavaScript MIME；若有独立 WASM 文件，应使用 application/wasm。Nginx 模板对缺失的静态 JS／WASM 返回 404，不会退回 SPA 页面。部署 CSP 时，connect-src 应允许已配置的 WSS 主机，worker-src 应允许同源 Worker，脚本策略应允许所需的 WebAssembly 编译。请将这些要求合并进完整且经过验证的应用 CSP，不要直接复制不完整的策略。

## 构建与维护

需要可重复的原生互通和持续传帧检查时，参照 REAL-DEVICE-TESTING.md，并使用 scripts/web-client/validate-session.cjs。报告会脱敏，并明确断言实际协商协议和实际画面尺寸。

    npm ci --legacy-peer-deps
    npm run web-client:protocol:check
    npm run lint
    npm test -- --runInBand --runTestsByPath src/features/web-client/core/session.test.ts
    npm run build
    docker build -t rustdesk-console-web:web-client-local .

当前验收分支基于官方 main 的 1.6.0 依赖，沿用其 Dockerfile 的 npm ci --legacy-peer-deps 安装方式；历史本机报告中的依赖安装结论对应旧基线。Docker 分层先安装依赖、后复制完整源码，因此源码复制后会重新执行 npm run postinstall，生成完整的 Umi 类型，再执行生产构建及检查。不要将锁定协议输入替换成上游 master 上会变化的文件。协议生成命令为 npm run web-client:protocol；source.json 分别记录固定的原生端与公共库修订、上游路径、输入哈希和父仓库许可证哈希。生成文件只能通过该生成器更新。

源码来源：rustdesk/rustdesk 提交 4812a9815bd3c6a93f3ad903f29504168c4930a1 的 libs/base/protos/message.proto，以及其 hbb_common 子模块提交 229b904508364c8997aad0fb5af57effac859f60 的 protos/rendezvous.proto。准确来源见 vendor/rustdesk-protocol/NOTICE.md、source.json 和 LICENCE.upstream。生产许可证说明也从这些输入生成，不另行硬编码修订号。历史 V1 提交 212e8e755954ec48ad39517ea0688711f8c146ef 的代码仅用于协议研究。

| 依赖 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| protobufjs | 8.8.0 | BSD-3-Clause | 协议线格式编码与解码 |
| protobufjs-cli | 2.7.0 | BSD-3-Clause | 本地协议代码生成 |
| libsodium-wrappers | 0.8.4 | ISC | 签名校验、box 密钥交换与 secretbox 加密 |
| fzstd | 0.1.1 | MIT | 有界的剪贴板／光标数据解压 |

第三方许可证完整原文见 THIRD-PARTY-NOTICES.txt；间接依赖版本同样由锁文件固定。分发本 AGPL 项目时应保留声明，并提供相应项目源码。

## 失败处理与资源边界

- 签名或目标不匹配、缺少加密握手、解密失败、nonce 重放都会终止连接，不回退到明文。
- 取消连接会使待完成的握手与密码操作失效。在原生端仍允许输入时，失焦和清理会排队发送按键／鼠标释放事件。撤销的权限恢复后，会话先释放此前成功发送但仍被持有的输入，再重新启用页面；禁止期间的操作不会重放。权限持续关闭时，原生端仍可能保持按下状态。KX 0／1 实测结果和限制见 INPUT-RECOVERY-2026-09-30.md。退出时会清理解码帧、待触发定时器、套接字和 Worker。
- 每个会话最多跟踪 256 个不同的按键和三个鼠标按钮。重复按下不会增加状态数量；新的按下事件超过上限时，会在发送前终止会话。断开／重连不会将这些状态带入其他会话。
- 页面和 Worker 通过 generation 拒绝旧会话事件、帧和渲染确认。账号／配置变化以及会话退出会清除保留的密码与剪贴板界面内容。
- 替换 Console 令牌时，会在新账号请求完成前清除旧身份。页面退出会立即移除旧界面数据，再允许排队中的释放和会话清理执行，最后终止 Worker；匹配的确认或一秒截止时间会结束该交接。网络故障或整个浏览器退出后，无法保证输入事件一定送达。
- 组合鼠标键跟随 PointerEvent 的 buttons 状态。Web Client 登录深链会保留目标 ID，普通登录用户无需管理权限也能返回该入口。
- 单个二进制包上限为 8 MiB；传输队列上限为 16 MiB／64 个包。解码任务上限为 8 个批次、每批 16 帧、排队 32 帧；向界面传递时最多保留一个尚未确认的帧和一个可被替换的待发送帧。
- 显示元数据和解码输出都有尺寸／像素数量上限。这些是防御性限制，不是浏览器解码器／GPU 内存保证，也不构成新增分辨率支持声明，详见 SECURITY.md。
- 文本使用 UTF-8，最多 1 MiB。解压前检查 Zstandard 声明的输出和历史窗口大小；PNG/RGBA 使用独立图片边界，文件只走独立原生认证会话；忽略不支持的格式。远端变化按内容去重并串行写回，避免回声循环；失焦或撤权使后续队列与旧转换失效，但浏览器已受理的写入不能撤回。
- 错误密码允许在有限次数内重试。浏览器／VP9 不支持、设备离线、权限限制和传输错误都有明确状态。原生连接管理器的前一个进程退出期间，可能拒绝立即重连；待其关闭后再重试。
- 120 秒鉴权截止时间覆盖等待首个 challenge 和原生端“仅本机确认”流程。保活包及重复的 No Password Access 提示不会延长该期限。该特定上游提示表示等待被控端用户处理，不是拒绝连接，也不是免密码绕过。

## 回退

设置 WEB_CLIENT_ENABLED=false 并重启后端。已有原生客户端和原生连接入口保持原行为。新前端搭配旧后端、配置路由不存在时，会显示功能不可用。本功能不引入数据库迁移。如需移除，仅回退此功能对应的改动，不要重置包含其他工作成果的工作树。
