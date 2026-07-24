/**
 * Jantar Mantar — Smart Routing Engine
 * Author: Aman Sharma
 *
 * Computes optimal routes between mesh nodes using the NetworkGraph.
 * Supports multiple strategies and auto-reroutes on disconnection.
 */

import { EventEmitter } from 'events';
import { MeshNetworkGraph } from './NetworkGraph';
import {
  MAX_HOP_COUNT,
  ROUTE_STALE_AFTER_MS,
} from '../../constants';
import type {
  MeshPeer,
  NetworkEdge,
  Route,
  RoutingStrategy,
  TransportType,
} from '../../types';

export type RoutingEvent =
  | { type: 'route_found'; targetId: string; route: Route }
  | { type: 'route_lost'; targetId: string }
  | { type: 'gateway_available'; gateway: MeshPeer; route: Route }
  | { type: 'gateway_lost' }
  | { type: 'topology_changed' };

export class RoutingEngine extends EventEmitter {
  private graph: MeshNetworkGraph;
  private routeCache: Map<string, { route: Route; cachedAt: number }> = new Map();
  private strategy: RoutingStrategy = 'shortest_path';

  constructor(selfId: string) {
    super();
    this.graph = new MeshNetworkGraph(selfId);
  }

  // ─────────────────────────────────────────────
  // Graph Updates (called by MeshOrchestrator)
  // ─────────────────────────────────────────────

  peerDiscovered(peer: MeshPeer): void {
    this.graph.addNode(peer);
    this._invalidateRoutesFor(peer.deviceId);
    this.emit('topology_changed');
  }

  peerUpdated(deviceId: string, updates: Partial<MeshPeer>): void {
    this.graph.updateNode(deviceId, updates);
    this._invalidateRoutesFor(deviceId);
    this.emit('topology_changed');
  }

  peerLost(deviceId: string): void {
    this.graph.removeNode(deviceId);
    this._invalidateRoutesFor(deviceId);
    this.emit('route_lost', { type: 'route_lost', targetId: deviceId });
    this.emit('topology_changed');
  }

  linkUpdated(edge: NetworkEdge): void {
    this.graph.addEdge(edge);
    this._invalidateRoutesFor(edge.toId);
    this.emit('topology_changed');
  }

  linkLost(fromId: string, toId: string): void {
    this.graph.removeEdge(fromId, toId);
    this._invalidateRoutesFor(toId);
    this.emit('topology_changed');
  }

  // ─────────────────────────────────────────────
  // Route Computation
  // ─────────────────────────────────────────────

  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
    this.routeCache.clear(); // invalidate all cached routes
  }

  /**
   * Get the best route to a target device.
   * Returns null if no path exists.
   */
  getRoute(targetId: string): Route | null {
    // Check cache
    const cached = this.routeCache.get(targetId);
    if (cached && Date.now() - cached.cachedAt < ROUTE_STALE_AFTER_MS) {
      return cached.route;
    }

    const path = this.graph.shortestPath(targetId);
    if (!path || path.length > MAX_HOP_COUNT) return null;

    const route = this._buildRoute(path);
    this.routeCache.set(targetId, { route, cachedAt: Date.now() });
    return route;
  }

  /**
   * Find the best internet gateway and route to it.
   */
  getBestGatewayRoute(): { route: Route; gateway: MeshPeer } | null {
    const result = this.graph.bestGatewayPath();
    if (!result) {
      this.emit('gateway_lost');
      return null;
    }
    const route = this._buildRoute(result.path);
    this.emit('gateway_available', { type: 'gateway_available', gateway: result.gateway, route });
    return { route, gateway: result.gateway };
  }

  /**
   * Get all directly reachable (1-hop) peers.
   */
  getDirectPeers(): MeshPeer[] {
    return this.graph.getOnlineNodes().filter(n => n.hopCount === 1);
  }

  /**
   * Get the complete topology snapshot for the Network Map screen.
   */
  getTopologySnapshot() {
    return this.graph.toSnapshot();
  }

  // ─────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────

  private _buildRoute(path: string[]): Route {
    const edges: NetworkEdge[] = [];
    let totalLatency = 0;
    const transports: TransportType[] = [];
    let totalWeight = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const edgeList = this.graph.getEdges(path[i]);
      const edge = edgeList.find(e => e.toId === path[i + 1]);
      if (edge) {
        edges.push(edge);
        totalLatency += edge.latency;
        if (!transports.includes(edge.transport)) {
          transports.push(edge.transport);
        }
        totalWeight += edge.weight;
      }
    }

    return {
      path,
      totalHops: path.length - 1,
      estimatedLatency: totalLatency,
      transport: transports,
      score: totalWeight,
    };
  }

  private _invalidateRoutesFor(deviceId: string): void {
    for (const [targetId, cached] of this.routeCache) {
      if (cached.route.path.includes(deviceId)) {
        this.routeCache.delete(targetId);
      }
    }
    this.routeCache.delete(deviceId);
  }
}

export default RoutingEngine;
