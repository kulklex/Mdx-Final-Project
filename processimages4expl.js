// Import necessary modules: PNG for working with PNG images, fs for filesystem operations
import { PNG } from 'pngjs';
import fs from 'fs';

// Path to the input image file
const imageFilePath = './Data/images/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.png';
// Path where the cropped image will be saved
const outputFilePath = './Data/output/process4.png';

// Define the area of the image that you want to crop
// x and y define the top-left corner of the crop area, while width and height define its dimensions
const cropArea = { x: 100, y: 50, width: 200, height: 150 };

// Function to read and parse a PNG image from a file path
function readImage(filePath) {
    // Return a new promise that resolves with the image data or rejects with an error
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Create a readable stream for the file
            .pipe(new PNG()) // Pipe it through PNG to parse the PNG data
            .on('parsed', function() { // Once parsing is complete, the 'parsed' event is fired
                resolve(this); // Resolve the promise with the PNG instance containing the image data
            })
            .on('error', reject); // If an error occurs, reject the promise
    });
}

// Function to save a cropped portion of the image to a new file
function saveCroppedImage(image, cropArea, outputFilePath) {
    let { x, y, width, height } = cropArea; // Destructure the crop area dimensions
    const croppedImage = new PNG({ width, height }); // Create a new PNG instance for the cropped image

    // Copy the specified area from the original image to the new cropped image instance
    PNG.bitblt(image, croppedImage, x, y, width, height, 0, 0);
    // Pack the cropped image data into a PNG format and write it to the output file path
    croppedImage.pack().pipe(fs.createWriteStream(outputFilePath));
}

// Asynchronously processes an image file by cropping a specified area and saving the result
async function processAndSaveCroppedImage(filePath, cropArea, outputFilePath) {
    try {
        const image = await readImage(filePath); // Read and parse the original image
        saveCroppedImage(image, cropArea, outputFilePath); // Crop and save the specified area of the image
        console.log('Cropped image saved to:', outputFilePath); // Log success message
    } catch (error) {
        console.error('Error processing image:', error); // Log any errors that occur
    }
}

// Execute the cropping and saving process with the specified parameters
processAndSaveCroppedImage(imageFilePath, cropArea, outputFilePath);
