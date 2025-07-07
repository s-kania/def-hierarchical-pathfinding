import { Heuristic } from './Heuristic.js';

export class OctileHeuristic extends Heuristic {
    calculate(a, b) {
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        const F = Math.SQRT2 - 1; // Cost of diagonal movement
        return Math.max(dx, dy) + F * Math.min(dx, dy);
    }

    getName() {
        return 'octile';
    }

    isAdmissible() {
        return true; // Octile is admissible for 8-directional movement with diagonal cost
    }
} 