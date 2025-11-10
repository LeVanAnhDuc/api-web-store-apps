/**
 * MongoDB-specific constants
 */

/**
 * MongoDB connection states
 * These values correspond to the Mongoose connection readyState values
 */
export const CONNECTION_STATES = {
  /** Connection is not established */
  DISCONNECTED: 0,
  /** Connection is active and ready to use */
  CONNECTED: 1,
  /** Connection is being established */
  CONNECTING: 2,
  /** Connection is being closed */
  DISCONNECTING: 3
} as const;
