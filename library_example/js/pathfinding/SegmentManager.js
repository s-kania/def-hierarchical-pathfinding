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
        this.reset();
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        
        // Filtruj segmenty, ignorując chunk 'start'
        this.segments = pathSegments.filter(segment => segment.chunk !== 'start');
        
        console.log(`SegmentManager: Przygotowano ${this.segments.length} segmentów`);
        console.log('SegmentManager: StartPoint:', this.startPoint);
        console.log('SegmentManager: EndPoint:', this.endPoint);
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
        
        // Debug
        console.log(`SegmentManager: Obliczanie segmentu ${this.currentIndex + 1}/${this.segments.length}`);
        console.log('Segment:', segment);
        console.log('StartPoint:', startPoint);
        console.log('EndPoint:', endPoint);
        
        // Sprawdź czy punkty są poprawne
        if (!startPoint || !endPoint) {
            console.error('SegmentManager: Nieprawidłowe punkty start/end:', { startPoint, endPoint });
            return null;
        }
        
        // Pobierz dane chunka
        const chunkData = getChunkData(segment.chunk);
        if (!chunkData) {
            console.warn(`SegmentManager: Brak danych dla chunka ${segment.chunk}`);
            return null;
        }
        
        // ETAP 3 PUNKT 2: Wykorzystanie LocalPathfinder bezpośrednio
        const localPathfinder = pathfinder.getLocalPathfinder();
        if (!localPathfinder) {
            console.error('SegmentManager: Brak LocalPathfinder w HierarchicalPathfinder');
            return null;
        }
        
        // Konwertuj pozycje globalne na lokalne w chunku
        const config = pathfinder.getConfig();
        const localStart = this.globalToLocal(startPoint, segment.chunk, config.chunkWidth, config.tileSize);
        const localEnd = this.globalToLocal(endPoint, segment.chunk, config.chunkWidth, config.tileSize);
        
        console.log('LocalStart:', localStart);
        console.log('LocalEnd:', localEnd);
        
        // Oblicz lokalną ścieżkę używając LocalPathfinder
        const localPath = localPathfinder.findPath(chunkData, localStart, localEnd);
        
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
            console.log('LocalPath:', localPath);
            return calculatedSegment;
        } else {
            console.warn(`SegmentManager: Nie można znaleźć ścieżki w segmencie ${this.currentIndex + 1}`);
            return null;
        }
    }

    /**
     * Konwertuje pozycję globalną na lokalną w chunku
     * @param {Object} globalPos - pozycja globalna {x, y}
     * @param {string} chunkId - ID chunka
     * @param {number} chunkSize - rozmiar chunka w kafelkach
     * @param {number} tileSize - rozmiar kafelka w jednostkach świata
     * @returns {Object} pozycja lokalna {x, y}
     */
    globalToLocal(globalPos, chunkId, chunkSize, tileSize) {
        // Parsuj chunkId (format: "x,y")
        const [chunkX, chunkY] = chunkId.split(',').map(Number);
        
        // Oblicz rozmiar chunka w jednostkach świata
        const chunkWorldSize = chunkSize * tileSize;
        
        // Oblicz pozycję lokalną
        const localX = Math.floor((globalPos.x - chunkX * chunkWorldSize) / tileSize);
        const localY = Math.floor((globalPos.y - chunkY * chunkWorldSize) / tileSize);
        
        // Ogranicz do granic chunka
        return {
            x: Math.max(0, Math.min(chunkSize - 1, localX)),
            y: Math.max(0, Math.min(chunkSize - 1, localY))
        };
    }

    /**
     * Określa punkt startowy dla segmentu
     */
    getStartPoint(segment) {
        if (this.currentIndex === 0) {
            return this.startPoint;
        } else {
            const previousSegment = this.segments[this.currentIndex - 1];
            if (!previousSegment || !previousSegment.position) {
                console.error('SegmentManager: Brak poprzedniego segmentu lub pozycji:', previousSegment);
                return null;
            }
            return previousSegment.position;
        }
    }

    /**
     * Określa punkt końcowy dla segmentu
     */
    getEndPoint(segment) {
        if (!segment || !segment.position) {
            console.error('SegmentManager: Brak segmentu lub pozycji:', segment);
            return null;
        }
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