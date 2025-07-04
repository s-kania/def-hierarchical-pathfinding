/**
 * TRANSITION POINT MANAGER BETWEEN CHUNKS
 */

import { RENDER_CONSTANTS } from '../config/Settings.js';

export class TransitionPointManager {
    constructor(settings, pathfindingSettings) {
        this.settings = settings;
        this.pathfindingSettings = pathfindingSettings;
        this.transitionPoints = [];
    }

    /**
     * GENERATES TRANSITION POINTS BETWEEN CHUNKS
     */
    generateTransitionPoints(chunks) {
        this.transitionPoints = [];
        
        const chunkSize = this.settings.chunkSize;
        const maxPoints = this.pathfindingSettings.maxTransitionPoints;
        
        // Check all pairs of adjacent chunks
        for (let chunkY = 0; chunkY < this.settings.chunkRows; chunkY++) {
            for (let chunkX = 0; chunkX < this.settings.chunkCols; chunkX++) {
                const currentChunk = chunks.find(c => c.x === chunkX && c.y === chunkY);
                if (!currentChunk) continue;
                
                // Check border with chunk on the right (horizontal)
                if (chunkX < this.settings.chunkCols - 1) {
                    const rightChunk = chunks.find(c => c.x === chunkX + 1 && c.y === chunkY);
                    if (rightChunk) {
                        const points = this.findTransitionPointsOnBorder(
                            currentChunk, rightChunk, 'horizontal', maxPoints
                        );
                        this.transitionPoints.push(...points);
                    }
                }
                
                // Check border with chunk below (vertical)
                if (chunkY < this.settings.chunkRows - 1) {
                    const bottomChunk = chunks.find(c => c.x === chunkX && c.y === chunkY + 1);
                    if (bottomChunk) {
                        const points = this.findTransitionPointsOnBorder(
                            currentChunk, bottomChunk, 'vertical', maxPoints
                        );
                        this.transitionPoints.push(...points);
                    }
                }
            }
        }
        
        return this.transitionPoints;
    }

    /**
     * FINDS TRANSITION POINTS ON BORDER BETWEEN TWO CHUNKS
     */
    findTransitionPointsOnBorder(chunkA, chunkB, direction, maxPoints) {
        const chunkSize = this.settings.chunkSize;
        const points = [];
        
        // Prepare array for checking passability
        const canPass = [];
        
        if (direction === 'horizontal') {
            // Vertical border - check rows (Y)
            for (let y = 0; y < chunkSize; y++) {
                // Right edge of chunkA (x = chunkSize-1)
                const tileA = chunkA.tiles[y * chunkSize + (chunkSize - 1)];
                // Left edge of chunkB (x = 0)
                const tileB = chunkB.tiles[y * chunkSize + 0];
                
                // Can pass only if both tiles are ocean (0)
                canPass[y] = (tileA === 0 && tileB === 0);
            }
        } else if (direction === 'vertical') {
            // Horizontal border - check columns (X)
            for (let x = 0; x < chunkSize; x++) {
                // Bottom edge of chunkA (y = chunkSize-1)
                const tileA = chunkA.tiles[(chunkSize - 1) * chunkSize + x];
                // Top edge of chunkB (y = 0)
                const tileB = chunkB.tiles[0 * chunkSize + x];
                
                // Can pass only if both tiles are ocean (0)
                canPass[x] = (tileA === 0 && tileB === 0);
            }
        }
        
        // Find continuous passable segments
        const segments = this.findPassableSegments(canPass);
        
        // Limit number of segments to maxPoints
        const selectedSegments = this.selectBestSegments(segments, maxPoints);
        
        // Create transition points at the center of each segment
        selectedSegments.forEach(segment => {
            const midPoint = Math.floor((segment.start + segment.end) / 2);
            
            let globalX, globalY;
            
            if (direction === 'horizontal') {
                // Point on border between chunks (at the end of chunk A)
                globalX = chunkA.x * chunkSize + chunkSize; // Border on the right side of chunkA
                globalY = chunkA.y * chunkSize + midPoint;
            } else if (direction === 'vertical') {
                // Point on border between chunks (at the end of chunk A)
                globalX = chunkA.x * chunkSize + midPoint;
                globalY = chunkA.y * chunkSize + chunkSize; // Border below chunkA
            }
            
            points.push({
                chunkA: chunkA.id,
                chunkB: chunkB.id,
                x: globalX,
                y: globalY,
                direction: direction,
                segmentLength: segment.end - segment.start + 1
            });
        });
        
        return points;
    }

