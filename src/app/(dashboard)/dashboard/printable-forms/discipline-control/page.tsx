"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/context/auth.context";
import { CurrentlyStudyingStudentsService, type CurrentlyStudyingStudent } from "@/lib/services/currently-studying-students.service";
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

const hygieneItems = [
  "ناخن‌ها", "موها", "لباس", "کفش", "دست‌ها",
  "دهان و دندان", "شانه", "دستمال", "بوی بدن",
];

export default function DisciplineControlPage() {
  const { user, accessToken } = useAuth();
  const [students, setStudents] = useState<CurrentlyStudyingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const printRef = useRef<HTMLDivElement>(null);

  const tenantId = user?.tenant_id ?? 7;

  const adminFullName = [user?.fname, user?.lname].filter(Boolean).join(" ").trim();

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    CurrentlyStudyingStudentsService.getAllCurrentlyStudyingStudents(tenantId, undefined, accessToken)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data as { data?: CurrentlyStudyingStudent[] }).data ?? [];
        const excludedNames = new Set<string>();
        if (adminFullName) excludedNames.add(adminFullName);
        const filtered = list.filter(
          (s) => !excludedNames.has(`${s.Fname} ${s.Lname}`.trim())
        );
        setStudents(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, tenantId, adminFullName]);

  const sortedStudents = useMemo(() => {
    const list = [...students];
    const col = (s: CurrentlyStudyingStudent, f: string) => {
      switch (f) {
        case "name": return `${s.Fname} ${s.Lname}`.trim();
        case "lname": return s.Lname || "";
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
  }, [students, sortField, sortDir]);

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
      .legend { font-size: 8pt; margin-top: 0.15cm; color: #444; }
      .section-title { font-size: 11pt; font-weight: bold; margin: 0.3cm 0 0.2cm 0; border-bottom: 1.5px solid #555; padding-bottom: 0.05cm; }
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>فرم کنترل انضباطی</title></head><body>`);
    win.document.write(printContent.innerHTML);
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

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">فرم کنترل انضباطی</h1>
            <p className="text-muted-foreground">تعداد قرآن‌آموزان: {sortedStudents.length} نفر</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">مرتب‌سازی:</span>
              <Select value={sortField} onValueChange={(v) => setSortField(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">نام و نام خانوادگی</SelectItem>
                  <SelectItem value="lname">نام خانوادگی</SelectItem>
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
            <Button onClick={handlePrint}>
              <Printer className="ml-2 h-4 w-4" />
              چاپ فرم
            </Button>
          </div>
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
                فرم کنترل انضباطی
              </div>
              <div style={{ fontSize: "9pt", marginTop: "0.1cm", color: "#333" }}>
                حوزه علمیه — سال تحصیلی ۱۴۰۶-۱۴۰۵
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5cm", marginTop: "0.25cm", fontSize: "9.5pt", flexWrap: "wrap" }}>
                <span><strong>تاریخ:</strong> <span style={{ display: "inline-block", minWidth: "2.5cm", borderBottom: "1px solid #000", height: "1.1em" }}></span></span>
                <span><strong>روز:</strong> <span style={{ display: "inline-block", minWidth: "1.5cm", borderBottom: "1px solid #000", height: "1.1em" }}></span></span>
                <span><strong>مربی:</strong> <span style={{ display: "inline-block", minWidth: "2.5cm", borderBottom: "1px solid #000", height: "1.1em" }}></span></span>
              </div>
            </div>

            <div className="section-title" style={{ fontSize: "11pt", fontWeight: "bold", margin: "0.3cm 0 0.2cm 0", borderBottom: "1.5px solid #555", paddingBottom: "0.05cm" }}>
              ✦ وضعیت بهداشت و نظافت شخصی
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
              <thead>
                <tr>
                  <th style={{ width: "0.8cm", border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>ردیف</th>
                  <th style={{ width: "4cm", border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>نام و نام خانوادگی</th>
                  {hygieneItems.map((item) => (
                    <th key={item} style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>{item}</th>
                  ))}
                  <th style={{ width: "1.2cm", border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>نمره<br />(۲۰)</th>
                  <th style={{ width: "2.2cm", border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", background: "#e0e0e0", fontWeight: "bold", fontSize: "8.5pt" }}>توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, index) => (
                  <tr key={student.id} style={index % 2 === 1 ? { background: "#f5f5f5" } : {}}>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}>{index + 1}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", verticalAlign: "middle", padding: "0.15cm 0.08cm", paddingRight: "0.2cm", fontWeight: "bold" }}>
                      {student.Fname} {student.Lname}
                    </td>
                    {hygieneItems.map((_, h) => (
                      <td key={h} style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm", width: "1.2cm" }}></td>
                    ))}
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}></td>
                    <td style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle", padding: "0.15cm 0.08cm" }}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="legend" style={{ fontSize: "8pt", marginTop: "0.15cm", color: "#444" }}>
              راهنما: ✓ = قابل قبول &nbsp;|&nbsp; △ = نیاز به تذکر &nbsp;|&nbsp; ✕ = نیاز به پیگیری
            </div>

            <div className="footer" style={{ marginTop: "0.4cm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", paddingTop: "0.2cm", borderTop: "1px solid #999" }}>
              <div className="signature" style={{ display: "flex", alignItems: "center", gap: "0.3cm" }}>
                <span>امضاء مربی:</span>
                <span className="sig-line" style={{ display: "inline-block", width: "3cm", borderBottom: "1px solid #000", height: "1em" }}></span>
              </div>
              <div className="signature" style={{ display: "flex", alignItems: "center", gap: "0.3cm" }}>
                <span>امضاء مدیر:</span>
                <span className="sig-line" style={{ display: "inline-block", width: "3cm", borderBottom: "1px solid #000", height: "1em" }}></span>
              </div>
              <div className="note" style={{ color: "#444", fontSize: "8pt" }}>نظافت شخصی — هفته‌نامه</div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
