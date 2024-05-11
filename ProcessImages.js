// Import necessary modules
import { PNG } from 'pngjs';
import fs from 'fs';
import Jimp from 'jimp';


// Images for each target
const referenceImagePaths = {
    team1: './Data/evaluation/player3.png',
    team2: './Data/evaluation/player2.png',
    ball: './Data/evaluation/ball.png'
};

// Function to calculate the average RGB color of an image
async function calculateAverageRGB(imagePath) {
    const image = await Jimp.read(imagePath);
    let r = 0, g = 0, b = 0;
    let count = 0;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        r += this.bitmap.data[idx + 0];
        g += this.bitmap.data[idx + 1];
        b += this.bitmap.data[idx + 2];
        count++;
    });

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    return { r, g, b };
}


// Function to dynamically set target colors based on average colors from reference images
async function setTargetColors() {
    const colors = {};
    for (const key in referenceImagePaths) {
        const color = await calculateAverageRGB(referenceImagePaths[key]);
        colors[key] = { ...color, label: key };
    }
    return colors;
}


// Define the sequence of image file paths
const imageFilePaths = [
    './Data/evaluation/caseH.png',
    './Data/evaluation/caseC.png'
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
    // Reduce the color space by dividing the RGB values by 32 and rounding the result
    return { r: Math.round(color.r / 32), g: Math.round(color.g / 32), b: Math.round(color.b / 32) };
};


// Calculates the average color within a cell of the image
function calculateCellAverageColor(image, cellX, cellY, cellWidth, cellHeight) {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    // Accumulate color values and count pixels within the specified cell
    for (let dy = 0; dy < cellHeight; dy++) {
        for (let dx = 0; dx < cellWidth; dx++) {
            let idx = ((cellY + dy) * image.width + (cellX + dx)) << 2;
            rSum += image.data[idx];
            gSum += image.data[idx + 1];
            bSum += image.data[idx + 2];
            count++;
        }
    }
    // Return the average color of the cell
    return { r: rSum / count, g: gSum / count, b: bSum / count };
};

// Function to create a classification grid for the image based on target colors
function createGridClassification(image, squareSize, targetColors) {
    const rows = Math.ceil(image.height / squareSize);
    const cols = Math.ceil(image.width / squareSize);
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "none"));
   

    // Classify each cell in the grid based on the quantized color matches
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
    // Return the classified grid
    return grid;
}

