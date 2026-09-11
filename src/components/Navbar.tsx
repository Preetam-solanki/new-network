import React from 'react';
import { 
  Network as NetworkIcon, 
  ShieldCheck, 
  Wifi, 
  Monitor, 
  Smartphone, 
  Server, 
  Activity, 
  Compass, 
  Radio, 
  FolderOpen,
  Sliders,
  Laptop
} from 'lucide-react';
import { Network, ClientPlatform } from '../types';

interface NavbarProps {
  activeTab: 'networks' | 'directory' | 'lan_games' | 'files' | 'architecture' | 'acls';
  setActiveTab: (tab: 'networks' | 'directory' | 'lan_games' | 'files' | 'architecture' | 'acls') => void;
  networks: Network[];
  clientPlatform: ClientPlatform;
  setClientPlatform: (os: ClientPlatform) => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  networks,
  clientPlatform,
  setClientPlatform,
  isMobilePreview,
  setIsMobilePreview,
  onOpenCreate,
  onOpenJoin,
}) => {
  const connectedNetworks = networks.filter((n) => n.isConnected);
  const totalPeersCount = connectedNetworks.reduce((acc, n) => acc + (n.isConnected ? 6 : 0), 0);

  const getPlatformIcon = (os: ClientPlatform) => {
    switch (os) {
      case 'windows': return '🪟 Windows';
      case 'linux': return '🐧 Linux';
      case 'android': return '🤖 Android';
      case 'ios': return '🍎 iOS';
      case 'macos': return '🍏 macOS';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-md">
      {/* Top tier: Brand, Interfaces, Client OS Switcher, View Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black shadow-inner">
            <NetworkIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                V-WAN <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">v2.4 Core</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                WireGuard Mesh Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Cross-Platform Virtual VLAN • Low-Latency LAN Gaming & P2P Tunneling
            </p>
          </div>
        </div>

        {/* Live Interface VIP Badges */}
        <div className="hidden lg:flex items-center gap-2">
          {connectedNetworks.length > 0 ? (
            connectedNetworks.slice(0, 2).map((net) => (
              <div
                key={net.id}
                className="flex items-center gap-1.5 text-xs bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-md text-slate-200"
                title={`${net.name} (${net.subnetCidr})`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
                <span className="font-mono text-slate-400 font-semibold">{net.interfaceName}:</span>
                <span className="font-mono text-emerald-300 font-bold">{net.assignedVirtualIp}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1.5 text-xs bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-md text-slate-400">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>No virtual interfaces active</span>
            </div>
          )}
          {connectedNetworks.length > 2 && (
            <span className="text-xs text-slate-400 font-mono">+{connectedNetworks.length - 2} more</span>
          )}
        </div>

        {/* Client OS Target Switcher & Mobile Simulator Toggle */}
        <div className="flex items-center gap-2">
          {/* OS Switcher dropdown/pills */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px] px-1 hidden sm:inline flex items-center gap-1">
              <Laptop className="w-3 h-3" /> Client:
            </span>
            {(['windows', 'linux', 'android', 'ios'] as ClientPlatform[]).map((os) => (
              <button
                key={os}
                onClick={() => setClientPlatform(os)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  clientPlatform === os
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {getPlatformIcon(os)}
              </button>
            ))}
          </div>

          {/* Desktop / Mobile Frame View Switcher */}
          <button
            onClick={() => setIsMobilePreview(!isMobilePreview)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMobilePreview
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMobilePreview ? 'Switch to Desktop Layout' : 'Simulate Mobile Flutter / React-Native App'}
          >
            {isMobilePreview ? (
              <>
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Mobile App View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5 gap-2 scrollbar-none">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('networks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'networks'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>My Networks</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                {connectedNetworks.length}/{networks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Public Rooms Directory</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                Radmin Style
              </span>
            </button>

            <button
              onClick={() => setActiveTab('lan_games')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'lan_games'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LAN Game Discovery (mDNS)</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'files'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>P2P File Sharing & SMB</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'bg-slate-800 text-indigo-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Go Control Plane & DERP Hub</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={onOpenJoin}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Join Network</span>
            </button>
            <button
              onClick={onOpenCreate}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Create VLAN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