    /**
     * FINDS CONTINUOUS SEGMENTS WHERE PASSAGE IS POSSIBLE
     */
    findPassableSegments(canPass) {
        const segments = [];
        let currentStart = null;
        
        for (let i = 0; i < canPass.length; i++) {
            if (canPass[i] && currentStart === null) {
                // Start of new segment
                currentStart = i;
            } else if (!canPass[i] && currentStart !== null) {
                // End of current segment
                segments.push({ start: currentStart, end: i - 1 });
                currentStart = null;
            }
        }
        
        // If segment continues to the end
        if (currentStart !== null) {
            segments.push({ start: currentStart, end: canPass.length - 1 });
        }
        
        return segments;
    }

    /**
     * SELECTS BEST SEGMENTS (LONGEST)
     */
    selectBestSegments(segments, maxCount) {
        // Sort segments by length (longest first)
        const sortedSegments = segments.sort((a, b) => {
            const lengthA = a.end - a.start + 1;
            const lengthB = b.end - b.start + 1;
            return lengthB - lengthA;
        });
        
        // Select maximum maxCount longest segments
        return sortedSegments.slice(0, maxCount);
    }

    /**
     * CALCULATES PIXEL COORDINATES FOR TRANSITION POINTS
     */
    calculateTransitionPointPixels(chunks, gapSize = RENDER_CONSTANTS.GAP_SIZE) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;

        this.transitionPoints.forEach(point => {
            const chunkAData = chunks.find(c => c.id === point.chunkA);
            const chunkBData = chunks.find(c => c.id === point.chunkB);
            
            if (!chunkAData || !chunkBData) return;

            let pixelX, pixelY;

            if (point.direction === 'horizontal') {
                // For horizontal points - position on right border of chunk A
                const chunkStartX = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.x * (chunkPixelSize + gapSize);
                const chunkStartY = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.y * (chunkPixelSize + gapSize);
                
                // Position X - on border between chunks (at the end of chunk A)
                pixelX = chunkStartX + chunkPixelSize;
                
                // Position Y - relative to chunk A, converted to local position in chunk
                const localYInChunk = point.y % this.settings.chunkSize;
                pixelY = chunkStartY + localYInChunk * this.settings.tileSize + this.settings.tileSize / 2;
                
            } else if (point.direction === 'vertical') {
                // For vertical points - position on bottom border of chunk A
                const chunkStartX = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.x * (chunkPixelSize + gapSize);
                const chunkStartY = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.y * (chunkPixelSize + gapSize);
                
                // Position X - relative to chunk A, converted to local position in chunk
                const localXInChunk = point.x % this.settings.chunkSize;
                pixelX = chunkStartX + localXInChunk * this.settings.tileSize + this.settings.tileSize / 2;
                
                // Position Y - on border between chunks (at the end of chunk A)
                pixelY = chunkStartY + chunkPixelSize;
            }

            // Save calculated coordinates in point object
            point.pixelX = pixelX;
            point.pixelY = pixelY;
        });
        

    }

    /**
     * FINDS TRANSITION POINT UNDER MOUSE COORDINATES
     */
    getTransitionPointAt(mouseX, mouseY) {
        const baseRadius = Math.max(8, this.settings.tileSize / 2);
        const pointRadius = baseRadius * this.pathfindingSettings.transitionPointScale;
        
        // Constant tolerance - simpler and more predictable
        const tolerance = Math.max(20, pointRadius * 1.5);
        
        // Find closest transition point
        let closestPoint = null;
        let closestDistance = Infinity;
        
        for (const point of this.transitionPoints) {
            // Use pre-calculated pixel coordinates
            if (typeof point.pixelX !== 'number' || typeof point.pixelY !== 'number') {
                console.warn(`⚠️ Point missing pixel coordinates:`, point);
                continue;
            }

            // Calculate distance from mouse to point
            const distance = Math.sqrt((mouseX - point.pixelX) ** 2 + (mouseY - point.pixelY) ** 2);
            
            // Check if point is within tolerance and closer than previous
            if (distance <= tolerance && distance < closestDistance) {
                closestPoint = point;
                closestDistance = distance;
            }
        }
        
        return closestPoint;
    }

    /**
     * GETTER FOR TRANSITION POINTS
     */
    getTransitionPoints() {
        return this.transitionPoints;
    }

    /**
     * CLEARS TRANSITION POINTS
     */
    clearTransitionPoints() {
        this.transitionPoints = [];
    }
} 