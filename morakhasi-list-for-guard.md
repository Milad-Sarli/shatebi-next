# راهنمای پیاده‌سازی فیلد late_time در فرانت‌اند

## نقطه پایانی (Endpoint)
```
PUT /api/morakhasi/guard/{id}
```

## توضیحات کلی
این API برای به‌روزرسانی وضعیت مرخصی توسط نگهبان طراحی شده است. یکی از قابلیت‌های مهم آن محاسبه خودکار تأخیر (`late_time`) هنگام تنظیم فیلد `checked` است.

## دسترسی
- **نقش‌های مجاز**: `admin` و `guard`
- **احراز هویت**: Bearer Token الزامی

## پارامترهای ورودی

| پارامتر | نوع | اجباری | توضیحات |
|---------|-----|---------|---------|
| `exit_ok` | boolean | خیر | تأیید خروج |
| `checked` | boolean | خیر | بررسی شده |

## منطق محاسبه late_time

### 1. شرایط محاسبه
- فیلد `checked` باید `true` باشد
- مرخصی باید دارای `totime_1` (زمان پایان) باشد
- زمان فعلی باید بیشتر از `totime_1` باشد

### 2. نحوه محاسبه
```php
// اگر زمان فعلی > زمان پایان مرخصی
$diffInMinutes = now()->diffInMinutes($toTime1DateTime);

if ($diffInMinutes > 60) {
    // بیش از یک ساعت: فرمت ساعت:دقیقه
    $hours = floor($diffInMinutes / 60);
    $minutes = $diffInMinutes % 60;
    $late_time = $hours . ':' . str_pad($minutes, 2, '0', STR_PAD_LEFT);
} else {
    // کمتر از یک ساعت: فقط دقیقه
    $late_time = $diffInMinutes;
}
```

### 3. فرمت‌های خروجی
- **کمتر از 60 دقیقه**: عدد صحیح (مثال: `15`, `45`)
- **بیش از 60 دقیقه**: فرمت `ساعت:دقیقه` (مثال: `1:30`, `2:15`)
- **بدون تأخیر**: `"0"`
- **خطا یا عدم وجود زمان**: `"0"`

## پیاده‌سازی در فرانت‌اند

### 1. ارسال درخواست

```javascript
const updateMorakhasiStatus = async (morakhasiId, checked, exitOk = null) => {
    try {
        const payload = { checked };
        if (exitOk !== null) {
            payload.exit_ok = exitOk;
        }

        const response = await fetch(`/api/morakhasi/guard/${morakhasiId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            throw new Error(data.message || 'خطا در به‌روزرسانی');
        }
    } catch (error) {
        console.error('خطا در به‌روزرسانی وضعیت مرخصی:', error);
        throw error;
    }
};
```

### 2. نمایش late_time در UI

```javascript
const formatLateTime = (lateTime, late) => {
    if (!late || late === 0) {
        return null;
    }

    if (!lateTime || lateTime === '0') {
        return 'بدون تأخیر';
    }

    // اگر شامل : باشد، فرمت ساعت:دقیقه است
    if (lateTime.includes(':')) {
        const [hours, minutes] = lateTime.split(':');
        return `${hours} ساعت و ${minutes} دقیقه تأخیر`;
    } else {
        // فقط دقیقه
        return `${lateTime} دقیقه تأخیر`;
    }
};

