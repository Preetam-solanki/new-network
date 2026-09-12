import React, { useState } from 'react';
import { 
  Wifi, 
  Power, 
  Key, 
  ShieldCheck, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Users, 
  Plus, 
  Globe, 
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  FileText
} from 'lucide-react';
import { Network, UserRole } from '../types';

interface NetworkListProps {
  networks: Network[];
  selectedNetworkId: string;
  userRole: UserRole;
  onSelectNetwork: (id: string) => void;
  onToggleConnect: (id: string) => void;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenConfig: (network: Network) => void;
  onOpenAcl: (network: Network) => void;
  onOpenWanHosts: (network: Network) => void;
  onDeleteNetwork: (id: string) => void;
}

export const NetworkList: React.FC<NetworkListProps> = ({
  networks,
  selectedNetworkId,
  userRole,
  onSelectNetwork,
  onToggleConnect,
  onOpenCreate,
  onOpenJoin,
  onOpenConfig,
  onOpenAcl,
  onOpenWanHosts,
  onDeleteNetwork,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyInvite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>My Virtual Networks</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {networks.filter((n) => n.isConnected).length} Active Interfaces
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect to multiple isolated VLANs simultaneously. Each network binds to a unique WireGuard virtual interface.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJoin}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Join with Invite Code
          </button>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New VLAN</span>
          </button>
        </div>
      </div>

      {/* Network cards list */}
      <div className="grid grid-cols-1 gap-3">
        {networks.map((net) => {
          const isSelected = net.id === selectedNetworkId;

          return (
            <div
              key={net.id}
              onClick={() => onSelectNetwork(net.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left side: status toggle + name + subnet */}
                <div className="flex items-start gap-3.5">
                  {/* Interface Power Switch */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleConnect(net.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      net.isConnected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                    title={net.isConnected ? 'Disconnect Interface' : 'Connect Interface'}
                  >
                    <Power className={`w-5 h-5 ${net.isConnected ? 'animate-pulse' : ''}`} />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white">{net.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 font-bold">
                        {net.subnetCidr}
                      </span>
                      {net.isPublic ? (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3" /> Public Room
                        </span>
                      ) : (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" /> Private VLAN
                        </span>
                      )}
                      {net.gameCategory && (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                          🎮 {net.gameCategory}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 max-w-2xl">
                      {net.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>
                        Interface: <span className="font-mono text-slate-200 font-semibold">{net.interfaceName}</span>
                      </span>
                      <span>
                        Assigned VIP:{' '}
                        <span className="font-mono text-emerald-300 font-bold">
                          {net.assignedVirtualIp}
                        </span>
                      </span>
                      <span>
                        Gateway: <span className="font-mono text-slate-300">{net.gatewayIp}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: quick stats & action buttons */}
                <div className="flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-850 border border-slate-800 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        net.isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                      }`}
                    ></span>
                    <span className={net.isConnected ? 'text-emerald-300' : 'text-slate-500'}>
                      {net.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {/* Copy Invite Code button */}
                  <button
                    onClick={(e) => handleCopyInvite(net.inviteCode, e)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Copy Invite Code (${net.inviteCode})`}
                  >
                    {copiedCode === net.inviteCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span className="font-mono hidden sm:inline">{net.inviteCode}</span>
                  </button>

                  {/* WireGuard Config Export */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenConfig(net);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
                    title="Export WireGuard Config / Mobile QR Code"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  {/* WAN Host File (Admin vs Restricted) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWanHosts(net);
                    }}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      userRole === 'admin'
                        ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800 hover:bg-emerald-900/80'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                    }`}
                    title={userRole === 'admin' ? 'Open Master WAN Hosts File (/etc/hosts)' : 'WAN Host File (Admin Only)'}
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* ACL Firewall Rules */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAcl(net);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors cursor-pointer"
                    title="Configure VLAN ACL Rules"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>

                  {/* Delete/Leave */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove network "${net.name}"?`)) {
                        onDeleteNetwork(net.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-700/80 transition-colors cursor-pointer"
                    title="Leave / Delete Network"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
