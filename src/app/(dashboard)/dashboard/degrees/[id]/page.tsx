"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { Degree, DegreeService } from "@/lib/services/degree.service";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { Badge } from "@/components/ui/badge";
import { useParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export default function DegreeDetailsPage() {
  const { accessToken } = useAuth();
  const [degree, setDegree] = React.useState<Degree | null>(null);
  const [loading, setLoading] = React.useState(true);
  const params = useParams();
  const id = params.id as string;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDegree, setSelectedDegree] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (!accessToken || !id) return;

    const fetchDegreeDetails = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await DegreeService.getDegreeById(id, accessToken);
        setDegree(response);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات درجه بندی");
        console.error(error);
        setDegree(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchDegreeDetails();
  }, [accessToken, id]);

  const filteredAndSortedItems = React.useMemo(() => {
    if (!degree?.items) return [];

    let items = [...degree.items];

    if (selectedDegree !== "all") {
      items = items.filter(item => item.degree === selectedDegree);
    }

    if (searchTerm) {
      items = items.filter(item =>
        item.student && `${item.student.Fname} ${item.student.Lname}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    items.sort((a, b) => parseInt(a.degree, 10) - parseInt(b.degree, 10));

    return items;
  }, [degree, searchTerm, selectedDegree]);

  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedItems, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);

  if (loading) {
    return <p className="text-center pt-10">در حال بارگذاری...</p>;
  }

  if (!degree) {
    return <p className="text-center pt-10">اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  return (
    <PageTransition>
      <Card dir="rtl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <CardTitle>{degree.name}</CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                لیست دانش آموزان و نمرات کسب شده در این درجه بندی
              </p>
            </div>
            <Badge variant="outline" className="mt-4 md:mt-0">{`ماه ${degree.month} سال ${degree.year}`}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="جستجوی دانش آموز..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
            <Select value={selectedDegree} onValueChange={(value) => {
              setSelectedDegree(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="فیلتر بر اساس درجه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه درجات</SelectItem>
                {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(d => (
                  <SelectItem key={d} value={d}>درجه {d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام دانش آموز</TableHead>
                  <TableHead className="text-right">درجه</TableHead>
                  <TableHead className="text-right">نمره</TableHead>
                  <TableHead className="text-right">پیشرفت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => {
                    const progress =
                      item.last_degree != null
                        ? parseFloat(item.number) -
                          parseFloat(item.last_degree)
                        : null;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.student
                            ? `${item.student.Fname} ${item.student.Lname}`
                            : "-"}
                        </TableCell>
                        <TableCell>{item.degree}</TableCell>
                        <TableCell>
                          {parseFloat(item.number).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {progress !== null ? (
                            <span
                              className={
                                progress >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                              dir="ltr"
                            >
                              {progress >= 0 ? "+" : "-"}
                              {Math.abs(progress).toFixed(2)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      نتیجه ای یافت نشد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              قبلی
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحه {currentPage} از {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              بعدی
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}