# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from PIL import Image
from pathlib import Path


def process_image(src_file: Path, dst_file: Path) -> Image:
    image = Image.open(src_file)
    image_data = image.load()
    height, width = image.size
    for row in range(height):
        for col in range(width):
            _, g, b = image_data[row, col]
            image_data[row, col] = _, g, b
    save_image(image, dst_file)


def save_image(image: Image, dst_file: Path) -> None:
    if os.path.exists(dst_file):
        os.remove(dst_file)
    if not os.path.exists(os.path.dirname(dst_file)):
        os.makedirs(os.path.dirname(dst_file))
    image.save(dst_file)
