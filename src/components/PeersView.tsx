import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  Copy, 
  Check, 
  Zap, 
  Radio, 
  ShieldCheck, 
  Laptop, 
  Smartphone, 
  Search, 
  Key, 
  ArrowUpRight, 
  ArrowDownLeft,
  Server,
  FolderOpen,
  FileText,
  Lock
} from 'lucide-react';
import { Peer, Network, ClientPlatform, UserRole } from '../types';
import { formatBytes } from '../utils/wireguard';

interface PeersViewProps {
  network: Network;
  peers: Peer[];
  userRole: UserRole;
  onOpenPing: (peer: Peer) => void;
  onOpenConfig: () => void;
  onOpenAcl: () => void;
  onOpenWanHosts: () => void;
}

export const PeersView: React.FC<PeersViewProps> = ({
  network,
  peers,
  userRole,
  onOpenPing,
  onOpenConfig,
  onOpenAcl,
  onOpenWanHosts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredPeers = peers.filter((peer) => {
    const matchSearch =
      peer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peer.virtualIp.includes(searchTerm) ||
      peer.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlatform = filterPlatform === 'all' || peer.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const getPlatformBadge = (platform: ClientPlatform) => {
    switch (platform) {
      case 'windows':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60 font-medium">
            🪟 Windows
          </span>
        );
      case 'linux':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
            🐧 Linux
          </span>
        );
      case 'android':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
            🤖 Android
          </span>
        );
      case 'ios':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-medium">
            🍎 iOS
          </span>
        );
      case 'macos':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            🍏 macOS
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Network Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white">{network.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {network.subnetCidr}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {network.region}
              </span>
              {network.gameCategory && (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  🎮 {network.gameCategory}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {network.description} • Host: <span className="text-slate-200 font-medium">{network.ownerName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenWanHosts}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                userRole === 'admin'
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="View WAN Master Host Resolution Table"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>WAN Host File</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                userRole === 'admin'
                  ? 'bg-emerald-900 text-emerald-200'
                  : 'bg-rose-950 text-rose-300 border border-rose-850'
              }`}>
                {userRole === 'admin' ? 'Admin' : 'Admin Only'}
              </span>
            </button>

            <button
              onClick={onOpenAcl}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>ACL & Security</span>
            </button>
            <button
              onClick={onOpenConfig}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>WireGuard Config / QR</span>
            </button>
          </div>
        </div>

        {/* Live Interface Metrics Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Your Virtual IP</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-mono font-bold text-emerald-400 text-sm">{network.assignedVirtualIp}</span>
              <button
                onClick={() => handleCopyIp(network.assignedVirtualIp)}
                className="text-slate-400 hover:text-white cursor-pointer"
                title="Copy VIP"
              >
                {copiedIp === network.assignedVirtualIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Virtual Interface</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-mono font-bold text-slate-200">{network.interfaceName} (MTU 1420)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>

          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Connected Nodes</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-bold text-slate-200">{peers.length} active peers</span>
              <span className="text-[10px] text-slate-400 font-mono">max {network.maxPeers}</span>
            </div>
          </div>

          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Firewall / ACL Policy</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-semibold text-emerald-300 capitalize">{network.aclPreset || 'gaming-safe'}</span>
              <span className="text-[10px] text-indigo-400 font-mono">eBPF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search peer name, virtual IP, endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-850 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-slate-400 text-xs">Filter:</span>
          {['all', 'windows', 'linux', 'android', 'ios'].map((os) => (
            <button
              key={os}
              onClick={() => setFilterPlatform(os)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer capitalize ${
                filterPlatform === os
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {os === 'all' ? 'All Platforms' : os}
            </button>
          ))}
        </div>
      </div>

      {/* Peer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPeers.map((peer) => (
          <div
            key={peer.id}
            className={`p-4 rounded-xl border transition-all ${
              peer.isSelf
                ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top row: Name, OS, Host/Self badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{peer.name}</span>
                  {peer.isSelf && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      THIS DEVICE
                    </span>
                  )}
                  {peer.isHost && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      HOST GATEWAY
                    </span>
                  )}
                </div>
                <div>{getPlatformBadge(peer.platform)}</div>
              </div>

              {/* Ping button & connection type pill */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenPing(peer)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-xs font-mono font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Run ICMP Virtual Ping Test"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span
                    className={
                      peer.latencyMs < 30
                        ? 'text-emerald-400'
                        : peer.latencyMs < 60
                        ? 'text-amber-300'
                        : 'text-orange-400'
                    }
                  >
                    {peer.latencyMs}ms
                  </span>
                </button>
              </div>
            </div>

            {/* Virtual IP & Endpoint Row */}
            <div className="mt-3.5 bg-slate-850/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">VIP:</span>
                <span className="text-emerald-300 font-bold">{peer.virtualIp}</span>
              </div>
              <button
                onClick={() => handleCopyIp(peer.virtualIp)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Copy IP address"
              >
                {copiedIp === peer.virtualIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Connection Mode & Protocol Details */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    peer.connectionMode === 'p2p' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-blue-400 animate-pulse'
                  }`}
                ></span>
                <span className="font-semibold text-slate-300">
                  {peer.connectionMode === 'p2p' ? 'Direct P2P (UDP Hole Punch)' : `Relay: ${peer.relayRegion || 'DERP'}`}
                </span>
              </div>

              <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={peer.endpoint}>
                {peer.endpoint}
              </span>
            </div>

            {/* Transfer Stats & Handshake */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-400">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  <span>{formatBytes(peer.rxBytes)}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <ArrowUpRight className="w-3 h-3 text-sky-400" />
                  <span>{formatBytes(peer.txBytes)}</span>
                </span>
              </div>

              <span className="text-slate-500 font-mono">Handshake: {peer.lastHandshake}</span>
            </div>

            {/* Shared Folder Link if any */}
            {peer.sharedFolder && (
              <div className="mt-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[11px]">{peer.sharedFolder}</span>
                </div>
                <button
                  onClick={() => handleCopyIp(peer.sharedFolder!)}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Copy SMB Path
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
