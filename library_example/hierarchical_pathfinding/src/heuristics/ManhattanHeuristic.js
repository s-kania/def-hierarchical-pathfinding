import { Heuristic } from './Heuristic.js';

export class ManhattanHeuristic extends Heuristic {
    calculate(a, b) {
        return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    }

    getName() {
        return 'manhattan';
    }

    isAdmissible() {
        return true; // Manhattan is admissible for 4-directional movement
    }
} 