import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Play, Square, RefreshCw, Terminal, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { Peer, PingPacket } from '../types';

interface PingToolModalProps {
  peer: Peer | null;
  onClose: () => void;
}

export const PingToolModal: React.FC<PingToolModalProps> = ({ peer, onClose }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [packets, setPackets] = useState<PingPacket[]>([]);
  const seqRef = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!peer) return;

    // Reset when peer changes
    seqRef.current = 1;
    setPackets([]);
    setIsRunning(true);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [peer]);

  useEffect(() => {
    if (!peer || !isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      // Calculate realistic ping based on peer baseline latency
      const base = peer.latencyMs || 25;
      const jitter = (Math.random() - 0.5) * 6;
      // Small 1% chance of loss for realistic simulation if relay or high latency
      const isLoss = Math.random() < 0.02;
      const rtt = Math.max(2, Math.round(base + jitter));

      const newPacket: PingPacket = {
        seq: seqRef.current++,
        timeMs: isLoss ? 0 : rtt,
        status: isLoss ? 'timeout' : 'success',
        ttl: 64,
      };

      setPackets((prev) => [...prev.slice(-19), newPacket]);
    }, 900);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, peer]);

  if (!peer) return null;

  const successfulPackets = packets.filter((p) => p.status === 'success');
  const totalSent = packets.length;
  const totalReceived = successfulPackets.length;
  const packetLossPercent = totalSent > 0 ? Math.round(((totalSent - totalReceived) / totalSent) * 100) : 0;
  
  const rttValues = successfulPackets.map((p) => p.timeMs);
  const minRtt = rttValues.length > 0 ? Math.min(...rttValues) : 0;
  const maxRtt = rttValues.length > 0 ? Math.max(...rttValues) : 0;
  const avgRtt = rttValues.length > 0 ? Math.round(rttValues.reduce((a, b) => a + b, 0) / rttValues.length) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                ICMP Virtual Tunnel Ping Test
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Target: <span className="text-emerald-300 font-bold">{peer.virtualIp}</span> ({peer.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Network route badge */}
        <div className="bg-slate-850 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${peer.connectionMode === 'p2p' ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`}></span>
              <span className="font-semibold">{peer.connectionMode === 'p2p' ? 'Direct P2P (STUN)' : 'DERP Relay Tunnel'}</span>
            </span>
            {peer.relayRegion && (
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Via: {peer.relayRegion}
              </span>
            )}
          </div>
          <span className="font-mono text-slate-400">WG Endpoint: {peer.endpoint}</span>
        </div>

        {/* Live terminal packet stream */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-black/60 space-y-1.5 min-h-[220px]">
          <div className="text-slate-500 text-[11px] pb-1 border-b border-slate-800/80 flex items-center justify-between">
            <span>PING {peer.virtualIp} ({peer.name}) 56(84) bytes of data across vwan0:</span>
            <span>MTU 1420</span>
          </div>

          {packets.length === 0 ? (
            <div className="text-slate-500 italic py-6 text-center">
              Initiating WireGuard handshake and ICMP echo probes...
            </div>
          ) : (
            packets.map((pkt) => (
              <div
                key={pkt.seq}
                className={`flex items-center justify-between transition-opacity ${
                  pkt.status === 'success' ? 'text-slate-200' : 'text-rose-400 font-bold'
                }`}
              >
                {pkt.status === 'success' ? (
                  <>
                    <span>
                      64 bytes from <span className="text-emerald-400">{peer.virtualIp}</span>: icmp_seq={pkt.seq} ttl={pkt.ttl} time=
                      <span className={pkt.timeMs > 60 ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
                        {pkt.timeMs}.4 ms
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500">RTT OK</span>
                  </>
                ) : (
                  <>
                    <span>Request timeout for icmp_seq {pkt.seq} (Host unreachable / packet dropped)</span>
                    <span className="text-[10px] text-rose-500">DROPPED</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Live RTT Bar Graph */}
        <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Live Latency History (Last 20 probes)</span>
            <span className="font-mono text-emerald-400">Current: {packets[packets.length - 1]?.timeMs || peer.latencyMs} ms</span>
          </div>
          <div className="h-14 flex items-end gap-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            {packets.map((p, idx) => {
              const heightPercent = p.status === 'success' ? Math.min(100, Math.max(15, (p.timeMs / 120) * 100)) : 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      p.status === 'timeout'
                        ? 'bg-rose-500'
                        : p.timeMs < 30
                        ? 'bg-emerald-400 group-hover:bg-emerald-300'
                        : p.timeMs < 70
                        ? 'bg-amber-400 group-hover:bg-amber-300'
                        : 'bg-orange-500 group-hover:bg-orange-400'
                    }`}
                  ></div>
                  <div className="absolute -top-7 hidden group-hover:block bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded shadow z-10 font-mono whitespace-nowrap">
                    #{p.seq}: {p.status === 'timeout' ? 'Drop' : `${p.timeMs}ms`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="bg-slate-900 px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div>
              <span className="text-slate-500">Sent: </span>
              <span className="font-mono font-bold text-white">{totalSent}</span>
            </div>
            <div>
              <span className="text-slate-500">Recv: </span>
              <span className="font-mono font-bold text-emerald-400">{totalReceived}</span>
            </div>
            <div>
              <span className="text-slate-500">Loss: </span>
              <span className={`font-mono font-bold ${packetLossPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {packetLossPercent}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
            <span>min/avg/max = <span className="text-emerald-400 font-bold">{minRtt}</span>/<span className="text-emerald-300 font-bold">{avgRtt}</span>/<span className="text-amber-400 font-bold">{maxRtt}</span> ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
