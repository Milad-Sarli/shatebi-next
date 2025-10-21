# Optimized Numbers API Filters

This document explains how to use the filtering capabilities for the Optimized Numbers API, specifically focusing on the "negative scores" filter.

## Endpoint

`GET /api/optimized-numbers`

## Query Parameters

You can filter the results by providing the following query parameter:

- `negative_scores` (boolean, optional): Set to `true` to filter for negative scores. This includes numbers where `number` is between 70 and 79 (inclusive) OR `hefz` is between 55 and 59 (inclusive).

## Examples

### Filter by Negative Scores

To get optimized numbers that are considered negative scores:

```
GET /api/optimized-numbers?negative_scores=true
```

## Notes

- All filters are optional and can be combined as needed.