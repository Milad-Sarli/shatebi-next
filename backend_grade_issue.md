## Backend Issue: Incorrect Grade Display Across Classes
 
### Problem Description:

The frontend is currently displaying student grades incorrectly. Specifically, if a student is enrolled in multiple classes, a grade recorded in one class is erroneously displayed in all other classes for that student. For example, a student in "Kidani" class (ID 27) might see grades for "Rookhani" subject (ID 25) that were actually recorded in a different class.

### Root Cause (Suspected Backend Issue):

Based on the current API response structure for student data and grades, it appears that individual `grade` objects do not contain a direct reference to the `class_id` they belong to. While each `grade` has a `lesson_area` (e.g., `lesson_area.id: 33491`) and a `dars` (e.g., `dars.id: 25`), the `lesson_area.id` might not be unique to a specific class instance.

When the frontend fetches students for a `selectedClass` using `optimizedClassService.getStudents(selectedClass.id, ...)`, it expects to receive only the grades relevant to that `selectedClass.id`. However, the current behavior suggests that the API might be returning all grades for a student across all classes they are enrolled in, without filtering by the `class_id` provided in the request.

### Proposed Backend Solution:

To resolve this issue, the backend API for fetching student grades (specifically the endpoint called by `optimizedClassService.getStudents`) should ensure that:

1.  **Grades are filtered by `class_id` on the backend:** When students are fetched for a specific `class_id`, the API should only return `grade` objects that were recorded within that particular class. This is the most straightforward and efficient solution.

    *   **Current API Call:** `optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken)`
    *   **Expected Backend Behavior:** The backend should use `selectedClass.id` to filter the grades associated with each student before sending the response.

2.  **(Alternative/Enhancement) Include `class_id` in each `grade` object:** If filtering on the backend is not feasible or if there's a need for the frontend to perform more granular filtering, each `grade` object in the API response should explicitly include the `class_id` it belongs to.

    *   **Example Desired `grade` structure:**
        ```json
        {
            "id": 350134,
            "hefz": "55",
            "details": "0",
            "tajvid": "0",
            "sout": "0",
            "number": "0",
            "practice_count": "0",
            "created_at": "2025-10-18T02:35:35.00000Z",
            "dars": {
                "id": 25,
                "title": "روخوانی"
            },
            "description": null,
            "lesson_area": {
                "id": 33491,
                "start_surah": {
                    "id": 1,
                    "title": "Al-Fatiha",
                    "titleAr": "الفاتحة",
                    "index": "1",
                    "pages": "1"
                }
            },
            "master_teacher": {
                "id": 123,
                "name": null
            },
            "student": {
                "id": 1190,
                "name": "محمد ذاکر میر حسنی",
                "father_name": "قاسم",
                "student_code": "401004009"
            },
            "class_id": 27 // <--- New field
        }
        ```

By implementing either of these solutions (preferably the first one for backend efficiency), the frontend will receive accurate grade data, allowing for correct display and preventing grades from one class from appearing in another.