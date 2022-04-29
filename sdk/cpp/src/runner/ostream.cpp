// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/detail/helpers.hpp"

namespace touca {
OutputCapturer::OutputCapturer() {}

OutputCapturer::~OutputCapturer() {
  if (_capturing) {
    stop_capture();
  }
}

void OutputCapturer::start_capture() {
  _buferr.str("");
  _buferr.clear();
  _err = std::cerr.rdbuf(_buferr.rdbuf());

  _bufout.str("");
  _bufout.clear();
  _out = std::cout.rdbuf(_bufout.rdbuf());

  _capturing = true;
}

void OutputCapturer::stop_capture() {
  std::cerr.rdbuf(_err);
  std::cout.rdbuf(_out);
  _capturing = false;
}

std::string OutputCapturer::cerr() const { return _buferr.str(); }

std::string OutputCapturer::cout() const { return _bufout.str(); }
}  // namespace touca
