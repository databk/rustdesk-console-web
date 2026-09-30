# 协议源码来源声明

协议输入是来自两个固定上游修订、未经修改的文件：

- message.proto：rustdesk/rustdesk@4812a9815bd3c6a93f3ad903f29504168c4930a1，路径为 libs/base/protos/message.proto。
- rendezvous.proto：rustdesk/hbb_common@229b904508364c8997aad0fb5af57effac859f60，路径为 protos/rendezvous.proto；该提交是上述原生端对应的子模块修订。

准确的仓库 URL、路径和 SHA-256 摘要见 source.json。这些固定修订用于源码生成，不代表最低支持的原生版本：认证通过的 KX 0 仍可连接并显示风险提示，支持 KX 1 的被控端会协商方向独立的密钥。固定官方 1.5.0 nightly 在最初研究阶段仅为 KX 1 验收候选；之后已经通过真实浏览器／原生端验收，准确产物与测试范围见 ../../docs/web-client/LIVE-VALIDATION-2026-09-30.md 和 ../../docs/web-client/FINAL-ACCEPTANCE-2026-09-30.md。

RustDesk 父项目提供 GNU AGPL 第 3 版许可证。LICENCE.upstream 是上述原生修订中未经修改的根目录 LICENCE，其摘要和路径同样记录在 source.json。本声明说明父项目来源，不自行推导或虚构独立的子模块许可授权。按本项目 AGPL-3.0 条款分发时，应保留上游署名、协议输入、生成器和相应项目源码。

生成的 JavaScript 与 TypeScript 声明由 scripts/generate-web-client-protocol.cjs 在本地派生。手写的传输、浏览器输入、媒体和界面由本仓库维护。历史 V1 代码仅作为协议研究参考；本项目不分发 V2 编译成品、CDN 客户端或嵌入的上游应用。
