# VPS 验收镜像

本次交付面向 Ubuntu amd64；前后端分别发布到 ghcr.io/yardbirds0/rustdesk-console-web 与 ghcr.io/yardbirds0/rustdesk-console，源码分支均为 web-client-v2-acceptance。每个仓库的“Web Client 验收镜像”Actions 运行成功后，摘要提供该次源码对应的固定标签和镜像摘要。

完整的配置、已有数据保留、HTTPS/WSS、Compose 覆盖文件、升级及回退步骤，统一见[后端部署说明](https://github.com/yardbirds0/rustdesk-console/blob/web-client-v2-acceptance/deploy/web-client/README.md)。请使用配套前后端，保留原有 JWT_SECRET、数据卷及反向代理配置。

镜像是在官方 main 基线上移植本次功能后重新构建的。历史 EXTENSIONS-ACCEPTANCE-2026-09-30.md 中的 144 项测试和 Worker 哈希对应原工作区产物；新镜像的测试结果和 Worker 哈希以该次 Actions 运行及 frontend-image-evidence 工件为准，不能将两者视为同一二进制。

镜像提供 E1–E5 的服务器验收入口，操作清单见 EXTENSIONS-2026-09-30.md。真实移动设备、VPS 网络与 TLS、实际音频听感和长期会话仍需按报告中的未验证范围验收；不包含 P2P 或 WebRTC。
