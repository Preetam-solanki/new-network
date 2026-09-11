import React, { useState } from 'react';
import { X, Key, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Network } from '../types';
import { generateWireGuardKey } from '../utils/wireguard';

interface JoinNetworkModalProps {
  onClose: () => void;
  onJoin: (network: Network) => void;
}

export const JoinNetworkModal: React.FC<JoinNetworkModalProps> = ({ onClose, onJoin }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please provide an invite code or access key.');
      return;
    }

    // Determine subnet prefix based on code or generate synthetic
    const subnetPrefix = `10.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 1}`;
    const subnetCidr = `${subnetPrefix}.0/24`;
    const assignedVirtualIp = `${subnetPrefix}.${Math.floor(Math.random() * 200) + 5}`;

    const joinedNetwork: Network = {
      id: `net-${Date.now()}`,
      name: `Joined VLAN (${cleanCode})`,
      description: `Virtual network joined via access invite key ${cleanCode}`,
      subnetCidr,
      gatewayIp: `${subnetPrefix}.1`,
      listenPort: 51820 + Math.floor(Math.random() * 200),
      isPublic: false,
      hasPassword: Boolean(password),
      password: password || undefined,
      inviteCode: cleanCode,
      region: 'Global Anycast',
      maxPeers: 64,
      ownerId: 'peer-host',
      ownerName: 'VLAN Administrator',
      createdAt: new Date().toISOString(),
      tags: ['Joined', 'WireGuard', 'P2P'],
      interfaceName: `vwan${Math.floor(Math.random() * 9) + 1}`,
      isConnected: true,
      assignedVirtualIp,
      clientPrivateKey: generateWireGuardKey(),
      clientPublicKey: generateWireGuardKey(),
      aclPreset: 'gaming-safe',
      aclRules: [],
      bandwidthCapMbps: 0,
    };

    onJoin(joinedNetwork);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Join Private Virtual Network</h3>
              <p className="text-xs text-slate-400">Connect using an invite code or access key</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleJoin} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Network Invite Code or Key
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VWAN-VALH-7721 or VWAN-MC88-9104"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 uppercase tracking-wide"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Codes are issued by the network creator or copied from the Public Directory.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Network Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave blank if room has no password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-slate-400 text-[11px] leading-relaxed space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>WireGuard Key Auto-Enrollment</span>
            </div>
            <p>
              Your client will automatically negotiate Curve25519 public keys with the control plane and provision a non-conflicting virtual IP in the room's subnet.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Connect & Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
