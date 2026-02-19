# Admin Sidebar API

Base URL: `/api/admin/menu`

Auth: All sidebar APIs are protected.

```http
Authorization: Bearer <jwt_token>
```

Role access:
- `Admin`: create, update, arrange, enable/disable
- `Admin` and `Developer`: get/list

## 1) Create Sidebar Item

Endpoint: `POST /api/admin/menu`

Request payload:

```json
{
  "title": "Settings",
  "link": "/settings",
  "parentId": null,
  "icon": "settings",
  "sortOrder": 10,
  "isHidden": false,
  "isEnabled": true,
  "roles": ["Admin", "Developer"]
}
```

Success response (`201`):

```json
{
  "success": true,
  "data": {
    "_id": "67b6c94aaf28f09f6fc12d1a",
    "title": "Settings",
    "link": "/settings",
    "parentId": null,
    "icon": "settings",
    "sortOrder": 10,
    "isHidden": false,
    "isEnabled": true,
    "roles": ["Admin", "Developer"],
    "createdAt": "2026-02-19T12:00:00.000Z",
    "updatedAt": "2026-02-19T12:00:00.000Z",
    "__v": 0
  }
}
```

Common error responses:

```json
{
  "success": false,
  "message": "Title is required"
}
```

```json
{
  "success": false,
  "message": "Invalid parent id"
}
```

```json
{
  "success": false,
  "message": "Parent menu item not found"
}
```

## 2) Get Sidebar Tree

Endpoint: `GET /api/admin/menu`

Optional query params:
- `includeHidden=true` (default hidden items are excluded)
- `isEnabled=true|false`

Example:
`GET /api/admin/menu?includeHidden=true&isEnabled=true`

Success response (`200`):

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "67b6c94aaf28f09f6fc12d10",
      "title": "Dashboard",
      "link": "/dashboard",
      "parentId": null,
      "icon": "dashboard",
      "sortOrder": 0,
      "isHidden": false,
      "isEnabled": true,
      "roles": ["Admin", "Developer"],
      "children": []
    },
    {
      "_id": "67b6c94aaf28f09f6fc12d1a",
      "title": "Settings",
      "link": "/settings",
      "parentId": null,
      "icon": "settings",
      "sortOrder": 10,
      "isHidden": false,
      "isEnabled": true,
      "roles": ["Admin", "Developer"],
      "children": [
        {
          "_id": "67b6c94aaf28f09f6fc12d1b",
          "title": "Manage Menu",
          "link": "/settings/menu",
          "parentId": "67b6c94aaf28f09f6fc12d1a",
          "icon": "menu",
          "sortOrder": 0,
          "isHidden": false,
          "isEnabled": true,
          "roles": ["Admin", "Developer"],
          "children": []
        }
      ]
    }
  ]
}
```

## 3) Update Sidebar Item

Endpoint: `PATCH /api/admin/menu/:id`

Request payload (send only fields you want to change):

```json
{
  "title": "Menu Management",
  "link": "/settings/menu-management",
  "parentId": "67b6c94aaf28f09f6fc12d1a",
  "icon": "menu",
  "sortOrder": 1,
  "isHidden": false,
  "isEnabled": true,
  "roles": ["Admin"]
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "_id": "67b6c94aaf28f09f6fc12d1b",
    "title": "Menu Management",
    "link": "/settings/menu-management",
    "parentId": "67b6c94aaf28f09f6fc12d1a",
    "icon": "menu",
    "sortOrder": 1,
    "isHidden": false,
    "isEnabled": true,
    "roles": ["Admin"],
    "createdAt": "2026-02-19T12:01:00.000Z",
    "updatedAt": "2026-02-19T12:20:00.000Z",
    "__v": 0
  }
}
```

Common error responses:

```json
{
  "success": false,
  "message": "Invalid menu id"
}
```

```json
{
  "success": false,
  "message": "Menu cannot be its own parent"
}
```

```json
{
  "success": false,
  "message": "Menu item not found"
}
```

## 4) Arrange Sidebar Items (Bulk reorder + parent mapping)

Endpoint: `PATCH /api/admin/menu/arrange`

Request payload:

```json
{
  "items": [
    {
      "id": "67b6c94aaf28f09f6fc12d10",
      "parentId": null,
      "sortOrder": 0
    },
    {
      "id": "67b6c94aaf28f09f6fc12d1a",
      "parentId": null,
      "sortOrder": 1
    },
    {
      "id": "67b6c94aaf28f09f6fc12d1b",
      "parentId": "67b6c94aaf28f09f6fc12d1a",
      "sortOrder": 0
    }
  ]
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Menu order updated successfully",
  "count": 3
}
```

Common error responses:

```json
{
  "success": false,
  "message": "items array is required for arrange"
}
```

```json
{
  "success": false,
  "message": "Invalid menu id: 123"
}
```

```json
{
  "success": false,
  "message": "Duplicate menu id: 67b6c94aaf28f09f6fc12d10"
}
```

```json
{
  "success": false,
  "message": "One or more menu ids were not found"
}
```

```json
{
  "success": false,
  "message": "One or more parent ids were not found"
}
```

## 5) Enable / Disable Sidebar Item

Endpoint: `PATCH /api/admin/menu/:id/status`

Disable payload:

```json
{
  "isEnabled": false
}
```

Enable payload:

```json
{
  "isEnabled": true
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Menu disabled successfully",
  "data": {
    "_id": "67b6c94aaf28f09f6fc12d1b",
    "title": "Manage Menu",
    "link": "/settings/menu",
    "parentId": "67b6c94aaf28f09f6fc12d1a",
    "icon": "menu",
    "sortOrder": 0,
    "isHidden": false,
    "isEnabled": false,
    "roles": ["Admin", "Developer"],
    "createdAt": "2026-02-19T12:01:00.000Z",
    "updatedAt": "2026-02-19T12:30:00.000Z",
    "__v": 0
  }
}
```

Common error responses:

```json
{
  "success": false,
  "message": "Invalid menu id"
}
```

```json
{
  "success": false,
  "message": "isEnabled is required"
}
```

```json
{
  "success": false,
  "message": "Menu item not found"
}
```

## Auth Errors (all protected routes)

```json
{
  "success": false,
  "message": "Authorization header missing or malformed"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Permission denied"
}
```
