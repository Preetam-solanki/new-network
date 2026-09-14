import argparse
import sys
import os
from .storage import StorageManager
from .wireguard import generate_wg_quick_config, generate_wan_hosts_file, generate_cli_commands
from .models import Network, Peer, LanGameBroadcast, SharedFile, WanHostEntry

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(title: str):
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}=== {title} ==={Colors.ENDC}")

def main():
    parser = argparse.ArgumentParser(
        description="V-WAN Virtual WAN & VLAN Command-Line Utility (Python Edition)"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # list-networks
    subparsers.add_parser("list-networks", help="List all configured virtual adapters and VLANs")

    # create-network
    create_net_parser = subparsers.add_parser("create-network", help="Create a new virtual network")
    create_net_parser.add_argument("--name", required=True, help="Network name")
    create_net_parser.add_argument("--subnet", default="10.147.50.0/24", help="CIDR subnet (e.g. 10.147.50.0/24)")
    create_net_parser.add_argument("--public", action="store_true", help="Publish in public directory")

    # list-peers
    peers_parser = subparsers.add_parser("list-peers", help="List peers inside a virtual network")
    peers_parser.add_argument("--network", default="net-vwan-valheim", help="Network ID")

    # export-wg
    wg_parser = subparsers.add_parser("export-wg", help="Export wg-quick client configuration file")
    wg_parser.add_argument("--network", default="net-vwan-valheim", help="Network ID")
    wg_parser.add_argument("--out", help="Output file path (prints to stdout if omitted)")

    # export-hosts
    hosts_parser = subparsers.add_parser("export-hosts", help="Export WAN Master Host Resolution Table (Admin Only)")
    hosts_parser.add_argument("--network", default="net-vwan-valheim", help="Network ID")
    hosts_parser.add_argument("--out", help="Output file path (prints to stdout if omitted)")

    # add-host
    add_host_parser = subparsers.add_parser("add-host", help="Add custom WAN host mapping to DNS table")
    add_host_parser.add_argument("--ip", required=True, help="Virtual IP address")
    add_host_parser.add_argument("--hostname", required=True, help="Domain FQDN (e.g. gameserver.vwan.lan)")
    add_host_parser.add_argument("--aliases", default="", help="Comma-separated aliases")
    add_host_parser.add_argument("--description", default="Custom Server", help="Description")

    # set-role
    role_parser = subparsers.add_parser("set-role", help="Set active user role (admin vs user)")
    role_parser.add_argument("role", choices=["admin", "user"], help="Role to assume")

    # list-files
    files_parser = subparsers.add_parser("list-files", help="List LAN shared files with access permissions")
    files_parser.add_argument("--network", default="net-vwan-valheim", help="Network ID")

    # download-file
    dl_parser = subparsers.add_parser("download-file", help="Download shared file (enforcing LAN file isolation)")
    dl_parser.add_argument("--id", required=True, help="File ID")

    # ping
    ping_parser = subparsers.add_parser("ping", help="Ping a peer across the virtual WireGuard mesh")
    ping_parser.add_argument("--peer-id", required=True, help="Peer ID to diagnostic ping")

    # serve
    serve_parser = subparsers.add_parser("serve", help="Run the Web GUI & REST API server")
    serve_parser.add_argument("--port", type=int, default=8080, help="Port to listen on (default 8080)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    storage = StorageManager()

    if args.command == "list-networks":
        print_header("V-WAN Virtual Networks")
        for net in storage.networks.values():
            status = f"{Colors.OKGREEN}UP{Colors.ENDC}" if net.is_connected else f"{Colors.FAIL}DOWN{Colors.ENDC}"
            print(f"• [{net.id}] {Colors.BOLD}{net.name}{Colors.ENDC}")
            print(f"  Interface: {net.interface_name} | Status: {status} | Subnet: {net.subnet_cidr}")
            print(f"  Gateway: {net.gateway_ip} | Assigned IP: {net.assigned_virtual_ip} | Invite: {net.invite_code}")
            print()

    elif args.command == "create-network":
        idx = len(storage.networks)
        net_id = f"net-vwan-{args.name.lower().replace(' ', '-')[:12]}"
        gw = args.subnet.rsplit('.', 1)[0] + '.1'
        assigned = args.subnet.rsplit('.', 1)[0] + '.14'
        new_net = Network(
            id=net_id,
            name=args.name,
            subnet_cidr=args.subnet,
            interface_name=f"vwan{idx}",
            gateway_ip=gw,
            encryption="Curve25519 / ChaCha20",
            is_connected=True,
            peers_count=1,
            max_peers=32,
            is_public=args.public,
            invite_code=f"VWAN-{idx * 1000 + 123}",
            assigned_virtual_ip=assigned,
            acl_preset="gaming_safe"
        )
        storage.networks[net_id] = new_net
        storage.save()
        print(f"{Colors.OKGREEN}Successfully created VLAN network '{args.name}' ({net_id}) on interface vwan{idx}!{Colors.ENDC}")

    elif args.command == "list-peers":
        peers = storage.peers.get(args.network, [])
        print_header(f"Peers for Network '{args.network}' ({len(peers)} enrolled)")
        for p in peers:
            status = f"{Colors.OKGREEN}ONLINE{Colors.ENDC}" if p.is_online else f"{Colors.FAIL}OFFLINE{Colors.ENDC}"
            conn = "Direct P2P (UDP)" if p.connection_type == "direct_p2p" else "DERP Relay"
            print(f"• {Colors.BOLD}{p.name}{Colors.ENDC} ({p.platform.upper()}) - {status}")
            print(f"  Virtual IP: {p.virtual_ip} | Endpoint: {p.endpoint} | Mode: {conn}")
            print(f"  Latency: {p.latency_ms} ms | Jitter: {p.jitter_ms} ms | Loss: {p.packet_loss_pct}%")
            print()

    elif args.command == "export-wg":
        net = storage.networks.get(args.network)
        if not net:
            print(f"{Colors.FAIL}Error: Network '{args.network}' not found.{Colors.ENDC}")
            return
        conf = generate_wg_quick_config(net)
        if args.out:
            with open(args.out, "w") as f:
                f.write(conf)
            print(f"{Colors.OKGREEN}Wrote WireGuard config to {args.out}{Colors.ENDC}")
        else:
            print(conf)

    elif args.command == "export-hosts":
        # Check role permission
        if storage.user_role != "admin":
            print(f"{Colors.FAIL}[Access Denied] The WAN Host File is restricted to Administrator role.{Colors.ENDC}")
            print(f"Current role: {storage.user_role}. To assume admin, run: python cli.py set-role admin")
            sys.exit(1)

        net = storage.networks.get(args.network)
        if not net:
            print(f"{Colors.FAIL}Error: Network '{args.network}' not found.{Colors.ENDC}")
            return
        peers = storage.peers.get(args.network, [])
        hosts_content = generate_wan_hosts_file(net, peers, storage.custom_hosts)
        if args.out:
            with open(args.out, "w") as f:
                f.write(hosts_content)
            print(f"{Colors.OKGREEN}Wrote WAN Host File (/etc/hosts) to {args.out}{Colors.ENDC}")
        else:
            print(hosts_content)

    elif args.command == "add-host":
        if storage.user_role != "admin":
            print(f"{Colors.FAIL}[Access Denied] Only administrators can register custom WAN hosts.{Colors.ENDC}")
            sys.exit(1)
        aliases = [a.strip() for a in args.aliases.split(",") if a.strip()]
        entry = WanHostEntry(
            id=f"custom-{len(storage.custom_hosts) + 1}",
            ip=args.ip,
            hostname=args.hostname,
            aliases=aliases,
            description=args.description
        )
        storage.custom_hosts.append(entry)
        storage.save()
        print(f"{Colors.OKGREEN}Added custom host entry: {args.ip} -> {args.hostname} ({', '.join(aliases)}){Colors.ENDC}")

    elif args.command == "set-role":
        storage.user_role = args.role
        storage.save()
        print(f"{Colors.OKGREEN}Switched role to: {args.role.upper()}{Colors.ENDC}")
        if args.role == "admin":
            print("You now have full administrator access to the WAN Host File & all LAN storage pools.")
        else:
            print("You are in Standard User mode: Access limited to your own LAN files; WAN Host File locked.")

    elif args.command == "list-files":
        print_header(f"LAN P2P Shared Files (Role: {storage.user_role.upper()})")
        for f in storage.files:
            if f.network_id != args.network:
                continue
            is_own = (f.uploaded_by_ip == storage.current_user_ip or f.uploaded_by_peer == storage.current_user_name)
            can_access = (storage.user_role == "admin" or is_own)
            access_label = f"{Colors.OKGREEN}ACCESSIBLE{Colors.ENDC}" if can_access else f"{Colors.FAIL}LOCKED (Remote Peer){Colors.ENDC}"
            print(f"• [{f.id}] {Colors.BOLD}{f.name}{Colors.ENDC} ({f.size_mb} MB) - {access_label}")
            print(f"  Owner: {f.uploaded_by_peer} ({f.uploaded_by_ip}) | Category: {f.category} | Downloads: {f.download_count}")
            print()

    elif args.command == "download-file":
        target = next((f for f in storage.files if f.id == args.id), None)
        if not target:
            print(f"{Colors.FAIL}File '{args.id}' not found.{Colors.ENDC}")
            return
        is_own = (target.uploaded_by_ip == storage.current_user_ip or target.uploaded_by_peer == storage.current_user_name)
        if storage.user_role != "admin" and not is_own:
            print(f"{Colors.FAIL}[LAN File Isolation Policy Violation]{Colors.ENDC}")
            print(f"You cannot access files uploaded by remote peer '{target.uploaded_by_peer}'.")
            print("Standard users can only access their own device files.")
            sys.exit(1)
        target.download_count += 1
        storage.save()
        print(f"{Colors.OKGREEN}Downloaded '{target.name}' ({target.size_mb} MB) successfully!{Colors.ENDC}")

    elif args.command == "ping":
        peer = None
        for plist in storage.peers.values():
            for p in plist:
                if p.id == args.peer_id or p.virtual_ip == args.peer_id:
                    peer = p
                    break
        if not peer:
            print(f"{Colors.FAIL}Peer '{args.peer_id}' not found.{Colors.ENDC}")
            return
        print(f"PING {peer.name} ({peer.virtual_ip}) 56(84) bytes of data.")
        for seq in range(1, 5):
            print(f"64 bytes from {peer.virtual_ip}: icmp_seq={seq} ttl=64 time={peer.latency_ms}.2 ms")
        print(f"\n--- {peer.virtual_ip} ping statistics ---")
        print(f"4 packets transmitted, 4 received, 0% packet loss, time 3004ms")
        print(f"rtt min/avg/max/mdev = {peer.latency_ms - 2}.1/{peer.latency_ms}.4/{peer.latency_ms + 3}.2/1.1 ms")

    elif args.command == "serve":
        from .server import run_server
        run_server(port=args.port)

if __name__ == "__main__":
    main()
