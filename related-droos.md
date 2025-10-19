# Related Droos API

This document describes the API endpoint for retrieving related 'Droos' (lessons) based on a given Dars ID.

## Endpoint

`GET /api/droos/{darsId}/related`

## Description

This endpoint allows you to fetch the direct children (sub-lessons) of a parent 'Dars'.

- If the provided `darsId` belongs to a 'Dars' that is itself a sub-lesson (i.e., it has a parent), the API will return an error message indicating that it is not a parent 'Dars'.
- If the provided `darsId` belongs to a 'Dars' that is a parent (i.e., its `parent` field is `null`), the API will return a collection of its direct children.

## Parameters

- `darsId` (required): The ID of the 'Dars' for which you want to retrieve direct children.

## Example Request

```
GET /api/droos/123/related
```

## Example Response (for a parent Dars)

```json
{
    "status": true,
    "data": [
        {
            "id": 456,
            "user_id": 1,
            "title": "Child Dars 1",
            "is_one_grade": false,
            "pages": 10,
            "start_page": 1,
            "tenant_id": 1,
            "parent": 123,
            "created_at": "2023-01-01T12:00:00.000000Z",
            "updated_at": "2023-01-01T12:00:00.000000Z",
            "user": {
                "id": 1,
                "name": "User Name",
                "email": "user@example.com",
                // ... other user details
            },
            "tenant": {
                "id": 1,
                "name": "Tenant Name",
                // ... other tenant details
            }
        }
    ]
}
```

## Error Responses

- **404 Not Found**: If the `darsId` provided does not correspond to an existing 'Dars'.

```json
{
    "status": false,
    "message": "Dars not found"
}
```

- **400 Bad Request**: If the `darsId` provided belongs to a 'Dars' that is a sub-lesson (i.e., it has a parent).

```json
{
    "status": false,
    "message": "این درس والد نمی باشد و خود زیرشاخه است."
}
```