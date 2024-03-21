import { PNG } from 'pngjs';
import fs from 'fs';

// Replace 'path/to/image.png' with the path to your PNG image
const imageFilePath = 'path/to/image.png';
const outputFilePath = 'path/to/output.png'; // Path to save the cropped image

// Simulated label data for the part of the image you're interested in
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

function saveCroppedImage(image, cropArea, outputFilePath) {
    let { x, y, width, height } = cropArea;
    const croppedImage = new PNG({ width, height });

    PNG.bitblt(image, croppedImage, x, y, width, height, 0, 0);
    croppedImage.pack().pipe(fs.createWriteStream(outputFilePath));
}

async function processAndSaveCroppedImage(filePath, cropArea, outputFilePath) {
    try {
        const image = await readImage(filePath);
        saveCroppedImage(image, cropArea, outputFilePath);
        console.log('Cropped image saved to:', outputFilePath);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processAndSaveCroppedImage(imageFilePath, cropArea, outputFilePath);
