import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Server, 
  Lock, 
  Plus, 
  Trash2, 
  Terminal, 
  Globe, 
  FileText, 
  AlertTriangle,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { Network, Peer, UserRole, WanHostEntry } from '../types';
import { generateWanHostsFile } from '../utils/wireguard';

interface WanHostFileModalProps {
  network: Network | null;
  peers: Peer[];
  userRole: UserRole;
  onSwitchToAdmin: () => void;
  onClose: () => void;
}

export const WanHostFileModal: React.FC<WanHostFileModalProps> = ({
  network,
  peers,
  userRole,
  onSwitchToAdmin,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'mappings' | 'add' | 'deploy'>('preview');
  const [copied, setCopied] = useState(false);
  const [customEntries, setCustomEntries] = useState<WanHostEntry[]>([
    {
      id: 'custom-1',
      ip: '10.147.19.100',
      hostname: 'dedicated-gameserver.vwan.lan',
      aliases: ['gameserver', 'valheim-box'],
      description: 'Dedicated 24/7 Game Server VM',
    },
    {
      id: 'custom-2',
      ip: '10.147.19.200',
      hostname: 'nas-storage.vwan.lan',
      aliases: ['nas', 'backup-vault'],
      description: 'TrueNAS Virtual Storage Target',
    },
  ]);

  // Form states for adding custom entry
  const [newIp, setNewIp] = useState('');
  const [newHostname, setNewHostname] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const hostsContent = useMemo(() => {
    if (!network) return '';
    return generateWanHostsFile(network, peers, customEntries);
  }, [network, peers, customEntries]);

  if (!network) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hostsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([hostsContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vwan-${network.interfaceName || 'hosts'}.hosts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim() || !newHostname.trim()) return;

    const entry: WanHostEntry = {
      id: `custom-${Date.now()}`,
      ip: newIp.trim(),
      hostname: newHostname.trim().toLowerCase(),
      aliases: newAliases.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      description: newDescription.trim() || 'Custom WAN Host',
    };

    setCustomEntries((prev) => [...prev, entry]);
    setNewIp('');
    setNewHostname('');
    setNewAliases('');
    setNewDescription('');
    setActiveTab('preview');
  };

  const handleDeleteCustomEntry = (id: string) => {
    setCustomEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // If user is a standard user, render Access Denied guard
  if (userRole !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-900/60 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span>WAN Host File — Access Restricted</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase font-semibold">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Security Policy: Confidential Master WAN Infrastructure
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Standard User Privilege Restriction (Current Role: Standard LAN User)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The <strong className="text-white">WAN Host File</strong> (`/etc/hosts`) contains sensitive master routing tables, internal gateway sockets, and cryptographic node names across the entire virtual wide area network.
              </p>
              <div className="pt-2 border-t border-slate-850 text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>
                  <span>Standard Users: Can access their own client connection config (`wg0.conf`) and own LAN files.</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Standard Users: Restricted from viewing, editing, or exporting the central WAN host file.</span>
                </div>
              </div>
            </div>

            {/* Authenticate as admin section */}
            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Network Administrator Elevation</span>
                </div>
                <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  Authorized Admin
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                If you are the network creator or sysadmin for <strong className="text-slate-200">{network.name}</strong>, switch to Administrator mode to inspect and download the WAN hosts file.
              </p>

              <button
                onClick={() => {
                  onSwitchToAdmin();
                }}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Elevate Privileges to Network Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin View: Full WAN Master Hosts File Management Suite
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm">
                  Master WAN Host File (`/etc/hosts`)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ADMIN ACCESS GRANTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Network: <span className="text-slate-200 font-medium">{network.name}</span> ({network.subnetCidr}) • Gateway: <span className="text-emerald-300 font-mono">{network.gatewayIp}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-emerald-400 font-semibold border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hosts File Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('mappings')}
              className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'mappings'
                  ? 'bg-slate-800 text-emerald-400 font-semibold border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Host Mappings ({peers.length + customEntries.length + 2})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add'
                  ? 'bg-slate-800 text-emerald-400 font-semibold border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Static WAN Host</span>
            </button>

            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deploy'
                  ? 'bg-slate-800 text-emerald-400 font-semibold border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>OS Install Guide</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .hosts</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center justify-between">
                <span>
                  <strong>Admin Status:</strong> This file maps all virtual peers to easily remembered internal hostnames (e.g. `alex-pc.vwan`, `odinhost-de.vwan`).
                </span>
                <span className="font-mono text-[10px] text-emerald-400">UTF-8 Unix Line Endings</span>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <pre className="p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed select-text">
                  {hostsContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'mappings' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                Active DNS resolution records automatically synthesized from connected peers and custom WAN server records.
              </p>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Virtual IP</th>
                      <th className="px-3 py-2.5">Primary Hostname (FQDN)</th>
                      <th className="px-3 py-2.5">Aliases</th>
                      <th className="px-3 py-2.5">Type / Node</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {/* Gateway */}
                    <tr className="bg-slate-900/50">
                      <td className="px-3 py-2.5 text-emerald-400 font-bold">{network.gatewayIp}</td>
                      <td className="px-3 py-2.5 text-slate-100">gateway.vwan.internal</td>
                      <td className="px-3 py-2.5 text-slate-400">vwan-gateway</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
                          WAN Gateway
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 font-sans text-[10px]">
                        Permanent
                      </td>
                    </tr>

                    {/* Peers */}
                    {peers.map((peer) => {
                      const peerSlug = peer.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                      return (
                        <tr key={peer.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="px-3 py-2.5 text-sky-400">{peer.virtualIp}</td>
                          <td className="px-3 py-2.5 text-slate-200">{peerSlug}.vwan.lan</td>
                          <td className="px-3 py-2.5 text-slate-400">{peerSlug}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {peer.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-500 font-sans text-[10px]">
                            Peer Node
                          </td>
                        </tr>
                      );
                    })}

                    {/* Custom entries */}
                    {customEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-850/40 transition-colors bg-indigo-950/10">
                        <td className="px-3 py-2.5 text-amber-400">{entry.ip}</td>
                        <td className="px-3 py-2.5 text-slate-100">{entry.hostname}</td>
                        <td className="px-3 py-2.5 text-slate-400">{entry.aliases.join(', ') || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px]">
                            {entry.description}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-sans">
                          <button
                            onClick={() => handleDeleteCustomEntry(entry.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddCustomEntry} className="space-y-4 max-w-lg">
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-slate-300 text-xs">
                Add static entries to the WAN hosts file for dedicated virtual game servers, NAS file servers, or homelab VMs.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Virtual IP (within {network.subnetCidr})
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10.147.19.50"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fully Qualified Domain Name (FQDN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. minecraft-dedicated.vwan.lan"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Short Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mc-server, mc, survival"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Service Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Tick Rate Minecraft Survival Node"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save to Master WAN Hosts</span>
              </button>
            </form>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>🪟 Windows Deployment</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    C:\Windows\System32\drivers\etc\hosts
                  </span>
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300 space-y-1">
                  <p className="text-slate-500"># Run in Administrator PowerShell to append WAN entries:</p>
                  <p className="select-all">
                    Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value (Get-Content "{network.interfaceName}.hosts" -Raw)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>🐧 Linux & Steam Deck Deployment</span>
                  <span className="font-mono text-[10px] text-slate-400">/etc/hosts</span>
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1">
                  <p className="text-slate-500"># Append V-WAN hosts to local resolution table:</p>
                  <p className="select-all">
                    cat {network.interfaceName}.hosts | sudo tee -a /etc/hosts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>🍏 macOS Deployment</span>
                  <span className="font-mono text-[10px] text-slate-400">/etc/hosts</span>
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-slate-500"># Append and flush DNS cache on macOS:</p>
                  <p className="select-all">
                    cat {network.interfaceName}.hosts | sudo tee -a /etc/hosts && sudo dscacheutil -flushcache
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin-only file. Standard users cannot view or download this file.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
