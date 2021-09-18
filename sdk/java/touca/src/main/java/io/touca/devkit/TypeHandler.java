// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import io.touca.types.ToucaType;
import io.touca.types.NumberType;

public final class TypeHandler {
    public final ToucaType transform(final Object value) {
        return new NumberType(1);
    }
}
