'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApplicantService } from '@/lib/services/applicant.service';
import { locationService, Province, City } from '@/lib/services/location.service';
import { SingleSelectCombobox } from '@/components/ui/Combobox';
import { useTheme } from '@/lib/context/theme.context';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from "next/image";
import persian_fa from 'react-date-object/locales/persian_fa';
import persian from 'react-date-object/calendars/persian';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import { useParams } from 'next/navigation';

interface FormState {
  Fname: string;
  Lname: string;
  Aks: string | File;
  FatherName: string;
  Mellicode: string;
  Birthday: string;
  Phone: string;
  TelPhone: string;
  Ostan: string;
  City: string;
  Vilage: string;
  Adress: string;
  Degree: string;
  Referer: string;
  Health: string;
  Description: string;
  status: boolean;
}

const initialState: FormState = {
  Fname: '',
  Lname: '',
  Aks: '',
  FatherName: '',
  Mellicode: '',
  Birthday: '',
  Phone: '',
  TelPhone: '',
  Ostan: '',
  City: '',
  Vilage: '',
  Adress: '',
  Degree: '',
  Referer: '',
  Health: '',
  Description: '',
  status: false,
};

const educationLevels = [
  { value: 'پنجم', label: 'پنجم' },
  { value: 'ششم', label: 'ششم' },
  { value: 'هفتم', label: 'هفتم' },
  { value: 'هشتم', label: 'هشتم' },
  { value: 'نهم', label: 'نهم' },
  { value: 'دهم', label: 'دهم' },
];

const healthStatusOptions = [
  { value: 'سلامت کامل', label: 'سلامت کامل' },
  { value: 'بیمار', label: 'بیمار' },
];

