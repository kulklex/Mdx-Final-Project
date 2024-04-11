import { PNG } from 'pngjs';
import fs from 'fs';

const imageFilePath = './Data/images/Artificial-3g-pitch.png';

// Target average colors previously calculated
const targetColors = [
    { r: 136, g: 0, b: 22 }, // Target color red as 1
    { r: 254, g: 242, b: 1 }, // Target color yellow as 2
    { r: 164, g: 76, b: 163 } // Target color ball as 3
];
const threshold = 60; // Distance threshold for color matching

// Function to read an image file and return a PNG object
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

// Function to calculate the average color of a specific cell
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

// Function to compare two colors and return the Euclidean distance
function compareColors(color1, color2) {
    return Math.sqrt(
        Math.pow(color2.r - color1.r, 2) +
        Math.pow(color2.g - color1.g, 2) +
        Math.pow(color2.b - color1.b, 2)
    );
}

// Main function to process the image
async function processImage(filePath) {
    try {
        const image = await readImage(filePath);
        const cellWidth = 10; // Define cell width
        const cellHeight = 10; // Define cell height

        // Loop through the image in a grid pattern
        for (let y = 0; y < image.height; y += cellHeight) {
            for (let x = 0; x < image.width; x += cellWidth) {
                const cellColor = calculateCellAverageColor(image, x, y, cellWidth, cellHeight);

                // Compare the cell's average color to each target color
                targetColors.forEach((targetColor, index) => {
                    const distance = compareColors(cellColor, targetColor);
                    if (distance < threshold) {
                        console.log(`Cell at (${x},${y}) matches target color ${index + 1} with distance: ${distance}`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processImage(imageFilePath);
