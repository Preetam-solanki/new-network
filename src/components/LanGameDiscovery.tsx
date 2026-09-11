import React, { useState } from 'react';
import { 
  Radio, 
  Gamepad2, 
  Plus, 
  Copy, 
  Check, 
  Users, 
  Clock, 
  Wifi, 
  Server, 
  Terminal,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { LanGameBroadcast, Network } from '../types';

interface LanGameDiscoveryProps {
  games: LanGameBroadcast[];
  networks: Network[];
  selectedNetworkId: string;
  onBroadcastGame: (game: Omit<LanGameBroadcast, 'id' | 'startedAt'>) => void;
}

export const LanGameDiscovery: React.FC<LanGameDiscoveryProps> = ({
  games,
  networks,
  selectedNetworkId,
  onBroadcastGame,
}) => {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Broadcast modal form state
  const [gameTitle, setGameTitle] = useState('Minecraft Java Edition');
  const [gamePort, setGamePort] = useState(25565);
  const [protocol, setProtocol] = useState<'TCP' | 'UDP' | 'TCP/UDP'>('TCP');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [worldName, setWorldName] = useState('Survival World (Hardcore)');
  const [version, setVersion] = useState('1.20.4');

  const activeNetwork = networks.find((n) => n.id === selectedNetworkId) || networks[0];

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSubmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNetwork) return;

    onBroadcastGame({
      networkId: activeNetwork.id,
      gameName: gameTitle,
      hostPeerName: 'Your-Laptop (This Device)',
      hostVirtualIp: activeNetwork.assignedVirtualIp,
      port: Number(gamePort),
      protocol,
      maxPlayers: Number(maxPlayers),
      currentPlayers: 1,
      mapOrWorldName: worldName,
      version,
    });

    setShowBroadcastModal(false);
  };

  const filteredGames = games.filter(
    (g) => !selectedNetworkId || g.networkId === selectedNetworkId
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span>LAN Game Discovery (mDNS & Virtual Broadcast Layer)</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                Subnet {activeNetwork?.subnetCidr || '10.147.19.0/24'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Emulates local network SSDP/mDNS UDP broadcasts across the WireGuard tunnel. Games like Minecraft, Source Engine, and Terraria automatically appear in your local multiplayer server browser!
            </p>
          </div>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Broadcast Local Game</span>
          </button>
        </div>

        {/* Emulation explanation pill */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
            <span>mDNS Repeater active on interface:</span>
            <span className="font-mono text-emerald-300 font-bold">{activeNetwork?.interfaceName || 'vwan0'}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Multicast: 224.0.0.251 / UDP 5353</span>
        </div>
      </div>

      {/* Active LAN games grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredGames.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-3">
            <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-200">No active LAN games detected in this VLAN</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Host a game on your PC or mobile device, or click "Broadcast Local Game" above to notify peers.
              </p>
            </div>
          </div>
        ) : (
          filteredGames.map((game) => {
            const directAddress = `${game.hostVirtualIp}:${game.port}`;
            const isCopied = copiedAddress === directAddress;

            return (
              <div
                key={game.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{game.gameName}</span>
                        {game.version && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            v{game.version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hosted by <span className="text-slate-200 font-medium">{game.hostPeerName}</span>
                      </p>
                    </div>

                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                      {game.protocol} {game.port}
                    </span>
                  </div>

                  {/* World/Map details */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-850/90 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">World / Map:</span>
                      <span className="font-semibold text-slate-200">{game.mapOrWorldName}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Players:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {game.currentPlayers} / {game.maxPlayers}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Virtual Socket:</span>
                      <span className="font-mono font-bold text-emerald-300">{directAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Connect / Copy bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Started {game.startedAt}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(directAddress)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy IP:Port for in-game Direct Connect"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied Socket!' : 'Copy Direct IP:Port'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Game Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    Broadcast LAN Multiplayer Game
                  </h3>
                  <p className="text-xs text-slate-400">
                    Network: <span className="text-white font-semibold">{activeNetwork?.name}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBroadcast} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Listen Port</label>
                  <input
                    type="number"
                    required
                    value={gamePort}
                    onChange={(e) => setGamePort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TCP">TCP (e.g. Minecraft)</option>
                    <option value="UDP">UDP (e.g. Source, Palworld)</option>
                    <option value="TCP/UDP">TCP/UDP (Both)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">World / Map Name</label>
                  <input
                    type="text"
                    required
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Players</label>
                  <input
                    type="number"
                    min="2"
                    max="64"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Game Version / Modpack</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.20.4 Paper or Calamity v2.0"
                  className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Start Broadcaster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
