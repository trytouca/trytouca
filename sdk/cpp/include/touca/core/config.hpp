// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#define TOUCA_VERSION_MAJOR 1
#define TOUCA_VERSION_MINOR 5
#define TOUCA_VERSION_PATCH 2
#define TOUCA_VERSION 10502

#if !defined(TOUCA_HAS_CPP20) && !defined(TOUCA_HAS_CPP17) && \
    !defined(TOUCA_HAS_CPP14) && !defined(TOUCA_HAS_CPP11)
#if (defined(__cplusplus) && __cplusplus >= 202002L) || \
    (defined(_MSVC_LANG) && _MSVC_LANG >= 202002L)
#define TOUCA_HAS_CPP20
#define TOUCA_HAS_CPP17
#define TOUCA_HAS_CPP14
#elif (defined(__cplusplus) && __cplusplus >= 201703L) || \
    (defined(_HAS_CXX17) && _HAS_CXX17 == 1)
#define TOUCA_HAS_CPP17
#define TOUCA_HAS_CPP14
#elif (defined(__cplusplus) && __cplusplus >= 201402L) || \
    (defined(_HAS_CXX14) && _HAS_CXX14 == 1)
#define TOUCA_HAS_CPP14
#endif
#endif
