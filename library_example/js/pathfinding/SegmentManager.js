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
        this.currentSegmentIndex = 0;
        this.calculatedSegments = [];
        this.hierarchicalPath = null;
        this.startPoint = null;
        this.endPoint = null;
        this.isComplete = false;
    }

    /**
     * Ustawia hierarchiczną ścieżkę i resetuje stan
     * @param {Object} hierarchicalPath - hierarchiczna ścieżka z segmentami
     * @param {Object} startPoint - punkt startowy {x, y}
     * @param {Object} endPoint - punkt końcowy {x, y}
     */
    setHierarchicalPath(hierarchicalPath, startPoint, endPoint) {
        this.hierarchicalPath = hierarchicalPath;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.reset();
        
        // Przygotuj segmenty do obliczenia (ignoruj chunk 'start')
        this.prepareSegments();
    }

    /**
     * Przygotowuje segmenty do obliczenia, ignorując chunk 'start'
     */
    prepareSegments() {
        if (!this.hierarchicalPath || !this.hierarchicalPath.segments) {
            this.segments = [];
            return;
        }

        // Filtruj segmenty, ignorując chunk 'start'
        this.segments = this.hierarchicalPath.segments.filter(segment => 
            segment.chunk !== 'start'
        );

        console.log(`SegmentManager: Przygotowano ${this.segments.length} segmentów do obliczenia`);
    }

    /**
     * Pobiera następny segment do obliczenia
     * @returns {Object|null} Segment do obliczenia lub null jeśli wszystkie obliczone
     */
    getNextSegment() {
        if (this.isComplete || this.currentSegmentIndex >= this.segments.length) {
            return null;
        }

        const segment = this.segments[this.currentSegmentIndex];
        
        // Określ punkty startowy i końcowy dla segmentu
        const segmentData = {
            chunkId: segment.chunk,
            startPoint: this.getSegmentStartPoint(segment),
            endPoint: this.getSegmentEndPoint(segment),
            segmentIndex: this.currentSegmentIndex,
            originalSegment: segment
        };

        console.log(`SegmentManager: Pobieranie segmentu ${this.currentSegmentIndex + 1}/${this.segments.length}`, segmentData);
        
        return segmentData;
    }

    /**
     * Określa punkt startowy dla segmentu
     * @param {Object} segment - segment do analizy
     * @returns {Object} Punkt startowy {x, y}
     */
    getSegmentStartPoint(segment) {
        if (this.currentSegmentIndex === 0) {
            // Pierwszy segment - start od punktu startowego
            return this.startPoint;
        } else {
            // Kolejne segmenty - start od poprzedniego punktu przejścia
            const previousSegment = this.segments[this.currentSegmentIndex - 1];
            return previousSegment.target || previousSegment.endPoint;
        }
    }

    /**
     * Określa punkt końcowy dla segmentu
     * @param {Object} segment - segment do analizy
     * @returns {Object} Punkt końcowy {x, y}
     */
    getSegmentEndPoint(segment) {
        return segment.target || segment.endPoint;
    }

    /**
     * Oblicza lokalną ścieżkę dla aktualnego segmentu
     * @param {Array} localPath - obliczona lokalna ścieżka
     * @param {Object} chunkData - dane chunka
     */
    calculateSegment(localPath, chunkData) {
        if (this.currentSegmentIndex >= this.segments.length) {
            console.warn('SegmentManager: Próba obliczenia segmentu poza zakresem');
            return;
        }

        const segment = this.segments[this.currentSegmentIndex];
        const segmentData = {
            chunkId: segment.chunk,
            startPoint: this.getSegmentStartPoint(segment),
            endPoint: this.getSegmentEndPoint(segment),
            localPath: localPath,
            calculated: true,
            segmentIndex: this.currentSegmentIndex,
            chunkData: chunkData
        };

        this.calculatedSegments.push(segmentData);
        
        console.log(`SegmentManager: Obliczono segment ${this.currentSegmentIndex + 1}/${this.segments.length}`, segmentData);

        // Przejdź do następnego segmentu
        this.currentSegmentIndex++;

        // Sprawdź czy wszystkie segmenty zostały obliczone
        if (this.currentSegmentIndex >= this.segments.length) {
            this.isComplete = true;
            console.log('SegmentManager: Wszystkie segmenty zostały obliczone');
        }
    }

    /**
     * Pobiera wszystkie obliczone segmenty
     * @returns {Array} Tablica obliczonych segmentów
     */
    getCalculatedSegments() {
        return this.calculatedSegments;
    }

    /**
     * Sprawdza czy wszystkie segmenty zostały obliczone
     * @returns {boolean} True jeśli wszystkie segmenty obliczone
     */
    isAllComplete() {
        return this.isComplete;
    }

    /**
     * Pobiera informację o postępie
     * @returns {string} Format "2/5" lub "Brak segmentów"
     */
    getProgress() {
        if (!this.segments || this.segments.length === 0) {
            return "Brak segmentów";
        }
        return `${this.currentSegmentIndex}/${this.segments.length}`;
    }

    /**
     * Pobiera informację o postępie z opisem
     * @returns {string} Opis postępu
     */
    getProgressDescription() {
        if (!this.segments || this.segments.length === 0) {
            return "Brak segmentów do obliczenia";
        }
        
        if (this.isComplete) {
            return `Wszystkie segmenty obliczone (${this.segments.length}/${this.segments.length})`;
        }
        
        return `Segment ${this.currentSegmentIndex + 1} z ${this.segments.length}`;
    }

    /**
     * Sprawdza czy można obliczyć następny segment
     * @returns {boolean} True jeśli można obliczyć następny segment
     */
    canCalculateNext() {
        return !this.isComplete && this.currentSegmentIndex < this.segments.length;
    }

    /**
     * Pobiera aktualny segment (ostatnio obliczony lub aktualnie w trakcie)
     * @returns {Object|null} Aktualny segment lub null
     */
    getCurrentSegment() {
        if (this.calculatedSegments.length > 0) {
            return this.calculatedSegments[this.calculatedSegments.length - 1];
        }
        return null;
    }

    /**
     * Pobiera hierarchiczną ścieżkę
     * @returns {Object|null} Hierarchiczna ścieżka
     */
    getHierarchicalPath() {
        return this.hierarchicalPath;
    }

    /**
     * Pobiera punkty startowy i końcowy
     * @returns {Object} {startPoint, endPoint}
     */
    getPathPoints() {
        return {
            startPoint: this.startPoint,
            endPoint: this.endPoint
        };
    }

    /**
     * Debug: wyświetla informacje o stanie
     */
    debugInfo() {
        console.log('=== SegmentManager Debug Info ===');
        console.log('Hierarchical Path:', this.hierarchicalPath);
        console.log('Start Point:', this.startPoint);
        console.log('End Point:', this.endPoint);
        console.log('Segments:', this.segments);
        console.log('Current Index:', this.currentSegmentIndex);
        console.log('Calculated Segments:', this.calculatedSegments);
        console.log('Is Complete:', this.isComplete);
        console.log('Progress:', this.getProgress());
        console.log('Can Calculate Next:', this.canCalculateNext());
        console.log('================================');
    }
} 