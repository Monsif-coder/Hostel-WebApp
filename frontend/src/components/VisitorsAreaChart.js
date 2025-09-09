import React from 'react';
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

// Data for the visitors chart
const visitorsData = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 305 },
  { month: "March", visitors: 237 },
  { month: "April", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "June", visitors: 214 },
];

// Chart configuration
const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "#2563eb", // blue-600
  },
};

export function VisitorsAreaChart() {
  // Use responsive sizing
  const [chartWidth, setChartWidth] = React.useState(window.innerWidth - 80); // Subtract padding
  
  // Update chart width when window resizes
  React.useEffect(() => {
    const handleResize = () => {
      setChartWidth(window.innerWidth - 80);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Visitor Trends</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={visitorsData}
            width={chartWidth}
            height={350}
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
