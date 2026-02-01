import { NetworkConfig, NetworkState, NetNode, NetLink } from '../types';

// Initialize a fully connected graph (clique) of m0 nodes
export const initNetwork = (width: number, height: number, config: NetworkConfig): NetworkState => {
  const { initialNodes } = config;
  const nodes: NetNode[] = [];
  const links: NetLink[] = [];

  const cx = width / 2;
  const cy = height / 2;
  const r = 50;

  for (let i = 0; i < initialNodes; i++) {
    const angle = (i / initialNodes) * Math.PI * 2;
    nodes.push({
      id: i,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      degree: initialNodes - 1,
      fitness: Math.random(), // Assign random fitness [0, 1)
      birthStep: 0
    });
  }

  // Fully connect initial nodes
  for (let i = 0; i < initialNodes; i++) {
    for (let j = i + 1; j < initialNodes; j++) {
      links.push({ source: i, target: j });
    }
  }

  return {
    nodes,
    links,
    step: 0,
    degreeDist: calculateDegreeDist(nodes)
  };
};

// Add a node using Bianconi-Barabasi (Fitness + Attractiveness)
// Probability ~ eta * (k + A)
export const addPreferentialNode = (state: NetworkState, config: NetworkConfig, width: number, height: number): NetworkState => {
  const { nodes, links, step } = state;
  const { newEdges, attractiveness } = config; // m, A

  // 1. Calculate Weights for each existing node
  // Weight_i = Fitness_i * (Degree_i + Attractiveness)
  let totalWeight = 0;
  // Use a map or temporary array to store weights to avoid re-calculating inside loop
  // But for N < 1000, calculating on fly or double loop is fine. 
  // Let's pre-calculate for safety and correctness.
  const nodeWeights = nodes.map(n => {
    const w = n.fitness * (n.degree + attractiveness);
    totalWeight += w;
    return { id: n.id, weight: w };
  });

  if (totalWeight === 0) totalWeight = 1; // Prevent div/0

  // 2. Select m unique targets using Roulette Wheel
  const targets: number[] = [];
  
  // Try to pick m unique targets
  for (let i = 0; i < newEdges; i++) {
    if (targets.length >= nodes.length) break; 

    let safety = 100;
    while (safety > 0) {
      const rand = Math.random() * totalWeight;
      let runningSum = 0;
      let selectedId = -1;

      for (const nw of nodeWeights) {
        runningSum += nw.weight;
        if (runningSum >= rand) {
          selectedId = nw.id;
          break;
        }
      }
      
      // Fallback
      if (selectedId === -1 && nodeWeights.length > 0) selectedId = nodeWeights[nodeWeights.length - 1].id;

      if (selectedId !== -1 && !targets.includes(selectedId)) {
        targets.push(selectedId);
        break;
      }
      safety--;
    }
  }

  // 3. Create New Node
  const angle = Math.random() * Math.PI * 2;
  const spawnR = Math.min(width, height) * 0.4;
  const newNode: NetNode = {
    id: nodes.length,
    x: width / 2 + Math.cos(angle) * spawnR * 0.8, 
    y: height / 2 + Math.sin(angle) * spawnR * 0.8,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    degree: targets.length,
    fitness: Math.random(), // New node gets random fitness
    isNew: true,
    birthStep: step + 1
  };

  // 4. Update Targets (Increase Degree) & Add Links
  targets.forEach(targetId => {
    const targetNode = nodes.find(n => n.id === targetId);
    if (targetNode) {
        targetNode.degree++;
        links.push({ source: newNode.id, target: targetId });
    }
  });

  // Remove "isNew" from old nodes
  nodes.forEach(n => n.isNew = false);

  const newNodes = [...nodes, newNode];
  
  return {
    nodes: newNodes,
    links: [...links],
    step: step + 1,
    degreeDist: calculateDegreeDist(newNodes)
  };
};

const calculateDegreeDist = (nodes: NetNode[]) => {
    const counts: Record<number, number> = {};
    nodes.forEach(n => {
        counts[n.degree] = (counts[n.degree] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([k, v]) => ({ degree: parseInt(k), count: v }))
        .sort((a, b) => a.degree - b.degree);
};


// Simple Force-Directed Layout Step (Verlet/Euler integration)
export const updateForceLayout = (state: NetworkState, width: number, height: number): NetworkState => {
    const nodes = state.nodes;
    const links = state.links;
    
    // Config constants
    const REPULSION = 1000;
    const SPRING_LEN = 30;
    const SPRING_K = 0.05;
    const CENTER_GRAVITY = 0.01;
    const DAMPING = 0.7; // Friction
    const MAX_SPEED = 10;

    // 1. Apply Forces
    for (let i = 0; i < nodes.length; i++) {
        const u = nodes[i];
        let fx = 0;
        let fy = 0;

        // Repulsion (Coulomb's Law-ish)
        for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const v = nodes[j];
            const dx = u.x - v.x;
            const dy = u.y - v.y;
            const distSq = dx*dx + dy*dy;
            // Avoid division by zero
            if (distSq > 0.1) {
                const dist = Math.sqrt(distSq);
                const force = REPULSION / distSq;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            }
        }

        // Center Gravity (Keep in canvas)
        const dx = (width / 2) - u.x;
        const dy = (height / 2) - u.y;
        fx += dx * CENTER_GRAVITY;
        fy += dy * CENTER_GRAVITY;

        // Update velocity with accumulated repulsion/gravity
        u.vx = (u.vx + fx) * DAMPING;
        u.vy = (u.vy + fy) * DAMPING;
    }

    // 2. Apply Spring Forces (Hooke's Law)
    links.forEach(link => {
        const u = nodes[link.source]; // Note: in real d3, source is object. Here it is ID (index if array is ordered)
        const v = nodes[link.target];
        
        if (u && v) {
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0) {
                const force = (dist - SPRING_LEN) * SPRING_K;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                u.vx += fx;
                u.vy += fy;
                v.vx -= fx;
                v.vy -= fy;
            }
        }
    });

    // 3. Update Positions
    nodes.forEach(u => {
        // Limit speed
        const speed = Math.sqrt(u.vx*u.vx + u.vy*u.vy);
        if (speed > MAX_SPEED) {
            u.vx = (u.vx / speed) * MAX_SPEED;
            u.vy = (u.vy / speed) * MAX_SPEED;
        }

        u.x += u.vx;
        u.y += u.vy;

        // Hard boundaries (optional, but good for keeping in view)
        const margin = 20;
        if (u.x < margin) u.x = margin;
        if (u.x > width - margin) u.x = width - margin;
        if (u.y < margin) u.y = margin;
        if (u.y > height - margin) u.y = height - margin;
    });

    return state; // In-place mutation for performance is acceptable here since React state update triggers redraw
};