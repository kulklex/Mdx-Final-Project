import Jimp from "jimp";

async function calculateAverageRGB(imagePath) {
    try {
        const image = await Jimp.read(imagePath);
        let r = 0, g = 0, b = 0;
        let count = 0;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            // idx is the index of the pixel in the bitmap array
            r += this.bitmap.data[idx + 0];
            g += this.bitmap.data[idx + 1];
            b += this.bitmap.data[idx + 2];
            count++;
        });

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        console.log(`Average RGB: (${r}, ${g}, ${b})`);
    } catch (err) {
        console.error(err);
    }
}

// calculateAverageRGB('./Data/images/scenario-red.png');
// calculateAverageRGB('./Data/images/scenario-yellow.png');
calculateAverageRGB('./Data/images/scenario-blue.png');