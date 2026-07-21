"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { FileText, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface FormCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const forms: FormCard[] = [
  {
    title: "فرم کنترل انضباطی",
    description: "فرم چاپی کنترل انضباطی قرآن‌آموزان شامل نمرات بهداشت فردی و امتیاز",
    icon: ClipboardCheck,
    href: "/dashboard/printable-forms/discipline-control",
  },
  {
    title: "فرم‌های بیشتر به زودی",
    description: "فرم‌های چاپی بیشتری در حال اضافه شدن هستند",
    icon: FileText,
    href: "#",
  },
];

export default function PrintableFormsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">فرم‌های چاپی</h1>
          <p className="text-muted-foreground">فرم‌های مورد نظر را انتخاب کنید</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const Icon = form.icon;
            return (
              <Card key={form.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription>{form.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={form.href}>
                      <FileText className="ml-2 h-4 w-4" />
                      مشاهده فرم
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
