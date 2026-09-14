import json
import os
from typing import Dict, List, Optional, Any
from .models import Network, Peer, LanGameBroadcast, SharedFile, WanHostEntry, UserRole, AclRule

DEFAULT_NETWORKS = [
    Network(
        id="net-vwan-valheim",
        name="Valheim Dedicated & Co-Op EU",
        subnet_cidr="10.147.19.0/24",
        interface_name="vwan0",
        gateway_ip="10.147.19.1",
        encryption="Curve25519 / ChaCha20",
        is_connected=True,
        peers_count=5,
        max_peers=64,
        is_public=True,
        invite_code="VWAN-VAL-8821",
        assigned_virtual_ip="10.147.19.14",
        acl_preset="gaming_safe",
        bytes_rx=412000000,
        bytes_tx=198000000,
        category="Gaming",
        description="Public EU server for dedicated Valheim co-op sessions and boss raids.",
        rules=[
            AclRule("rule-1", "Allow Game UDP", "ACCEPT", "UDP", "2456-2458", "10.147.19.0/24", "Permit Valheim game traffic"),
            AclRule("rule-2", "Allow ICMP Ping", "ACCEPT", "ICMP", "ALL", "10.147.19.0/24", "Permit echo requests"),
            AclRule("rule-3", "Block NetBIOS", "DROP", "UDP", "137-139", "10.147.19.0/24", "Block Windows NetBIOS noise")
        ]
    ),
    Network(
        id="net-vwan-minecraft",
        name="Minecraft Survival 1.20.4 SMP",
        subnet_cidr="10.10.5.0/24",
        interface_name="vwan1",
        gateway_ip="10.10.5.1",
        encryption="Curve25519 / ChaCha20",
        is_connected=False,
        peers_count=8,
        max_peers=32,
        is_public=True,
        invite_code="VWAN-MC-5591",
        assigned_virtual_ip="10.10.5.12",
        acl_preset="gaming_safe",
        bytes_rx=89000000,
        bytes_tx=42000000,
        category="Gaming",
        description="Vanilla+ survival SMP multiplayer world.",
        rules=[
            AclRule("rule-mc-1", "Allow Minecraft TCP", "ACCEPT", "TCP", "25565", "10.10.5.0/24", "Permit default Minecraft server port"),
            AclRule("rule-mc-2", "Allow Voice Chat UDP", "ACCEPT", "UDP", "24454", "10.10.5.0/24", "Simple Voice Chat plugin port")
        ]
    ),
    Network(
        id="net-vwan-homelab",
        name="Homelab SSH & NAS Cluster",
        subnet_cidr="10.200.0.0/24",
        interface_name="vwan2",
        gateway_ip="10.200.0.1",
        encryption="Curve25519 / ChaCha20",
        is_connected=True,
        peers_count=3,
        max_peers=16,
        is_public=False,
        invite_code="VWAN-LAB-4412",
        assigned_virtual_ip="10.200.0.2",
        acl_preset="dev_ssh",
        bytes_rx=1200000000,
        bytes_tx=840000000,
        category="Infrastructure",
        description="Secure private tunnel for remote server management and NAS backups.",
        rules=[
            AclRule("rule-lab-1", "Allow SSH", "ACCEPT", "TCP", "22", "10.200.0.0/24", "Permit SSH management"),
            AclRule("rule-lab-2", "Allow HTTPS", "ACCEPT", "TCP", "443", "10.200.0.0/24", "Permit web UI dashboards")
        ]
    )
]

