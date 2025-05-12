'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import { ApplicantService } from '@/lib/services/applicant.service';
import { useAuth } from '@/lib/context/auth.context';
import { locationService, Province, City } from '@/lib/services/location.service';
import { SingleSelectCombobox } from '@/components/ui/Combobox';

interface FormState {
  Fname: string;
  Lname: string;
  Aks: string;
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
  { value: 'یازدهم', label: 'یازدهم' },
  { value: 'دوازدهم', label: 'دوازدهم' },
  { value: 'دانشگاه', label: 'دانشگاه' },
];

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);

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
    if (!form.Birthday) newErrors.Birthday = 'تاریخ تولد الزامی است';
    if (!form.Phone) newErrors.Phone = 'شماره موبایل الزامی است';
    if (!form.Ostan) newErrors.Ostan = 'استان الزامی است';
    if (!form.City) newErrors.City = 'شهر الزامی است';
    if (!form.Adress) newErrors.Adress = 'آدرس الزامی است';
    if (!form.Degree) newErrors.Degree = 'پایه تحصیلی الزامی است';
    if (!form.Health) newErrors.Health = 'وضعیت سلامت الزامی است';
    return newErrors;
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
      if (!accessToken || !user) throw new Error('شما وارد نشده‌اید');
      await ApplicantService.createApplicant({
        ...form,
        status: 1,
        tenant_id: 1,
      }, accessToken);
      alert('ثبت نام با موفقیت انجام شد');
      setForm(initialState);
    } catch (error: any) {
      alert(error.message || 'خطا در ثبت نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl mt-10 border border-gray-100" dir="rtl">
      <h2 className="text-3xl font-extrabold mb-10 text-center text-black">فرم ثبت نام</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">نام</label>
          <input name="Fname" value={form.Fname} onChange={handleChange} placeholder="نام را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
          {errors.Fname && <span className="text-red-500 text-sm mt-1">{errors.Fname}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">نام خانوادگی</label>
          <input name="Lname" value={form.Lname} onChange={handleChange} placeholder="نام خانوادگی را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
          {errors.Lname && <span className="text-red-500 text-sm mt-1">{errors.Lname}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">نام پدر</label>
          <input name="FatherName" value={form.FatherName} onChange={handleChange} placeholder="نام پدر را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">کد ملی</label>
          <input name="Mellicode" maxLength={10}  value={form.Mellicode} onChange={handleChange} placeholder="کد ملی را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
          {errors.Mellicode && <span className="text-red-500 text-sm mt-1">{errors.Mellicode}</span>}
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <label className="text-base font-bold mb-1">تاریخ تولد</label>
          <div className="w-full">
            <DatePicker onChange={(date: Date) => {
              const d = new Date(date);
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              setForm({ ...form, Birthday: `${yyyy}-${mm}-${dd}` });
            }} />
            {form.Birthday && (
              <div className="text-xs text-gray-500 mt-2">{form.Birthday}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">شماره موبایل</label>
          <input name="Phone" maxLength={11} value={form.Phone} onChange={handleChange} placeholder="شماره موبایل را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
          {errors.Phone && <span className="text-red-500 text-sm mt-1">{errors.Phone}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">تلفن ثابت</label>
          <input name="TelPhone" value={form.TelPhone} onChange={handleChange} placeholder="تلفن ثابت را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">استان</label>
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
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">شهر</label>
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
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">روستا</label>
          <input name="Vilage" value={form.Vilage} onChange={handleChange} placeholder="روستا را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-base font-bold mb-1">آدرس</label>
          <input name="Adress" value={form.Adress} onChange={handleChange} placeholder="آدرس را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">پایه تحصیلی</label>
          <SingleSelectCombobox
            options={educationLevels}
            value={form.Degree}
            onChange={(value) => setForm(prev => ({ ...prev, Degree: value }))}
            placeholder="پایه تحصیلی را انتخاب کنید"
            emptyMessage="پایه تحصیلی یافت نشد"
          />
          {errors.Degree && <span className="text-red-500 text-sm mt-1">{errors.Degree}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">معرف</label>
          <input name="Referer" value={form.Referer} onChange={handleChange} placeholder="نام معرف را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold mb-1">وضعیت سلامت</label>
          <input name="Health" value={form.Health} onChange={handleChange} placeholder="وضعیت سلامت را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-base font-bold mb-1">توضیحات</label>
          <textarea name="Description" value={form.Description} onChange={handleChange} placeholder="توضیحات را وارد کنید" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition min-h-[60px]" />
        </div>
       
        <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl text-lg font-bold hover:bg-blue-700 transition mt-4 shadow-lg" disabled={loading}>
          {loading ? 'در حال ثبت...' : 'ثبت نام'}
        </button>
      </form>
    </div>
  );
}
