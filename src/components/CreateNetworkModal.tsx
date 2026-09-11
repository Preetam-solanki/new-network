import React, { useState } from 'react';
import { X, Network as NetworkIcon, Plus, Globe, Lock, ShieldCheck, Tag } from 'lucide-react';
import { Network } from '../types';
import { generateWireGuardKey } from '../utils/wireguard';

interface CreateNetworkModalProps {
  onClose: () => void;
  onCreate: (network: Network) => void;
}

export const CreateNetworkModal: React.FC<CreateNetworkModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subnetCidr, setSubnetCidr] = useState('10.147.25.0/24');
  const [isPublic, setIsPublic] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [gameCategory, setGameCategory] = useState('General Gaming');
  const [region, setRegion] = useState('EU-Central');
  const [maxPeers, setMaxPeers] = useState(64);
  const [tagsInput, setTagsInput] = useState('VLAN, WireGuard, Gaming');

  const subnetOptions = [
    '10.147.25.0/24',
    '10.10.42.0/24',
    '10.200.15.0/24',
    '10.50.8.0/24',
    '192.168.150.0/24',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const basePrefix = subnetCidr.split('.').slice(0, 3).join('.');
    const gatewayIp = `${basePrefix}.1`;
    const assignedVirtualIp = `${basePrefix}.2`;

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `VWAN-${name.substring(0, 4).toUpperCase()}-${randomSuffix}`;

    const newNet: Network = {
      id: `net-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Private isolated WireGuard VLAN for gaming and remote access.',
      subnetCidr,
      gatewayIp,
      listenPort: 51820 + Math.floor(Math.random() * 100),
      isPublic,
      hasPassword,
      password: hasPassword ? password : undefined,
      inviteCode,
      gameCategory,
      region,
      maxPeers: Number(maxPeers),
      ownerId: 'self',
      ownerName: 'Your-Laptop (Host)',
      createdAt: new Date().toISOString(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      interfaceName: `vwan${Math.floor(Math.random() * 8) + 1}`,
      isConnected: true,
      assignedVirtualIp,
      clientPrivateKey: generateWireGuardKey(),
      clientPublicKey: generateWireGuardKey(),
      aclPreset: isPublic ? 'gaming-safe' : 'full-mesh',
      aclRules: [],
      bandwidthCapMbps: 0,
    };

    onCreate(newNet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <NetworkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Create Virtual Network (VLAN)</h3>
              <p className="text-xs text-slate-400">
                Provisions dedicated WireGuard interface & assigned /24 subnet
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Network Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Valheim Dedicated Co-op or HomeLab Cloud"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Short description of this virtual network room..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subnet CIDR Range</label>
              <select
                value={subnetCidr}
                onChange={(e) => setSubnetCidr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                {subnetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Game / Service Category</label>
              <select
                value={gameCategory}
                onChange={(e) => setGameCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Minecraft">Minecraft</option>
                <option value="Valheim">Valheim</option>
                <option value="Counter-Strike 2">Counter-Strike 2</option>
                <option value="Terraria">Terraria</option>
                <option value="Palworld">Palworld</option>
                <option value="RetroArch">RetroArch</option>
                <option value="Remote Office">Remote Office / SMB</option>
                <option value="General Gaming">General Gaming</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Relay Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="EU-Central">EU-Central (Frankfurt)</option>
                <option value="NA-East">NA-East (New York)</option>
                <option value="NA-West">NA-West (San Francisco)</option>
                <option value="Asia-East">Asia-East (Tokyo)</option>
                <option value="Global">Global Anycast</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Peer Capacity</label>
              <input
                type="number"
                min="2"
                max="500"
                value={maxPeers}
                onChange={(e) => setMaxPeers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Visibility toggle: Public directory vs Private */}
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-200">
                Publish to Public Rooms Directory (Radmin Mode)
              </span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              When checked, anyone can discover and join this room in the Public Directory.
            </p>
          </div>

          {/* Password toggle if private */}
          {!isPublic && (
            <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-200">Require Room Password</span>
              </label>
              {hasPassword && (
                <input
                  type="password"
                  required
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Survival, Modded, Low-Latency"
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
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
              <Plus className="w-3.5 h-3.5" />
              <span>Create VLAN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