const LeaveCard = ({ leave, onStatusUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCheckToggle = async () => {
        setIsUpdating(true);
        try {
            const updatedLeave = await updateMorakhasiStatus(
                leave.id, 
                !leave.checked
            );
            onStatusUpdate(updatedLeave);
        } catch (error) {
            alert('خطا در به‌روزرسانی وضعیت');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="leave-card">
            <div className="leave-header">
                <h3>{leave.fullname}</h3>
                <div className="status-controls">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={leave.checked || false}
                            onChange={handleCheckToggle}
                            disabled={isUpdating}
                        />
                        بررسی شده
                    </label>
                </div>
            </div>
            
            <div className="leave-details">
                <p><strong>دلیل:</strong> {leave.dalil}</p>
                <p><strong>زمان پایان:</strong> {formatDateTime(leave.totime_1)}</p>
                
                {/* نمایش وضعیت تأخیر */}
                {leave.late === 1 && (
                    <div className="late-status">
                        <span className="late-badge">تأخیر</span>
                        <span className="late-time">
                            {formatLateTime(leave.late_time, leave.late)}
                        </span>
                    </div>
                )}
                
                {leave.checked && leave.late === 0 && (
                    <div className="on-time-status">
                        <span className="on-time-badge">به موقع</span>
                    </div>
                )}
            </div>
        </div>
    );
};
```

### 3. کامپوننت کامل با مدیریت خطا

```javascript
import { useState, useCallback } from 'react';

const GuardMorakhasiManager = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleStatusUpdate = useCallback((updatedLeave) => {
        setLeaves(prevLeaves => 
            prevLeaves.map(leave => 
                leave.id === updatedLeave.id ? updatedLeave : leave
            )
        );
    }, []);

    const updateLeaveStatus = async (leaveId, checked, exitOk = null) => {
        try {
            setError(null);
            const payload = { checked };
            if (exitOk !== null) {
                payload.exit_ok = exitOk;
            }

            const response = await fetch(`/api/morakhasi/guard/${leaveId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const updatedLeave = await response.json();
            handleStatusUpdate(updatedLeave);
            
            return updatedLeave;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    return (
        <div className="guard-morakhasi-manager">
            {error && (
                <div className="error-message">
                    خطا: {error}
                </div>
            )}
            
            <div className="leaves-list">
                {leaves.map(leave => (
                    <MorakhasiCard
                        key={leave.id}
                        leave={leave}
                        onUpdate={updateLeaveStatus}
                    />
                ))}
            </div>
        </div>
    );
};
```

### 4. استایل‌های CSS

```css
.late-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

.late-badge {
    background: #ffebee;
    color: #d32f2f;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.late-time {
    color: #d32f2f;
    font-size: 13px;
    font-weight: 500;
}

.on-time-status {
    margin-top: 8px;
}

.on-time-badge {
    background: #e8f5e8;
    color: #388e3c;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    margin: 0;
}

.error-message {
    background: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
    border: 1px solid #ffcdd2;
}
```

## نکات مهم

### 1. مدیریت خطا
- همیشه خطاهای شبکه را مدیریت کنید
- پیام‌های خطای مناسب نمایش دهید
- در صورت خطا، وضعیت قبلی را بازگردانید

### 2. تجربه کاربری
- حالت loading هنگام به‌روزرسانی نمایش دهید
- تأیید کاربر برای تغییرات مهم دریافت کنید
- بازخورد بصری مناسب ارائه دهید

### 3. عملکرد
- از debouncing برای جلوگیری از درخواست‌های متعدد استفاده کنید
- وضعیت محلی را بلافاصله به‌روزرسانی کنید
- در صورت خطا، تغییرات را برگردانید

### 4. امنیت
- همیشه token احراز هویت ارسال کنید
- ورودی‌های کاربر را اعتبارسنجی کنید
- خطاهای حساس را افشا نکنید

## مثال کامل Hook سفارشی

```javascript
import { useState, useCallback } from 'react';

const useMorakhasiGuard = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateStatus = useCallback(async (morakhasiId, updates) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/morakhasi/guard/${morakhasiId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'خطا در به‌روزرسانی');
            }

            const result = await response.json();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const checkMorakhasi = useCallback(async (morakhasiId, checked) => {
        return updateStatus(morakhasiId, { checked });
    }, [updateStatus]);

    const setExitOk = useCallback(async (morakhasiId, exitOk) => {
        return updateStatus(morakhasiId, { exit_ok: exitOk });
    }, [updateStatus]);

    return {
        loading,
        error,
        updateStatus,
        checkMorakhasi,
        setExitOk,
        clearError: () => setError(null)
    };
};

export default useMorakhasiGuard;
```

## خلاصه
فیلد `late_time` به صورت خودکار توسط بک‌اند محاسبه می‌شود و نیازی به ارسال آن از فرانت‌اند نیست. فقط کافی است فیلد `checked` را `true` کنید تا سیستم تأخیر را محاسبه و ذخیره کند.