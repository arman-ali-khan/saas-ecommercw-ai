
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, PieChart as PieChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'hsl(var(--chart-1))' },
  approved: { label: 'Approved', color: 'hsl(var(--chart-2))' },
  processing: { label: 'Processing', color: 'hsl(var(--chart-3))' },
  packaging: { label: 'Packaging', color: 'hsl(var(--chart-4))' },
  'send for delivery': { label: 'Out for Delivery', color: 'hsl(var(--chart-5))' },
  delivered: { label: 'Delivered', color: 'hsl(var(--primary))' },
  canceled: { label: 'Canceled', color: 'hsl(var(--destructive))' },
};

const PAYMENT_METHOD_TYPES = {
  cod: { label: 'Cash on Delivery', color: 'hsl(var(--chart-1))' },
  mobile_banking: { label: 'Direct Payment', color: 'hsl(var(--chart-2))' },
};

interface DashboardChartsProps {
  revenueChartData: any[];
  allOrders: any[];
  isLoading: boolean;
  t: any;
}

export default function DashboardCharts({ revenueChartData, allOrders, isLoading, t }: DashboardChartsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const paymentMethodData = useMemo(() => {
    const paymentMethodSales = allOrders
      .filter(o => o.status !== 'canceled')
      .reduce((acc, order) => {
        const method = order.payment_method;
        acc[method] = (acc[method] || 0) + order.total;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(paymentMethodSales).map(([method, total]) => ({
      name: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.label || method,
      value: total,
      fill: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.color || '#8884d8',
    }));
  }, [allOrders]);

  const orderStatusData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const ordersForMonth = allOrders.filter(o => isWithinInterval(new Date(o.created_at), { start, end }));

    const statusCounts = ordersForMonth.reduce((acc, order) => {
      const status = order.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status,
        value: count,
        fill: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.color || '#8884d8',
      }))
      .filter(item => item.name !== 'Canceled');
  }, [allOrders, selectedMonth]);

  const monthOptions = [...Array(6)].map((_, i) => subMonths(new Date(), i));
  const totalOrdersForMonth = orderStatusData.reduce((sum, item) => sum + item.value, 0);
  const totalSales = paymentMethodData.reduce((sum, item) => sum + item.value, 0);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  const itemStyle = {
    color: 'hsl(var(--foreground))',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" /> {t.revenue7Days}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={revenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={itemStyle}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.salesByPayment}</CardTitle>
            <CardDescription>{t.salesByPaymentDesc}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : paymentMethodData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {t.noSales}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={itemStyle}
                    formatter={(value: number) => `৳ ${value.toFixed(2)}`}
                  />
                  <Pie
                    data={paymentMethodData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    strokeWidth={0}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
                  {totalSales > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {`৳${(totalSales / 1000).toFixed(0)}k`}
                    </text>
                  )}
                  {totalSales > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" dy="20" className="fill-muted-foreground text-sm">
                      {t.totalSales}
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.orderStatus}</CardTitle>
              <CardDescription>{t.orderStatusDesc}</CardDescription>
            </div>
            <Select onValueChange={(value) => setSelectedMonth(new Date(value))} defaultValue={format(selectedMonth, 'yyyy-MM-dd')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.selectMonth} />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.toISOString()} value={month.toISOString()}>
                    {format(month, 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : orderStatusData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {t.noOrdersThisMonth}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    itemStyle={itemStyle}
                  />
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    strokeWidth={0}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
                  {totalOrdersForMonth > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {totalOrdersForMonth}
                    </text>
                  )}
                  {totalOrdersForMonth > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" dy="20" className="fill-muted-foreground text-sm">
                      {t.totalOrders}
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
