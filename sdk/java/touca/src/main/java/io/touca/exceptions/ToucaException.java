// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.exceptions;

/**
 *
 */
public abstract class ToucaException extends RuntimeException {
    /**
     *
     */
    public ToucaException(final String message) {
        super(message);
    }
}
