import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, Plus, Trash2, Lock, Sliders, Check } from 'lucide-react';
import { Network, ACLRule } from '../types';

interface AclSettingsModalProps {
  network: Network | null;
  onSave: (updatedNetwork: Network) => void;
  onClose: () => void;
}

export const AclSettingsModal: React.FC<AclSettingsModalProps> = ({
  network,
  onSave,
  onClose,
}) => {
  if (!network) return null;

  const [preset, setPreset] = useState<'full-mesh' | 'gaming-safe' | 'host-only' | 'custom'>(
    network.aclPreset || 'gaming-safe'
  );
  const [rules, setRules] = useState<ACLRule[]>(network.aclRules || []);
  const [bandwidthCap, setBandwidthCap] = useState<number>(network.bandwidthCapMbps || 0);

  // New rule inputs
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'allow' | 'block'>('allow');
  const [newRuleProto, setNewRuleProto] = useState<'all' | 'tcp' | 'udp' | 'icmp'>('udp');
  const [newRulePorts, setNewRulePorts] = useState('');

  const handleApplyPreset = (p: 'full-mesh' | 'gaming-safe' | 'host-only' | 'custom') => {
    setPreset(p);
    if (p === 'full-mesh') {
      setRules([
        {
          id: 'rule-fm-1',
          name: 'Allow All Peer Traffic',
          action: 'allow',
          protocol: 'all',
          source: 'any',
          destination: 'any',
          description: 'Full uninhibited LAN mesh for games and file sharing',
        },
      ]);
    } else if (p === 'gaming-safe') {
      setRules([
        {
          id: 'rule-gs-1',
          name: 'Allow ICMP Echo (Ping)',
          action: 'allow',
          protocol: 'icmp',
          source: 'any',
          destination: 'any',
          description: 'Permits ping test diagnostics between peers',
        },
        {
          id: 'rule-gs-2',
          name: 'Allow High Ports (Gaming UDP 1024-65535)',
          action: 'allow',
          protocol: 'udp',
          portRange: '1024-65535',
          source: 'any',
          destination: 'any',
          description: 'Allows multiplayer discovery and game packets',
        },
        {
          id: 'rule-gs-3',
          name: 'Block Windows SMB / NetBIOS (Ports 139, 445)',
          action: 'block',
          protocol: 'tcp',
          portRange: '139,445',
          source: 'any',
          destination: 'any',
          description: 'Protects user local files from untrusted public peers',
        },
      ]);
    } else if (p === 'host-only') {
      setRules([
        {
          id: 'rule-ho-1',
          name: 'Allow Peer to Host Only',
          action: 'allow',
          protocol: 'all',
          source: 'any',
          destination: network.gatewayIp,
          description: 'Peers can only communicate with the dedicated gateway',
        },
        {
          id: 'rule-ho-2',
          name: 'Block Peer-to-Peer Cross Talk',
          action: 'block',
          protocol: 'all',
          source: 'any',
          destination: network.subnetCidr,
          description: 'Isolates client devices from seeing each other',
        },
      ]);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: ACLRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      action: newRuleAction,
      protocol: newRuleProto,
      portRange: newRulePorts.trim() || undefined,
      source: 'any',
      destination: 'any',
      description: 'Custom firewall rule applied to virtual interface',
    };

    setRules([...rules, newRule]);
    setPreset('custom');
    setNewRuleName('');
    setNewRulePorts('');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    setPreset('custom');
  };

  const handleSave = () => {
    onSave({
      ...network,
      aclPreset: preset,
      aclRules: rules,
      bandwidthCapMbps: bandwidthCap,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                VLAN Access Control Lists (ACL) & Security
              </h3>
              <p className="text-xs text-slate-400">
                Network: <span className="text-white font-semibold">{network.name}</span> ({network.subnetCidr})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Security Policy Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('gaming-safe')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  preset === 'gaming-safe'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Gaming-Safe</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Recommended for public rooms. Allows UDP games, blocks SMB/NetBIOS ports.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('full-mesh')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  preset === 'full-mesh'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Full Mesh LAN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  For trusted friends. All ports, files, and discovery protocols fully open.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('host-only')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  preset === 'host-only'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Host-Only / Star</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Client isolation. Peers can only speak to host gateway ({network.gatewayIp}).
                </p>
              </button>
            </div>
          </div>

          {/* Active Rules List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Active Filter Rules ({rules.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Evaluated Top-Down by WireGuard Kernel/eBPF
              </span>
            </div>

            <div className="space-y-2">
              {rules.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                  No ACL rules defined. Default policy: Allow all traffic.
                </div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2.5 rounded-lg bg-slate-850 border border-slate-700/80 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          rule.action === 'allow'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {rule.action}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{rule.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            [{rule.protocol.toUpperCase()}{rule.portRange ? ` : ${rule.portRange}` : ''}]
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{rule.description}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Custom Rule */}
          <form onSubmit={handleAddRule} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Add Custom Packet Filter Rule</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Rule Name (e.g. Block Port 80)"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="col-span-1 sm:col-span-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <select
                value={newRuleAction}
                onChange={(e) => setNewRuleAction(e.target.value as any)}
                className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="allow">ALLOW</option>
                <option value="block">BLOCK</option>
              </select>

              <select
                value={newRuleProto}
                onChange={(e) => setNewRuleProto(e.target.value as any)}
                className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="udp">UDP</option>
                <option value="tcp">TCP</option>
                <option value="icmp">ICMP (Ping)</option>
                <option value="all">ANY PROTOCOL</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Port or Range (e.g. 25565, or 27015-27020)"
                value={newRulePorts}
                onChange={(e) => setNewRulePorts(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>
          </form>

          {/* Bandwidth Cap Slider */}
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Per-Peer Bandwidth Cap</span>
              <span className="font-mono text-emerald-400 font-bold">
                {bandwidthCap === 0 ? 'Unlimited (Full Wire Speed)' : `${bandwidthCap} Mbps`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={bandwidthCap}
              onChange={(e) => setBandwidthCap(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Unlimited (0)</span>
              <span>50 Mbps</span>
              <span>100 Mbps</span>
              <span>200 Mbps</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply ACLs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
