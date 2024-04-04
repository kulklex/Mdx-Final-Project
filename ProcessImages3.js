import { PNG } from 'pngjs';
import fs from 'fs';


const imageFilePath = './Data/images/Artificial-3g-pitch.png';

function readImage(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(new PNG())
            .on('parsed', function() {
                resolve(this);
            })
            .on('error', reject);
    });
}

function quantizeColor(color) {
    return {
        r: Math.round(color.r / 32),
        g: Math.round(color.g / 32),
        b: Math.round(color.b / 32)
    };
}

function calculateCellAverageColor(image, cellX, cellY, cellWidth, cellHeight) {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let dy = 0; dy < cellHeight; dy++) {
        for (let dx = 0; dx < cellWidth; dx++) {
            let idx = ((cellY + dy) * image.width + (cellX + dx)) << 2;
            rSum += image.data[idx];
            gSum += image.data[idx + 1];
            bSum += image.data[idx + 2];
            count++;
        }
    }
    return {
        r: rSum / count,
        g: gSum / count,
        b: bSum / count
    };
}

// Simplified version to demonstrate the concept
function createGridClassification(image, squareSize) {
    const rows = Math.ceil(image.height / squareSize);
    const cols = Math.ceil(image.width / squareSize);
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "none"));

    // Example target colors for demonstration
    const targetColors = [
        { r: 136, g: 0, b: 22, label: "team1" },
        { r: 254, g: 242, b: 1, label: "team2" },
        { r: 164, g: 76, b: 163, label: "ball" }
    ].map(color => ({
        ...color,
        ...quantizeColor(color)
    }));

    for (let y = 0; y < image.height; y += squareSize) {
        for (let x = 0; x < image.width; x += squareSize) {
            const cellColor = calculateCellAverageColor(image, x, y, squareSize, squareSize);
            const quantizedCellColor = quantizeColor(cellColor);
            
            let closestMatch = null;
            targetColors.forEach((targetColor) => {
                if (quantizedCellColor.r === targetColor.r && 
                    quantizedCellColor.g === targetColor.g && 
                    quantizedCellColor.b === targetColor.b) {
                    closestMatch = targetColor.label;
                }
            });

            const row = Math.floor(y / squareSize);
            const col = Math.floor(x / squareSize);
            grid[row][col] = closestMatch ? closestMatch : "none";
        }
    }
    
    return grid;
}

// Player detection and bounding box calculation
function detectPlayersAndObjects(gridClassification, squareSize) {
    const visited = gridClassification.map(row => row.map(() => false));
    const playersAndObjects = [];
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // To move in 4 directions

    function dfs(x, y, label) {
        if (x < 0 || y < 0 || x >= gridClassification.length || y >= gridClassification[0].length || visited[x][y] || gridClassification[x][y] !== label) {
            return null;
        }
        visited[x][y] = true;
        const bounds = { minX: x, minY: y, maxX: x, maxY: y }; // Initial bounds for this region
        directions.forEach(([dx, dy]) => {
            const next = dfs(x + dx, y + dy, label);
            if (next) {
                bounds.minX = Math.min(bounds.minX, next.minX);
                bounds.minY = Math.min(bounds.minY, next.minY);
                bounds.maxX = Math.max(bounds.maxX, next.maxX);
                bounds.maxY = Math.max(bounds.maxY, next.maxY);
            }
        });
        return bounds;
    }

    for (let i = 0; i < gridClassification.length; i++) {
        for (let j = 0; j < gridClassification[i].length; j++) {
            if (!visited[i][j] && gridClassification[i][j] !== 'none') {
                const bounds = dfs(i, j, gridClassification[i][j]);
                if (bounds) {
                    // Convert grid bounds back to image pixel coordinates
                    playersAndObjects.push({
                        type: gridClassification[i][j], // Label as type
                        x: bounds.minX * squareSize,
                        y: bounds.minY * squareSize,
                        width: (bounds.maxX - bounds.minX + 1) * squareSize,
                        height: (bounds.maxY - bounds.minY + 1) * squareSize
                    });
                }
            }
        }
    }

    return playersAndObjects;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function findClosestPlayerToBall(playersAndObjects) {
    const ball = playersAndObjects.find(obj => obj.type === 'ball');
    if (!ball) return null;

    const ballCenterX = ball.x + ball.width / 2;
    const ballCenterY = ball.y + ball.height / 2;

    let closestPlayer = null;
    let minDistance = Infinity;

    playersAndObjects.forEach(player => {
        if (player.type.startsWith('team')) {
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const distance = calculateDistance(ballCenterX, ballCenterY, playerCenterX, playerCenterY);

            if (distance < minDistance) {
                closestPlayer = player;
                minDistance = distance;
            }
        }
    });

    return closestPlayer;
}

async function processImageAndFindPossession(filePath, squareSize = 10) {
    try {
        const image = await readImage(filePath);
        const gridClassification = createGridClassification(image, squareSize);
        const playersAndObjects = detectPlayersAndObjects(gridClassification, squareSize);

        const closestPlayer = findClosestPlayerToBall(playersAndObjects);
        if (closestPlayer) {
            console.log(`The player closest to the ball is:`, closestPlayer);
        } else {
            console.log("No player is close to the ball.");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

processImageAndFindPossession(imageFilePath);
