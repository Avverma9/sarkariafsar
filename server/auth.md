# Admin Auth API

Base URL: `/api/admin/auth`

## 1) Login

Endpoint: `POST /api/admin/auth/login`

Request payload:

```json
{
  "email": "admin@example.com",
  "password": "YourPassword123"
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "token": "<jwt_token>",
    "expiresIn": "8h",
    "user": {
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "Admin",
      "isActive": true,
      "createdAt": "2026-02-19T11:00:00.000Z",
      "updatedAt": "2026-02-19T11:00:00.000Z",
      "id": "67b5e8b8a5f0f1a2b3c4d5e6"
    }
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Email and password are required"
}
```

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "User is disabled"
}
```

## 2) Forgot Password (Send OTP)

Endpoint: `POST /api/admin/auth/forgot-password`

Request payload:

```json
{
  "email": "admin@example.com"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "If this email exists, OTP has been sent"
}
```

Possible error response (`500`, SMTP issue):

```json
{
  "success": false,
  "message": "Unable to send OTP email right now. Please try again."
}
```

## 3) Verify Reset OTP

Endpoint: `POST /api/admin/auth/verify-reset-otp`

Request payload:

```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "OTP verified",
  "data": {
    "resetToken": "<reset_token>",
    "expiresInMinutes": 15
  }
}
```

Common error responses:

```json
{
  "success": false,
  "message": "Email and OTP are required"
}
```

```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

```json
{
  "success": false,
  "message": "OTP has expired. Request a new OTP."
}
```

```json
{
  "success": false,
  "message": "Maximum OTP attempts exceeded. Request a new OTP."
}
```

## 4) Reset Password

Endpoint: `POST /api/admin/auth/reset-password`

Request payload:

```json
{
  "email": "admin@example.com",
  "resetToken": "<reset_token>",
  "newPassword": "NewStrongPassword123",
  "confirmPassword": "NewStrongPassword123"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

Common error responses:

```json
{
  "success": false,
  "message": "Email, resetToken and newPassword are required"
}
```

```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

```json
{
  "success": false,
  "message": "confirmPassword does not match"
}
```

```json
{
  "success": false,
  "message": "Invalid reset session. Verify OTP again."
}
```

```json
{
  "success": false,
  "message": "Reset session expired. Verify OTP again."
}
```

```json
{
  "success": false,
  "message": "Invalid reset session token"
}
```

```json
{
  "success": false,
  "message": "New password must be different from current password"
}
```

## Auth Header for Protected APIs

After login, use:

```http
Authorization: Bearer <jwt_token>
```

This token is required for protected admin routes (users/menu APIs).
