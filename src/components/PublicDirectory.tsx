import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Users, 
  Activity, 
  Check, 
  Plus, 
  ExternalLink, 
  Radio, 
  Gamepad2, 
  Tag,
  ShieldCheck
} from 'lucide-react';
import { Network } from '../types';

interface PublicDirectoryProps {
  userNetworks: Network[];
  onJoinPublicNetwork: (room: {
    name: string;
    description: string;
    subnetCidr: string;
    gameCategory: string;
    region: string;
    tags: string[];
    maxPeers: number;
    ownerName: string;
  }) => void;
  onOpenCreate: () => void;
}

// Available public rooms in the global directory (simulating Radmin VPN public catalog)
const DIRECTORY_ROOMS = [
  {
    id: 'pub-mc-1',
    name: 'Minecraft Java 1.20.4 - Hermitcraft-Style SMP',
    description: 'Whitelisted public SMP room. Voice chat mod supported via virtual subnet audio stream.',
    gameCategory: 'Minecraft',
    region: 'NA-East',
    subnetCidr: '10.10.88.0/24',
    currentPeers: 18,
    maxPeers: 128,
    ownerName: 'RedstoneWiz_US',
    latencyMs: 24,
    tags: ['SMP', 'Vanilla+', 'VoiceChat', 'US-East'],
  },
  {
    id: 'pub-valheim-1',
    name: 'Valheim: Mistlands & Ashlands Co-Op',
    description: 'Public dedicated community co-op room. Join for boss progression and shared building.',
    gameCategory: 'Valheim',
    region: 'EU-Central',
    subnetCidr: '10.147.19.0/24',
    currentPeers: 6,
    maxPeers: 64,
    ownerName: 'OdinHost_DE',
    latencyMs: 18,
    tags: ['Survival', 'Co-op', 'PVE', 'Europe', 'Low-Latency'],
  },
  {
    id: 'pub-cs2-1',
    name: 'CS2 LAN 128-Tick Scrims & Retro Frag',
    description: 'Direct P2P low-jitter room for custom 5v5 competitive LAN server and surf maps.',
    gameCategory: 'Counter-Strike 2',
    region: 'EU-Central',
    subnetCidr: '10.200.1.0/24',
    currentPeers: 10,
    maxPeers: 32,
    ownerName: 'AeroStrike',
    latencyMs: 15,
    tags: ['Competitive', '128Tick', 'LowJitter', 'Scrims'],
  },
  {
    id: 'pub-palworld-1',
    name: 'Palworld 24/7 Dedicated Server Guild',
    description: 'High performance co-op server with custom breeding rates and dungeon expeditions.',
    gameCategory: 'Palworld',
    region: 'Asia-East',
    subnetCidr: '10.50.0.0/24',
    currentPeers: 14,
    maxPeers: 64,
    ownerName: 'PalMaster_Tokyo',
    latencyMs: 52,
    tags: ['Palworld', 'Survival', 'Asia', 'PVE'],
  },
  {
    id: 'pub-terraria-1',
    name: 'Terraria Calamity Mod + Infernum Playthrough',
    description: 'Expert difficulty Terraria multiplayer server with Calamity, Magic Storage, and Boss Checklist.',
    gameCategory: 'Terraria',
    region: 'NA-East',
    subnetCidr: '10.77.7.0/24',
    currentPeers: 8,
    maxPeers: 16,
    ownerName: 'CalamitasSummoner',
    latencyMs: 29,
    tags: ['Calamity', 'Modded', 'TModLoader', 'Bosses'],
  },
  {
    id: 'pub-retroarch-1',
    name: 'RetroArch NetPlay: 90s Arcade & SNES Brawlers',
    description: 'Rollback netcode peer room for Street Fighter Alpha 3, Marvel vs Capcom, and Mario Kart.',
    gameCategory: 'RetroArch',
    region: 'Global',
    subnetCidr: '10.90.90.0/24',
    currentPeers: 5,
    maxPeers: 32,
    ownerName: 'ArcadeLegend',
    latencyMs: 35,
    tags: ['Netplay', 'Rollback', 'Arcade', 'Retro'],
  },
  {
    id: 'pub-aoe2-1',
    name: 'Age of Empires II: DE - Black Forest Casuals',
    description: '4v4 diplomacy and boom lobbies. Direct LAN discovery via virtual broadcast layer.',
    gameCategory: 'Age of Empires',
    region: 'EU-Central',
    subnetCidr: '10.120.4.0/24',
    currentPeers: 8,
    maxPeers: 24,
    ownerName: 'TeutonicKnight',
    latencyMs: 22,
    tags: ['AOE2DE', 'RTS', 'Diplomacy', 'LAN'],
  },
  {
    id: 'pub-share-1',
    name: 'Indie Game Developers & 3D Asset Exchange',
    description: 'Open peer network for sharing Godot/Unity builds, Blender textures, and lossless audio.',
    gameCategory: 'File Sharing',
    region: 'Global',
    subnetCidr: '10.250.0.0/24',
    currentPeers: 12,
    maxPeers: 100,
    ownerName: 'AssetVault',
    latencyMs: 40,
    tags: ['SMB', 'GameDev', 'P2P', 'Assets'],
  }
];

export const PublicDirectory: React.FC<PublicDirectoryProps> = ({
  userNetworks,
  onJoinPublicNetwork,
  onOpenCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');

  const categories = [
    'All',
    'Minecraft',
    'Valheim',
    'Counter-Strike 2',
    'Palworld',
    'Terraria',
    'RetroArch',
    'Age of Empires',
    'File Sharing',
  ];

  const regions = ['All', 'NA-East', 'EU-Central', 'Asia-East', 'Global'];

  const filteredRooms = DIRECTORY_ROOMS.filter((room) => {
    const matchSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      room.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || room.gameCategory === selectedCategory;
    const matchRegion = selectedRegion === 'All' || room.region === selectedRegion;

    return matchSearch && matchCategory && matchRegion;
  });

  const isUserJoined = (subnetCidr: string) => {
    return userNetworks.some((n) => n.subnetCidr === subnetCidr);
  };

  return (
    <div className="space-y-4">
      {/* Directory Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Public Rooms Directory (Radmin VPN Mode)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Browse public gaming rooms and community VLANs. Join any open room without a password to discover multiplayer servers, share files, and game over virtual LAN.
            </p>
          </div>

          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Public Room</span>
          </button>
        </div>

        {/* Search and Category Filters */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search rooms by game name, host, tags (e.g. 128Tick, SMP, Survival)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 text-xs whitespace-nowrap">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === 'All' ? 'All Regions' : r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Game Category Pill Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRooms.map((room) => {
          const joined = isUserJoined(room.subnetCidr);

          return (
            <div
              key={room.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-100 group-hover:text-white">
                        {room.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-emerald-400 font-semibold">{room.subnetCidr}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-medium">Host: {room.ownerName}</span>
                    </div>
                  </div>

                  {/* Ping Badge */}
                  <div className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-slate-850 border border-slate-700/80 text-emerald-400">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>~{room.latencyMs}ms</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {room.description}
                </p>

                {/* Tags row */}
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                    {room.gameCategory}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {room.region}
                  </span>
                  {room.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom stats & Join button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-300">
                    {room.currentPeers} / {room.maxPeers} nodes
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden ml-1 hidden sm:block">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(room.currentPeers / room.maxPeers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {joined ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5 cursor-default"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Already Joined</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onJoinPublicNetwork(room)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
