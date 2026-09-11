import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  Radio, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Globe, 
  Cpu, 
  Code,
  Download
} from 'lucide-react';
import { DERP_RELAYS } from '../mockData';

export const ControlPlaneArchitecture: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'docker' | 'api' | 'derp'>('blueprint');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const dockerComposeCode = `version: '3.8'

services:
  # 1. V-WAN Control Plane API (Go + Gin / WireGuard Key Coordinator)
  vwan-control-plane:
    image: ghcr.io/vwan-project/vwan-control-plane:v2.4
    container_name: vwan-control-plane
    restart: unless-stopped
    ports:
      - "8080:8080"       # REST API & WebSockets for peer real-time updates
      - "51820:51820/udp" # WireGuard Central Tunnel Gateway (wireguard-go)
    environment:
      - DATABASE_URL=postgres://vwan_admin:vwan_secret_pass@vwan-postgres:5432/vwan_db?sslmode=disable
      - JWT_SECRET=change_me_super_secure_jwt_secret_64chars
      - STUN_SERVER=derp.vwan.net:3478
      - DERP_MAP_URL=https://control.vwan.net/derp/map.json
      - ENABLE_AUTO_VLAN_SUBNET=true
      - MAX_NODES_PER_NETWORK=500
    depends_on:
      vwan-postgres:
        condition: service_healthy
    cap_add:
      - NET_ADMIN
      - SYS_MODULE

  # 2. Relational Database (PostgreSQL 16)
  vwan-postgres:
    image: postgres:16-alpine
    container_name: vwan-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=vwan_admin
      - POSTGRES_PASSWORD=vwan_secret_pass
      - POSTGRES_DB=vwan_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vwan_admin -d vwan_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 3. DERP / STUN Relay Node (Tailscale DERP open-source server for NAT traversal)
  vwan-derp-relay:
    image: ghcr.io/vwan-project/derper:latest
    container_name: vwan-derp-relay
    restart: unless-stopped
    ports:
      - "3478:3478/udp" # STUN port for UDP NAT hole-punching
      - "8443:8443"     # DERP TLS fallback relay protocol (TCP)
    environment:
      - DERP_DOMAIN=relay-us.vwan.net
      - DERP_ADDR=:8443
      - DERP_STUN_PORT=3478
      - DERP_VERIFY_CLIENTS=true

volumes:
  pgdata:
`;

  const goControlPlaneSpec = `// Package main - Self-Hosted V-WAN Control Plane (Go 1.23)
package main

import (
	"context"
	"net/http"
	"github.com/gin-gonic/gin"
	"golang.zx2c4.com/wireguard/wgctrl"
	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

// Network represents an isolated virtual LAN subnet
type Network struct {
	ID          string   \`json:"id"\`
	Name        string   \`json:"name"\`
	CIDR        string   \`json:"cidr"\` // e.g. "10.147.19.0/24"
	OwnerID     string   \`json:"owner_id"\`
	MaxNodes    int      \`json:"max_nodes"\` // max 500
	InviteCode  string   \`json:"invite_code"\`
	ACLPolicy   string   \`json:"acl_policy"\`
}

// Node represents an enrolled device running WireGuard
type Node struct {
	ID          string            \`json:"id"\`
	NetworkID   string            \`json:"network_id"\`
	VirtualIP   string            \`json:"virtual_ip"\`
	PublicKey   wgtypes.Key       \`json:"public_key"\`
	Endpoint    string            \`json:"endpoint"\`
	LastHandshake int64           \`json:"last_handshake"\`
	Connection  string            \`json:"connection"\` // "p2p" or "derp_relay"
}

func main() {
	r := gin.Default()

	// REST API Endpoints
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/register", handleRegister)
		v1.POST("/auth/login", handleLogin)

		// VLAN management
		v1.POST("/networks", createVLAN)
		v1.GET("/networks/:id/peers", getPeers)
		v1.POST("/networks/:id/join", joinVLAN)

		// WireGuard node handshake & DERP sync
		v1.POST("/node/register", registerWireGuardNode)
		v1.POST("/node/heartbeat", updateHandshake)
		v1.GET("/node/ws", streamRealtimePeerUpdates) // WebSocket
	}

	r.Run(":8080")
}`;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <span>Control Plane Architecture & Self-Hosting Hub</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                Headscale / WireGuard / DERP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Complete production specifications for deploying your own stateless Go Control Plane, PostgreSQL database, and distributed DERP relays for full self-sovereign virtual WAN networking.
            </p>
          </div>

          <button
            onClick={() => handleCopy(dockerComposeCode, 'docker')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copiedText === 'docker' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy docker-compose.yml</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'blueprint'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Blueprint</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docker'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>docker-compose.yml</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Go REST & WS Spec</span>
          </button>

          <button
            onClick={() => setActiveTab('derp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'derp'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>DERP Relay Network ({DERP_RELAYS.length} Nodes)</span>
          </button>
        </div>
      </div>

      {/* Tab contents */}
      {activeTab === 'blueprint' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-100">Control Plane Layer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stateless Golang service (Gin/Echo) managing Curve25519 key coordination, auto-subnet allocation (/24 CIDR per VLAN), ACL enforcement via eBPF/iptables, and real-time node state broadcasting via WebSockets.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-100">Tunneling & P2P Mesh</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every peer runs a WireGuard interface (<code className="text-emerald-300 font-mono">vwan0</code>). UDP hole punching via STUN establishes direct P2P connections whenever possible for near-zero added latency in competitive gaming.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-100">DERP / TURN Relay Fallback</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When symmetric NAT or strict university/cellular firewalls prevent direct UDP sockets, traffic seamlessly routes via regional DERP relay nodes over HTTPS (Port 443) without breaking encryption.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-400">docker-compose.yml</span>
            <button
              onClick={() => handleCopy(dockerComposeCode, 'docker')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedText === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'docker' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 bg-black/80 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
            {dockerComposeCode}
          </pre>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-400">main.go (Control Plane Blueprint)</span>
            <button
              onClick={() => handleCopy(goControlPlaneSpec, 'go')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedText === 'go' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'go' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 bg-black/80 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
            {goControlPlaneSpec}
          </pre>
        </div>
      )}

      {activeTab === 'derp' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DERP_RELAYS.map((node) => (
            <div
              key={node.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{node.city}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                    STUN :3478
                  </span>
                </div>
                <div className="text-slate-400 mt-0.5">{node.country}</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Latency:</span>
                  <span className="text-emerald-400 font-bold">{node.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Relays:</span>
                  <span>{node.currentRelaySessions} tunnels</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
