# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import hashlib
import touca
from code_under_test import process_image


@touca.Workflow
def test_flowers(testcase: str):
    src_file = f"images/{testcase}.jpg"
    dst_file = f"output/{testcase}.jpg"
    process_image(src_file, dst_file)
    image_hash = hashlib.sha256(open(dst_file, "rb").read()).hexdigest()
    touca.add_result("image_hash", image_hash)


if __name__ == "__main__":
    touca.run()
