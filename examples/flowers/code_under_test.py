import os
from PIL import Image


def process_image(src_file: str, dst_file: str):
    if os.path.exists(dst_file):
        os.remove(dst_file)
    if not os.path.exists(os.path.dirname(dst_file)):
        os.makedirs(os.path.dirname(dst_file))

    image = Image.open(src_file)
    image_data = image.load()
    height, width = image.size
    for row in range(height):
        for col in range(width):
            _, g, b = image_data[row, col]
            image_data[row, col] = 0, g, b
    image.save(dst_file)
