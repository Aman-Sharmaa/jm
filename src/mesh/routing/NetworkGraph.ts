/**
 * Jantar Mantar — Network Graph
 * Author: Aman Sharma
 *
 * Maintains the in-memory representation of the mesh topology as a
 * weighted directed graph. Supports real-time updates and path queries.
 */

import type { MeshPeer, NetworkEdge, NetworkGraph, TransportType } from '../../types';

export class MeshNetworkGraph {
  private nodes: Map<string, MeshPeer> = new Map();
  private adjacency: Map<string, Map<string, NetworkEdge>> = new Map();
  private selfId: string;

  constructor(selfId: string) {
    this.selfId = selfId;
  }

  // ─────────────────────────────────────────────
  // Node Operations
  // ─────────────────────────────────────────────

  addNode(peer: MeshPeer): void {
    this.nodes.set(peer.deviceId, peer);
    if (!this.adjacency.has(peer.deviceId)) {
      this.adjacency.set(peer.deviceId, new Map());
    }
  }

  updateNode(deviceId: string, updates: Partial<MeshPeer>): void {
    const existing = this.nodes.get(deviceId);
    if (existing) {
      this.nodes.set(deviceId, { ...existing, ...updates });
    }
  }

  removeNode(deviceId: string): void {
    this.nodes.delete(deviceId);
    this.adjacency.delete(deviceId);
    // Remove all edges pointing to this node
    for (const [, edges] of this.adjacency) {
      edges.delete(deviceId);
    }
  }

  getNode(deviceId: string): MeshPeer | undefined {
    return this.nodes.get(deviceId);
  }

  getAllNodes(): MeshPeer[] {
    return Array.from(this.nodes.values());
  }

  getOnlineNodes(): MeshPeer[] {
    return this.getAllNodes().filter(n => n.status === 'online');
  }

  getGatewayNodes(): MeshPeer[] {
    return this.getAllNodes().filter(n => n.hasInternet && n.status === 'online');
  }

  // ─────────────────────────────────────────────
  // Edge Operations
  // ─────────────────────────────────────────────

  /**
   * Compute edge weight from link quality metrics.
   * Lower = better (Dijkstra uses minimum weight).
   */
  static computeEdgeWeight(
    latency: number,
    signalStrength: number,
    batteryLevel: number,
    transport: TransportType,
  ): number {
    // Normalize signal: -100 dBm → 1.0, 0 dBm → 0.0
    const signalFactor = Math.max(0, (100 + signalStrength) / 100);
    // Transport bonus: Wi-Fi Direct > Nearby > BLE
    const transportBonus = transport === 'wifi_direct' ? 0.5 : transport === 'nearby' ? 0.7 : 1.0;
    // Battery penalty: low battery = higher weight
    const batteryPenalty = batteryLevel < 20 ? 2.0 : batteryLevel < 50 ? 1.2 : 1.0;

    return (latency * batteryPenalty) / (signalFactor * transportBonus + 0.001);
  }

  addEdge(edge: NetworkEdge): void {
    if (!this.adjacency.has(edge.fromId)) {
      this.adjacency.set(edge.fromId, new Map());
    }
    this.adjacency.get(edge.fromId)!.set(edge.toId, edge);
  }

  updateEdge(fromId: string, toId: string, updates: Partial<NetworkEdge>): void {
    const edge = this.adjacency.get(fromId)?.get(toId);
    if (edge) {
      const updated = { ...edge, ...updates };
      // Recompute weight if metrics changed
      if (updates.latency || updates.signalStrength || updates.transport) {
        updated.weight = MeshNetworkGraph.computeEdgeWeight(
          updated.latency,
          updated.signalStrength,
          this.nodes.get(toId)?.batteryLevel ?? 100,
          updated.transport,
        );
      }
      this.adjacency.get(fromId)!.set(toId, updated);
    }
  }

  removeEdge(fromId: string, toId: string): void {
    this.adjacency.get(fromId)?.delete(toId);
  }

  getEdges(fromId: string): NetworkEdge[] {
    return Array.from(this.adjacency.get(fromId)?.values() ?? []);
  }

  getAllEdges(): NetworkEdge[] {
    const edges: NetworkEdge[] = [];
    for (const [, edgeMap] of this.adjacency) {
      for (const [, edge] of edgeMap) {
        edges.push(edge);
      }
    }
    return edges;
  }

  // ─────────────────────────────────────────────
  // Dijkstra Shortest Path
  // ─────────────────────────────────────────────

  /**
   * Find the shortest (lowest-weight) path from selfId to targetId.
   * Returns ordered list of device IDs including source and destination.
   */
  shortestPath(targetId: string): string[] | null {
    if (targetId === this.selfId) return [this.selfId];

    const dist: Map<string, number> = new Map();
    const prev: Map<string, string | null> = new Map();
    const unvisited: Set<string> = new Set();

    for (const nodeId of this.nodes.keys()) {
      dist.set(nodeId, Infinity);
      prev.set(nodeId, null);
      unvisited.add(nodeId);
    }
    // Add self if not in nodes
    dist.set(this.selfId, 0);
    unvisited.add(this.selfId);

    dist.set(this.selfId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let u: string | null = null;
      let minDist = Infinity;
      for (const nodeId of unvisited) {
        const d = dist.get(nodeId) ?? Infinity;
        if (d < minDist) {
          minDist = d;
          u = nodeId;
        }
      }

      if (u === null || minDist === Infinity) break;
      if (u === targetId) break;

      unvisited.delete(u);

      const edges = this.adjacency.get(u) ?? new Map();
      for (const [neighborId, edge] of edges) {
        if (!unvisited.has(neighborId)) continue;
        const alt = (dist.get(u) ?? Infinity) + edge.weight;
        if (alt < (dist.get(neighborId) ?? Infinity)) {
          dist.set(neighborId, alt);
          prev.set(neighborId, u);
        }
      }
    }

    // Reconstruct path
    if ((dist.get(targetId) ?? Infinity) === Infinity) return null;
    const path: string[] = [];
    let current: string | null = targetId;
    while (current !== null) {
      path.unshift(current);
      current = prev.get(current) ?? null;
    }
    return path;
  }

  /**
   * Find the path to the best available internet gateway.
   */
  bestGatewayPath(): { path: string[]; gateway: MeshPeer } | null {
    const gateways = this.getGatewayNodes();
    if (gateways.length === 0) return null;

    // Sort by latency and signal
    const sorted = gateways.sort(
      (a, b) => (a.internetLatency ?? 9999) - (b.internetLatency ?? 9999),
    );

    for (const gateway of sorted) {
      const path = this.shortestPath(gateway.deviceId);
      if (path) return { path, gateway };
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // Serialization
  // ─────────────────────────────────────────────

  toSnapshot(): NetworkGraph {
    const nodesRecord: Record<string, MeshPeer> = {};
    for (const [id, peer] of this.nodes) {
      nodesRecord[id] = peer;
    }
    return {
      nodes: nodesRecord,
      edges: this.getAllEdges(),
      selfId: this.selfId,
    };
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.getAllEdges().length;
  }
}

export default MeshNetworkGraph;
