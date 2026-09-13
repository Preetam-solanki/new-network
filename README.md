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

## 📖 User Guide

### 1. Creating or Joining a Virtual Network (VLAN)
- **Creating a Network**:
  1. Click **+ Create VLAN** in the top navigation bar.
  2. Choose a network name (e.g., *Valheim Co-op EU*), a CIDR subnet (e.g., `10.147.19.0/24`), an optional room password, and a peer limit (up to 500 nodes).
  3. Share your generated 8-character invite code (e.g., `VWAN-VAL-8821`) with your friends.
- **Joining an Existing Network**:
  1. Click **Join Network** in the top navigation bar.
  2. Enter the 8-character invite code and network password (if password-protected).
  3. Your client is immediately provisioned with a static virtual IP within that subnet.
- **Browsing Public Lobbies**:
  - Open the **Public Rooms** tab to browse community gaming lobbies categorized by title (*Valheim*, *Minecraft*, *Assetto Corsa*, *Terraria*) and latency region.

### 2. Activating Your WireGuard Tunnel
1. Select your network card from the left-hand **Virtual Networks** panel.
2. Click the **Toggle Switch** on the card to bring the interface `UP`.
3. To connect your operating system or mobile device directly:
   - Click the **WireGuard Config / QR** key icon (`🔑`).
   - **Desktop (Windows/Linux)**: Download `<iface>.conf` or copy the CLI commands.
   - **Mobile (Android/iOS)**: Open the official WireGuard app and scan the generated QR code.

### 3. Hosting & Joining LAN Multiplayer Games
1. Navigate to the **LAN Game Discovery** tab.
2. **Host a Game**:
   - Click **+ Broadcast New Game**.
   - Select your game title, enter the listening port (e.g., `2456` for Valheim, `25565` for Minecraft), and set max players.
   - Your game is immediately advertised across the VLAN via simulated UDP broadcast.
3. **Join a Game**:
   - Click **Copy Direct IP** next to any advertised game to copy the host's virtual socket (e.g., `10.147.19.14:2456`).
   - Paste this IP directly into your in-game "Direct Connect" or "LAN Server" browser.

### 4. P2P File Sharing & Local Storage Access
- Navigate to the **P2P File Sharing & SMB** tab.
- **Upload / Share a File**: Drag and drop any file into the upload zone to share it from your node (`Your-Laptop (This Device)`).
- **LAN File Isolation Policy**:
  - **Standard Users** can view and download files they personally host on their device. Remote peer files remain isolated and locked to prevent unauthorized data exfiltration.
  - **Administrators** possess global clearance to inspect, audit, download, or delete files across all peers in the room.
- **Direct Operating System Mounting**:
  - **Windows Explorer**: Press `Win + R` and enter `\\<Peer_Virtual_IP>\MyLocalShare`
  - **Linux / macOS Finder**: Press `Cmd + K` and enter `smb://<Peer_Virtual_IP>/MyLocalShare`

### 5. Network Diagnostics & Ping Latency
- On any peer card in the **Connected Peers** tab, click **Ping**.
- The interactive ping tool sends simulated ICMP echo requests and charts real-time round-trip time (RTT), packet jitter, and packet loss percentage to verify direct tunnel health.

---

## 🌐 WAN Host File Setup Guide (`/etc/hosts`)

The **WAN Host File** is a master network resolution table that maps each peer's static virtual IP to human-readable domain names (e.g., `valheim-host.vwan.lan`, `dedicated-gameserver.vwan.lan`, `nas-storage.vwan.lan`). 

Instead of typing raw IP addresses (`10.147.19.14`), users and game clients can connect using memorable hostnames.

> ⚠️ **Administrative Access Only**: 
> The WAN Host File is strictly gated to the **Administrator** role. Standard users cannot inspect or modify master host files to prevent DNS hijacking, IP spoofing, and unauthorized network topology discovery.

---

### Step 1: Accessing the WAN Host File (Admin)
1. Ensure your role is set to **Admin Mode** using the role toggle in the top-right header.
2. Open the WAN Host File via any of these locations:
   - Click the **WAN Host File** button in the top navigation sub-bar.
   - Click the **Document icon** (`📄`) on your network card in the network list.
   - Click **WAN Host File** inside the active network's Peers view header.

