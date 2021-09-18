// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

public final class NumberType extends ToucaType {

    private Integer value;

    public NumberType(final Integer value) {
        this.value = value;
    }

    @Override
    public final ToucaType.Types type() {
        return ToucaType.Types.Number;
    }

    public void increment() {
        this.value += 1;
    }
}
