import { PNG } from 'pngjs';
import fs from 'fs';

const imageFilePath = './Data/images/Artificial-3g-pitch.png';

// Assuming we can identify the ball, team players, and defenders by unique colors
const targetColors = [
    { r: 136, g: 0, b: 22, label: "attacker" },  // Example: Red for attackers
    { r: 254, g: 242, b: 1, label: "defender" },  // Example: Blue for defenders
    { r: 164, g: 76, b: 163, label: "ball" }     // Example: Yellow for the ball
];

// Function to asynchronously read an image file and parse it into a PNG object
function readImage(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(new PNG())
            .on('parsed', function() {
                resolve(this) 
            })
            .on('error', reject)
    });
}

// Function to calculate the average RGB values of a specific cell (or square) in the image
function calculateCellAverageColor(image, cellX, cellY, cellWidth, cellHeight) {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    // Loop through each pixel in the cell to accumulate RGB values
    for (let dy = 0; dy < cellHeight; dy++) {
        for (let dx = 0; dx < cellWidth; dx++) {
            let idx = ((cellY + dy) * image.width + (cellX + dx)) << 2; // Calculate index in the RGBA array
            rSum += image.data[idx];     // Red
            gSum += image.data[idx + 1]; // Green
            bSum += image.data[idx + 2]; // Blue
            count++;
        }
    }
    // Return the average RGB values for the cell
    return {
        r: rSum / count,
        g: gSum / count,
        b: bSum / count
    };
}

function classifyObjects(image, squareSize) {
    let objectsMap = { attackers: [], defenders: [], ball: null };

    for (let y = 0; y < image.height; y += squareSize) {
        for (let x = 0; x < image.width; x += squareSize) {
            const cellColor = calculateCellAverageColor(image, x, y, squareSize, squareSize);
            
            targetColors.forEach(targetColor => {
                if (Math.abs(cellColor.r - targetColor.r) < 10 &&
                    Math.abs(cellColor.g - targetColor.g) < 10 &&
                    Math.abs(cellColor.b - targetColor.b) < 10) {
                    if (targetColor.label === "ball") {
                        objectsMap.ball = { x, y };
                    } else {
                        objectsMap[targetColor.label + 's'].push({ x, y });
                    }
                }
            });
        }
    }

    return objectsMap;
}

function detectOffside(objectsMap) {
    if (!objectsMap.ball) {
        console.log("Ball not found.");
        return;
    }

    // Simplification: the second-last defender's position is approximated by finding the defender closest to the goal line.
    const secondLastDefenderY = objectsMap.defenders.sort((a, b) => b.y - a.y)[1]?.y;
    if (secondLastDefenderY === undefined) {
        console.log("Defenders not found or insufficient data.");
        return;
    }

    // Check if any attacker is closer to the goal line than the second-last defender at the moment the ball is played
    const offsideAttackers = objectsMap.attackers.filter(attacker => attacker.y > secondLastDefenderY);

    offsideAttackers.forEach(offsideAttacker => {
        console.log(`Offside attacker found at position: (${offsideAttacker.x}, ${offsideAttacker.y})`);
    });

    if (offsideAttackers.length === 0) {
        console.log("No offside attackers detected.");
    }
}

async function processImage(filePath, squareSize = 10) {
    try {
        const image = await readImage(filePath);
        const objectsMap = classifyObjects(image, squareSize);
        detectOffside(objectsMap);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processImage(imageFilePath);
