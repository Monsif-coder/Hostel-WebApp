import React from 'react';
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";

// Helper to get month name from a Date
const MONTHS = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

// Chart configuration
const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "#2563eb", // blue-600
  },
};

export function VisitorsAreaChart({ bookings = [] }) {
  // Aggregate bookings into visitors per month (last 12 months)
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const visitorsMap = months.reduce((acc, m) => {
    acc[m.key] = 0;
    return acc;
  }, {});

  bookings.forEach(b => {
    // Expect booking.checkInDate to be an ISO string or Date
    const checkIn = b.checkInDate ? new Date(b.checkInDate) : null;
    if (!checkIn || Number.isNaN(checkIn.getTime())) return;

    const key = `${checkIn.getFullYear()}-${checkIn.getMonth() + 1}`;
    if (visitorsMap[key] !== undefined) {
      // Use persons if present, otherwise count as 1
      visitorsMap[key] += (b.persons || 1);
    }
  });

  const visitorsData = months.map(m => ({ month: m.label, visitors: visitorsMap[m.key] || 0 }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Visitor Trends</CardTitle>
        <CardDescription>
          Showing visitors for the last 12 months
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart
              data={visitorsData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" config={chartConfig} />}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.2}
            />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium text-green-600">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-gray-500 flex items-center gap-2 leading-none">
              January - June 2025
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
