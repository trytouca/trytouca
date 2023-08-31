# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

"""Defines the implementation actions to generate_export_header."""

def _generate_export_header_impl(ctx):
    output = ctx.outputs.out

    ctx.actions.write(output = output, content = """
#ifndef TOUCA_CLIENT_API_H
#define TOUCA_CLIENT_API_H

#ifdef TOUCA_STATIC_DEFINE
#  define TOUCA_CLIENT_API
#  define TOUCA_NO_EXPORT
#else
#  ifndef TOUCA_CLIENT_API
#    ifdef touca_EXPORTS
        /* We are building this library */
#      define TOUCA_CLIENT_API 
#    else
        /* We are using this library */
#      define TOUCA_CLIENT_API 
#    endif
#  endif

#  ifndef TOUCA_NO_EXPORT
#    define TOUCA_NO_EXPORT 
#  endif
#endif

#ifndef TOUCA_DEPRECATED
#  define TOUCA_DEPRECATED __attribute__ ((__deprecated__))
#endif

#ifndef TOUCA_DEPRECATED_EXPORT
#  define TOUCA_DEPRECATED_EXPORT TOUCA_CLIENT_API TOUCA_DEPRECATED
#endif

#ifndef TOUCA_DEPRECATED_NO_EXPORT
#  define TOUCA_DEPRECATED_NO_EXPORT TOUCA_NO_EXPORT TOUCA_DEPRECATED
#endif

#if 0 /* DEFINE_NO_DEPRECATED */
#  ifndef TOUCA_NO_DEPRECATED
#    define TOUCA_NO_DEPRECATED
#  endif
#endif

#endif /* TOUCA_CLIENT_API_H */

""")

_generate_export_header_gen = rule(
    attrs = {
        "out": attr.output(mandatory = True),
    },
    output_to_genfiles = True,
    implementation = _generate_export_header_impl,
)

def generate_export_header(
        name = None,
        out = None,
        **kwargs):
    _generate_export_header_gen(
        name = name,
        out = out,
        **kwargs
    )
