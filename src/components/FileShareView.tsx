import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  HardDrive, 
  Copy, 
  Check, 
  FolderOpen, 
  ShieldCheck, 
  ShieldAlert,
  Clock, 
  FileArchive,
  Layers,
  Sparkles,
  Share2,
  Lock,
  Unlock,
  AlertCircle,
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { SharedFile, Network, UserRole } from '../types';
import { formatBytes } from '../utils/wireguard';

interface FileShareViewProps {
  files: SharedFile[];
  networks: Network[];
  selectedNetworkId: string;
  userRole: UserRole;
  onUploadFile: (file: Omit<SharedFile, 'id' | 'uploadedAt' | 'downloadCount'>) => void;
  onDeleteFile?: (fileId: string) => void;
  onSwitchToAdmin?: () => void;
}

export const FileShareView: React.FC<FileShareViewProps> = ({
  files,
  networks,
  selectedNetworkId,
  userRole,
  onUploadFile,
  onDeleteFile,
  onSwitchToAdmin,
}) => {
  const [copiedSmb, setCopiedSmb] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [accessDeniedFile, setAccessDeniedFile] = useState<SharedFile | null>(null);
  const [userTab, setUserTab] = useState<'my_files' | 'remote_shares'>('my_files');
  const [adminPeerFilter, setAdminPeerFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeNetwork = networks.find((n) => n.id === selectedNetworkId) || networks[0];
  const smbPath = `\\\\${activeNetwork?.assignedVirtualIp || '10.147.19.5'}\\MyLocalShare`;
  const nfsPath = `smb://${activeNetwork?.assignedVirtualIp || '10.147.19.5'}/MyLocalShare`;

  const handleCopySmb = () => {
    navigator.clipboard.writeText(smbPath);
    setCopiedSmb(true);
    setTimeout(() => setCopiedSmb(false), 2000);
  };

  // Check if a file belongs to the user's own LAN node
  const isOwnFile = (file: SharedFile): boolean => {
    if (!activeNetwork) return false;
    return (
      file.uploaderVirtualIp === activeNetwork.assignedVirtualIp ||
      file.uploaderName.toLowerCase().includes('your-laptop') ||
      file.uploaderName.toLowerCase().includes('this device')
    );
  };

  const handleSimulateDownload = (file: SharedFile) => {
    // If standard user and not own file, prevent download
    if (userRole !== 'admin' && !isOwnFile(file)) {
      setAccessDeniedFile(file);
      return;
    }

    setDownloadingFileId(file.id);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingFileId(null);
            // Trigger actual browser download of a sample payload
            const dummyBlob = new Blob([
              `V-WAN Virtual LAN P2P transfer payload for: ${file.name}\n` +
              `Virtual Network: ${activeNetwork?.name} (${activeNetwork?.subnetCidr})\n` +
              `Uploader: ${file.uploaderName} [${file.uploaderVirtualIp}]\n` +
              `SHA-256: ${file.sha256}\n` +
              `Access Authorization: Verified (${userRole === 'admin' ? 'Network Admin' : 'Node Owner'})\n`
            ], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dummyBlob);
            link.download = file.name;
            link.click();
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNetwork) return;

    onUploadFile({
      networkId: activeNetwork.id,
      name: file.name,
      sizeBytes: file.size,
      uploaderName: 'Your-Laptop (This Device)',
      uploaderVirtualIp: activeNetwork.assignedVirtualIp,
      sha256: Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      mimeType: file.type || 'application/octet-stream',
      category: file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'archive' : 'document',
    });

    e.target.value = '';
    // Switch to my files tab to see newly uploaded item
    setUserTab('my_files');
  };

  const networkFiles = files.filter(
    (f) => !selectedNetworkId || f.networkId === selectedNetworkId
  );

  const ownFiles = networkFiles.filter((f) => isOwnFile(f));
  const remoteFiles = networkFiles.filter((f) => !isOwnFile(f));

  // Determine which files to show based on user role and tabs
  const displayFiles = (() => {
    let result = networkFiles;
    if (userRole !== 'admin') {
      // Standard user can only access their own LAN files
      result = userTab === 'my_files' ? ownFiles : remoteFiles;
    } else {
      // Admin can filter by peer
      if (adminPeerFilter === 'own') {
        result = ownFiles;
      } else if (adminPeerFilter === 'remote') {
        result = remoteFiles;
      }
    }

    if (filterCategory !== 'all') {
      result = result.filter((f) => f.category === filterCategory);
    }
    return result;
  })();

  return (
    <div className="space-y-4">
      {/* Access Denied Modal for standard users trying to download remote files */}
      {accessDeniedFile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-3 text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-white">LAN File Isolation Policy Violation</h4>
                <p className="text-[11px] text-rose-300/80">Standard User Access Restriction</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-300">
              <p>
                You are currently signed in as a <strong className="text-white">Standard LAN User</strong>. Under virtual network policy, you can <strong>only access and download your own LAN files</strong> hosted on this device.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Target File: <span className="text-slate-200">{accessDeniedFile.name}</span></div>
                <div className="text-slate-400">Remote Owner: <span className="text-rose-400">{accessDeniedFile.uploaderName} ({accessDeniedFile.uploaderVirtualIp})</span></div>
                <div className="text-slate-400">Policy: <span className="text-amber-400">ISOLATE_REMOTE_PEER_SHARES</span></div>
              </div>
              <p className="text-[11px] text-slate-400">
                To access remote peer files or manage global VLAN shares, elevate your privileges to Network Administrator.
              </p>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => setAccessDeniedFile(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Dismiss
                </button>

                {onSwitchToAdmin && (
                  <button
                    onClick={() => {
                      setAccessDeniedFile(null);
                      onSwitchToAdmin();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Switch to Administrator</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-Aware Security Notice Banner */}
      {userRole !== 'admin' ? (
        <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">LAN File Isolation Policy Active</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-amber-950 text-amber-200 border border-amber-800 font-semibold">
                  Role: Standard User
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                You can <strong className="text-slate-200">only access and download your own LAN files</strong> hosted on your device (<span className="font-mono text-emerald-400">{activeNetwork?.assignedVirtualIp}</span>). Remote peer shares are protected.
              </p>
            </div>
          </div>

          {onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Elevate to Admin</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-300">Administrator Global Storage Clearance</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-950 text-emerald-200 border border-emerald-800 font-semibold">
                  Role: Network Admin
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Full administrative access granted. You can inspect, audit, download, or remove files across all connected peers in this virtual subnet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Peer Filter:</span>
            <select
              value={adminPeerFilter}
              onChange={(e) => setAdminPeerFilter(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-850 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Peers ({networkFiles.length})</option>
              <option value="own">My Node Only ({ownFiles.length})</option>
              <option value="remote">Remote Peers ({remoteFiles.length})</option>
            </select>
          </div>
        </div>
      )}

      {/* Header Banner with SMB / Windows Network Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <span>P2P Virtual File Sharing & Node SMB</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                {activeNetwork?.interfaceName || 'vwan0'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Encrypted WireGuard P2P direct transfer. {userRole !== 'admin' ? 'Share and manage your personal local LAN files securely.' : 'Manage and audit all shared files across the entire virtual network.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload to My LAN Share</span>
            </button>
          </div>
        </div>

        {/* Native OS SMB / NFS mount helper */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block font-medium">🪟 Windows Explorer UNC (Your Share):</span>
              <span className="font-mono text-emerald-300 font-bold text-xs">{smbPath}</span>
            </div>
            <button
              onClick={handleCopySmb}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedSmb ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSmb ? 'Copied' : 'Copy UNC'}</span>
            </button>
          </div>

          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block font-medium">🐧 Linux / 🍏 macOS Finder Path:</span>
              <span className="font-mono text-sky-300 font-bold text-xs">{nfsPath}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(nfsPath);
                setCopiedSmb(true);
                setTimeout(() => setCopiedSmb(false), 2000);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy URI</span>
            </button>
          </div>
        </div>
      </div>

      {/* For Standard Users: Tab Switcher between My Files and Remote Locked Shares */}
      {userRole !== 'admin' && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setUserTab('my_files')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              userTab === 'my_files'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span>My Own LAN Files</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-200 font-mono">
              {ownFiles.length}
            </span>
          </button>

          <button
            onClick={() => setUserTab('remote_shares')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              userTab === 'remote_shares'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Remote Peer Shares (Restricted)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
              {remoteFiles.length}
            </span>
          </button>
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 overflow-x-auto text-xs">
        <span className="text-slate-400 pl-1">Category:</span>
        {[
          { id: 'all', label: 'All Files' },
          { id: 'game_mod', label: 'Game Mods & Patches' },
          { id: 'save_file', label: 'World & Save Files' },
          { id: 'archive', label: 'Zip / Archives' },
          { id: 'document', label: 'Guides & Documents' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCategory(c.id)}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterCategory === c.id
                ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Files List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Node / Owner (VIP)</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {displayFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    {userRole !== 'admin' && userTab === 'my_files'
                      ? 'You have not shared any files from this device yet. Click "Upload to My LAN Share" above.'
                      : 'No files match the selected filter.'}
                  </td>
                </tr>
              ) : (
                displayFiles.map((file) => {
                  const isDownloading = downloadingFileId === file.id;
                  const isOwned = isOwnFile(file);
                  const canAccess = userRole === 'admin' || isOwned;

                  return (
                    <tr
                      key={file.id}
                      className={`transition-colors ${
                        !canAccess
                          ? 'bg-slate-950/40 text-slate-400 hover:bg-slate-950/70'
                          : 'hover:bg-slate-850/60'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2">
                        {canAccess ? (
                          <FileArchive className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <span className={`block ${!canAccess ? 'text-slate-400 font-normal' : ''}`}>
                            {file.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            SHA: {file.sha256.substring(0, 16)}...
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isOwned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> My LAN File
                          </span>
                        ) : userRole === 'admin' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" /> Admin Cleared
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3 text-rose-400" /> Remote Peer (Restricted)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {formatBytes(file.sizeBytes)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span className="block font-medium text-slate-200">
                            {file.uploaderName}
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400">
                            {file.uploaderVirtualIp}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {file.uploadedAt}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isDownloading ? (
                            <div className="flex items-center justify-end gap-2 text-emerald-400">
                              <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-400 h-full transition-all duration-200"
                                  style={{ width: `${downloadProgress}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-[10px]">{downloadProgress}%</span>
                            </div>
                          ) : canAccess ? (
                            <button
                              onClick={() => handleSimulateDownload(file)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Download LAN File"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSimulateDownload(file)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Locked by LAN Isolation Policy"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Restricted</span>
                            </button>
                          )}

                          {/* Delete button: available to owner of file or admin */}
                          {(isOwned || userRole === 'admin') && onDeleteFile && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove file "${file.name}" from LAN share?`)) {
                                  onDeleteFile(file.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
