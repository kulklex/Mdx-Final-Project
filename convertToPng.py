from PIL import Image

# Open the PPM image
image = Image.open('./Data/output/player.ppm')

# Save the image in PNG format
image.save('./Data/output/output.png')
