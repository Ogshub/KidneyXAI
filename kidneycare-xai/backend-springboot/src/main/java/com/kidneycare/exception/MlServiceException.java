package com.kidneycare.exception;

/**
 * Thrown when the Python ML service is unreachable,
 * times out, or returns a malformed response.
 */
public class MlServiceException extends RuntimeException {

    public MlServiceException(String message) {
        super(message);
    }

    public MlServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
