import React from 'react';
import { TrendingUp, TrendingDown, Users, Home, Calendar } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// Stat card component for different booking metrics
export function BookingStats({ metrics = {} }) {
  // Provide sensible fallbacks
  const totalBookings = metrics.totalBookings ?? 0;
  const roomOccupancy = metrics.occupancyRate ?? 0; // percent
  const totalGuests = metrics.totalGuests ?? metrics.totalBookings ? metrics.totalBookings * 2 : 0; // guess if not provided

  const stats = [
    {
      title: "Total Bookings",
      value: totalBookings,
      change: metrics.totalBookingsChange || '',
      trending: metrics.totalBookingsChange && metrics.totalBookingsChange.startsWith('-') ? 'down' : 'up',
      description: "vs last month",
      icon: Calendar
    },
    {
      title: "Room Occupancy",
      value: `${roomOccupancy}%`,
      change: metrics.occupancyChange || '',
      trending: metrics.occupancyChange && metrics.occupancyChange.startsWith('-') ? 'down' : 'up',
      description: "vs last month",
      icon: Home
    },
    {
      title: "Total Guests",
      value: totalGuests,
      change: metrics.totalGuestsChange || '',
      trending: metrics.totalGuestsChange && metrics.totalGuestsChange.startsWith('-') ? 'down' : 'up',
      description: "vs last month",
      icon: Users
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs">
              {stat.change ? (
                stat.trending === "up" ? (
                  <>
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    <span className="text-green-600">{stat.change}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    <span className="text-red-600">{stat.change}</span>
                  </>
                )
              ) : null}
              <span className="text-gray-500 ml-1">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