DEFAULT_PEERS = {
    "net-vwan-valheim": [
        Peer(
            id="peer-1",
            network_id="net-vwan-valheim",
            name="Your-Laptop (This Device)",
            platform="linux",
            virtual_ip="10.147.19.14",
            endpoint="192.168.1.105:51820",
            is_online=True,
            connection_type="direct_p2p",
            latency_ms=12,
            jitter_ms=1,
            packet_loss_pct=0.0,
            public_key="k7L8m9N0p1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d5E6f7G=",
            last_handshake="2 seconds ago",
            transfer_rx="198 MB",
            transfer_tx="412 MB"
        ),
        Peer(
            id="peer-2",
            network_id="net-vwan-valheim",
            name="Viking-Host-PC",
            platform="windows",
            virtual_ip="10.147.19.22",
            endpoint="84.115.42.18:51820",
            is_online=True,
            connection_type="direct_p2p",
            latency_ms=18,
            jitter_ms=2,
            packet_loss_pct=0.0,
            public_key="A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1V=",
            last_handshake="14 seconds ago",
            transfer_rx="340 MB",
            transfer_tx="890 MB"
        ),
        Peer(
            id="peer-3",
            network_id="net-vwan-valheim",
            name="Archer-MacBook",
            platform="macos",
            virtual_ip="10.147.19.38",
            endpoint="194.25.10.92:51820",
            is_online=True,
            connection_type="derp_relay",
            latency_ms=45,
            jitter_ms=4,
            packet_loss_pct=0.2,
            public_key="Z9y8X7w6V5u4T3s2R1q0P9o8N7m6L5k4J3i2H1g0F9E=",
            last_handshake="40 seconds ago",
            transfer_rx="120 MB",
            transfer_tx="110 MB"
        ),
        Peer(
            id="peer-4",
            network_id="net-vwan-valheim",
            name="Shield-Rig-Win11",
            platform="windows",
            virtual_ip="10.147.19.45",
            endpoint="212.58.244.70:51820",
            is_online=True,
            connection_type="direct_p2p",
            latency_ms=22,
            jitter_ms=3,
            packet_loss_pct=0.0,
            public_key="m1N2o3P4q5R6s7T8u9V0w1X2y3Z4a5B6c7D8e9F0g1H=",
            last_handshake="1 minute ago",
            transfer_rx="88 MB",
            transfer_tx="75 MB"
        ),
        Peer(
            id="peer-5",
            network_id="net-vwan-valheim",
            name="Steve-Phone-Android",
            platform="android",
            virtual_ip="10.147.19.51",
            endpoint="178.62.204.11:51820",
            is_online=False,
            connection_type="derp_relay",
            latency_ms=68,
            jitter_ms=8,
            packet_loss_pct=1.5,
            public_key="x1Y2z3A4b5C6d7E8f9G0h1I2j3K4l5M6n7O8p9Q0r1S=",
            last_handshake="12 minutes ago",
            transfer_rx="15 MB",
            transfer_tx="12 MB"
        )
    ]
}

DEFAULT_LAN_GAMES = [
    LanGameBroadcast(
        id="game-1",
        network_id="net-vwan-valheim",
        game_title="Valheim",
        host_peer_name="Viking-Host-PC",
        virtual_socket="10.147.19.22:2456",
        game_mode="Survival Co-op (Mistlands)",
        players_current=4,
        players_max=10,
        ping_ms=18,
        broadcast_port=2456,
        map_name="OdinWorld_Seed99",
        is_password_protected=True
    ),
    LanGameBroadcast(
        id="game-2",
        network_id="net-vwan-valheim",
        game_title="Counter-Strike 2",
        host_peer_name="Shield-Rig-Win11",
        virtual_socket="10.147.19.45:27015",
        game_mode="5v5 Competitive LAN",
        players_current=6,
        players_max=10,
        ping_ms=22,
        broadcast_port=27015,
        map_name="de_inferno",
        is_password_protected=False
    ),
    LanGameBroadcast(
        id="game-3",
        network_id="net-vwan-minecraft",
        game_title="Minecraft Java",
        host_peer_name="Steve-Host",
        virtual_socket="10.10.5.1:25565",
        game_mode="Survival SMP 1.20.4",
        players_current=8,
        players_max=20,
        ping_ms=25,
        broadcast_port=25565,
        map_name="Hermitcraft_Style",
        is_password_protected=False
    )
]

