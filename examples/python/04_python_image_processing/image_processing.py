# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
from pathlib import Path

from PIL import Image


def process_image(src_file: Path) -> Image:
    image = Image.open(src_file)
    image_data = image.load()
    height, width = image.size
    for row in range(height):
        for col in range(width):
            r, g, b = image_data[row, col]
            image_data[row, col] = 0, g, b
    return image


def save_image(image: Image, dst_file: Path) -> None:
    if os.path.exists(dst_file):
        os.remove(dst_file)
    if not os.path.exists(os.path.dirname(dst_file)):
        os.makedirs(os.path.dirname(dst_file))
    image.save(dst_file)
