import { AUTH_ROLES } from "./auth";

const CONNECTION_STATE = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
} as const;

const DATABASE = {
  CONNECTION_STATE,
  AUTH_ROLES
};

export default DATABASE;
