import { verifyJwt } from "../services/jwt.service.mjs";

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next({ statusCode: 401, message: "Authorization header missing or malformed" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = verifyJwt(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (err) {
    return next({ statusCode: 401, message: "Invalid or expired token" });
  }
};

export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next({ statusCode: 401, message: "Authentication required" });
    }

    if (!allowedRoles.length || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next({ statusCode: 403, message: "Permission denied" });
  };
};