---

### Step 2: Customizing Host Mappings
Inside the **WAN Host Resolution File** modal:
1. Review auto-generated entries for all active peers in the VLAN.
2. Go to the **Add Custom Host** tab to bind additional virtual appliances:
   - **Virtual IP**: Target IP inside the subnet (e.g., `10.147.19.100`).
   - **Primary Hostname**: Full FQDN (e.g., `dedicated-gameserver.vwan.lan`).
   - **Aliases / Short Names**: Comma-separated shortcuts (e.g., `gameserver, valheim-box`).
   - **Description**: Note on server workload (e.g., *Dedicated 24/7 Game Server VM*).
3. Click **Add to WAN Host Table**. The entry is instantly compiled into the configuration.

---

### Step 3: Exporting the Hosts File
- Click **Download .hosts File** to save `vwan-<interface>.hosts` to your machine.
- Or click **Copy to Clipboard** to copy the complete hosts block:

```text
# ==============================================================================
# V-WAN Virtual Network Hosts Mapping
# Network: Valheim Dedicated & Co-Op EU (vwan0)
# Subnet:  10.147.19.0/24
# Generated: Sat Sep 12 2026
# ==============================================================================

# Central Gateway & Control Plane
10.147.19.1       vwan-gateway.net gateway.vwan0.lan vwan0-gateway

# Active VLAN Peers
10.147.19.14      your-laptop.vwan.lan this-device
10.147.19.22      viking-host-pc.vwan.lan valheim-host
10.147.19.38      archer-macbook.vwan.lan archer-laptop
10.147.19.45      shield-rig-win11.vwan.lan gaming-rig
10.147.19.51      steve-phone-android.vwan.lan mobile-steve

# Custom Static Network Appliances
10.147.19.100     dedicated-gameserver.vwan.lan gameserver valheim-box
10.147.19.200     nas-storage.vwan.lan nas backup-vault
```

---

### Step 4: Installing the WAN Host File on Client Operating Systems

#### 🪟 Windows Setup
1. Open **Notepad** or **PowerShell** as **Administrator** (Right-click > *Run as administrator*).
2. The Windows hosts file is located at:
   ```powershell
   C:\Windows\System32\drivers\etc\hosts
   ```
3. To append the V-WAN entries automatically via elevated PowerShell:
   ```powershell
   # Append downloaded vwan-vwan0.hosts to system hosts file
   Get-Content .\vwan-vwan0.hosts | Add-Content C:\Windows\System32\drivers\etc\hosts

   # Flush DNS resolver cache
   ipconfig /flushdns
   ```

#### 🐧 Linux Setup
1. Open your terminal.
2. Append the entries to `/etc/hosts` with `sudo`:
   ```bash
   sudo tee -a /etc/hosts < vwan-vwan0.hosts
   ```
3. If your system runs `systemd-resolved`, flush your local DNS cache:
   ```bash
   sudo resolvectl flush-caches
   ```

#### 🍎 macOS Setup
1. Open **Terminal**.
2. Append the entries to `/etc/hosts`:
   ```bash
   sudo tee -a /etc/hosts < vwan-vwan0.hosts
   ```
3. Flush the macOS multicast DNS cache:
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

#### 📱 Android & iOS (Mobile)
Mobile operating systems sandbox the system hosts file. To resolve custom V-WAN hostnames on mobile devices:
- **Option A (Recommended)**: Set the `DNS` directive in your WireGuard mobile client profile to point to your V-WAN gateway or local DNS server (e.g., `DNS = 10.147.19.1`).
- **Option B (Homelab / Router)**: Import the generated hosts table into your local DNS forwarder (**Pi-hole**, **AdGuard Home**, **dnsmasq**, or **CoreDNS**).

---

### Step 5: Verifying Host Resolution
Once installed, verify that the hostnames resolve correctly across your virtual tunnel:
```bash
# Test ICMP ping by hostname
ping dedicated-gameserver.vwan.lan
ping valheim-host

# Test SSH connection using alias
ssh root@nas.vwan.lan

# Test web service hosted on peer
curl http://gameserver:8080/health
```

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
