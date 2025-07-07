import { Heuristic } from './Heuristic.js';

export class EuclideanHeuristic extends Heuristic {
    calculate(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getName() {
        return 'euclidean';
    }

    isAdmissible() {
        return true; // Euclidean is admissible for any movement
    }
} 