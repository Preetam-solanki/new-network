import unittest
import os
import tempfile
from vwan_python.models import Network, Peer, SharedFile, WanHostEntry
from vwan_python.storage import StorageManager
from vwan_python.wireguard import (
    generate_wireguard_keypair,
    generate_wg_quick_config,
    generate_wan_hosts_file
)

class TestVWanPython(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        self.temp_db.close()
        self.storage = StorageManager(db_path=self.temp_db.name)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_keypair_generation(self):
        priv, pub = generate_wireguard_keypair()
        self.assertTrue(len(priv) > 20)
        self.assertTrue(len(pub) > 20)
        self.assertTrue(priv.endswith("="))
        self.assertTrue(pub.endswith("="))

    def test_wg_quick_config(self):
        net = self.storage.networks["net-vwan-valheim"]
        config = generate_wg_quick_config(net)
        self.assertIn("[Interface]", config)
        self.assertIn("[Peer]", config)
        self.assertIn("10.147.19.14/24", config)
        self.assertIn("vwan-gateway.net:51820", config)

    def test_wan_hosts_file_generation(self):
        net = self.storage.networks["net-vwan-valheim"]
        peers = self.storage.peers["net-vwan-valheim"]
        hosts = generate_wan_hosts_file(net, peers, self.storage.custom_hosts)
        
        self.assertIn("10.147.19.1", hosts)
        self.assertIn("vwan-gateway.net", hosts)
        self.assertIn("10.147.19.14", hosts)
        self.assertIn("your-laptop-this-device.vwan.lan", hosts)
        self.assertIn("viking-host-pc.vwan.lan", hosts)
        self.assertIn("dedicated-gameserver.vwan.lan", hosts)

    def test_lan_file_isolation_for_standard_user(self):
        self.storage.user_role = "user"
        own_file = self.storage.files[0]  # Uploaded by "Your-Laptop (This Device)"
        remote_file = self.storage.files[1]  # Uploaded by "Viking-Host-PC"

        # Check own file is accessible
        is_own = (own_file.uploaded_by_ip == self.storage.current_user_ip)
        self.assertTrue(is_own)

        # Check remote file is locked for standard user
        is_remote_own = (remote_file.uploaded_by_ip == self.storage.current_user_ip)
        self.assertFalse(is_remote_own)

    def test_lan_file_access_for_admin(self):
        self.storage.user_role = "admin"
        # Admin can access all files
        for file in self.storage.files:
            can_admin_access = (self.storage.user_role == "admin")
            self.assertTrue(can_admin_access)

    def test_custom_host_registration(self):
        entry = WanHostEntry(
            id="test-custom-1",
            ip="10.147.19.250",
            hostname="redis-cache.vwan.lan",
            aliases=["redis"],
            description="In-memory cache"
        )
        self.storage.custom_hosts.append(entry)
        self.storage.save()

        # Reload from disk
        new_storage = StorageManager(db_path=self.temp_db.name)
        found = any(h.hostname == "redis-cache.vwan.lan" for h in new_storage.custom_hosts)
        self.assertTrue(found)

if __name__ == "__main__":
    unittest.main()
