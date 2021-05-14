/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/framework/detail/utils.hpp"

/**
 *
 */
OutputCapturer::OutputCapturer()
{
}

/**
 *
 */
OutputCapturer::~OutputCapturer()
{
    if (_capturing) {
        stop_capture();
    }
}

/**
 *
 */
void OutputCapturer::start_capture()
{
    _buferr.str("");
    _buferr.clear();
    _err = std::cerr.rdbuf(_buferr.rdbuf());

    _bufout.str("");
    _bufout.clear();
    _out = std::cout.rdbuf(_bufout.rdbuf());

    _capturing = true;
}

/**
 *
 */
void OutputCapturer::stop_capture()
{
    std::cerr.rdbuf(_err);
    std::cout.rdbuf(_out);
    _capturing = false;
}

/**
 *
 */
std::string OutputCapturer::cerr() const
{
    return _buferr.str();
}

/**
 *
 */
std::string OutputCapturer::cout() const
{
    return _bufout.str();
}