// Function to detect players, the ball, and calculate bounding boxes for each identified entity
function detectPlayersAndObjects(gridClassification, squareSize) {
    const visited = gridClassification.map(row => row.map(() => false));
    
    // Store detected players and objects
    const playersAndObjects = [];

    // Define directions for depth-first search
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];

    // Depth-first search to identify contiguous regions of the same label
    function dfs(x, y, label) {
        if (x < 0 || y < 0 || x >= gridClassification.length || y >= gridClassification[0].length || visited[x][y] || gridClassification[x][y] !== label) {
            return null; // Exit condition for recursion
        }
        
        visited[x][y] = true;
        // Initialize bounding box for the current region
        let bounds = { minX: x, minY: y, maxX: x, maxY: y };
        directions.forEach(([dx, dy]) => {
            const next = dfs(x + dx, y + dy, label);
            if (next) {
                // Update bounding box to include the adjacent cell
                bounds.minX = Math.min(bounds.minX, next.minX);
                bounds.minY = Math.min(bounds.minY, next.minY);
                bounds.maxX = Math.max(bounds.maxX, next.maxX);
                bounds.maxY = Math.max(bounds.maxY, next.maxY);
            }
        });
        return bounds;
    }

    // Iterate over the grid to detect and classify all entities
    for (let i = 0; i < gridClassification.length; i++) {
        for (let j = 0; j < gridClassification[i].length; j++) {
            if (!visited[i][j] && gridClassification[i][j] !== 'none') {
                const bounds = dfs(i, j, gridClassification[i][j]);
                if (bounds) {
                    // Create an object for the detected entity with its bounding box
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
    console.log("Players and Objects Results: ", playersAndObjects)
    // Return the list of detected players and objects
    return playersAndObjects;
}

// Utility function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    // Use the Pythagorean theorem to calculate the distance
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Function to extract frame data, including identifying the player closest to the ball and the first attacking player
function extractFrameData(playersAndObjects) {
    let frameData = { team1: [], team2: null, ball: null, playerInPossession: null, };
    

    // Extract player positions and the ball from the detected objects
     playersAndObjects.forEach(object => {
        switch (object.type) {
            case 'team1':
                frameData.team1.push({ ...object, firstAttackingPlayer: false });
                break;
            case 'team2':
                frameData.team2 = object;
                break;
            case 'ball':
                frameData.ball = object;
                break;
        }
    });


    // Determine which team1 player is closest to the ball
    if (frameData.ball) {
        let closestDistance = Infinity;
        frameData.team1.forEach(player => {
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const ballCenterX = frameData.ball.x + frameData.ball.width / 2;
            const ballCenterY = frameData.ball.y + frameData.ball.height / 2;

            const distance = calculateDistance(playerCenterX, playerCenterY, ballCenterX, ballCenterY);
            if (distance < closestDistance) {
                closestDistance = distance;
                frameData.playerInPossession = player;
            }
        });
    }

    // Logic to identify the first attacking player based on the highest height and width
    if (frameData.team1.length > 0) {
        let maxArea = 0;
        let indexMaxArea = -1;
        frameData.team1.forEach((player, index) => {
            let area = player.height * player.width;
            if (area > maxArea) {
                maxArea = area;
                indexMaxArea = index;
            }
        });

        // Mark the identified player as the first attacking player
        if (indexMaxArea !== -1) {
            frameData.team1[indexMaxArea].firstAttackingPlayer = true;
        }
    }
    return frameData;
}


async function processImageAndAnalyzeOffside(filePath, squareSize) {
    // Incorporating dynamic target colors into the grid classification function
    const targetColors = await setTargetColors();

    // Convert these colors using the quantizeColor function and continue with the rest of the processing
    const quantizedTargetColors = Object.values(targetColors).map(color => ({
        ...color,
        ...quantizeColor(color)
    }));

    // Read and parse the image.
    const image = await readImage(filePath);

    // Create a grid classification of the image.
    // This function divides the image into a grid and classifies each cell based on the target colors.
    const gridClassification = createGridClassification(image, squareSize, quantizedTargetColors);

    // Detect players and the ball based on the grid classification.
    // This function identifies contiguous areas of the same classification and interprets them as objects.
    const playersAndObjects = detectPlayersAndObjects(gridClassification, squareSize);

    // Extract meaningful frame data for offside analysis.
    // Now, extractFrameData would organize this information, determining possession among other details.
    const frameData = extractFrameData(playersAndObjects);

    return frameData;
}



// Function to determine if a player is offside based on the current frame data
function compareFramesForOffside(previousFrameData, currentFrameData) {
    // Initialize variables to identify the player with the ball in the previous frame
    let playerWithBallPreviousFrame;
    let smallestDistancePreviousFrame = Infinity; // Used to find the closest player to the ball in the previous frame

    // Iterate through all team1 players to find who was closest to the ball in the previous frame
    previousFrameData.team1.forEach(player => {
        const distance = calculateDistance(
            player.x + player.width / 2, player.y + player.height / 2, // Player's center position
            previousFrameData.ball.x + previousFrameData.ball.width / 2, previousFrameData.ball.y + previousFrameData.ball.height / 2 // Ball's center position
        );

        // Update if this player is closer to the ball than any previously checked player
        if (distance < smallestDistancePreviousFrame) {
            smallestDistancePreviousFrame = distance;
            playerWithBallPreviousFrame = player;
        }
    });

    // Repeat the process for the current frame to identify the player currently closest to the ball
    let playerWithBallCurrentFrame;
    let smallestDistanceCurrentFrame = Infinity;

    currentFrameData.team1.forEach(player => {
        const distance = calculateDistance(
            player.x + player.width / 2, player.y + player.height / 2, 
            currentFrameData.ball.x + currentFrameData.ball.width / 2, currentFrameData.ball.y + currentFrameData.ball.height / 2 // Ball's center position
        );

        // Update if this player is closer to the ball than any previously checked player
        if (distance < smallestDistanceCurrentFrame) {
            smallestDistanceCurrentFrame = distance;
            playerWithBallCurrentFrame = player;
        }
    });
    
    // Calculate the x-position of the team2 (defender) player
    const defenderX = currentFrameData.team2.x + currentFrameData.team2.width / 2;
    
    // Extract the X positions for relevant entities.
    const previousPlayerX = playerWithBallPreviousFrame.x + playerWithBallPreviousFrame.width / 2;
    const currentPlayerX = playerWithBallCurrentFrame.x + playerWithBallCurrentFrame.width / 2;
    const ballXAtPass = previousFrameData.ball.x + previousFrameData.ball.width / 2; // Position of the ball in the previous frame
    const ballXAfterPass = currentFrameData.ball.x + currentFrameData.ball.width / 2; // Position of the ball in the current frame
    

    // Identify if the player in possession is the first attacking player in each frame
    const playerInPossessionPreviousFrame =  previousFrameData.playerInPossession.firstAttackingPlayer;
    const playerInPossessionCurrentFrame =  currentFrameData.playerInPossession.firstAttackingPlayer;

    console.log("Player in possession Frame 1: ", playerInPossessionPreviousFrame)
    console.log("\nPlayer in possession Frame 2: ", playerInPossessionCurrentFrame)   

    // If the same player retains possession from the previous frame to the current frame.
    if (playerInPossessionPreviousFrame === playerInPossessionCurrentFrame) {
        console.log("Same player retains the possession from the previous frame")
        return false
    } else {
        // If there's a new player in possession, indicating a pass.
        console.log("New player has possession in current frame")
        // It's offside if the second attacking player receives the ball and is ahead of the last defender
        if (previousPlayerX <= ballXAtPass && currentPlayerX >= ballXAtPass) {  
            return true;
        }
    }

    return false; // Defaults to not offside if none of the specific conditions are met.
}



async function analyzeOffsideScenarios(imageFilePaths, squareSize = 10) {
    if (imageFilePaths.length != 2) {
        console.error("This analysis requires exactly two images.");
        return;
    }

    // Process the first image to establish the baseline positions
    const initialFrameData = await processImageAndAnalyzeOffside(imageFilePaths[0], squareSize);
    console.log("Frame 1 result: ", initialFrameData)

    // Process the second image for offside analysis
    const finalFrameData = await processImageAndAnalyzeOffside(imageFilePaths[1], squareSize);
    console.log("\n\nFrame 2 result: ", finalFrameData);

    // Now, determine offside based on the comparison between the initial and final frames
    const isOffside = compareFramesForOffside(initialFrameData, finalFrameData);
    console.log(`Offside detected in the transition from the first to the second image: ${isOffside}`);
}



analyzeOffsideScenarios(imageFilePaths)
    .then(() => console.log("Completed offside analysis."))
    .catch(error => console.error("An error occurred during analysis:", error));



