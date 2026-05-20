'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApplicantService } from '@/lib/services/applicant.service';
import { ApplicantOtpService } from '@/lib/services/applicant-otp.service';
import { locationService, Province, City } from '@/lib/services/location.service';
import { SingleSelectCombobox } from '@/components/ui/Combobox';
import { useTheme } from '@/lib/context/theme.context';
import { Sun, Moon, ArrowRight, Check, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from "next/image";
import persian_fa from 'react-date-object/locales/persian_fa';
import persian from 'react-date-object/calendars/persian';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OTPInput } from '@/components/ui/otp-input';
import { FireworksEffect } from '@/components/ui/fireworks-effect';
import { motion as m } from 'framer-motion';

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
  Fname: '', Lname: '', Aks: '', FatherName: '', Mellicode: '',
  Birthday: '', Phone: '', TelPhone: '', Ostan: '', City: '',
  Vilage: '', Adress: '', Degree: '', Referer: '', Health: '',
  Description: '', status: false,
};

const educationLevels = [
  { value: 'پنجم', label: 'پنجم' }, { value: 'ششم', label: 'ششم' },
  { value: 'هفتم', label: 'هفتم' }, { value: 'هشتم', label: 'هشتم' },
  { value: 'نهم', label: 'نهم' }, { value: 'دهم', label: 'دهم' },
];

const healthStatusOptions = [
  { value: 'سلامت کامل', label: 'سلامت کامل' },
  { value: 'بیمار', label: 'بیمار' },
];

interface ApiError extends Error {
  message: string;
}

