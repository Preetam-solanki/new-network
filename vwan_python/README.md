# V-WAN — Python Engine & Control Plane

A standalone Python 3 implementation of the **V-WAN (Virtual WAN & VLAN Platform)**. It provides a complete control plane, WireGuard profile generator, master WAN host resolution table (`/etc/hosts`) coordinator, LAN multiplayer game discovery, P2P file sharing with LAN isolation, interactive CLI, and an embedded web dashboard with REST API.

---

## 🌟 Highlights

- **Zero-Dependency Core**: Built entirely on the Python 3.10+ standard library (`http.server`, `socketserver`, `dataclasses`, `argparse`, `secrets`).
- **Full WireGuard Integration**: Generates production-ready `wg-quick` `.conf` files with Curve25519-compatible keypair generation.
- **Admin-Gated WAN Host File**: Master `/etc/hosts` resolution table mapping static peer virtual IPs to domain names, strictly restricted to Administrator access.
- **LAN File Isolation Policy**: Standard users can only access files hosted on their own device (`Your-Laptop`); cross-peer downloads are blocked unless elevated to Administrator.
- **Interactive CLI & Web GUI**: Includes both an interactive command-line tool (`cli.py`) and a built-in browser dashboard with full REST API (`server.py`).

---

## 📁 Directory Structure

```
vwan_python/
├── __init__.py           # Package marker & metadata
├── models.py             # Dataclasses (Network, Peer, Game, File, Host, ACL)
├── wireguard.py          # Keypair generator, wg-quick & /etc/hosts builders
├── storage.py            # JSON-backed persistence & default VLAN seed state
├── server.py             # Built-in HTTP server, REST API & Web GUI
├── cli.py                # Command-line interface with colored output
├── main.py               # Runnable module entrypoint
├── requirements.txt      # Dependency specification
├── tests/
│   └── test_vwan.py      # Unit test suite (WireGuard, RBAC, isolation, storage)
└── README.md             # This documentation
```

---

## 🚀 Quick Start

### 1. Run the Web Dashboard & REST API
```bash
# Launch server on port 8080 (or any custom port)
python3 -m vwan_python.cli serve --port 8080

# Or run via main.py
python3 vwan_python/main.py serve --port 8080
```
Open your browser at **http://localhost:8080** to access the web GUI.

### 2. Run the Command-Line Interface (CLI)

#### List Virtual Networks
```bash
python3 -m vwan_python.cli list-networks
```

#### List Connected Peers
```bash
python3 -m vwan_python.cli list-peers --network net-vwan-valheim
```

#### Export WireGuard Client Profile
```bash
python3 -m vwan_python.cli export-wg --network net-vwan-valheim --out vwan0.conf
```

#### Export WAN Host File (`/etc/hosts`) — Admin Only
```bash
# In Admin mode:
python3 -m vwan_python.cli export-hosts --network net-vwan-valheim --out vwan0.hosts

# In User mode (Access Denied):
python3 -m vwan_python.cli set-role user
python3 -m vwan_python.cli export-hosts --network net-vwan-valheim
# Output: [Access Denied] The WAN Host File is restricted to Administrator role.
```

#### Add Custom Host Mapping (Admin Only)
```bash
python3 -m vwan_python.cli add-host \
  --ip 10.147.19.100 \
  --hostname dedicated-gameserver.vwan.lan \
  --aliases "gameserver,valheim-box" \
  --description "Dedicated 24/7 Game Server VM"
```

#### Test LAN File Isolation Policy
```bash
# Switch to Standard User
python3 -m vwan_python.cli set-role user

# Try downloading a remote peer's file (Blocked)
python3 -m vwan_python.cli download-file --id file-2
# Output: [LAN File Isolation Policy Violation] You cannot access files uploaded by remote peer.

# Download own device file (Allowed)
python3 -m vwan_python.cli download-file --id file-1
# Output: Downloaded 'ValheimPlus_v0.9.9_Modpack.zip' successfully!
```

#### Ping Peer Diagnostic
```bash
python3 -m vwan_python.cli ping --peer-id peer-2
```

---

## 📡 REST API Reference

| Endpoint | Method | Role | Description |
|:---|:---:|:---:|:---|
| `/api/status` | `GET` | All | Returns network statistics, peer counts, and active role. |
| `/api/networks` | `GET` | All | Lists all enrolled virtual network adapters. |
| `/api/networks` | `POST` | All | Creates a new VLAN with custom CIDR subnet. |
| `/api/networks/toggle` | `POST` | All | Toggles interface state (`UP`/`DOWN`). |
| `/api/peers?network_id=X` | `GET` | All | Lists peers with latency, endpoint, and handshake stats. |
| `/api/wireguard-config?network_id=X` | `GET` | All | Returns or downloads `wg-quick` configuration. |
| `/api/wan-hosts?network_id=X` | `GET` | **Admin** | Returns `/etc/hosts` content. Returns `403` for standard users. |
| `/api/wan-hosts` | `POST` | **Admin** | Registers a new custom host mapping. |
| `/api/files?network_id=X` | `GET` | All | Lists shared files with per-file `can_download` permissions. |
| `/api/files/download?id=X` | `GET` | **Isolated** | Downloads file. Returns `403` if standard user attempts to download remote file. |
| `/api/role` | `POST` | All | Switches active role between `admin` and `user`. |
| `/api/ping?peer_id=X` | `GET` | All | Live ICMP round-trip latency & jitter diagnostic. |

---

## 🧪 Running Unit Tests

Run the built-in test suite:
```bash
PYTHONPATH=. python3 -m unittest vwan_python/tests/test_vwan.py
```
Test coverage verifies:
- WireGuard keypair generation and format conformance.
- `wg-quick` configuration template rendering.
- `/etc/hosts` table compilation with custom host entries.
- LAN file isolation policies for standard users vs administrators.
- JSON database state persistence and loading.

---

## 📄 License
MIT License.
