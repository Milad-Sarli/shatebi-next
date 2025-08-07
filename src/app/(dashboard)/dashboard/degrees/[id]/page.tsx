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
  Carousel,
  CarouselContent,   
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface DegreeItem {
  id: string;
  degree: string;
  number: number;
  student: {
    Fname: string;
    Lname: string;
  };
}

export default function DegreeDetailsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [degree, setDegree] = React.useState<Degree | null>(null);
  const [loading, setLoading] = React.useState(true);
  const params = useParams();
  const id = params.id as string;

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

  const groupedStudents = React.useMemo(() => {
    const allDegrees = new Map<string, DegreeItem[]>();
    for (let i = 1; i <= 10; i++) {
      allDegrees.set(i.toString(), []);
    }

    if (!degree) return allDegrees;

    degree.items.forEach((item: DegreeItem) => {
      if (item.student && allDegrees.has(item.degree)) {
        allDegrees.get(item.degree)?.push(item);
      }
    });

    return allDegrees;
  }, [degree]);

  if (loading) {
    return <p>در حال بارگذاری...</p>;
  }

  if (!degree) {
    return <p>اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  return (
    <PageTransition>
      <Card>
        <CardHeader>
          <CardTitle>{degree.name}</CardTitle>
          <Badge>{`${degree.year}/${degree.month}`}</Badge>
        </CardHeader>
        <CardContent>
          <Carousel dir="rtl" opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-4">
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((studentDegreeNum) => {
                const studentDegree = studentDegreeNum.toString();
                const items = groupedStudents.get(studentDegree) || [];

                return (
                  <CarouselItem key={studentDegree} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="p-1">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-center">درجه {studentDegree}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          {items.length > 0 ? (
                            <ul className="space-y-2">
                              {items.map((item) => (
                                <li key={item.id} className="flex justify-between items-center">
                                  <span>{`${item.student.Fname} ${item.student.Lname}`}</span>
                                  <Badge variant="secondary">{parseFloat(item.number).toFixed(2)}</Badge>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-center text-gray-500">-</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </Card>
    </PageTransition>
  );
}