DEFAULT_FILES = [
    SharedFile(
        id="file-1",
        network_id="net-vwan-valheim",
        name="ValheimPlus_v0.9.9_Modpack.zip",
        size_mb=48.5,
        uploaded_by_peer="Your-Laptop (This Device)",
        uploaded_by_ip="10.147.19.14",
        category="mod",
        download_count=14,
        uploaded_at="2 hours ago"
    ),
    SharedFile(
        id="file-2",
        network_id="net-vwan-valheim",
        name="Odin_World_Backup_Day350.db",
        size_mb=122.0,
        uploaded_by_peer="Viking-Host-PC",
        uploaded_by_ip="10.147.19.22",
        category="map",
        download_count=5,
        uploaded_at="Yesterday"
    ),
    SharedFile(
        id="file-3",
        network_id="net-vwan-valheim",
        name="Server_AutoRestart_Script.sh",
        size_mb=0.1,
        uploaded_by_peer="Your-Laptop (This Device)",
        uploaded_by_ip="10.147.19.14",
        category="config",
        download_count=8,
        uploaded_at="3 days ago"
    ),
    SharedFile(
        id="file-4",
        network_id="net-vwan-valheim",
        name="Remote_Telemetry_Report.pdf",
        size_mb=2.4,
        uploaded_by_peer="Archer-MacBook",
        uploaded_by_ip="10.147.19.38",
        category="document",
        download_count=2,
        uploaded_at="5 days ago"
    )
]

DEFAULT_WAN_HOSTS = [
    WanHostEntry(
        id="custom-1",
        ip="10.147.19.100",
        hostname="dedicated-gameserver.vwan.lan",
        aliases=["gameserver", "valheim-box"],
        description="Dedicated 24/7 Game Server VM"
    ),
    WanHostEntry(
        id="custom-2",
        ip="10.147.19.200",
        hostname="nas-storage.vwan.lan",
        aliases=["nas", "backup-vault"],
        description="TrueNAS Virtual Storage Target"
    )
]

class StorageManager:
    """
    Manages persistent state for the V-WAN platform in Python.
    Loads and saves to a local JSON database file.
    """
    def __init__(self, db_path: str = "vwan_state.json"):
        self.db_path = db_path
        self.networks: Dict[str, Network] = {}
        self.peers: Dict[str, List[Peer]] = {}
        self.games: List[LanGameBroadcast] = []
        self.files: List[SharedFile] = []
        self.custom_hosts: List[WanHostEntry] = []
        self.user_role: UserRole = "admin"
        self.current_user_ip: str = "10.147.19.14"
        self.current_user_name: str = "Your-Laptop (This Device)"
        self.load()

    def reset(self):
        self.networks = {net.id: net for net in DEFAULT_NETWORKS}
        self.peers = {k: list(v) for k, v in DEFAULT_PEERS.items()}
        self.games = list(DEFAULT_LAN_GAMES)
        self.files = list(DEFAULT_FILES)
        self.custom_hosts = list(DEFAULT_WAN_HOSTS)
        self.user_role = "admin"
        self.save()

    def load(self):
        if not os.path.exists(self.db_path) or os.path.getsize(self.db_path) == 0:
            self.reset()
            return

        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.user_role = data.get("user_role", "admin")
            self.current_user_ip = data.get("current_user_ip", "10.147.19.14")
            self.current_user_name = data.get("current_user_name", "Your-Laptop (This Device)")

            self.networks = {}
            for net_dict in data.get("networks", []):
                rules = [AclRule(**r) for r in net_dict.pop("rules", [])]
                self.networks[net_dict["id"]] = Network(**net_dict, rules=rules)

            self.peers = {}
            for net_id, peer_list in data.get("peers", {}).items():
                self.peers[net_id] = [Peer(**p) for p in peer_list]

            self.games = [LanGameBroadcast(**g) for g in data.get("games", [])]
            self.files = [SharedFile(**f) for f in data.get("files", [])]
            self.custom_hosts = [WanHostEntry(**h) for h in data.get("custom_hosts", [])]
        except Exception as e:
            print(f"[Warning] Failed to load {self.db_path}: {e}. Resetting to defaults.")
            self.reset()

    def save(self):
        data = {
            "user_role": self.user_role,
            "current_user_ip": self.current_user_ip,
            "current_user_name": self.current_user_name,
            "networks": [net.to_dict() for net in self.networks.values()],
            "peers": {net_id: [p.to_dict() for p in peers] for net_id, peers in self.peers.items()},
            "games": [g.to_dict() for g in self.games],
            "files": [f.to_dict() for f in self.files],
            "custom_hosts": [h.to_dict() for h in self.custom_hosts]
        }
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
