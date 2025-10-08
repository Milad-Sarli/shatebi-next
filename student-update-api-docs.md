# Student Update API Documentation

## Overview
این API برای به‌روزرسانی اطلاعات دانش‌آموزان استفاده می‌شود. امکان به‌روزرسانی تمام فیلدهای دانش‌آموز از جمله آپلود تصویر جدید را فراهم می‌کند.

## Endpoint
```
PUT /api/students/{id}
```

## Headers
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
Accept: application/json
```

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | شناسه دانش‌آموز |

### Request Body (Form Data)
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Fname | string | No | max:255 | نام |
| Lname | string | No | max:255 | نام خانوادگی |
| Aks | file | No | image (jpeg,png,jpg,webp), max:300KB | تصویر دانش‌آموز |
| FatherName | string | No | max:255 | نام پدر |
| Mellicode | string | No | max:255 | کد ملی |
| FatherJob | string | No | max:255 | شغل پدر |
| Ostan | string | No | max:255 | استان |
| status | string | No | max:255 | وضعیت تحصیل |
| tenant_id | integer | No | exists in tenants table | شناسه موسسه |

### Status Values
وضعیت‌های معتبر برای فیلد `status`:
- `انتقالی`
- `فارغ التحصیل`
- `در حال تحصیل`
- `ترک تحصیل`
- `اخراجی`

## Response

### Success Response (200)
```json
{
    "status": "success",
    "message": "Student updated successfully",
    "data": {
        "id": 1,
        "Fname": "احمد",
        "Lname": "محمدی",
        "Aks": "shatebi/uploads/avatars_tenant_1/converted_image_123456.webp",
        "FatherName": "علی",
        "Mellicode": "1234567890",
        "FatherJob": "مهندس",
        "Entryday": "1402/05/15",
        "Educating": "دیپلم",
        "Ostan": "تهران",
        "status": "در حال تحصیل",
        "StudentCode": "402005001",
        "tenant_id": 1,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T11:45:00.000000Z",
        "tenant": {
            "id": 1,
            "name": "موسسه نمونه"
        }
    }
}
```

### Error Responses

#### Student Not Found (404)
```json
{
    "status": "error",
    "message": "Student not found"
}
```

#### Validation Error (422)
```json
{
    "status": "error",
    "message": {
        "Fname": ["The Fname field is required."],
        "Mellicode": ["The Mellicode field must be a string."]
    }
}
```

#### Image Upload Error (422)
```json
{
    "status": "error",
    "message": "خطا در آپلود تصویر",
    "errors": {
        "Aks": ["Error message details"]
    }
}
```

## Frontend Integration Examples

### JavaScript (Fetch API)
```javascript
async function updateStudent(studentId, formData) {
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('Student updated successfully:', result.data);
            return result;
        } else {
            console.error('Update failed:', result.message);
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
}

// Usage example
const formData = new FormData();
formData.append('Fname', 'احمد');
formData.append('Lname', 'محمدی');
formData.append('status', 'در حال تحصیل');

// If updating image
const fileInput = document.getElementById('imageFile');
if (fileInput.files[0]) {
    formData.append('Aks', fileInput.files[0]);
}

updateStudent(123, formData);
```

### Axios Example
```javascript
import axios from 'axios';

const updateStudent = async (studentId, data) => {
    try {
        const formData = new FormData();
        
        // Add text fields
        Object.keys(data).forEach(key => {
            if (key !== 'Aks' && data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        
        // Add image file if exists
        if (data.Aks && data.Aks instanceof File) {
            formData.append('Aks', data.Aks);
        }

        const response = await axios.put(`/api/students/${studentId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Update failed');
        }
        throw error;
    }
};
```

### React Hook Example
```javascript
import { useState } from 'react';

const useStudentUpdate = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateStudent = async (studentId, studentData) => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            
            Object.entries(studentData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value);
                }
            });

            const response = await fetch(`/api/students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Update failed');
            }

            return result.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateStudent, loading, error };
};
```

## Important Notes

### Image Upload
- تصاویر به صورت خودکار به فرمت WebP تبدیل می‌شوند
- حداکثر سایز فایل: 300KB
- فرمت‌های پشتیبانی شده: JPEG, PNG, JPG, WebP
- تصاویر در مسیر `/shatebi/uploads/avatars_tenant_{tenant_id}/` ذخیره می‌شوند

### Tenant Management
- اگر `tenant_id` در درخواست ارسال نشود، از `tenant_id` موجود در رکورد دانش‌آموز استفاده می‌شود
- کاربر باید دسترسی به tenant مربوطه داشته باشد

### Partial Updates
- تمام فیلدها اختیاری هستند (partial update)
- فقط فیلدهایی که ارسال می‌شوند به‌روزرسانی خواهند شد
- برای حذف مقدار یک فیلد، مقدار خالی ارسال کنید

### Error Handling
- همیشه status code و response body را بررسی کنید
- خطاهای validation در فرمت استاندارد Laravel برگردانده می‌شوند
- خطاهای آپلود تصویر در فیلد `errors.Aks` قرار می‌گیرند