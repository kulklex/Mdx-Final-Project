import Jimp from 'jimp';
import { promises as fs } from 'fs';

// Constants for demonstration
const PLAYER_LABEL = 3; 
const imageFileName = "./Data/images/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.png";
const labelFileName = "./Data/labels/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.txt";


async function readLabels(fileName) {
    const content = await fs.readFile(fileName, 'utf8');
    return content.split('\n').map(line => {
        const parts = line.split(' ').map(parseFloat);
        return { type: parts[0], x: parts[1], y: parts[2], width: parts[3], height: parts[4] };
    }).filter(label => label.type === PLAYER_LABEL);
}

async function calculateAverageColor(image) {
    let total = { r: 0, g: 0, b: 0, count: 0 };
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        total.r += this.bitmap.data[idx + 0];
        total.g += this.bitmap.data[idx + 1];
        total.b += this.bitmap.data[idx + 2];
        total.count++;
    });

    return {
        r: Math.round(total.r / total.count),
        g: Math.round(total.g / total.count),
        b: Math.round(total.b / total.count)
    };
}

async function processImage(imagePath, labels) {
    const image = await Jimp.read(imagePath);

    for (const [index, label] of labels.entries()) {
        let { x, y, width: w, height: h } = label;
        // Convert normalized coordinates to pixels
        x = Math.round(x * image.bitmap.width);
        y = Math.round(y * image.bitmap.height);
        w = Math.round(w * image.bitmap.width);
        h = Math.round(h * image.bitmap.height);

        // Ensure the coordinates and dimensions are valid
        if (w <= 0 || h <= 0) {
            console.error(`Invalid extraction area for label index ${index}: width and/or height are non-positive.`);
            continue;
        }

        // Crop the image to the specified area
        const croppedImage = image.clone().crop(x, y, w, h);

        // Calculate the average color
        const avgColor = await calculateAverageColor(croppedImage);

        // Save the cropped image
        await croppedImage.writeAsync(`output/player_${index}.png`);

        console.log(`Average color for player ${index}:`, avgColor);
    }
}

async function main() {
    try {
        const labels = await readLabels(labelFileName);
        await processImage(imageFileName, labels);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

main();
