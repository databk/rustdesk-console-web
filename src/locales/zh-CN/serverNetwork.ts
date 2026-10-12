export default {
  'pages.servers.network.title': '网络设置',
  'pages.servers.network.selection': 'TCP 拥塞控制',
  'pages.servers.network.aboutTitle': '了解 TCP 拥塞控制',
  'pages.servers.network.resultDetails': '查看算法识别详情',
  'pages.servers.network.unknown': '无法识别',
  'pages.servers.network.loading': '正在识别…',
  'pages.servers.network.multiple': '按网络模板',
  'pages.servers.network.notConnected': '尚未连接',
  'pages.servers.network.notApplicable': '不使用 TCP',
  'pages.servers.network.about.system':
    '这里显示所读取网络范围的当前 TCP 拥塞控制配置；单条连接可能使用不同算法。',
  'pages.servers.network.about.entry':
    '负责将画面数据发送到浏览器的连接算法；经过代理时读取最后一层入口代理。',
  'pages.servers.network.about.relay':
    '负责从 hbbr 向网页网关发送画面数据的连接算法。',
  'pages.servers.network.about.modify':
    'TCP 拥塞控制属于系统底层网络机制。此处仅显示识别结果，修改需在对应系统、容器或应用中自行进行。',
  'pages.servers.network.currentConfiguration':
    '具体连接使用的 TCP 拥塞控制算法可能与系统配置不同。',
  'pages.servers.network.actualConnection': '已读取此发送连接的实际算法。',
  'pages.servers.network.registeredAlgorithms': '当前可用算法',
  'pages.servers.network.commonAlgorithms':
    '系统常见算法，本机支持情况未确认。',
  'pages.servers.network.algorithm': '算法',
  'pages.servers.network.feature': '特点',
  'pages.servers.network.suitable': '适用情况（效果需实测）',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': '系统未知',
  'pages.servers.network.deployment.native': '直接部署',
  'pages.servers.network.deployment.container': '容器部署',
  'pages.servers.network.deployment.kubernetes': 'Kubernetes 部署',
  'pages.servers.network.deployment.unknown': '部署方式未知',
  'pages.servers.network.scope.host': '本机系统',
  'pages.servers.network.scope.container': '容器网络范围',
  'pages.servers.network.scope.namespace': '独立网络范围',
  'pages.servers.network.scope.unknown': '读取范围未知',
  'pages.servers.network.reason.permission_denied':
    '当前服务无权读取此网络范围。',
  'pages.servers.network.reason.tool_unavailable': '系统诊断工具不可用。',
  'pages.servers.network.reason.source_unavailable':
    '未能读取系统提供的算法信息。',
  'pages.servers.network.reason.invalid_response':
    '返回的算法信息不完整或无效。',
  'pages.servers.network.reason.platform_unobservable':
    '无法从当前系统读取此连接的算法。',
  'pages.servers.network.reason.namespace_unobservable':
    '无法读取发送端所在的网络范围。',
  'pages.servers.network.reason.proxy_unobservable':
    '入口代理未提供此连接的实际算法。',
  'pages.servers.network.reason.connection_not_found': '未找到对应的发送连接。',
  'pages.servers.network.reason.ambiguous_connection':
    '匹配到多条连接，无法确认当前会话。',
  'pages.servers.network.reason.not_connected': '会话尚未建立有效连接。',
  'pages.servers.network.reason.not_tcp': '此链路未使用 TCP。',
  'pages.servers.network.reason.system_selected':
    '系统按网络模板或连接策略选择算法，无法确认单一值。',
  'pages.servers.network.guide.reno.feature': '丢包后降低发送速度',
  'pages.servers.network.guide.reno.suitable': '兼容性优先的常规网络',
  'pages.servers.network.guide.cubic.feature': '随拥塞窗口调整发送速度',
  'pages.servers.network.guide.cubic.suitable': '常规公网、大带宽网络',
  'pages.servers.network.guide.bbr.feature': '估算带宽和延迟',
  'pages.servers.network.guide.bbr.suitable': '跨地区、高延迟网络',
  'pages.servers.network.guide.hybrid.feature': '结合丢包和延迟调整',
  'pages.servers.network.guide.hybrid.suitable': '兼顾吞吐和延迟的网络',
  'pages.servers.network.guide.dctcp.feature': '利用 ECN 提前感知拥塞',
  'pages.servers.network.guide.dctcp.suitable': '支持 ECN 的数据中心网络',
  'pages.servers.network.guide.prague.feature': '配合 L4S 低延迟队列',
  'pages.servers.network.guide.prague.suitable': '支持 L4S 的网络和应用',
  'pages.servers.network.guide.delay.feature': '关注排队延迟',
  'pages.servers.network.guide.delay.suitable': '希望减少排队的网络',
  'pages.servers.network.guide.background.feature': '尽量让出带宽',
  'pages.servers.network.guide.background.suitable': '后台下载、低优先级传输',
  'pages.servers.network.guide.other.feature': '当前系统提供的算法',
  'pages.servers.network.guide.other.suitable': '请参考该系统的算法说明',
  'pages.servers.network.scopeLabel': '读取范围：',
  'pages.servers.network.scopeContext.console':
    '读取范围：Console 所在网络环境。',
  'pages.servers.network.scopeContext.node':
    '读取范围：登记管理节点所在网络环境。',
  'pages.servers.network.managementUnavailable': '尚未接入服务器管理接口',
  'pages.servers.network.managementSetup':
    '接入后可查看和管理 hbbs、hbbr；当前页面仍可显示网络信息。',
};
