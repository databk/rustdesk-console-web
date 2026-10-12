export default {
  'pages.servers.network.title': 'Network settings',
  'pages.servers.network.selection': 'TCP congestion control',
  'pages.servers.network.aboutTitle': 'About TCP congestion control',
  'pages.servers.network.resultDetails': 'Algorithm identification details',
  'pages.servers.network.unknown': 'Unable to identify',
  'pages.servers.network.loading': 'Identifying…',
  'pages.servers.network.multiple': 'By network template',
  'pages.servers.network.notConnected': 'Not connected',
  'pages.servers.network.notApplicable': 'TCP not used',
  'pages.servers.network.about.system':
    'Current TCP congestion control configuration in the observed network scope. Individual connections may use another algorithm.',
  'pages.servers.network.about.entry':
    'The algorithm of the connection sending screen data to the browser. With proxies, this is the final entry proxy.',
  'pages.servers.network.about.relay':
    'The algorithm of the connection sending screen data from hbbr to the web gateway.',
  'pages.servers.network.about.modify':
    'TCP congestion control is a system networking mechanism. This view only reports observations. Make changes in the relevant system, container or application.',
  'pages.servers.network.currentConfiguration':
    'The TCP congestion control algorithm used by an individual connection may differ from the system configuration.',
  'pages.servers.network.actualConnection':
    'Actual algorithm read from this sending connection.',
  'pages.servers.network.registeredAlgorithms':
    'Currently available algorithms',
  'pages.servers.network.commonAlgorithms':
    'Common system algorithms; support on this machine is unconfirmed.',
  'pages.servers.network.algorithm': 'Algorithm',
  'pages.servers.network.feature': 'Behavior',
  'pages.servers.network.suitable': 'Suitable for (measure results)',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': 'Unknown system',
  'pages.servers.network.deployment.native': 'Native deployment',
  'pages.servers.network.deployment.container': 'Container deployment',
  'pages.servers.network.deployment.kubernetes': 'Kubernetes deployment',
  'pages.servers.network.deployment.unknown': 'Unknown deployment',
  'pages.servers.network.scope.host': 'This system',
  'pages.servers.network.scope.container': 'Container network scope',
  'pages.servers.network.scope.namespace': 'Isolated network scope',
  'pages.servers.network.scope.unknown': 'Unknown observation scope',
  'pages.servers.network.reason.permission_denied':
    'The service cannot read this network scope.',
  'pages.servers.network.reason.tool_unavailable':
    'System diagnostic tools are unavailable.',
  'pages.servers.network.reason.source_unavailable':
    'System algorithm information could not be read.',
  'pages.servers.network.reason.invalid_response':
    'Algorithm information is incomplete or invalid.',
  'pages.servers.network.reason.platform_unobservable':
    "This connection's algorithm could not be read on this system.",
  'pages.servers.network.reason.namespace_unobservable':
    "The sender's network scope cannot be read.",
  'pages.servers.network.reason.proxy_unobservable':
    "The entry proxy does not report this connection's actual algorithm.",
  'pages.servers.network.reason.connection_not_found':
    'No matching sending connection was found.',
  'pages.servers.network.reason.ambiguous_connection':
    'Several connections matched; this session could not be identified.',
  'pages.servers.network.reason.not_connected':
    'The session has no active connection.',
  'pages.servers.network.reason.not_tcp': 'This path does not use TCP.',
  'pages.servers.network.reason.system_selected':
    'The system selects by network template or connection policy; a single value cannot be confirmed.',
  'pages.servers.network.guide.reno.feature': 'Slows down after packet loss',
  'pages.servers.network.guide.reno.suitable':
    'General networks prioritizing compatibility',
  'pages.servers.network.guide.cubic.feature':
    'Adjusts rate with the congestion window',
  'pages.servers.network.guide.cubic.suitable':
    'General public and high-bandwidth networks',
  'pages.servers.network.guide.bbr.feature': 'Estimates bandwidth and delay',
  'pages.servers.network.guide.bbr.suitable': 'Long-distance, high-delay paths',
  'pages.servers.network.guide.hybrid.feature':
    'Combines loss and delay signals',
  'pages.servers.network.guide.hybrid.suitable':
    'Balancing throughput and latency',
  'pages.servers.network.guide.dctcp.feature':
    'Uses ECN to detect congestion early',
  'pages.servers.network.guide.dctcp.suitable':
    'ECN-enabled data center networks',
  'pages.servers.network.guide.prague.feature':
    'Works with L4S low-delay queues',
  'pages.servers.network.guide.prague.suitable':
    'L4S-enabled networks and applications',
  'pages.servers.network.guide.delay.feature': 'Responds to queueing delay',
  'pages.servers.network.guide.delay.suitable':
    'Networks seeking shorter queues',
  'pages.servers.network.guide.background.feature':
    'Yields bandwidth to other traffic',
  'pages.servers.network.guide.background.suitable':
    'Background downloads and low-priority transfers',
  'pages.servers.network.guide.other.feature':
    'Algorithm provided by this system',
  'pages.servers.network.guide.other.suitable':
    "Refer to the system's algorithm documentation",
  'pages.servers.network.scopeLabel': 'Reading scope: ',
  'pages.servers.network.scopeContext.console':
    'Reading scope: the network environment running Console.',
  'pages.servers.network.scopeContext.node':
    'Reading scope: the network environment of the enrolled management node.',
  'pages.servers.network.managementUnavailable':
    'Server management is not connected',
  'pages.servers.network.managementSetup':
    'Connect management to view and manage hbbs and hbbr. Network information remains available.',
};