type Step = 'otp-phone' | 'otp-verify' | 'form' | 'success';

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

  const [step, setStep] = useState<Step>('otp-phone');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (id === '7') setDynamicTitle('مسجد و مکتبخانه رحمت');
    else setDynamicTitle('دارالقرآن امام شاطبی (رح)');
  }, [id]);

  useEffect(() => {
    locationService.getAllProvinces().then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      locationService.getCitiesByProvince(selectedProvinceId).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
    setForm(prev => ({ ...prev, [name]: fieldValue }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.Fname) newErrors.Fname = 'نام الزامی است';
    if (!form.Lname) newErrors.Lname = 'نام خانوادگی الزامی است';
    if (!form.FatherName) newErrors.FatherName = 'نام پدر الزامی است';
    if (!form.Mellicode) newErrors.Mellicode = 'کد ملی الزامی است';
    if (!form.Ostan) newErrors.Ostan = 'استان الزامی است';
    if (!form.City) newErrors.City = 'شهر الزامی است';
    if (!form.Degree) newErrors.Degree = 'پایه تحصیلی الزامی است';
    if (form.TelPhone && form.TelPhone.length > 11) newErrors.TelPhone = 'شماره موبایل پدر یا مادر نباید بیشتر از 11 کاراکتر باشد';
    return newErrors;
  };

  const handleSendOtp = async () => {
    if (!/^09[0-9]{9}$/.test(otpPhone)) {
      toast({ title: 'خطا', description: 'شماره موبایل نامعتبر است', type: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await ApplicantOtpService.sendOtp(otpPhone);
      setOtpToken(res.token);
      setOtpCode('');
      setStep('otp-verify');
      setCountdown(120);
      toast({ title: 'کد تایید ارسال شد', description: 'کد ۶ رقمی به شماره شما ارسال شد' });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({ title: 'خطا', description: apiError.message || 'خطا در ارسال کد', type: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpValue = code ?? otpCode;
    if (otpValue.length !== 6) {
      toast({ title: 'خطا', description: 'کد تایید را وارد کنید', type: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await ApplicantOtpService.verifyOtp(otpPhone, otpValue, otpToken);
      setForm(prev => ({ ...prev, Phone: otpPhone, TelPhone: otpPhone }));
      setStep('form');
      toast({ title: 'تایید شد', description: 'شماره موبایل با موفقیت تایید شد' });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({ title: 'خطا', description: apiError.message || 'کد نامعتبر است', type: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await ApplicantOtpService.sendOtp(otpPhone);
      setOtpToken(res.token);
      setCountdown(120);
      toast({ title: 'کد مجدد ارسال شد' });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({ title: 'خطا', description: apiError.message, type: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'Aks') {
          if (value instanceof File) formData.append('Aks', value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      formData.set('status', '1');
      formData.set('tenant_id', id);

      await ApplicantService.createApplicant(formData);
      setStep('success');
      setShowFireworks(true);
      setForm(initialState);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const message = apiError.message || 'خطا در ثبت نام';
      if (message.includes('کد ملی') || message.includes('duplicate') || message.includes('تکراری')) {
        toast({ title: 'کد ملی تکراری است', description: 'این کد ملی قبلاً ثبت شده است', type: 'destructive' });
      } else if (message.toLowerCase().includes('the aks field must be a file of type: jpeg, png, jpg')) {
        toast({ title: 'خطا در آپلود عکس', description: 'فیلد عکس باید یک فایل از نوع: jpeg، png، jpg باشد', type: 'destructive' });
      } else {
        toast({ title: 'خطا', description: message, type: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-2 sm:px-6 lg:px-8 flex items-center justify-center" dir="rtl">
      <FireworksEffect show={showFireworks} onComplete={() => setShowFireworks(false)} />

      {step === 'success' ? (
        <div className="w-full max-w-md mx-auto text-center">
          <m.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ثبت نام با موفقیت انجام شد
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                ثبت نام شما در {dynamicTitle} با موفقیت ثبت شد.
                <br />
                به امید دیدار شما در کلاس‌های آموزشی
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setStep('otp-phone');
                    setOtpPhone('');
                    setOtpToken('');
                    setOtpCode('');
                    setForm(initialState);
                    setImagePreview(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                >
                  ثبت نام جدید
                </Button>
                <Link href="/">
                  <Button variant="outline" className="px-6 py-3 rounded-xl">
                    بازگشت به صفحه اصلی
                  </Button>
                </Link>
              </div>
            </div>
          </m.div>
        </div>
      ) : step === 'otp-phone' || step === 'otp-verify' ? (
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              فرم ثبت نام <span className="text-green-600 dark:text-green-400">{dynamicTitle}</span>
            </h2>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            {step === 'otp-phone' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    تایید شماره موبایل
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    لطفاً شماره موبایل خود را وارد کنید. کد تایید برای شما ارسال خواهد شد.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    maxLength={11}
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="09123456789"
                    className={`${inputClass} text-center text-lg tracking-widest`}
                  />
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading || otpPhone.length < 11}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg disabled:opacity-50"
                >
                  {loading ? 'در حال ارسال...' : 'دریافت کد تایید'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    کد تایید را وارد کنید
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    کد ۶ رقمی ارسال شده به {otpPhone} را وارد کنید
                  </p>
                </div>

                <div className="flex justify-center py-4" dir="ltr">
                  <OTPInput
                    key={otpToken}
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value);
                      if (value.length === 6) {
                        handleVerifyOtp(value);
                      }
                    }}
                    className="[&_input]:w-12 [&_input]:h-14 [&_input]:text-xl"
                    disabled={loading}
                  />
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ارسال مجدد کد تا {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      disabled={loading}
                      onClick={handleResendOtp}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      ارسال مجدد کد تایید
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('otp-phone');
                      setOtpToken('');
                      setOtpCode('');
                      setCountdown(0);
                    }}
                    className="flex-1"
                  >
                    <ArrowRight className="ml-1 h-4 w-4" />
                    ویرایش شماره
                  </Button>
                  <Button
                    onClick={() => handleVerifyOtp()}
                    disabled={loading || otpCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {loading ? 'در حال بررسی...' : 'تایید'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md sm:max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                فرم ثبت نام <span className="text-green-600 dark:text-green-400">{dynamicTitle}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                شماره تایید شده: {otpPhone}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام <span className="text-red-500">*</span></label>
                <input name="Fname" value={form.Fname} onChange={handleChange} placeholder="نام را وارد کنید" className={inputClass} />
                {errors.Fname && <span className="text-red-500 text-xs mt-1">{errors.Fname}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام خانوادگی <span className="text-red-500">*</span></label>
                <input name="Lname" value={form.Lname} onChange={handleChange} placeholder="نام خانوادگی را وارد کنید" className={inputClass} />
                {errors.Lname && <span className="text-red-500 text-xs mt-1">{errors.Lname}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام پدر <span className="text-red-500">*</span></label>
                <input name="FatherName" value={form.FatherName} onChange={handleChange} placeholder="نام پدر را وارد کنید" className={inputClass} />
                {errors.FatherName && <span className="text-red-500 text-xs mt-1">{errors.FatherName}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد ملی <span className="text-red-500">*</span></label>
                <input name="Mellicode" maxLength={10} value={form.Mellicode} onChange={handleChange} placeholder="کد ملی را وارد کنید" className={inputClass} />
                {errors.Mellicode && <span className="text-red-500 text-xs mt-1">{errors.Mellicode}</span>}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عکس <span className="text-gray-400">(اختیاری)</span></label>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 300 * 1024) {
                          toast({ title: "خطا", description: "حجم عکس باید کمتر از 300 کیلوبایت باشد", type: "destructive" });
                          e.target.value = '';
                          return;
                        }
                        const img = new window.Image();
                        img.src = URL.createObjectURL(file);
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const size = Math.min(img.width, img.height);
                          canvas.width = size;
                          canvas.height = size;
                          const offsetX = (img.width - size) / 2;
                          const offsetY = (img.height - size) / 2;
                          ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
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
                    className={inputClass}
                  />
                  {imagePreview && (
                    <div className="relative">
                      <Image src={imagePreview} alt="پیش‌نمایش عکس" width={160} height={160} className="mt-2 rounded-full w-40 h-40 object-cover border-2 border-gray-200 dark:border-gray-700 mx-auto" />
                      <button type="button" onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, Aks: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-4 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition">✕</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ تولد <span className="text-gray-400">(اختیاری)</span></label>
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
                  locale={persian_fa} calendar={persian} calendarPosition="bottom-right"
                  style={{ width: "100%" }}
                  inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره موبایل داوطلب</label>
                <input value={otpPhone} disabled className={`${inputClass} bg-gray-100 dark:bg-gray-600 cursor-not-allowed`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره موبایل پدر یا مادر<span className="text-red-500">*</span></label>
                <input name="TelPhone" maxLength={11} value={form.TelPhone} onChange={handleChange} placeholder="شماره موبایل پدر یا مادر را وارد کنید" className={inputClass} />
                {errors.TelPhone && <span className="text-red-500 text-xs mt-1">{errors.TelPhone}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">استان <span className="text-red-500">*</span></label>
                <SingleSelectCombobox options={provinces.map(p => ({ value: p.name, label: p.name }))} value={form.Ostan} onChange={handleProvinceChange} placeholder="استان را انتخاب کنید" emptyMessage="استانی یافت نشد" />
                {errors.Ostan && <span className="text-red-500 text-xs mt-1">{errors.Ostan}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شهر <span className="text-red-500">*</span></label>
                <SingleSelectCombobox options={cities.map(c => ({ value: c.name, label: c.name }))} value={form.City} onChange={handleCityChange} placeholder="شهر را انتخاب کنید" emptyMessage="شهری یافت نشد" searchable={true} />
                {errors.City && <span className="text-red-500 text-xs mt-1">{errors.City}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">روستا <span className="text-gray-400">(اختیاری)</span></label>
                <input name="Vilage" value={form.Vilage} onChange={handleChange} placeholder="روستا را وارد کنید" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت سلامت <span className="text-gray-400">(اختیاری)</span></label>
                {isTypingHealthDetails ? (
                  <div className="flex items-start gap-2">
                    <input name="Health" value={form.Health} onChange={handleChange} placeholder="توضیحات بیماری را وارد کنید" className={inputClass} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setIsTypingHealthDetails(false); setForm(prev => ({ ...prev, Health: '' })); }} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 px-2 py-3 mt-0.5">لغو</Button>
                  </div>
                ) : (
                  <SingleSelectCombobox options={healthStatusOptions} value={form.Health === 'سلامت کامل' ? 'سلامت کامل' : ''} onChange={(value) => { if (value === 'بیمار') { setForm(prev => ({ ...prev, Health: '' })); setIsTypingHealthDetails(true); } else { setForm(prev => ({ ...prev, Health: value })); setIsTypingHealthDetails(false); } }} placeholder="وضعیت سلامت را انتخاب کنید" emptyMessage="گزینه ای یافت نشد" />
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس <span className="text-gray-400">(اختیاری)</span></label>
                <input name="Adress" value={form.Adress} onChange={handleChange} placeholder="آدرس را وارد کنید" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پایه تحصیلی <span className="text-red-500">*</span></label>
                <SingleSelectCombobox options={educationLevels} value={form.Degree} onChange={(value) => setForm(prev => ({ ...prev, Degree: value }))} placeholder="پایه تحصیلی را انتخاب کنید" emptyMessage="پایه تحصیلی یافت نشد" />
                {errors.Degree && <span className="text-red-500 text-xs mt-1">{errors.Degree}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">معرف <span className="text-gray-400">(اختیاری)</span></label>
                <input name="Referer" value={form.Referer} onChange={handleChange} placeholder="نام معرف را وارد کنید" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات <span className="text-gray-400">(اختیاری)</span></label>
                <textarea name="Description" value={form.Description} onChange={handleChange} placeholder="توضیحات را وارد کنید" className={`${inputClass} min-h-[60px]`} />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('otp-verify')} className="px-4 py-3 rounded-xl">
                  <ArrowRight className="ml-1 h-4 w-4" /> بازگشت
                </Button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg transition mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600">
                  {loading ? 'در حال ثبت...' : 'ثبت نام'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


