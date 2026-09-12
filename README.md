# V-WAN — Virtual WAN & VLAN Platform

[![Protocol: WireGuard](https://img.shields.io/badge/Protocol-WireGuard-00599C?logo=wireguard&logoColor=white)](#)
[![Stack: React + TypeScript + Tailwind](https://img.shields.io/badge/Stack-React_19_+_TypeScript-3178C6?logo=typescript&logoColor=white)](#)
[![Cross-Platform: Linux | Windows | Android | iOS](https://img.shields.io/badge/Platform-Cross--Platform-10B981)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)

**V-WAN** is a modern, high-performance cross-platform Virtual WAN and VLAN platform inspired by **Radmin VPN**, **LogMeIn Hamachi**, and **Tailscale / Headscale**. It enables users to create and join private, cryptographically isolated virtual local area networks (**VLANs**) for zero-configuration multiplayer LAN gaming, P2P file sharing, and remote access across the internet.

---

## 🚀 Key Features

- **WireGuard® Mesh Data Plane**: Secure peer-to-peer tunnels using state-of-the-art cryptography (Curve25519 key exchange, ChaCha20-Poly1305 authenticated encryption, and BLAKE2s hashing).
- **Multiple Concurrent Virtual Adapters**: Connect to multiple networks at the same time using independent interfaces (`vwan0`, `vwan1`, etc.) without subnet collisions.
- **Radmin-Style Public Game Directory**: Browse, filter, and instantly join public gaming rooms categorized by game and geographic region (e.g., *Valheim Dedicated*, *Minecraft Survival*, *Assetto Corsa*).
- **Zero-Config LAN Game Discovery**: Emulate local UDP broadcast packets across virtual subnets so players can discover hosted games automatically in local server browsers.
- **Role-Based Access Control (RBAC)**:
  - **Standard User**: Access personal LAN files; cross-peer downloads and sensitive master host resolution are locked.
  - **Network Administrator**: Full global storage audit access, ACL firewall management, and access to the master WAN host table.
- **WAN Host File Management (`/etc/hosts`)**: (Admin only) Master DNS and IP-to-hostname mapping table with one-click export and deployment guides for Windows, Linux, macOS, and mobile DNS forwarders.
- **Multi-Platform Support**: Native configuration generation (`.conf` files, mobile QR codes, and CLI setup) for **Windows**, **Linux**, **Android**, and **iOS**.
- **Interactive Ping & Diagnostics**: Built-in ICMP diagnostic tool with live RTT, jitter, and packet loss metrics to verify peer connectivity.
- **NAT Traversal & DERP Relays**: Direct UDP hole punching (STUN) with automatic fallback to encrypted DERP relay nodes (Frankfurt, Ashburn, Tokyo, Singapore).

---

## 🏛️ System Architecture

```
                       +-------------------------------+
                       |   V-WAN Control Plane (Go)    |
                       | - Node Enrollment & REST API  |
                       | - WebSocket Peer Coordination |
                       | - PostgreSQL Storage Layer    |
                       +---------------+---------------+
                                       |
                +----------------------+----------------------+
                |                                             |
     [ Direct P2P Tunnel ]                           [ DERP Relay Fallback ]
  STUN UDP Hole Punching (<15ms)                Symmetric NAT / Strict Firewalls
                |                                             |
    +-----------+-----------+                     +-----------+-----------+
    |                       |                     |                       |
+---+---+               +---+---+             +---+---+               +---+---+
| Peer  |               | Peer  |             | Peer  |               | Peer  |
| Linux |               |  Win  |             |  iOS  |               |Android|
+-------+               +-------+             +-------+               +-------+
```

### 1. Control Plane
- Manages user accounts, network creation, and node allocations.
- Each network receives its own CIDR subnet (e.g., `10.147.19.0/24`) with automatic virtual IP assignment.
- Scales up to 500 nodes per network.

### 2. Tunneling Layer
- Standard WireGuard protocol implemented in kernel space or user space (`wireguard-go`).
- Generates compliant `wg-quick` configuration files:
  ```ini
  [Interface]
  PrivateKey = <Client_Private_Key>
  Address = 10.147.19.14/24
  DNS = 10.147.19.1

  [Peer]
  PublicKey = <Gateway_Public_Key>
  Endpoint = vwan-gateway.net:51820
  AllowedIPs = 10.147.19.0/24
  PersistentKeepalive = 25
  ```

### 3. Access Control Lists (ACLs)
Four built-in firewall presets to secure virtual traffic:
- **Gaming Safe**: Permits standard LAN multiplayer UDP ports and PING while blocking NetBIOS and vulnerable Windows RPC ports.
- **Isolated / Quarantine**: Nodes can only talk to the central gateway; peer-to-peer traffic is denied.
- **Development & SSH**: Permits SSH (port 22), HTTP/S (ports 80/443), and custom dev ports (3000-8080).
- **Promiscuous / Trust All**: Full mesh bidirectional connectivity across all IP protocols.

---

## 📂 Project Structure

```
├── metadata.json              # Applet metadata, name, and capabilities
├── index.html                 # Main HTML entrypoint
├── package.json               # Dependencies and scripts
├── src/
│   ├── main.tsx               # React application entry point
│   ├── App.tsx                # Core state, navigation, and modal orchestration
│   ├── types.ts               # TypeScript interfaces for Networks, Peers, Roles, ACLs
│   ├── storage.ts             # LocalStorage persistence & initial mock demo seed data
│   ├── components/
│   │   ├── Navbar.tsx                   # Top navigation, Role Switcher, Platform selector
│   │   ├── NetworkList.tsx              # Virtual network adapter cards and controls
│   │   ├── PeersView.tsx                # Connected peers list, ping triggers, and actions
│   │   ├── WanHostFileModal.tsx         # Admin-only /etc/hosts resolution manager
│   │   ├── FileShareView.tsx            # P2P file sharing with LAN file isolation policy
│   │   ├── WireGuardConfigModal.tsx     # Config download, QR code generator, CLI syntax
│   │   ├── PublicDirectory.tsx          # Radmin-style public rooms directory
│   │   ├── LanGameDiscovery.tsx         # Local UDP multiplayer game broadcasting
│   │   ├── AclSettingsModal.tsx         # Firewall rule and preset configurator
│   │   ├── PingToolModal.tsx            # Live ICMP ping latency simulator
│   │   ├── ControlPlaneArchitecture.tsx # High-level architectural documentation view
│   │   ├── CreateNetworkModal.tsx       # Wizard to spin up a new virtual network
│   │   ├── JoinNetworkModal.tsx         # Join network by 8-character invite code
│   │   └── MobileFrame.tsx              # Mobile simulator frame for testing mobile UI
│   └── utils/
│       └── wireguard.ts       # WireGuard key generation, hosts file builder, QR code logic
```

---

## 🔒 Security & Access Control

### Administrator vs Standard User
| Feature | Standard User | Network Administrator |
|:---|:---:|:---:|
| **LAN File Sharing** | Can only access/download **own files** | Global audit clearance for all peer files |
| **WAN Host File** | 🚫 Locked (Restricted screen) | Full `/etc/hosts` table editor & export |
| **ACL & Firewall** | View current policies | Modify rules and change network presets |
| **WireGuard Profile**| Download individual client `.conf` | Manage gateway & redistribute client profiles |

---

## 🛠️ Development & Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Compile and check for errors
npm run build
```

---

## 📱 Supported Operating Systems

- **Linux**: Supported natively via `wg-quick up vwan0.conf`.
- **Windows**: Compatible with the official WireGuard for Windows client and Wintun driver.
- **Android**: Scan the generated QR code directly in the official WireGuard Android app.
- **iOS**: Scan the generated QR code directly in the official WireGuard iOS app.

---

## 📄 License
This project is open-source under the MIT License.
