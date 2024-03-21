import { PNG } from 'pngjs';
import fs from 'fs';

// Replace 'path/to/image.png' with the path to your PNG image
const imageFilePath = './Data/images/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.png';

// Simulated label data for the part of the image you're interested in
// These should be actual values based on your application's needs
const cropArea = { x: 100, y: 50, width: 200, height: 150 }; // Example crop area

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

function cropAndAnalyzeImage(image, cropArea) {
    let { x, y, width, height } = cropArea;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            let idx = ((y + dy) * image.width + (x + dx)) << 2;
            rSum += image.data[idx];
            gSum += image.data[idx + 1];
            bSum += image.data[idx + 2];
            count++;
        }
    }

    let averageColor = {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count)
    };

    return averageColor;
}

async function processImage(filePath, cropArea) {
    try {
        const image = await readImage(filePath);
        const averageColor = cropAndAnalyzeImage(image, cropArea);
        console.log('Average Color:', averageColor);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processImage(imageFilePath, cropArea);
