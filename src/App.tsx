import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NetworkList } from './components/NetworkList';
import { PeersView } from './components/PeersView';
import { PublicDirectory } from './components/PublicDirectory';
import { LanGameDiscovery } from './components/LanGameDiscovery';
import { FileShareView } from './components/FileShareView';
import { ControlPlaneArchitecture } from './components/ControlPlaneArchitecture';
import { PingToolModal } from './components/PingToolModal';
import { WireGuardConfigModal } from './components/WireGuardConfigModal';
import { AclSettingsModal } from './components/AclSettingsModal';
import { CreateNetworkModal } from './components/CreateNetworkModal';
import { JoinNetworkModal } from './components/JoinNetworkModal';
import { MobileFrame } from './components/MobileFrame';
import { 
  Network, 
  Peer, 
  LanGameBroadcast, 
  SharedFile, 
  ClientPlatform 
} from './types';
import { 
  loadNetworks, 
  saveNetworks, 
  loadPeers, 
  savePeers, 
  loadLanGames, 
  saveLanGames, 
  loadSharedFiles, 
  saveSharedFiles,
  getStoredClientPlatform,
  setStoredClientPlatform,
  resetToDefaults
} from './storage';
import { generateWireGuardKey } from './utils/wireguard';
import { 
  Activity, 
  Wifi, 
  RotateCcw, 
  CheckCircle2, 
  Radio, 
  Server, 
  ShieldCheck,
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [networks, setNetworks] = useState<Network[]>(loadNetworks);
  const [peers, setPeers] = useState<Record<string, Peer[]>>(loadPeers);
  const [lanGames, setLanGames] = useState<LanGameBroadcast[]>(loadLanGames);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(loadSharedFiles);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(() => {
    const loaded = loadNetworks();
    return loaded.length > 0 ? loaded[0].id : 'net-vwan-valheim';
  });

  const [activeTab, setActiveTab] = useState<'networks' | 'directory' | 'lan_games' | 'files' | 'architecture' | 'acls'>('networks');
  const [clientPlatform, setClientPlatformState] = useState<ClientPlatform>(getStoredClientPlatform);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [pingPeer, setPingPeer] = useState<Peer | null>(null);
  const [configNetwork, setConfigNetwork] = useState<Network | null>(null);
  const [aclNetwork, setAclNetwork] = useState<Network | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state to local persistence
  useEffect(() => {
    saveNetworks(networks);
  }, [networks]);

  useEffect(() => {
    savePeers(peers);
  }, [peers]);

  useEffect(() => {
    saveLanGames(lanGames);
  }, [lanGames]);

  useEffect(() => {
    saveSharedFiles(sharedFiles);
  }, [sharedFiles]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const setClientPlatform = (os: ClientPlatform) => {
    setClientPlatformState(os);
    setStoredClientPlatform(os);
    showNotification(`Client platform switched to ${os.toUpperCase()}`);
  };

  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId) || networks[0];
  const currentNetworkPeers = peers[selectedNetwork?.id] || [];

  // Network actions
  const handleToggleConnect = (netId: string) => {
    setNetworks((prev) =>
      prev.map((n) => {
        if (n.id === netId) {
          const nextState = !n.isConnected;
          showNotification(
            nextState
              ? `WireGuard interface [${n.interfaceName}] UP (${n.assignedVirtualIp})`
              : `WireGuard interface [${n.interfaceName}] DOWN`
          );
          return { ...n, isConnected: nextState };
        }
        return n;
      })
    );
  };

  const handleCreateNetwork = (newNet: Network) => {
    setNetworks((prev) => [newNet, ...prev]);
    setSelectedNetworkId(newNet.id);

    // Initialize default peers for newly created network
    const initialPeers: Peer[] = [
      {
        id: `peer-${Date.now()}-self`,
        name: 'Your-Laptop (This Device)',
        platform: clientPlatform,
        virtualIp: newNet.assignedVirtualIp,
        publicKey: newNet.clientPublicKey,
        endpoint: '192.168.1.105:51820',
        connectionMode: 'p2p',
        latencyMs: 1,
        txBytes: 1048576,
        rxBytes: 2097152,
        lastHandshake: 'Just now',
        isSelf: true,
        isHost: true,
        status: 'online',
      },
    ];

    setPeers((prev) => ({
      ...prev,
      [newNet.id]: initialPeers,
    }));

    showNotification(`VLAN "${newNet.name}" created on ${newNet.subnetCidr}`);
  };

  const handleJoinNetwork = (joinedNet: Network) => {
    setNetworks((prev) => [joinedNet, ...prev]);
    setSelectedNetworkId(joinedNet.id);

    const initialPeers: Peer[] = [
      {
        id: `peer-${Date.now()}-self`,
        name: 'Your-Laptop (This Device)',
        platform: clientPlatform,
        virtualIp: joinedNet.assignedVirtualIp,
        publicKey: joinedNet.clientPublicKey,
        endpoint: '192.168.1.105:51820',
        connectionMode: 'p2p',
        latencyMs: 1,
        txBytes: 524288,
        rxBytes: 1048576,
        lastHandshake: 'Just now',
        isSelf: true,
        status: 'online',
      },
      {
        id: `peer-${Date.now()}-host`,
        name: `${joinedNet.ownerName} [Host Gateway]`,
        platform: 'linux',
        virtualIp: joinedNet.gatewayIp,
        publicKey: generateWireGuardKey(),
        endpoint: 'relay-fra.vwan.net:443',
        connectionMode: 'relay',
        relayRegion: 'Frankfurt (DERP)',
        latencyMs: 28,
        txBytes: 12000000,
        rxBytes: 24000000,
        lastHandshake: '5 seconds ago',
        isHost: true,
        status: 'online',
      },
    ];

    setPeers((prev) => ({
      ...prev,
      [joinedNet.id]: initialPeers,
    }));

    showNotification(`Connected to VLAN [${joinedNet.inviteCode}] as ${joinedNet.assignedVirtualIp}`);
  };

  const handleJoinPublicNetwork = (room: {
    name: string;
    description: string;
    subnetCidr: string;
    gameCategory: string;
    region: string;
    tags: string[];
    maxPeers: number;
    ownerName: string;
  }) => {
    const existing = networks.find((n) => n.subnetCidr === room.subnetCidr);
    if (existing) {
      setSelectedNetworkId(existing.id);
      setActiveTab('networks');
      showNotification(`Already enrolled in "${room.name}"`);
      return;
    }

    const basePrefix = room.subnetCidr.split('.').slice(0, 3).join('.');
    const nextIpNum = Math.floor(Math.random() * 30) + 10;
    const assignedVirtualIp = `${basePrefix}.${nextIpNum}`;

    const newNet: Network = {
      id: `net-pub-${Date.now()}`,
      name: room.name,
      description: room.description,
      subnetCidr: room.subnetCidr,
      gatewayIp: `${basePrefix}.1`,
      listenPort: 51820 + Math.floor(Math.random() * 100),
      isPublic: true,
      hasPassword: false,
      inviteCode: `VWAN-PUB-${Math.floor(Math.random() * 9000) + 1000}`,
      gameCategory: room.gameCategory,
      region: room.region,
      maxPeers: room.maxPeers,
      ownerId: 'peer-host',
      ownerName: room.ownerName,
      createdAt: new Date().toISOString(),
      tags: room.tags,
      interfaceName: `vwan${networks.length}`,
      isConnected: true,
      assignedVirtualIp,
      clientPrivateKey: generateWireGuardKey(),
      clientPublicKey: generateWireGuardKey(),
      aclPreset: 'gaming-safe',
      aclRules: [],
      bandwidthCapMbps: 0,
    };

    handleJoinNetwork(newNet);
    setActiveTab('networks');
  };

  const handleDeleteNetwork = (id: string) => {
    setNetworks((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (selectedNetworkId === id && remaining.length > 0) {
        setSelectedNetworkId(remaining[0].id);
      }
      return remaining;
    });
    showNotification('Network removed.');
  };

  const handleBroadcastGame = (gameData: Omit<LanGameBroadcast, 'id' | 'startedAt'>) => {
    const newGame: LanGameBroadcast = {
      ...gameData,
      id: `game-${Date.now()}`,
      startedAt: 'Just now',
    };
    setLanGames((prev) => [newGame, ...prev]);
    showNotification(`Broadcasting ${newGame.gameName} on virtual socket ${newGame.hostVirtualIp}:${newGame.port}`);
  };

  const handleUploadFile = (fileData: Omit<SharedFile, 'id' | 'uploadedAt' | 'downloadCount'>) => {
    const newFile: SharedFile = {
      ...fileData,
      id: `file-${Date.now()}`,
      uploadedAt: 'Just now',
      downloadCount: 0,
    };
    setSharedFiles((prev) => [newFile, ...prev]);
    showNotification(`File "${newFile.name}" shared to VLAN pool.`);
  };

  const handleSaveAcl = (updatedNet: Network) => {
    setNetworks((prev) => prev.map((n) => (n.id === updatedNet.id ? updatedNet : n)));
    showNotification(`ACL firewall rules applied for ${updatedNet.name}`);
  };

  const handleResetDemo = () => {
    if (confirm('Reset V-WAN virtual networks and peers back to initial showcase demo state?')) {
      const res = resetToDefaults();
      setNetworks(res.networks);
      setPeers(res.peers);
      setLanGames(res.games);
      setSharedFiles(res.files);
      setSelectedNetworkId(res.networks[0].id);
      showNotification('State reset to clean defaults.');
    }
  };

  // Main UI content rendered either directly in desktop view or wrapped in smartphone shell
  const renderContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* View switching based on active tab */}
      {activeTab === 'networks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: User's Network Interfaces */}
          <div className="lg:col-span-5 space-y-4">
            <NetworkList
              networks={networks}
              selectedNetworkId={selectedNetworkId}
              onSelectNetwork={setSelectedNetworkId}
              onToggleConnect={handleToggleConnect}
              onOpenCreate={() => setCreateModalOpen(true)}
              onOpenJoin={() => setJoinModalOpen(true)}
              onOpenConfig={(net) => setConfigNetwork(net)}
              onOpenAcl={(net) => setAclNetwork(net)}
              onDeleteNetwork={handleDeleteNetwork}
            />
          </div>

          {/* Right column: Peers inside the selected network */}
          <div className="lg:col-span-7 space-y-4">
            {selectedNetwork ? (
              <PeersView
                network={selectedNetwork}
                peers={currentNetworkPeers}
                onOpenPing={(peer) => setPingPeer(peer)}
                onOpenConfig={() => setConfigNetwork(selectedNetwork)}
                onOpenAcl={() => setAclNetwork(selectedNetwork)}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                Select a network on the left to view connected peers.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <PublicDirectory
          userNetworks={networks}
          onJoinPublicNetwork={handleJoinPublicNetwork}
          onOpenCreate={() => setCreateModalOpen(true)}
        />
      )}

      {activeTab === 'lan_games' && (
        <LanGameDiscovery
          games={lanGames}
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onBroadcastGame={handleBroadcastGame}
        />
      )}

      {activeTab === 'files' && (
        <FileShareView
          files={sharedFiles}
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onUploadFile={handleUploadFile}
        />
      )}

      {activeTab === 'architecture' && <ControlPlaneArchitecture />}

      {/* Footer Info & Quick Reset Bar */}
      <footer className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>WireGuard® Tunnel: Curve25519 + ChaCha20-Poly1305</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">STUN/DERP NAT Traversal Fallback</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset to default showcase networks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networks={networks}
        clientPlatform={clientPlatform}
        setClientPlatform={setClientPlatform}
        isMobilePreview={isMobilePreview}
        setIsMobilePreview={setIsMobilePreview}
        onOpenCreate={() => setCreateModalOpen(true)}
        onOpenJoin={() => setJoinModalOpen(true)}
      />

      {/* Main viewport: Desktop full screen or Mobile Frame */}
      <main className="flex-1">
        {isMobilePreview ? (
          <MobileFrame onExit={() => setIsMobilePreview(false)}>
            {renderContent()}
          </MobileFrame>
        ) : (
          renderContent()
        )}
      </main>

      {/* Modals */}
      {pingPeer && (
        <PingToolModal
          peer={pingPeer}
          onClose={() => setPingPeer(null)}
        />
      )}

      {configNetwork && (
        <WireGuardConfigModal
          network={configNetwork}
          clientPlatform={clientPlatform}
          onClose={() => setConfigNetwork(null)}
        />
      )}

      {aclNetwork && (
        <AclSettingsModal
          network={aclNetwork}
          onSave={handleSaveAcl}
          onClose={() => setAclNetwork(null)}
        />
      )}

      {createModalOpen && (
        <CreateNetworkModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateNetwork}
        />
      )}

      {joinModalOpen && (
        <JoinNetworkModal
          onClose={() => setJoinModalOpen(false)}
          onJoin={handleJoinNetwork}
        />
      )}
    </div>
  );
}
