# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import hashlib
import touca
from flowers import process_image


def get_testcases():
    from pathlib import Path

    for file in Path("images").glob("*.jpg"):
        yield file.stem


@touca.workflow(testcases=get_testcases)
def test_flowers(testcase: str):
    src_file = f"images/{testcase}.jpg"
    dst_file = f"output/{testcase}.jpg"
    process_image(src_file, dst_file)
    image_hash = hashlib.sha256(open(dst_file, "rb").read()).hexdigest()
    touca.check("image_hash", image_hash)
