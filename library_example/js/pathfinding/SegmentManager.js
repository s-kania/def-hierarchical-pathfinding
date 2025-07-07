/**
 * SegmentManager - zarządza stanem segmentów hierarchicznej ścieżki
 * Umożliwia krokowe obliczanie lokalnych ścieżek dla każdego segmentu
 */
export class SegmentManager {
    constructor() {
        this.reset();
    }

    /**
     * Resetuje stan managera segmentów
     */
    reset() {
        this.currentIndex = 0;
        this.calculatedSegments = [];
        this.segments = [];
        this.startPoint = null;
        this.endPoint = null;
    }

    /**
     * Ustawia hierarchiczną ścieżkę i resetuje stan
     * @param {Array} pathSegments - segmenty ścieżki hierarchicznej
     * @param {Object} startPoint - punkt startowy {x, y}
     * @param {Object} endPoint - punkt końcowy {x, y}
     */
    setPath(pathSegments, startPoint, endPoint) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.reset();
        
        // Filtruj segmenty, ignorując chunk 'start'
        this.segments = pathSegments.filter(segment => segment.chunk !== 'start');
        
        console.log(`SegmentManager: Przygotowano ${this.segments.length} segmentów`);
    }

    /**
     * Oblicza następny segment
     * @param {Object} pathfinder - instancja HierarchicalPathfinding
     * @param {Function} getChunkData - funkcja do pobierania danych chunka
     * @returns {Object|null} Obliczony segment lub null
     */
    calculateNext(pathfinder, getChunkData) {
        if (this.currentIndex >= this.segments.length) {
            return null;
        }

        const segment = this.segments[this.currentIndex];
        const startPoint = this.getStartPoint(segment);
        const endPoint = this.getEndPoint(segment);
        
        // Pobierz dane chunka
        const chunkData = getChunkData(segment.chunk);
        if (!chunkData) {
            console.warn(`SegmentManager: Brak danych dla chunka ${segment.chunk}`);
            return null;
        }
        
        // Oblicz lokalną ścieżkę
        const localPath = pathfinder.findLocalPath(segment.chunk, startPoint, endPoint);
        
        if (localPath) {
            const calculatedSegment = {
                chunkId: segment.chunk,
                startPoint: startPoint,
                endPoint: endPoint,
                localPath: localPath,
                segmentIndex: this.currentIndex
            };

            this.calculatedSegments.push(calculatedSegment);
            this.currentIndex++;
            
            console.log(`SegmentManager: Obliczono segment ${this.currentIndex}/${this.segments.length}`);
            return calculatedSegment;
        } else {
            console.warn(`SegmentManager: Nie można znaleźć ścieżki w segmencie ${this.currentIndex + 1}`);
            return null;
        }
    }

    /**
     * Określa punkt startowy dla segmentu
     */
    getStartPoint(segment) {
        if (this.currentIndex === 0) {
            return this.startPoint;
        } else {
            const previousSegment = this.segments[this.currentIndex - 1];
            return previousSegment.position;
        }
    }

    /**
     * Określa punkt końcowy dla segmentu
     */
    getEndPoint(segment) {
        return segment.position;
    }

    /**
     * Pobiera wszystkie obliczone segmenty
     */
    getCalculatedSegments() {
        return this.calculatedSegments;
    }

    /**
     * Sprawdza czy wszystkie segmenty zostały obliczone
     */
    isComplete() {
        return this.currentIndex >= this.segments.length;
    }

    /**
     * Pobiera informację o postępie
     */
    getProgress() {
        if (this.segments.length === 0) {
            return "Brak segmentów";
        }
        return `${this.currentIndex}/${this.segments.length}`;
    }

    /**
     * Sprawdza czy można obliczyć następny segment
     */
    canCalculateNext() {
        return !this.isComplete();
    }
} 