interface ApiError extends Error {
  message: string;
}

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isTypingHealthDetails, setIsTypingHealthDetails] = useState(false);
  const params = useParams();
  const id = params?.id as string;
  const [dynamicTitle, setDynamicTitle] = useState('دارالقرآن امام شاطبی (رح)');

  useEffect(() => {
    if (id === '7') {
      setDynamicTitle('مسجد و مکتبخانه رحمت');
    } else {
      setDynamicTitle('دارالقرآن امام شاطبی (رح)');
    }
  }, [id]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesData = await locationService.getAllProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (selectedProvinceId) {
        try {
          const citiesData = await locationService.getCitiesByProvince(selectedProvinceId);
          setCities(citiesData);
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => p.name === value);
    if (province) {
      setSelectedProvinceId(province.id);
      setForm(prev => ({ ...prev, Ostan: value, City: '' }));
    } else {
      setSelectedProvinceId(null);
      setForm(prev => ({ ...prev, Ostan: '', City: '' }));
    }
  };

  const handleCityChange = (value: string) => {
    setForm(prev => ({ ...prev, City: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked;
    }
    setForm({
      ...form,
      [name]: fieldValue,
    });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.Fname) newErrors.Fname = 'نام الزامی است';
    if (!form.Lname) newErrors.Lname = 'نام خانوادگی الزامی است';
    if (!form.FatherName) newErrors.FatherName = 'نام پدر الزامی است';
    if (!form.Mellicode) newErrors.Mellicode = 'کد ملی الزامی است';
    if (!form.Phone) newErrors.Phone = 'شماره موبایل داوطلب الزامی است';
    if (!form.TelPhone) newErrors.TelPhone = 'شماره موبایل پدر یا مادر الزامی است';
    if (!form.Ostan) newErrors.Ostan = 'استان الزامی است';
    if (!form.City) newErrors.City = 'شهر الزامی است';
    if (!form.Degree) newErrors.Degree = 'پایه تحصیلی الزامی است';
    if (form.TelPhone && form.TelPhone.length > 11) newErrors.TelPhone = 'شماره موبایل پدر یا مادر نباید بیشتر از 11 کاراکتر باشد';
    if (form.Phone && form.Phone.length > 11) newErrors.Phone = 'شماره موبایل داوطلب نباید بیشتر از 11 کاراکتر باشد';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // if (!accessToken) {
    //   toast({
    //     title: 'خطا',
    //     description: 'شما وارد نشده‌اید.',
    //     type: 'destructive',
    //   });
    //   return;
    // }
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      // Correctly append form data, ensuring Aks is handled as File or string
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'Aks') {
          if (value instanceof File) {
            formData.append('Aks', value);
            console.log('Image data (File):', value);
          } else if (typeof value === 'string' && value.trim() !== '') {
            // This case might not be hit if Aks is always File or empty string after selection
            // but good to have if string URLs could be part of initial state or logic
            // formData.append('Aks', value); 
            // console.log('Image data (string):', value);
            // For create, if Aks is a string path (e.g. from a previous upload not represented as File object), it's likely not submittable directly.
            // The current logic with `setImagePreview` and `fileInputRef` seems to only handle new File uploads for `Aks`.
            // So, if `value` is a string for `Aks` here, it might be an empty string or an old path.
            // We should only append if it's a non-empty string that's meaningful to send. Given current setup, empty string means no new image.
          } 
          // If Aks is an empty string, we don't append it, backend handles missing Aks.
        } else if (value !== null && value !== undefined) { // Ensure other fields are not null/undefined
          formData.append(key, String(value)); // Convert boolean and number to string
          console.log(`${key}:`, String(value));
        }
      });
      
      formData.set('status', '1');
      formData.set('tenant_id', id);

      // Log all FormData entries
      console.log('All FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? 'File object' : pair[1]));
      }

      await ApplicantService.createApplicant(formData);
      toast({
        title: 'ثبت نام موفق',
        description: 'ثبت نام شما با موفقیت انجام شد.',
        type: 'default',
      });
      setForm(initialState);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const message = apiError.message || 'خطا در ثبت نام';
      if (message.includes('کد ملی') || message.includes('duplicate') || message.includes('تکراری')) {
        toast({
          title: 'کد ملی تکراری است',
          description: 'این کد ملی قبلاً ثبت شده است. لطفاً کد ملی دیگری وارد کنید.',
          type: 'destructive',
        });
      } else if (message.toLowerCase().includes('the aks field must be a file of type: jpeg, png, jpg')) {
        toast({
          title: 'خطا در آپلود عکس',
          description: 'فیلد عکس باید یک فایل از نوع: jpeg ،png ،jpg باشد.',
          type: 'destructive',
        });
      } else {
        toast({
          title: 'خطا',
          description: message,
          type: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-2 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            فرم ثبت نام <span className="text-green-600 dark:text-green-400">{dynamicTitle}</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام <span className="text-red-500">*</span>
              </label>
              <input 
                name="Fname" 
                value={form.Fname} 
                onChange={handleChange} 
                placeholder="نام را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
              {errors.Fname && <span className="text-red-500 text-xs mt-1">{errors.Fname}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام خانوادگی <span className="text-red-500">*</span>
              </label>
              <input 
                name="Lname" 
                value={form.Lname} 
                onChange={handleChange} 
                placeholder="نام خانوادگی را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
              {errors.Lname && <span className="text-red-500 text-xs mt-1">{errors.Lname}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام پدر <span className="text-red-500">*</span>
              </label>
              <input 
                name="FatherName" 
                value={form.FatherName} 
                onChange={handleChange} 
                placeholder="نام پدر را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد ملی <span className="text-red-500">*</span>
              </label>
              <input 
                name="Mellicode" 
                maxLength={10} 
                value={form.Mellicode} 
                onChange={handleChange} 
                placeholder="کد ملی را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
              {errors.Mellicode && <span className="text-red-500 text-xs mt-1">{errors.Mellicode}</span>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                عکس <span className="text-gray-400">(اختیاری)</span>
              </label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 300 * 1024) { // 300KB in bytes
                        toast({
                          title: "خطا", 
                          description: "حجم عکس باید کمتر از 300 کیلوبایت باشد",
                          type: "destructive"
                        });
                        e.target.value = '';
                        return;
                      }
                      
                      // Create image element to get dimensions
                      const img = new window.Image();
                      img.src = URL.createObjectURL(file);
                      img.onload = () => {
                        // Create canvas for cropping
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate dimensions for square crop
                        const size = Math.min(img.width, img.height);
                        canvas.width = size;
                        canvas.height = size;
                        
                        // Draw cropped image centered
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
                        
                        // Convert to blob and create preview
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const croppedFile = new File([blob], file.name, { type: file.type });
                            setForm(prev => ({ ...prev, Aks: croppedFile }));
                            setImagePreview(URL.createObjectURL(blob));
                          }
                        }, file.type);
                      };
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />

                {imagePreview && (
                  <div className="relative">
                    <Image 
                      src={imagePreview} 
                      alt="پیش‌نمایش عکس" 
                      width={160}
                      height={160}
                      className="mt-2 rounded-full w-40 h-40 object-cover border-2 border-gray-200 dark:border-gray-700 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setForm(prev => ({ ...prev, Aks: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-4 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {errors.Aks && <span className="text-red-500 text-xs mt-1">{errors.Aks}</span>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تاریخ تولد <span className="text-gray-400">(اختیاری)</span>
              </label>
              <div className="w-full">
                <DatePicker 
                  onChange={(date: DateObject | null) => {
                    if (date) {
                      const d = new Date(date.toDate());
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setForm({ ...form, Birthday: `${yyyy}-${mm}-${dd}` });
                    }
                  }} 
                  locale={persian_fa}
                  calendar={persian}
                    calendarPosition="bottom-right"
                    style={{ width: "100%" }}
                    inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                شماره موبایل داوطلب<span className="text-red-500">*</span>
              </label>
              <input 
                name="Phone" 
                maxLength={11} 
                value={form.Phone} 
                onChange={handleChange} 
                placeholder="شماره موبایل داوطلب را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
              {errors.Phone && <span className="text-red-500 text-xs mt-1">{errors.Phone}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 شماره موبایل پدر یا مادر <span className="text-red-500">*</span>
              </label>
              <input 
                name="TelPhone" 
                maxLength={11}
                value={form.TelPhone} 
                onChange={handleChange} 
                placeholder="شماره موبایل پدر یا مادر را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                استان <span className="text-red-500">*</span>
              </label>
              <SingleSelectCombobox
                options={provinces.map(province => ({
                  value: province.name,
                  label: province.name
                }))}
                value={form.Ostan}
                onChange={handleProvinceChange}
                placeholder="استان را انتخاب کنید"
                emptyMessage="استانی یافت نشد"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                شهر <span className="text-red-500">*</span>
              </label>
              <SingleSelectCombobox
                options={cities.map(city => ({
                  value: city.name,
                  label: city.name
                }))}
                value={form.City}
                onChange={handleCityChange}
                placeholder="شهر را انتخاب کنید"
                emptyMessage="شهری یافت نشد"
                searchable={true}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                روستا <span className="text-gray-400">(اختیاری)</span>
              </label>
              <input 
                name="Vilage" 
                value={form.Vilage} 
                onChange={handleChange} 
                placeholder="روستا را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وضعیت سلامت <span className="text-gray-400">(اختیاری)</span>
              </label>
              {isTypingHealthDetails ? (
                <div className="flex items-start gap-2">
                  <input
                    name="Health"
                    value={form.Health}
                    onChange={handleChange}
                    placeholder="توضیحات بیماری را وارد کنید"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsTypingHealthDetails(false);
                      setForm(prev => ({ ...prev, Health: '' })); // Reset health or set to a default like 'سلامت کامل'
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 px-2 py-3 mt-0.5" // Adjusted padding and margin for alignment
                  >
                    لغو
                  </Button>
                </div>
              ) : (
                <SingleSelectCombobox
                  options={healthStatusOptions}
                  value={form.Health === 'سلامت کامل' ? 'سلامت کامل' : ''}
                  onChange={(value) => {
                    if (value === 'بیمار') {
                      setForm(prev => ({ ...prev, Health: '' }));
                      setIsTypingHealthDetails(true);
                    } else { // 'سلامت کامل'
                      setForm(prev => ({ ...prev, Health: value }));
                      setIsTypingHealthDetails(false);
                    }
                  }}
                  placeholder="وضعیت سلامت را انتخاب کنید"
                  emptyMessage="گزینه ای یافت نشد"
                />
              )}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                آدرس <span className="text-gray-400">(اختیاری)</span>
              </label>
              <input 
                name="Adress" 
                value={form.Adress} 
                onChange={handleChange} 
                placeholder="آدرس را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                پایه تحصیلی <span className="text-red-500">*</span>
              </label>
              <SingleSelectCombobox
                options={educationLevels}
                value={form.Degree}
                onChange={(value) => setForm(prev => ({ ...prev, Degree: value }))}
                placeholder="پایه تحصیلی را انتخاب کنید"
                emptyMessage="پایه تحصیلی یافت نشد"
              />
              {errors.Degree && <span className="text-red-500 text-xs mt-1">{errors.Degree}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                معرف <span className="text-gray-400">(اختیاری)</span>
              </label>
              <input 
                name="Referer" 
                value={form.Referer} 
                onChange={handleChange} 
                placeholder="نام معرف را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
              />
            </div>
          
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات <span className="text-gray-400">(اختیاری)</span>
              </label>
              <textarea 
                name="Description" 
                value={form.Description} 
                onChange={handleChange} 
                placeholder="توضیحات را وارد کنید" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition min-h-[60px]" 
              />
            </div>
     
            <div className="md:col-span-2">
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg transition mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'در حال ثبت...' : 'ثبت نام'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
