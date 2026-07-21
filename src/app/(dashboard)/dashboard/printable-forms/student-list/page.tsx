"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/context/auth.context";
import type { Student } from "@/lib/services/student.service";
import { optimizedClassService, type OptimizedClass } from "@/lib/services/optimizedClass.service";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Loader2, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function StudentListPage() {
  const { user, accessToken } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<OptimizedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [classStudentIds, setClassStudentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const tenantId = user?.tenant_id ?? 7;

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [studentRes, classRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/students?status=در حال تحصیل&tenant_id=${tenantId}&per_page=1000&with=tenant`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        }).then(r => r.json()),
        optimizedClassService.getAllSimple(accessToken),
      ]);

      const studentList: Student[] = studentRes?.data?.data ?? [];
      const activeClasses = (Array.isArray(classRes) ? classRes : []).filter((c) => c.status);
      setStudents(studentList);
      setClasses(activeClasses);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClassChange = async (value: string) => {
    setSelectedClassId(value);
    if (value === "all") {
      setClassStudentIds(new Set());
      return;
    }
    const classId = parseInt(value, 10);
    try {
      const date = new Date().toISOString().split("T")[0];
      const classStudents = await optimizedClassService.getStudents(classId, date, accessToken!);
      const studentEntries = Object.values(classStudents.data) as Array<{ student: { id: number } }>;
      const ids = studentEntries.map((s) => s.student.id);
      setClassStudentIds(new Set(ids));
    } catch {
      setClassStudentIds(new Set());
    }
  };

  const getSelectedClass = () => classes.find((c) => c.id.toString() === selectedClassId);

  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const displayStudents = selectedClassId === "all"
    ? students
    : students.filter((s) => classStudentIds.has(s.id));

  const adminFullName = [user?.fname, user?.lname].filter(Boolean).join(" ").trim();
  const filteredStudents = displayStudents.filter((s) => {
    const fullName = `${s.Fname} ${s.Lname}`.trim();
    return fullName !== adminFullName;
  });

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    const col = (s: Student, f: string) => {
      switch (f) {
        case "name": return `${s.Fname} ${s.Lname}`;
        case "lname": return s.Lname || "";
        case "father": return s.FatherName || "";
        case "mellicode": return s.Mellicode || "";
        case "degree": return s.degree || "";
        default: return "";
      }
    };
    list.sort((a, b) => {
      const va = col(a, sortField);
      const vb = col(b, sortField);
      const cmp = va.localeCompare(vb, "fa");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredStudents, sortField, sortDir]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const style = document.createElement("style");
    style.textContent = `
      @page { size: A4; margin: 1cm 0.7cm; }
      body { font-family: 'Pinar', 'IRANSansX', 'B Yekan', 'Tahoma', sans-serif; font-size: 9.5pt; color: #000; background: #fff; padding: 0; margin: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; }
      table th, table td { border: 1px solid #000; text-align: center; vertical-align: middle; padding: 0.15cm 0.08cm; }
      table thead th { background: #d0d0d0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; font-size: 8.5pt; }
      .no-print { display: none !important; }
      .header { text-align: center; padding-bottom: 0.3cm; border-bottom: 2.5px solid #000; margin-bottom: 0.3cm; }
      .school { font-size: 20pt; font-weight: bold; letter-spacing: 1px; }
      .form-title { font-size: 16pt; font-weight: bold; margin-top: 0.05cm; }
      .footer { margin-top: 0.4cm; display: flex; justify-content: space-between; font-size: 8.5pt; padding-top: 0.2cm; border-top: 1px solid #999; }
      .sig-line { display: inline-block; width: 3cm; border-bottom: 1px solid #000; height: 1em; }
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>لیست قرآن‌آموزان</title></head><body>`);
    win.document.write(printContent.innerHTML.replace(/ class="no-print"/g, ' style="display:none!important"'));
    win.document.write("</body></html>");
    win.document.head.appendChild(style);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">خطا در دریافت اطلاعات: {error}</p>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const selectedClass = getSelectedClass();

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="no-print flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">لیست قرآن‌آموزان</h1>
            <p className="text-muted-foreground">به تفکیک کلاس / درس</p>
          </div>
          <Button onClick={handlePrint} disabled={sortedStudents.length === 0}>
            <Printer className="ml-2 h-4 w-4" />
            چاپ لیست
          </Button>
        </div>

        <div className="no-print flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>انتخاب کلاس</Label>
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="انتخاب کلاس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه قرآن‌آموزان</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.dars?.title || `کلاس ${c.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مرتب‌سازی</Label>
            <div className="flex gap-2">
              <Select value={sortField} onValueChange={(v) => setSortField(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">نام و نام خانوادگی</SelectItem>
                  <SelectItem value="lname">نام خانوادگی</SelectItem>
                  <SelectItem value="father">نام پدر</SelectItem>
                  <SelectItem value="mellicode">کد ملی</SelectItem>
                  <SelectItem value="degree">پایه تحصیلی</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={sortDir === "asc" ? "صعودی" : "نزولی"}
              >
                <ArrowUpDown className={`h-4 w-4 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground self-end pb-1">
            تعداد: {sortedStudents.length} نفر
          </p>
        </div>

        <div ref={printRef}>
          <div style={{
            maxWidth: "19cm", margin: "0 auto", padding: "0.6cm 0.5cm",
            border: "2.5px solid #000", background: "#fff",
            fontFamily: "'Pinar', 'IRANSansX', 'B Yekan', 'Tahoma', sans-serif",
            fontSize: "9.5pt", color: "#000",
          }}>
            <div className="header" style={{ textAlign: "center", paddingBottom: "0.3cm", borderBottom: "2.5px solid #000", marginBottom: "0.3cm" }}>
              <div className="school" style={{ fontSize: "20pt", fontWeight: "bold", letterSpacing: "1px" }}>
                {user?.tenant?.title || "مکتب‌خانه"}
              </div>
              <div className="form-title" style={{ fontSize: "16pt", fontWeight: "bold", marginTop: "0.05cm" }}>
                لیست قرآن‌آموزان
              </div>
              <div style={{ fontSize: "9pt", marginTop: "0.1cm", color: "#333" }}>
                حوزه علمیه — سال تحصیلی ۱۴۰۶-۱۴۰۵
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5cm", marginTop: "0.25cm", fontSize: "9.5pt", flexWrap: "wrap" }}>
                <span><strong>کلاس / درس:</strong> {selectedClass ? selectedClass.dars?.title : "همه"}</span>
                <span><strong>تاریخ:</strong> <span style={{ display: "inline-block", minWidth: "2.5cm", borderBottom: "1px solid #000", height: "1.1em" }}></span></span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
              <thead>
                <tr>
                  <th style={{ width: "0.8cm", border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>ردیف</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>نام</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>نام خانوادگی</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>نام پدر</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>کد ملی</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>پایه تحصیلی</th>
                  <th style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>تلفن والدین</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s, i) => (
                  <tr key={s.id} style={i % 2 === 1 ? { background: "#f5f5f5" } : {}}>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", verticalAlign: "middle", padding: "0.15cm 0.08cm", paddingRight: "0.2cm" }}>{s.Fname}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", verticalAlign: "middle", padding: "0.15cm 0.08cm", paddingRight: "0.2cm" }}>{s.Lname}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", verticalAlign: "middle", padding: "0.15cm 0.08cm", paddingRight: "0.2cm" }}>{s.FatherName}</td>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}>{s.Mellicode}</td>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}>{s.degree || ""}</td>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", direction: "ltr" }}>{s.ParentPhone || s.Phone || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="footer" style={{ marginTop: "0.4cm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", paddingTop: "0.2cm", borderTop: "1px solid #999" }}>
              <div className="signature" style={{ display: "flex", alignItems: "center", gap: "0.3cm" }}>
                <span>امضاء مربی:</span>
                <span className="sig-line" style={{ display: "inline-block", width: "3cm", borderBottom: "1px solid #000", height: "1em" }}></span>
              </div>
              <div className="signature" style={{ display: "flex", alignItems: "center", gap: "0.3cm" }}>
                <span>امضاء مدیر:</span>
                <span className="sig-line" style={{ display: "inline-block", width: "3cm", borderBottom: "1px solid #000", height: "1em" }}></span>
              </div>
              <div className="note" style={{ color: "#444", fontSize: "8pt" }}>تعداد: {sortedStudents.length} نفر</div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
