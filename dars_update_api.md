# راهنمای API آپدیت Dars

## مشخصات API
- **آدرس**: `/api/droos/{id}`
- **متد**: `PUT`
- **هدر‌ها**: `Authorization: Bearer {token}`, `Content-Type: application/json`

## پارامترها
- `title`: عنوان درس (اجباری)
- `pages`: تعداد صفحات (اختیاری)
- `start_page`: صفحه شروع (اختیاری)
- `tenant_id`: شناسه tenant (اجباری)
- `parent`: شناسه درس والد یا 'null' (اختیاری)
- `is_one_grade`: آیا درس تک نمره است (اختیاری)
- `lesson_area_id`: شناسه منطقه درس (اختیاری)

## نمونه کد فرانت‌اند
```javascript
const updateDars = async (id, data) => {
  try {
    const response = await axios.put(`/api/droos/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('خطا:', error);
    throw error;
  }
};

// مثال استفاده
updateDars(5, {
  title: 'عنوان جدید',
  pages: 100,
  tenant_id: 1,
  parent: 2 // برای حذف والد از 'null' استفاده کنید
});
```

## نکات مهم
1. برای حذف والد، مقدار `'null'` را ارسال کنید
2. سیستم از ارجاع دایره‌ای جلوگیری می‌کند
3. در صورت موفقیت، اطلاعات کامل درس برگردانده می‌شود