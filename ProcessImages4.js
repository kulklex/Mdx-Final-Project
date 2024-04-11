import { PNG } from 'pngjs';
import fs from 'fs';


const imageFilePath = './Data/images/Artificial-ball-pitch.png';
const outputFilePath = './Data/output/process_BALL.png';

// Simulated label data for the part of the image you're interested in
const cropArea = { x: 10, y: 10, width: 20, height: 25 }; // Example crop area

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

function analyzeImage(image, cropArea) {
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

    console.log("height: ", image.height)
    console.log("width: ", image.width)
    let averageColor = {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count)
    };

    return averageColor;
}

function saveCroppedImage(image, cropArea, outputFilePath) {
    let { x, y, width, height } = cropArea;
    const croppedImage = new PNG({ width, height });

    PNG.bitblt(image, croppedImage, x, y, width, height, 0, 0);
    croppedImage.pack().pipe(fs.createWriteStream(outputFilePath));
}

async function processAndSaveCroppedImage(filePath, cropArea, outputFilePath) {
    try {
        const image = await readImage(filePath);
        const averageColor = analyzeImage(image, cropArea);
        console.log('Average Color:', averageColor);
        saveCroppedImage(image, cropArea, outputFilePath);
        console.log('Cropped image saved to:', outputFilePath);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processAndSaveCroppedImage(imageFilePath, cropArea, outputFilePath);
