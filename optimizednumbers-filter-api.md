# Optimized Numbers API Filters

This document explains how to use the filtering capabilities for the Optimized Numbers API, specifically focusing on the `master_id` filter.

## Endpoint

`GET /api/optimized-numbers`

## Query Parameters

You can filter the results by providing the following query parameters:

- `master_id` (integer, optional): The ID of the master teacher to filter by. This corresponds to the selected teacher in the UI select component.
- `negative_scores` (boolean, optional): Filter to include or exclude negative scores (true/false).
- `start_date` (string, optional): Start date for filtering (Jalali calendar format: YYYY/MM/DD).
- `end_date` (string, optional): End date for filtering (Jalali calendar format: YYYY/MM/DD).

## Examples

### Filter by Master Teacher

To get optimized numbers for a specific master teacher (e.g., with ID `1`):

```
GET /api/optimized-numbers?master_id=1
```

### Combine Filters

To get negative scores for a specific master teacher in a date range:

```
GET /api/optimized-numbers?master_id=1&negative_scores=true&start_date=1403/01/01&end_date=1403/01/31
```

## Notes

- All filters are optional and can be combined as needed.
- The UI select component for teachers maps directly to the `master_id` query parameter.