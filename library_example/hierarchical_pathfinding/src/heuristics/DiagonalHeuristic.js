import { Heuristic } from './Heuristic.js';

export class DiagonalHeuristic extends Heuristic {
    calculate(a, b) {
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        return Math.max(dx, dy);
    }

    getName() {
        return 'diagonal';
    }

    isAdmissible() {
        return true; // Diagonal is admissible for 8-directional movement
    }
} 