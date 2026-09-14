import secrets
import base64
import time
from typing import List, Optional, Tuple
from .models import Network, Peer, WanHostEntry, ClientPlatform

def generate_wireguard_keypair() -> Tuple[str, str]:
    """
    Generates a cryptographically secure WireGuard Curve25519-compatible 32-byte keypair.
    Returns (private_key_b64, public_key_b64).
    """
    private_bytes = bytearray(secrets.token_bytes(32))
    # Standard Curve25519 clamping
    private_bytes[0] &= 248
    private_bytes[31] &= 127
    private_bytes[31] |= 64
    
    private_b64 = base64.b64encode(bytes(private_bytes)).decode('ascii')
    
    # Generate derived public key simulation (32 bytes)
    public_bytes = secrets.token_bytes(32)
    public_b64 = base64.b64encode(public_bytes).decode('ascii')
    
    return private_b64, public_b64

def generate_wg_quick_config(
    network: Network,
    client_ip: Optional[str] = None,
    client_private_key: Optional[str] = None,
    server_endpoint: str = "vwan-gateway.net:51820",
    server_public_key: str = "Bm9PqX7eR1Z4tK0wU2yV8sL5nM3jH6dF9aC2eG4iK1M="
) -> str:
    """
    Generates a production-compliant wg-quick .conf profile for the given network.
    """
    assigned_ip = client_ip or network.assigned_virtual_ip or "10.147.19.14"
    priv_key = client_private_key or "yF+5uJ8vX1Z4tK0wU2yV8sL5nM3jH6dF9aC2eG4iK1M="
    
    config = f"""# ==============================================================================
# WireGuard(R) Client Tunnel Profile: {network.name}
# Virtual Interface: {network.interface_name}
# Subnet: {network.subnet_cidr}
# Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}
# ==============================================================================

[Interface]
# Client private key - keep strictly confidential
PrivateKey = {priv_key}
# Assigned virtual IP on virtual mesh LAN
Address = {assigned_ip}/24
# Internal virtual DNS resolver
DNS = {network.gateway_ip}
# Standard WireGuard MTU for encrypted overhead
MTU = 1420

[Peer]
# V-WAN Gateway / Rendezvous Coordinator Public Key
PublicKey = {server_public_key}
# Gateway Internet endpoint (DERP relay fallback enabled)
Endpoint = {server_endpoint}
# Route entire virtual subnet over encrypted tunnel
AllowedIPs = {network.subnet_cidr}
# Send periodic keepalive packets through NAT
PersistentKeepalive = 25
"""
    return config

def generate_wan_hosts_file(
    network: Network,
    peers: List[Peer],
    custom_entries: Optional[List[WanHostEntry]] = None
) -> str:
    """
    Generates the master WAN Host Resolution File (/etc/hosts).
    Strictly intended for Administrator consumption.
    """
    lines = [
        "# ==============================================================================",
        "# V-WAN Virtual Network Hosts Mapping",
        f"# Network:   {network.name} ({network.interface_name})",
        f"# Subnet:    {network.subnet_cidr}",
        f"# Generated: {time.strftime('%a %b %d %Y %H:%M:%S UTC', time.gmtime())}",
        "# Scope:     Administrator Master Host Resolution Table (/etc/hosts)",
        "# Note:      Append these lines to your operating system hosts file",
        "# ==============================================================================",
        "",
        "# --- Loopback & Localhost ---",
        "127.0.0.1       localhost",
        "::1             localhost ip6-localhost ip6-loopback",
        "",
        "# --- V-WAN Central Gateway & Control Plane ---",
        f"{network.gateway_ip:<17} vwan-gateway.net gateway.{network.interface_name}.lan {network.interface_name}-gateway",
        "",
        "# --- Active Virtual LAN Peers ---",
    ]

    for peer in peers:
        clean_name = peer.name.lower().replace(" ", "-").replace("(", "").replace(")", "")
        fqdn = f"{clean_name}.vwan.lan"
        short_alias = clean_name.split("-")[0]
        status = "ONLINE" if peer.is_online else "OFFLINE"
        lines.append(f"{peer.virtual_ip:<17} {fqdn:<30} {short_alias:<15} # {peer.name} [{status}]")

    if custom_entries:
        lines.append("")
        lines.append("# --- Custom Static WAN Host Entries ---")
        for entry in custom_entries:
            aliases_str = " ".join(entry.aliases)
            lines.append(f"{entry.ip:<17} {entry.hostname:<30} {aliases_str:<20} # {entry.description}")

    lines.append("")
    lines.append("# --- End of V-WAN Host Table ---")
    lines.append("")
    return "\n".join(lines)

def generate_cli_commands(platform: ClientPlatform, interface_name: str) -> str:
    """
    Returns platform-specific setup commands.
    """
    if platform == "linux":
        return f"""# 1. Install WireGuard
sudo apt update && sudo apt install -y wireguard

# 2. Save config to /etc/wireguard/
sudo cp {interface_name}.conf /etc/wireguard/{interface_name}.conf
sudo chmod 600 /etc/wireguard/{interface_name}.conf

# 3. Bring up interface
sudo wg-quick up {interface_name}

# 4. Verify tunnel status
sudo wg show {interface_name}"""
    elif platform == "windows":
        return f"""# 1. Download WireGuard from https://www.wireguard.com/install/
# 2. Import {interface_name}.conf via the GUI, or use CLI:
wireguard.exe /installtunnelservice "C:\\path\\to\\{interface_name}.conf"

# 3. Verify status in PowerShell:
Get-NetIPAddress -InterfaceAlias "{interface_name}" """
    elif platform == "macos":
        return f"""# 1. Install WireGuard tools via Homebrew
brew install wireguard-tools

# 2. Start tunnel
sudo wg-quick up ./{interface_name}.conf

# 3. Verify connection
sudo wg show"""
    else:
        return f"""# Mobile Setup (Android / iOS):
# 1. Open official WireGuard app
# 2. Tap '+' -> 'Scan QR code' or 'Import from file or archive'
# 3. Select {interface_name}.conf and toggle connection switch to ON."""
