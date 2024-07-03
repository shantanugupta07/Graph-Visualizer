const numNodes = 50;
const nodes = [];
const edges = [];
let startNode = null;
let endNode = null;

const graphContainer = document.getElementById('graph-container');
const algorithmSelect = document.getElementById('algorithm');
const generateButton = document.getElementById('generate');
const startButton = document.getElementById('start');
const timeComplexityText = document.getElementById('timeComplexity');

generateButton.addEventListener('click', generateGraph);
startButton.addEventListener('click', startVisualization);

function generateGraph() {
    clearGraph();

    // Generate random nodes
    for (let i = 0; i < numNodes; i++) {
        const node = document.createElement('div');
        node.classList.add('node');
        const x = Math.random() * graphContainer.clientWidth;
        const y = Math.random() * graphContainer.clientHeight;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        graphContainer.appendChild(node);
        nodes.push({ element: node, x, y, visited: false, neighbors: [], predecessor: null });
    }

    // Connect all nodes with edges
    connectNodes();

    startNode = nodes[0];
    endNode = nodes[numNodes - 1];
    startNode.element.style.backgroundColor = 'green';
    endNode.element.style.backgroundColor = 'red';
}

function connectNodes() {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const distance = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);

            // Create an edge between nodeA and nodeB
            const edge = document.createElement('div');
            edge.classList.add('edge');
            edge.style.left = `${nodeA.x}px`;
            edge.style.top = `${nodeA.y}px`;
            edge.style.width = `${distance}px`;
            edge.style.transformOrigin = 'left center';
            const angle = Math.atan2(nodeB.y - nodeA.y, nodeB.x - nodeA.x) * 180 / Math.PI;
            edge.style.transform = `rotate(${angle}deg)`;
            graphContainer.appendChild(edge);
            edges.push(edge);

            // Connect nodeA and nodeB
            nodeA.neighbors.push(nodeB);
            nodeB.neighbors.push(nodeA);
        }
    }
}

function clearGraph() {
    nodes.forEach(node => {
        graphContainer.removeChild(node.element);
    });
    edges.forEach(edge => {
        graphContainer.removeChild(edge);
    });
    nodes.length = 0;
    edges.length = 0;
    startNode = null;
    endNode = null;
    timeComplexityText.textContent = '';
}

function startVisualization() {
    const algorithm = algorithmSelect.value;
    switch (algorithm) {
        case 'dijkstra':
            dijkstra();
            timeComplexityText.textContent = 'Time Complexity: O(V^2)';
            break;
        case 'a-star':
            aStar();
            timeComplexityText.textContent = 'Time Complexity: O(V + E)';
            break;
        case 'bfs':
            bfs();
            timeComplexityText.textContent = 'Time Complexity: O(V + E)';
            break;
        default:
            break;
    }
}

async function dijkstra() {
    const pq = new MinHeap();
    pq.insert({ node: startNode, distance: 0 });
    const distances = new Map(nodes.map(node => [node, Infinity]));
    distances.set(startNode, 0);

    while (!pq.isEmpty()) {
        const { node, distance } = pq.extractMin();
        if (node.visited) continue;
        node.visited = true;
        node.element.classList.add('visited');

        if (node === endNode) {
            await highlightPath();
            return;
        }

        for (const neighbor of node.neighbors) {
            const newDistance = distance + Math.hypot(node.x - neighbor.x, node.y - neighbor.y);
            if (newDistance < distances.get(neighbor)) {
                distances.set(neighbor, newDistance);
                pq.insert({ node: neighbor, distance: newDistance });
                neighbor.predecessor = node;
            }
        }

        await new Promise(r => setTimeout(r, 50));
    }
}

async function aStar() {
    const pq = new MinHeap();
    pq.insert({ node: startNode, distance: 0 });
    const gScores = new Map(nodes.map(node => [node, Infinity]));
    gScores.set(startNode, 0);
    const fScores = new Map(nodes.map(node => [node, Infinity]));
    fScores.set(startNode, heuristic(startNode, endNode));

    while (!pq.isEmpty()) {
        const { node } = pq.extractMin();
        if (node.visited) continue;
        node.visited = true;
        node.element.classList.add('visited');

        if (node === endNode) {
            await highlightPath();
            return;
        }

        for (const neighbor of node.neighbors) {
            const tentativeGScore = gScores.get(node) + Math.hypot(node.x - neighbor.x, node.y - neighbor.y);
            if (tentativeGScore < gScores.get(neighbor)) {
                gScores.set(neighbor, tentativeGScore);
                fScores.set(neighbor, tentativeGScore + heuristic(neighbor, endNode));
                pq.insert({ node: neighbor, distance: fScores.get(neighbor) });
                neighbor.predecessor = node;
            }
        }

        await new Promise(r => setTimeout(r, 50));
    }
}

async function bfs() {
    const queue = [startNode];
    const visited = new Set();
    visited.add(startNode);

    while (queue.length > 0) {
        const node = queue.shift();
        node.visited = true;
        node.element.classList.add('visited');

        if (node === endNode) {
            await highlightPath();
            return;
        }

        for (const neighbor of node.neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                neighbor.predecessor = node;
            }
        }

        await new Promise(r => setTimeout(r, 50));
    }
}

async function highlightPath() {
    let currentNode = endNode;
    const pathNodes = [];
    while (currentNode !== startNode) {
        pathNodes.push(currentNode);
        currentNode = currentNode.predecessor;
        if (!currentNode) return;  // In case no path is found
    }
    pathNodes.push(startNode);

    // Reverse the path nodes for correct drawing
    pathNodes.reverse();

    console.log("Highlighting path:");
    pathNodes.forEach((node, index) => {
        console.log(`Node ${index}: (${node.x}, ${node.y})`);
    });

    // Add a delay to highlight each node in the path
    for (let i = 0; i < pathNodes.length; i++) {
        pathNodes[i].element.classList.add('path');
        await new Promise(r => setTimeout(r, 100));  // Delay to visualize the path highlighting
    }
}

function heuristic(nodeA, nodeB) {
    return Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
}

class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(item) {
        this.heap.push(item);
        this.heapifyUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.isEmpty()) {
            return null;
        }

        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapifyDown(0);
        }
        return min;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    heapifyUp(index) {
        let current = index;
        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.heap[current].distance < this.heap[parent].distance) {
                [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
                current = parent;
            } else {
                break;
            }
        }
    }

    heapifyDown(index) {
        let current = index;
        while (current < this.heap.length) {
            const left = 2 * current + 1;
            const right = 2 * current + 2;
            let smallest = current;

            if (left < this.heap.length && this.heap[left].distance < this.heap[smallest].distance) {
                smallest = left;
            }
            if (right < this.heap.length && this.heap[right].distance < this.heap[smallest].distance) {
                smallest = right;
            }

            if (smallest !== current) {
                [this.heap[current], this.heap[smallest]] = [this.heap[smallest], this.heap[current]];
                current = smallest;
            } else {
                break;
            }
        }
    }
}
