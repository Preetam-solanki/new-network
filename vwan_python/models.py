from dataclasses import dataclass, field, asdict
from typing import List, Optional, Literal, Dict, Any
import time

ClientPlatform = Literal["linux", "windows", "android", "ios", "macos"]
UserRole = Literal["admin", "user"]
AclPreset = Literal["gaming_safe", "isolated", "dev_ssh", "promiscuous"]

@dataclass
class AclRule:
    id: str
    name: str
    action: Literal["ACCEPT", "DROP"]
    protocol: Literal["TCP", "UDP", "ICMP", "ALL"]
    port_range: str
    source_cidr: str
    description: str

@dataclass
class Network:
    id: str
    name: str
    subnet_cidr: str
    interface_name: str
    gateway_ip: str
    encryption: str
    is_connected: bool
    peers_count: int
    max_peers: int
    is_public: bool
    invite_code: str
    assigned_virtual_ip: str
    acl_preset: AclPreset
    bytes_rx: int = 0
    bytes_tx: int = 0
    password: Optional[str] = None
    category: Optional[str] = "Gaming"
    description: Optional[str] = ""
    rules: List[AclRule] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Peer:
    id: str
    network_id: str
    name: str
    platform: ClientPlatform
    virtual_ip: str
    endpoint: str
    is_online: bool
    connection_type: Literal["direct_p2p", "derp_relay"]
    latency_ms: int
    jitter_ms: int
    packet_loss_pct: float
    public_key: str
    last_handshake: str
    transfer_rx: str
    transfer_tx: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class LanGameBroadcast:
    id: str
    network_id: str
    game_title: str
    host_peer_name: str
    virtual_socket: str
    game_mode: str
    players_current: int
    players_max: int
    ping_ms: int
    broadcast_port: int
    map_name: str
    is_password_protected: bool

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class SharedFile:
    id: str
    network_id: str
    name: str
    size_mb: float
    uploaded_by_peer: str
    uploaded_by_ip: str
    category: Literal["mod", "map", "config", "patch", "document"]
    download_count: int
    uploaded_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class WanHostEntry:
    id: str
    ip: str
    hostname: str
    aliases: List[str]
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
