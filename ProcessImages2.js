// Import necessary modules
import { PNG } from 'pngjs';
import fs from 'fs';

// Define the sequence of image file paths
const imageFilePaths = [
    './Data/images/case-one-pitch.png',
    './Data/images/case-two-pitch.png',
    './Data/images/case-four-pitch.png'
];

// Asynchronously reads and parses an image file into a usable PNG object
async function readImage(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(new PNG())
            .on('parsed', function() {
                resolve(this);
            })
            .on('error', reject);
    });
}

// Simplifies the color space for comparison by quantizing color values
function quantizeColor(color) {
    return { r: Math.round(color.r / 32), g: Math.round(color.g / 32), b: Math.round(color.b / 32) };
}

// Calculates the average color within a cell of the image
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
    return { r: rSum / count, g: gSum / count, b: bSum / count };
}

// Creates a classification grid for the image
function createGridClassification(image, squareSize) {
    const rows = Math.ceil(image.height / squareSize);
    const cols = Math.ceil(image.width / squareSize);
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "none"));

    const targetColors = [
        { r: 237, g: 28, b: 36, label: "team1" },
        { r: 255, g: 242, b: 0, label: "team2" },
        { r: 163, g: 73, b: 164, label: "ball" }
    ].map(color => ({ ...color, ...quantizeColor(color) }));

    for (let y = 0; y < image.height; y += squareSize) {
        for (let x = 0; x < image.width; x += squareSize) {
            const cellColor = calculateCellAverageColor(image, x, y, squareSize, squareSize);
            const quantizedCellColor = quantizeColor(cellColor);
            targetColors.forEach(targetColor => {
                if (quantizedCellColor.r === targetColor.r && quantizedCellColor.g === targetColor.g && quantizedCellColor.b === targetColor.b) {
                    grid[Math.floor(y / squareSize)][Math.floor(x / squareSize)] = targetColor.label;
                }
            });
        }
    }
    return grid;
}

// Detects players, the ball, and calculates bounding boxes for each entity on the field
function detectPlayersAndObjects(gridClassification, squareSize) {
    const visited = gridClassification.map(row => row.map(() => false));
    const playersAndObjects = [];
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];

    function dfs(x, y, label) {
        if (x < 0 || y < 0 || x >= gridClassification.length || y >= gridClassification[0].length || visited[x][y] || gridClassification[x][y] !== label) {
            return null;
        }
        visited[x][y] = true;
        let bounds = { minX: x, minY: y, maxX: x, maxY: y };
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
                    playersAndObjects.push({
                        type: gridClassification[i][j],
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

// Utility function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Extract frame data, including determining which team1 player is closest to the ball
function extractFrameData(playersAndObjects) {
    const frameData = {
        team1: [],
        team2: null,
        ball: null,
    };

    playersAndObjects.forEach(object => {
        if (object.type === 'ball') {
            frameData.ball = object;
        } else if (object.type === 'team1') {
            frameData.team1.push(object); 
        } else if (object.type === 'team2') {
            frameData.team2 = object;
        }
    });

    if (frameData.ball) {
        let closestDistance = Infinity;
        frameData.team1.forEach(player => {
            const distance = calculateDistance(
                player.x + player.width / 2, player.y + player.height / 2,
                frameData.ball.x + frameData.ball.width / 2, frameData.ball.y + frameData.ball.height / 2
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                frameData.playerInPossession = player; // Directly mark the player in possession
            }
        });
    }

    return frameData;
}

// Function to determine if a player is offside based on the current frame data
function isPlayerOffside(frameData) {
    const playerInPossession = frameData.playerInPossession;
    const defender = frameData.team2;
    const ball = frameData.ball;

    if (!playerInPossession || !defender || !ball) {
        console.error("Required entities (player, defender, or ball) are missing.");
        return false;
    }

    // Convert positions to the middle of each entity for comparison
    const ballX = ball.x + ball.width / 2;
    const playerX = playerInPossession.x + playerInPossession.width / 2;
    const defenderX = defender.x + defender.width / 2;

    // Apply offside rule: player is nearer to the opponent's goal line than both the ball and the second-last opponent
    return playerX > ballX && playerX > defenderX;
}

// Main function to process the images and analyze offside positions
async function processImagesAndAnalyzeOffside(imagePaths, squareSize = 10) {
    for (const imagePath of imagePaths) {
        const image = await readImage(imagePath);
        const gridClassification = createGridClassification(image, squareSize);
        const playersAndObjects = detectPlayersAndObjects(gridClassification, squareSize);
        const frameData = extractFrameData(playersAndObjects);

        const isOffside = isPlayerOffside(frameData);
        console.log(`${imagePath}: Offside Detected = ${isOffside}`);
    }
}

// Execute the sequence processing
processImagesAndAnalyzeOffside(imageFilePaths, 10)
    .then(() => console.log("Completed processing images."))
    .catch(error => console.error("An error occurred:", error));
