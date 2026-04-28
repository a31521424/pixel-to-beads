// 3D KD-Tree over OKLab for fast nearest-color queries.
// The neutralBias scoring in renderStrategies is asymmetric, so we let the
// KD-Tree return the top-K geometric candidates and let the caller re-score
// them with the strategy. K=6 covers the bias range without losing accuracy.

const DIMS = ['L', 'a', 'b'];

class KdNode {
    constructor(color, axis, left = null, right = null) {
        this.color = color;
        this.axis = axis;
        this.left = left;
        this.right = right;
    }
}

function buildNode(items, depth) {
    if (items.length === 0) return null;
    const axis = depth % 3;
    const key = DIMS[axis];

    items.sort((a, b) => a.lab[key] - b.lab[key]);
    const mid = Math.floor(items.length / 2);
    return new KdNode(
        items[mid],
        axis,
        buildNode(items.slice(0, mid), depth + 1),
        buildNode(items.slice(mid + 1), depth + 1)
    );
}

function squaredOklabDistance(lab1, lab2) {
    // Same lightness weighting as the brute-force scorer (1.6x dL).
    const dL = (lab1.L - lab2.L) * 1.6;
    const dA = lab1.a - lab2.a;
    const dB = lab1.b - lab2.b;
    return dL * dL + dA * dA + dB * dB;
}

// Bounded heap that keeps the K smallest items. Tiny implementation for K<=16.
class TopKHeap {
    constructor(k) {
        this.k = k;
        this.items = []; // {dist, color}
    }
    push(dist, color) {
        if (this.items.length < this.k) {
            this.items.push({ dist, color });
            this.items.sort((a, b) => a.dist - b.dist);
            return;
        }
        if (dist >= this.items[this.k - 1].dist) return;
        this.items[this.k - 1] = { dist, color };
        this.items.sort((a, b) => a.dist - b.dist);
    }
    worst() {
        return this.items.length < this.k ? Infinity : this.items[this.items.length - 1].dist;
    }
}

function knnSearch(node, target, heap) {
    if (!node) return;
    const dist = squaredOklabDistance(target, node.color.lab);
    heap.push(dist, node.color);

    const axisKey = DIMS[node.axis];
    const diff = target[axisKey] - node.color.lab[axisKey];
    const near = diff < 0 ? node.left : node.right;
    const far = diff < 0 ? node.right : node.left;

    knnSearch(near, target, heap);

    // Re-weight diff for L axis to match distance metric.
    const axisDiff = node.axis === 0 ? diff * 1.6 : diff;
    if (axisDiff * axisDiff < heap.worst()) {
        knnSearch(far, target, heap);
    }
}

export class ColorIndex {
    constructor(colors) {
        this.colors = colors;
        this.root = buildNode([...colors], 0);
        this._cache = new Map(); // hex -> closest color (single-result cache)
    }

    // Returns the single nearest color by OKLab distance.
    nearest(lab) {
        const heap = new TopKHeap(1);
        knnSearch(this.root, lab, heap);
        return heap.items[0]?.color ?? this.colors[0];
    }

    // Returns up to K nearest colors sorted by ascending distance.
    nearestK(lab, k) {
        const heap = new TopKHeap(Math.min(k, this.colors.length));
        knnSearch(this.root, lab, heap);
        return heap.items.map(item => item.color);
    }

    // Cached lookup keyed by hex (useful when source pixels repeat heavily,
    // e.g. flat-color logos). Caller must reset cache when palette changes.
    nearestCached(lab, hexKey) {
        const cached = this._cache.get(hexKey);
        if (cached) return cached;
        const result = this.nearest(lab);
        this._cache.set(hexKey, result);
        return result;
    }

    clearCache() {
        this._cache.clear();
    }
}

// Brute-force fallback for tiny palettes or RGB-mode strategies. Kept here so
// the call site has one consistent interface.
export function bruteForceNearestRgb(rgb, colors) {
    let bestDist = Infinity;
    let best = colors[0];
    for (const c of colors) {
        const dr = rgb[0] - c.rgb[0];
        const dg = rgb[1] - c.rgb[1];
        const db = rgb[2] - c.rgb[2];
        const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if (dist < bestDist) {
            bestDist = dist;
            best = c;
        }
    }
    return best;
}
