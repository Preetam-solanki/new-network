import sys
import os

# Ensure vwan_python package directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vwan_python.cli import main

if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Default to interactive CLI help or server
        print("V-WAN Virtual WAN & VLAN Engine (Python Edition)")
        print("Usage:")
        print("  python -m vwan_python.cli serve [--port 8080]  (Start Web GUI & REST API)")
        print("  python -m vwan_python.cli list-networks        (View all VLANs)")
        print("  python -m vwan_python.cli list-peers           (View connected peers)")
        print("  python -m vwan_python.cli export-hosts         (Export WAN /etc/hosts file - Admin)")
        print("  python -m vwan_python.cli list-files           (Inspect LAN file sharing)")
        print()
    main()
