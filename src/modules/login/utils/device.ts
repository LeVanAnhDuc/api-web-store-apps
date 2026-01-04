/**
 * IP Address Utilities
 * Get client IP from request
 */

/**
 * Get client IP from request
 * Handles proxies and load balancers
 */
export const getClientIp = (req: {
  headers: Record<string, unknown>;
  ip?: string;
}): string => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp.trim();
  }

  return req.ip || "unknown";
};
