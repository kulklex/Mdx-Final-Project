//Data set: https://universe.roboflow.com/models/object-detection

// Note: To convert to normalized xywh from pixel values, divide x (and width) by the image's width and divide y (and height) by the image's height.

import readJPG from 'read-jpg';
import * as fs from "node:fs/promises";
import toab from "toab";
import { PNG } from 'pngjs';

//Number for player label
const PLAYER = 3;

//Reads jpg file - adapted from the read-jpg page.
async function readImage(fileName){
    const buffer = await fs.readFile(fileName);
    const arrayBuffer = await toab(buffer);
    const image = await readJPG({
        data: arrayBuffer,
        debug: false
    });
    console.log(`Image size: w:${image.width}; h:${image.height};`);
    return image;
}

/* Each label is four numbers x, y width and height
    expressed as percentages of the total width and height */
async function processPlayers(imageFileName, labelFileName){
    //Read image file
    //Each pixel has four values RGB and A (transparency)
    const image = await readImage(imageFileName);

    //Convert 1D array of pixels to three dimensions to make it easier to process.
    const pixels3D = get3DArray(image);
    // await savePng(pixels3D);//Worth doing a test on this

    //Read contents of label file
    const fileContents = await fs.readFile(labelFileName, 'utf8');

    //Split into individual lines
    const labels= fileContents.split('\n');

    //Work through line by line looking for players
    const playerLabels = [];//Add revised player labels here when you have found the two teams.
    for(let label of labels){
        if(label.charAt(0) == PLAYER){
            //Get array with x, y, width and height
            const xywh = label.substring(2, label.length).split(' ');

            //Convert to pixel values 
            //Note that x + width can be greater than total image width
            const xStart = Math.round(xywh[0] * image.width);
            const yStart = Math.round(xywh[1] * image.height);
            const width = Math.round(xywh[2] * image.width);
            const height = Math.round(xywh[3] * image.height);
            console.log(`Pixel coordinates: x:${xStart}; y:${yStart}; w:${width}; h:${height}`);

            //Get pixel values in selected area
            const selectedPixels = [];
            for(let y=yStart; y < yStart+height && y < image.height; ++y){
                selectedPixels.push([]);//New array for the row
                for(let x=xStart; x < xStart+width && x < image.width; ++x){
                    selectedPixels[y-yStart].push(pixels3D[y][x]);
                }
            }
            
            //Try to see if there a red player?
            let [rAv, gAv, bAv, aAv] = getAverages(selectedPixels);
            console.log(`rAv:${rAv}; gAv:${gAv}; bAv:${bAv}; aAv:${aAv}`);
            if(rAv > gAv && rAv > bAv){
                //Fix this method to see if the pixels are correct
                await savePng(selectedPixels);
            }
        }
    }
}

//Converts 1D array of pixels to 3D array - height, width and RGBA
function get3DArray(image){
    //Convert to 3D array
    const imagePixels = [];
    for(let y=0; y<image.height; ++y){//Work through each row
        imagePixels.push([]);//New array for the row
        for(let x=0; x<image.width * 4; x += 4){//Work through pixels on each row
            //Store third array with RGBA values.
            imagePixels[y].push([image.pixels[x], image.pixels[x+1], image.pixels[x+2], image.pixels[x+3]]);
        }
    }
    return imagePixels;
}

//Returns the average red, green, blue and alpha for the pixels
function getAverages(pixels3D){
    let rAv=0, gAv=0, bAv=0, aAv=0, cntr=0;
    for(let y=0; y<pixels3D.length; ++y){
        for(let x=0; x<pixels3D[y].length; ++x){
            rAv += pixels3D[y][x][0];
            gAv += pixels3D[y][x][1];
            bAv += pixels3D[y][x][2];
            aAv += pixels3D[y][x][3];
            ++cntr;
        }
    }
    return [rAv/cntr, gAv/cntr, bAv/cntr, aAv/cntr];
}

// Saves the 3D array of pixels to a PNG file
// Adapted from https://github.com/Lellansin/node-pnglib
// #FIXME# DOES NOT WORK!
// async function savePng(pixels3D){
//     //Add pixels to PNG - this part breaks with 'node-pnglib: depth is not enough, set up it for more'
//     let png = new PNGlib(pixels3D[0].length, pixels3D.length, 24);
//     for(let y=0; y<pixels3D.length; ++y){
//         for(let x=0; x<pixels3D[y].length; ++x){
//             png.setPixel(x, y, `rgb(${pixels3D[y][x][0]}, ${pixels3D[y][x][1]}, ${pixels3D[y][x][2]})` );
//         }
//     }
//     //Save PNG file
//     await fs.writeFile('./Data/output/player.png', png.getBuffer());
// }

async function savePng(pixels3D) {
    // Create a new PNG
    const png = new PNG({
        width: pixels3D[0].length,
        height: pixels3D.length,
        filterType: -1, // No filtering
    });

    // Fill the PNG with your pixel data
    for (let y = 0; y < pixels3D.length; y++) {
        for (let x = 0; x < pixels3D[y].length; x++) {
            const idx = (png.width * y + x) << 2; // << 2 is equivalent to * 4
            const pixel = pixels3D[y][x];
            png.data[idx] = pixel[0]; // Red
            png.data[idx + 1] = pixel[1]; // Green
            png.data[idx + 2] = pixel[2]; // Blue
            png.data[idx + 3] = pixel[3]; // Alpha
        }
    }

    // Convert PNG to buffer and save
    png.pack().pipe(fs.createWriteStream('./Data/output/player.png'));
}

//Converts RGBA to hex color, for example, #330fa3
//Might not be needed if the rgb(23,33,55) method works
function getHex(rVal, gVal, bVal){
    let rHex = rVal.toString(16);
    if (rHex.length === 1)
        rHex = "0" + rHex;
    let gHex = gVal.toString(16);
    if (gHex.length === 1)
        gHex = "0" + gHex;
    let bHex = bVal.toString(16);
    if (bHex.length === 1)
        bHex = "0" + bHex;
    const finalHex = "#" + rHex + bHex + gHex;
    //console.log(finalHex);
    return finalHex;
}

//Should test these separately
savePng();
//console.log(getHex(33, 255, 12));

//Calls main method to process players and labels
processPlayers("./Data/images/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.png", "Data/labels/Full-Match-PERSIJA_Jakarta_VS_PSS_Sleman_frame14760_png.rf.ca72912b733ecf834bf43aaed0a56d2a.txt");