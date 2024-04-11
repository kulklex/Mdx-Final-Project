// Import necessary modules
import { PNG } from 'pngjs';
import fs from 'fs';


const imageFilePath = './Data/images/Artificial-3g-pitch.png';

// Define target colors for player1, player2, and the ball with their RGB values and labels
const targetColors = [
    { r: 136, g: 0, b: 22, label: "player1" },  // Red
    { r: 254, g: 242, b: 1, label: "player2" }, // Yellow
    { r: 164, g: 76, b: 163, label: "ball" }    // Purple
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


function quantizeColor(color) {
    // Divide RGB values by 32 and round to get more accurate result
    return {
        r: Math.round(color.r / 32),
        g: Math.round(color.g / 32),
        b: Math.round(color.b / 32)
    };
}

// Function to classify cells in the image based on their average color compared to target colors
function classifyColors(image, squareSize, targetColors) {
    const classificationMap = new Map();
    
    // Quantize target colors for comparison
    const quantizedTargets = targetColors.map(color => ({
        ...color,
        ...quantizeColor(color)
    }));

    // Loop through the image in a grid pattern
    for (let y = 0; y < image.height; y += squareSize) {
        for (let x = 0; x < image.width; x += squareSize) {
            const cellColor = calculateCellAverageColor(image, x, y, squareSize, squareSize);
            const quantizedCellColor = quantizeColor(cellColor);
            
            // Compare the cell's color to each target color
            quantizedTargets.forEach((targetColor) => {
                if (quantizedCellColor.r === targetColor.r && 
                    quantizedCellColor.g === targetColor.g && 
                    quantizedCellColor.b === targetColor.b) {
                    // If a match is found, add the cell's position to the classification map under the appropriate label
                    if (!classificationMap.has(targetColor.label)) {
                        classificationMap.set(targetColor.label, []);
                    }
                    classificationMap.get(targetColor.label).push({ x, y });
                }
            });
        }
    }
    
    return classificationMap
}

// Main function to process the image and classify parts of it based on target colors
async function processImage(filePath, squareSize = 10) {
    try {
        const image = await readImage(filePath)
        const classificationMap = classifyColors(image, squareSize, targetColors) // Classify colors in the image
        
        // Log the classification results for each label
        classificationMap.forEach((positions, label) => {
            console.log(`${label} positions:`, positions)
        });
    } catch (error) {
        console.error('Error processing image:', error)
    }
}

processImage(imageFilePath)
