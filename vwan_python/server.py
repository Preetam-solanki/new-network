import http.server
import socketserver
import json
import urllib.parse
import sys
import os
import random
from typing import Dict, Any

from .storage import StorageManager
from .wireguard import (
    generate_wg_quick_config,
    generate_wan_hosts_file,
    generate_wireguard_keypair,
    generate_cli_commands
)
from .models import Network, Peer, LanGameBroadcast, SharedFile, WanHostEntry, AclRule

class VWanApiHandler(http.server.BaseHTTPRequestHandler):
    storage: StorageManager = None

    def _send_json(self, data: Any, status: int = 200):
        body = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text: str, content_type: str = 'text/plain; charset=utf-8', status: int = 200, filename: str = None):
        body = text.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        if filename:
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Web Dashboard UI served at root
        if path in ('/', '/index.html'):
            self._serve_web_ui()
            return

        # REST API Routes
        if path == '/api/status':
            total_peers = sum(len(p) for p in self.storage.peers.values())
            online_peers = sum(1 for peers in self.storage.peers.values() for p in peers if p.is_online)
            self._send_json({
                "service": "V-WAN Python Control Plane",
                "version": "1.0.0",
                "user_role": self.storage.user_role,
                "current_user_ip": self.storage.current_user_ip,
                "current_user_name": self.storage.current_user_name,
                "total_networks": len(self.storage.networks),
                "total_peers": total_peers,
                "online_peers": online_peers,
                "active_games": len(self.storage.games),
                "shared_files": len(self.storage.files)
            })
            return

        elif path == '/api/networks':
            nets = [n.to_dict() for n in self.storage.networks.values()]
            self._send_json({"networks": nets})
            return

        elif path == '/api/peers':
            net_id = query.get('network_id', [''])[0]
            if not net_id:
                all_peers = {nid: [p.to_dict() for p in plist] for nid, plist in self.storage.peers.items()}
                self._send_json({"peers": all_peers})
            else:
                peers = [p.to_dict() for p in self.storage.peers.get(net_id, [])]
                self._send_json({"network_id": net_id, "peers": peers})
            return

        elif path == '/api/wireguard-config':
            net_id = query.get('network_id', ['net-vwan-valheim'])[0]
            network = self.storage.networks.get(net_id)
            if not network:
                self._send_json({"error": f"Network {net_id} not found"}, status=404)
                return
            config_text = generate_wg_quick_config(network)
            as_file = query.get('download', ['0'])[0] == '1'
            if as_file:
                self._send_text(config_text, filename=f"{network.interface_name}.conf")
            else:
                self._send_json({
                    "network_id": net_id,
                    "interface_name": network.interface_name,
                    "config": config_text
                })
            return

        elif path == '/api/wan-hosts':
            # SECURITY CHECK: Admin only
            if self.storage.user_role != 'admin':
                self._send_json({
                    "error": "Access Denied: WAN Host File is restricted to Administrator role only.",
                    "message": "Standard users cannot view or export master network resolution tables to prevent subnet discovery.",
                    "current_role": self.storage.user_role
                }, status=403)
                return

            net_id = query.get('network_id', ['net-vwan-valheim'])[0]
            network = self.storage.networks.get(net_id)
            if not network:
                self._send_json({"error": f"Network {net_id} not found"}, status=404)
                return

            peers = self.storage.peers.get(net_id, [])
            hosts_text = generate_wan_hosts_file(network, peers, self.storage.custom_hosts)
            as_file = query.get('download', ['0'])[0] == '1'
            if as_file:
                self._send_text(hosts_text, filename=f"vwan-{network.interface_name}.hosts")
            else:
                self._send_json({
                    "network_id": net_id,
                    "interface_name": network.interface_name,
                    "custom_hosts_count": len(self.storage.custom_hosts),
                    "hosts_content": hosts_text
                })
            return

        elif path == '/api/games':
            self._send_json({"games": [g.to_dict() for g in self.storage.games]})
            return

        elif path == '/api/files':
            # LAN File Isolation Policy
            net_id = query.get('network_id', [''])[0]
            file_list = []
            for f in self.storage.files:
                if net_id and f.network_id != net_id:
                    continue
                f_dict = f.to_dict()
                is_own_file = (f.uploaded_by_ip == self.storage.current_user_ip or 
                               f.uploaded_by_peer == self.storage.current_user_name)
                
                # Admin has global clearance; standard users are restricted to their own files
                if self.storage.user_role == 'admin':
                    f_dict['is_own_file'] = is_own_file
                    f_dict['can_download'] = True
                    f_dict['access_status'] = 'Full Access (Admin)'
                else:
                    f_dict['is_own_file'] = is_own_file
                    f_dict['can_download'] = is_own_file
                    f_dict['access_status'] = 'Allowed (Own Node)' if is_own_file else 'Locked (Remote Peer Isolation)'
                file_list.append(f_dict)

            self._send_json({
                "user_role": self.storage.user_role,
                "current_user_ip": self.storage.current_user_ip,
                "files": file_list
            })
            return

        elif path == '/api/files/download':
            file_id = query.get('id', [''])[0]
            target_file = next((f for f in self.storage.files if f.id == file_id), None)
            if not target_file:
                self._send_json({"error": "File not found"}, status=404)
                return

            is_own_file = (target_file.uploaded_by_ip == self.storage.current_user_ip or 
                           target_file.uploaded_by_peer == self.storage.current_user_name)

            if self.storage.user_role != 'admin' and not is_own_file:
                self._send_json({
                    "error": "LAN File Isolation Policy Violation",
                    "message": f"Standard users cannot download remote files hosted by '{target_file.uploaded_by_peer}' ({target_file.uploaded_by_ip}). You may only access your own LAN files.",
                    "required_role": "admin",
                    "current_role": self.storage.user_role
                }, status=403)
                return

            target_file.download_count += 1
            self.storage.save()
            mock_content = f"V-WAN Virtual LAN P2P Shared File Payload: {target_file.name}\nSource: {target_file.uploaded_by_ip}\nSize: {target_file.size_mb} MB"
            self._send_text(mock_content, filename=target_file.name)
            return

        elif path == '/api/ping':
            peer_id = query.get('peer_id', [''])[0]
            peer = None
            for plist in self.storage.peers.values():
                for p in plist:
                    if p.id == peer_id:
                        peer = p
                        break
            if not peer:
                self._send_json({"error": "Peer not found"}, status=404)
                return

            rtt = peer.latency_ms + random.randint(-2, 4)
            jitter = max(1, peer.jitter_ms + random.randint(-1, 2))
            self._send_json({
                "peer_id": peer.id,
                "peer_name": peer.name,
                "virtual_ip": peer.virtual_ip,
                "rtt_ms": max(2, rtt),
                "jitter_ms": jitter,
                "packet_loss_pct": peer.packet_loss_pct,
                "status": "HEALTHY" if peer.is_online else "OFFLINE"
            })
            return

        self._send_json({"error": f"Path not found: {path}"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            body = json.loads(post_data) if post_data.strip() else {}
        except Exception:
            body = {}

        if path == '/api/role':
            new_role = body.get('role', 'user')
            if new_role not in ('admin', 'user'):
                self._send_json({"error": "Role must be 'admin' or 'user'"}, status=400)
                return
            self.storage.user_role = new_role
            self.storage.save()
            self._send_json({
                "status": "ok",
                "user_role": self.storage.user_role,
                "message": f"Switched role to {new_role.upper()}"
            })
            return

        elif path == '/api/networks':
            name = body.get('name', '').strip()
            if not name:
                self._send_json({"error": "Network name is required"}, status=400)
                return
            
            idx = len(self.storage.networks)
            net_id = f"net-vwan-{name.lower().replace(' ', '-')[:12]}"
            iface = f"vwan{idx}"
            subnet = body.get('subnet_cidr', f"10.{140 + idx}.10.0/24")
            gw = subnet.rsplit('.', 1)[0] + '.1'
            assigned_ip = subnet.rsplit('.', 1)[0] + '.14'
            invite_code = f"VWAN-{random.randint(1000, 9999)}"

            new_net = Network(
                id=net_id,
                name=name,
                subnet_cidr=subnet,
                interface_name=iface,
                gateway_ip=gw,
                encryption="Curve25519 / ChaCha20",
                is_connected=True,
                peers_count=1,
                max_peers=int(body.get('max_peers', 32)),
                is_public=bool(body.get('is_public', False)),
                invite_code=invite_code,
                assigned_virtual_ip=assigned_ip,
                acl_preset=body.get('acl_preset', 'gaming_safe'),
                category=body.get('category', 'Custom'),
                description=body.get('description', '')
            )
            self.storage.networks[net_id] = new_net
            self.storage.peers[net_id] = [
                Peer(
                    id=f"peer-{idx}-self",
                    network_id=net_id,
                    name=self.storage.current_user_name,
                    platform="linux",
                    virtual_ip=assigned_ip,
                    endpoint="192.168.1.100:51820",
                    is_online=True,
                    connection_type="direct_p2p",
                    latency_ms=10,
                    jitter_ms=1,
                    packet_loss_pct=0.0,
                    public_key="k7L8m9N0p1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d5E6f7G=",
                    last_handshake="Just now",
                    transfer_rx="0 MB",
                    transfer_tx="0 MB"
                )
            ]
            self.storage.save()
            self._send_json({"status": "created", "network": new_net.to_dict()}, status=201)
            return

        elif path == '/api/networks/toggle':
            net_id = body.get('id', '')
            net = self.storage.networks.get(net_id)
            if not net:
                self._send_json({"error": "Network not found"}, status=404)
                return
            net.is_connected = not net.is_connected
            self.storage.save()
            self._send_json({"status": "toggled", "id": net.id, "is_connected": net.is_connected})
            return

        elif path == '/api/wan-hosts':
            if self.storage.user_role != 'admin':
                self._send_json({"error": "Admin permission required to add custom WAN hosts"}, status=403)
                return
            ip = body.get('ip', '').strip()
            hostname = body.get('hostname', '').strip()
            if not ip or not hostname:
                self._send_json({"error": "IP and Hostname are required"}, status=400)
                return
            
            entry = WanHostEntry(
                id=f"custom-{len(self.storage.custom_hosts) + 1}",
                ip=ip,
                hostname=hostname,
                aliases=[a.strip() for a in body.get('aliases', []) if a.strip()],
                description=body.get('description', 'Custom Host')
            )
            self.storage.custom_hosts.append(entry)
            self.storage.save()
            self._send_json({"status": "created", "entry": entry.to_dict()}, status=201)
            return

        elif path == '/api/games':
            title = body.get('game_title', '').strip()
            socket = body.get('virtual_socket', '').strip()
            if not title or not socket:
                self._send_json({"error": "Title and virtual socket required"}, status=400)
                return
            new_game = LanGameBroadcast(
                id=f"game-{len(self.storage.games) + 1}",
                network_id=body.get('network_id', 'net-vwan-valheim'),
                game_title=title,
                host_peer_name=self.storage.current_user_name,
                virtual_socket=socket,
                game_mode=body.get('game_mode', 'LAN Multiplayer'),
                players_current=int(body.get('players_current', 1)),
                players_max=int(body.get('players_max', 10)),
                ping_ms=15,
                broadcast_port=int(socket.split(':')[-1]) if ':' in socket else 2456,
                map_name=body.get('map_name', 'DefaultMap'),
                is_password_protected=bool(body.get('is_password_protected', False))
            )
            self.storage.games.append(new_game)
            self.storage.save()
            self._send_json({"status": "broadcasted", "game": new_game.to_dict()}, status=201)
            return

        elif path == '/api/files':
            filename = body.get('name', '').strip()
            if not filename:
                self._send_json({"error": "Filename required"}, status=400)
                return
            new_file = SharedFile(
                id=f"file-{len(self.storage.files) + 1}",
                network_id=body.get('network_id', 'net-vwan-valheim'),
                name=filename,
                size_mb=float(body.get('size_mb', 15.0)),
                uploaded_by_peer=self.storage.current_user_name,
                uploaded_by_ip=self.storage.current_user_ip,
                category=body.get('category', 'document'),
                download_count=0,
                uploaded_at="Just now"
            )
            self.storage.files.insert(0, new_file)
            self.storage.save()
            self._send_json({"status": "shared", "file": new_file.to_dict()}, status=201)
            return

        elif path == '/api/reset':
            self.storage.reset()
            self._send_json({"status": "ok", "message": "Reset to default demo data"})
            return

        self._send_json({"error": f"Route not found: {path}"}, status=404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/networks':
            net_id = query.get('id', [''])[0]
            if net_id in self.storage.networks:
                del self.storage.networks[net_id]
                self.storage.peers.pop(net_id, None)
                self.storage.save()
                self._send_json({"status": "deleted", "id": net_id})
                return
            self._send_json({"error": "Network not found"}, status=404)
            return

        self._send_json({"error": f"Route not found: {path}"}, status=404)

    def _serve_web_ui(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>V-WAN Virtual Network — Python Engine</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <i class="fa-solid fa-network-wired text-lg"></i>
      </div>
      <div>
        <h1 class="font-bold text-lg text-white flex items-center gap-2">
          V-WAN Platform <span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Python 3 Edition</span>
        </h1>
        <p class="text-xs text-slate-400">WireGuard Mesh, WAN Host File & LAN Isolation</p>
      </div>
    </div>

    <!-- Role Switcher & Status -->
    <div class="flex items-center gap-3">
      <div class="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
        <button id="btnRoleUser" onclick="setRole('user')" class="px-3 py-1 rounded font-medium transition-colors">User Mode</button>
        <button id="btnRoleAdmin" onclick="setRole('admin')" class="px-3 py-1 rounded font-medium transition-colors">Admin Mode</button>
      </div>
      <button onclick="fetchStatus()" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs">
        <i class="fa-solid fa-arrows-rotate"></i> Refresh
      </button>
    </div>
  </header>

  <main class="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
    <!-- Notice Banner -->
    <div id="roleBanner" class="p-4 rounded-xl border flex items-center justify-between text-xs"></div>

    <!-- Grid View -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Networks List -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-ethernet text-emerald-400"></i> Virtual Adapters
          </h2>
          <button onclick="promptCreateNetwork()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">
            + New VLAN
          </button>
        </div>
        <div id="networksList" class="space-y-3"></div>
      </div>

      <!-- Center: Peers & Diagnostics -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-users text-indigo-400"></i> Connected Peers
          </h2>
          <span id="peersCountBadge" class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300"></span>
        </div>
        <div id="peersList" class="space-y-2 max-h-[420px] overflow-y-auto"></div>
      </div>

      <!-- Right: Security, WAN Hosts & Files -->
      <div class="space-y-6">
        <!-- WAN Host File (Admin vs User) -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-file-lines text-amber-400"></i> WAN Host File
            </h2>
            <span id="wanHostBadge" class="text-[10px] font-bold px-2 py-0.5 rounded"></span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Master DNS & host resolution table (/etc/hosts) for mapping static peer IPs to domain names.
          </p>
          <div class="flex items-center gap-2">
            <button onclick="viewWanHosts()" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold">
              Inspect Hosts
            </button>
            <button onclick="downloadWanHosts()" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">
              <i class="fa-solid fa-download"></i> .hosts
            </button>
          </div>
        </div>

        <!-- LAN File Isolation Policy -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-folder-open text-cyan-400"></i> LAN File Sharing
            </h2>
            <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">P2P SMB</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Standard users may only access their own device files. Admins hold global storage clearance.
          </p>
          <div id="fileSharesList" class="space-y-2 max-h-[220px] overflow-y-auto text-xs"></div>
        </div>
      </div>
    </div>
  </main>

  <!-- Hosts Viewer Modal -->
  <div id="modalHosts" class="fixed inset-0 bg-black/80 hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-sm text-emerald-300 flex items-center gap-2">
          <i class="fa-solid fa-terminal"></i> Master WAN Hosts Resolution File (/etc/hosts)
        </h3>
        <button onclick="closeHostsModal()" class="text-slate-400 hover:text-white">&times;</button>
      </div>
      <pre id="hostsModalContent" class="bg-black/80 text-emerald-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 whitespace-pre"></pre>
      <div class="flex justify-end gap-2">
        <button onclick="closeHostsModal()" class="px-4 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Close</button>
      </div>
    </div>
  </div>

  <script>
    let currentRole = 'admin';
    let currentNetworkId = 'net-vwan-valheim';

    async function fetchStatus() {
      const res = await fetch('/api/status');
      const data = await res.json();
      currentRole = data.user_role;
      updateRoleUI();
      loadNetworks();
      loadPeers();
      loadFiles();
    }

    function updateRoleUI() {
      const btnUser = document.getElementById('btnRoleUser');
      const btnAdmin = document.getElementById('btnRoleAdmin');
      const banner = document.getElementById('roleBanner');
      const badge = document.getElementById('wanHostBadge');

      if (currentRole === 'admin') {
        btnAdmin.className = 'px-3 py-1 rounded font-semibold bg-emerald-600 text-white';
        btnUser.className = 'px-3 py-1 rounded text-slate-400 hover:text-white';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700';
        badge.innerText = 'Admin: Full Access';
        banner.className = 'p-3 rounded-xl border bg-emerald-950/40 border-emerald-800/80 text-emerald-300 flex items-center justify-between text-xs';
        banner.innerHTML = '<span><i class="fa-solid fa-shield-halved mr-2"></i> <strong>Administrator Privilege Active:</strong> Full clearance to export master WAN Host File & audit all LAN files.</span>';
      } else {
        btnUser.className = 'px-3 py-1 rounded font-semibold bg-indigo-600 text-white';
        btnAdmin.className = 'px-3 py-1 rounded text-slate-400 hover:text-white';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800';
        badge.innerText = 'Locked: Admin Only';
        banner.className = 'p-3 rounded-xl border bg-amber-950/40 border-amber-800/80 text-amber-300 flex items-center justify-between text-xs';
        banner.innerHTML = '<span><i class="fa-solid fa-lock mr-2"></i> <strong>Standard User Mode Active:</strong> WAN Host File locked to prevent DNS poisoning. Cross-peer file downloads restricted.</span>';
      }
    }

    async function setRole(role) {
      await fetch('/api/role', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({role})
      });
      currentRole = role;
      updateRoleUI();
      loadFiles();
    }

    async function loadNetworks() {
      const res = await fetch('/api/networks');
      const data = await res.json();
      const container = document.getElementById('networksList');
      container.innerHTML = '';
      data.networks.forEach(net => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border transition-colors cursor-pointer ${net.id === currentNetworkId ? 'bg-slate-800/90 border-emerald-500' : 'bg-slate-850/60 border-slate-750'}`;
        div.onclick = () => { currentNetworkId = net.id; loadNetworks(); loadPeers(); };
        div.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-white">${net.name}</span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded ${net.is_connected ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${net.interface_name}</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Subnet: ${net.subnet_cidr}</span>
            <span class="text-emerald-400 font-mono">${net.assigned_virtual_ip}</span>
          </div>
        `;
        container.appendChild(div);
      });
    }

    async function loadPeers() {
      const res = await fetch(`/api/peers?network_id=${currentNetworkId}`);
      const data = await res.json();
      const container = document.getElementById('peersList');
      document.getElementById('peersCountBadge').innerText = `${data.peers.length} peers`;
      container.innerHTML = '';
      data.peers.forEach(peer => {
        const div = document.createElement('div');
        div.className = 'p-2.5 rounded bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs';
        div.innerHTML = `
          <div>
            <div class="font-semibold text-slate-200 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${peer.is_online ? 'bg-emerald-400' : 'bg-slate-600'}"></span>
              ${peer.name}
            </div>
            <div class="text-[11px] text-slate-400 font-mono">${peer.virtual_ip} • ${peer.platform}</div>
          </div>
          <button onclick="pingPeer('${peer.id}', '${peer.name}')" class="px-2 py-1 bg-slate-750 hover:bg-slate-700 text-slate-300 rounded text-[11px]">
            Ping
          </button>
        `;
        container.appendChild(div);
      });
    }

    async function loadFiles() {
      const res = await fetch(`/api/files?network_id=${currentNetworkId}`);
      const data = await res.json();
      const container = document.getElementById('fileSharesList');
      container.innerHTML = '';
      data.files.forEach(f => {
        const div = document.createElement('div');
        div.className = 'p-2 rounded bg-slate-800/60 border border-slate-700/60 flex items-center justify-between';
        div.innerHTML = `
          <div class="overflow-hidden pr-2">
            <div class="font-medium text-slate-200 truncate">${f.name}</div>
            <div class="text-[10px] text-slate-400">${f.uploaded_by_peer} (${f.size_mb} MB)</div>
          </div>
          <button onclick="downloadFile('${f.id}', '${f.name}', ${f.can_download})" class="px-2 py-1 rounded text-[11px] font-medium shrink-0 ${f.can_download ? 'bg-emerald-700 text-white hover:bg-emerald-600' : 'bg-slate-800 text-rose-400 border border-rose-900/60 cursor-not-allowed'}">
            ${f.can_download ? '<i class="fa-solid fa-download"></i> Get' : '<i class="fa-solid fa-lock"></i> Locked'}
          </button>
        `;
        container.appendChild(div);
      });
    }

    async function pingPeer(peerId, name) {
      const res = await fetch(`/api/ping?peer_id=${peerId}`);
      const data = await res.json();
      alert(`[ICMP Ping Diagnostic]\\nTarget: ${name} (${data.virtual_ip})\\nRound-Trip Time: ${data.rtt_ms} ms\\nJitter: ${data.jitter_ms} ms\\nPacket Loss: ${data.packet_loss_pct}%\\nTunnel: Direct P2P OK`);
    }

    async function downloadFile(id, name, canDownload) {
      if (!canDownload) {
        alert("LAN File Isolation Policy Violation:\\nStandard users may only download their own device files.\\nElevate to Administrator mode to access remote peer shares.");
        return;
      }
      window.location.href = `/api/files/download?id=${id}`;
    }

    async function viewWanHosts() {
      const res = await fetch(`/api/wan-hosts?network_id=${currentNetworkId}`);
      if (res.status === 403) {
        const err = await res.json();
        alert(`Access Restricted (Admin Only):\\n${err.error}\\n${err.message}`);
        return;
      }
      const data = await res.json();
      document.getElementById('hostsModalContent').innerText = data.hosts_content;
      document.getElementById('modalHosts').style.display = 'flex';
    }

    function downloadWanHosts() {
      if (currentRole !== 'admin') {
        alert("Access Denied: WAN Host File can only be exported by Administrators.");
        return;
      }
      window.location.href = `/api/wan-hosts?network_id=${currentNetworkId}&download=1`;
    }

    function closeHostsModal() {
      document.getElementById('modalHosts').style.display = 'none';
    }

    async function promptCreateNetwork() {
      const name = prompt("Enter Virtual Network Name:", "Sim-Racing LAN");
      if (!name) return;
      await fetch('/api/networks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name})
      });
      loadNetworks();
    }

    window.onload = fetchStatus;
  </script>
</body>
</html>
"""
        self._send_text(html, content_type='text/html; charset=utf-8')

def run_server(port: int = 8080, db_path: str = "vwan_state.json"):
    storage = StorageManager(db_path=db_path)
    VWanApiHandler.storage = storage
    
    server_address = ('0.0.0.0', port)
    with socketserver.ThreadingTCPServer(server_address, VWanApiHandler) as httpd:
        print(f"[V-WAN Python Engine] Server listening at http://0.0.0.0:{port}")
        print(f"[V-WAN Python Engine] Web GUI and REST API online. Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[V-WAN Python Engine] Shutting down cleanly...")
            storage.save()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
