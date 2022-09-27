# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import touca
import flowers
from pathlib import Path


def get_testcases():
    for file in Path("images").glob("*.jpg"):
        yield file.stem


@touca.workflow(testcases=get_testcases)
def test_flowers(testcase: str):
    src_file = Path("images").joinpath(testcase).with_suffix(".jpg")
    dst_file = Path("out").joinpath(testcase).with_suffix(".jpg")
    flowers.process_image(src_file, dst_file)
    touca.check_file("input_file", src_file)
    touca.check_file("output_file", dst_file)
