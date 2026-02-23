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
import { format as uniqueDateStringFormatter, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const CHART_ORDER_STATUS_LABELS = {
  pending: { label: 'Pending', color: 'hsl(var(--chart-1))' },
  approved: { label: 'Approved', color: 'hsl(var(--chart-2))' },
  processing: { label: 'Processing', color: 'hsl(var(--chart-3))' },
  packaging: { label: 'Packaging', color: 'hsl(var(--chart-4))' },
  'send for delivery': { label: 'Out for Delivery', color: 'hsl(var(--chart-5))' },
  delivered: { label: 'Delivered', color: 'hsl(var(--primary))' },
  canceled: { label: 'Canceled', color: 'hsl(var(--destructive))' },
};

const CHART_PAYMENT_METHOD_LABELS = {
  cod: { label: 'Cash on Delivery', color: 'hsl(var(--chart-1))' },
  mobile_banking: { label: 'Direct Payment', color: 'hsl(var(--chart-2))' },
};

const dashboardChartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  borderColor: 'hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

const dashboardChartItemTextStyle = {
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

interface DashboardChartsProps {
  revenueChartData: any[];
  allOrders: any[];
  isLoading: boolean;
  t: any;
}

export default function DashboardCharts({ revenueChartData, allOrders, isLoading, t }: DashboardChartsProps) {
  const [selectedDisplayMonth, setSelectedDisplayMonth] = useState(new Date());

  const paymentMethodAnalyticsData = useMemo(() => {
    const paymentMethodSalesTotalsMap = allOrders
      .filter(orderRecordItem => orderRecordItem.status !== 'canceled')
      .reduce((accMap, orderRecordItem) => {
        const methodKeyString = orderRecordItem.payment_method;
        accMap[methodKeyString] = (accMap[methodKeyString] || 0) + orderRecordItem.total;
        return accMap;
      }, {} as Record<string, number>);

    return Object.entries(paymentMethodSalesTotalsMap).map(([methodKeyString, totalSumValue]) => ({
      name: CHART_PAYMENT_METHOD_LABELS[methodKeyString as keyof typeof CHART_PAYMENT_METHOD_LABELS]?.label || methodKeyString,
      value: totalSumValue,
      fill: CHART_PAYMENT_METHOD_LABELS[methodKeyString as keyof typeof CHART_PAYMENT_METHOD_LABELS]?.color || '#8884d8',
    }));
  }, [allOrders]);

  const orderStatusAnalyticsData = useMemo(() => {
    const monthStartBound = startOfMonth(selectedDisplayMonth);
    const monthEndBound = endOfMonth(selectedDisplayMonth);
    const monthFilteredOrdersList = allOrders.filter(orderRecordItem => isWithinInterval(new Date(orderRecordItem.created_at), { start: monthStartBound, end: monthEndBound }));

    const statusFrequencyCountsMap = monthFilteredOrdersList.reduce((accMap, orderRecordItem) => {
      const statusKeyString = orderRecordItem.status.toLowerCase();
      accMap[statusKeyString] = (accMap[statusKeyString] || 0) + 1;
      return accMap;
    }, {} as Record<string, number>);

    return Object.entries(statusFrequencyCountsMap)
      .map(([statusKeyString, frequencyValue]) => ({
        name: CHART_ORDER_STATUS_LABELS[statusKeyString as keyof typeof CHART_ORDER_STATUS_LABELS]?.label || statusKeyString,
        value: frequencyValue,
        fill: CHART_ORDER_STATUS_LABELS[statusKeyString as keyof typeof CHART_ORDER_STATUS_LABELS]?.color || '#8884d8',
      }))
      .filter(entryRecord => entryRecord.name !== 'Canceled');
  }, [allOrders, selectedDisplayMonth]);

  const availableMonthDropdownOptions = useMemo(() => [...Array(6)].map((_, indexOffset) => subMonths(new Date(), indexOffset)), []);
  const monthlyTotalOrdersSum = orderStatusAnalyticsData.reduce((sum, entryRecord) => sum + entryRecord.value, 0);
  const lifetimeTotalSalesSum = paymentMethodAnalyticsData.reduce((sum, entryRecord) => sum + entryRecord.value, 0);

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
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip 
                  contentStyle={dashboardChartTooltipStyle}
                  itemStyle={dashboardChartItemTextStyle}
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
            {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : paymentMethodAnalyticsData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {t.noSales}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={dashboardChartTooltipStyle}
                    itemStyle={dashboardChartItemTextStyle}
                    formatter={(val: number) => `৳ ${val.toFixed(2)}`}
                  />
                  <Pie
                    data={paymentMethodAnalyticsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    strokeWidth={0}
                  >
                    {paymentMethodAnalyticsData.map((dataEntryRecord, entryIdx) => (
                      <Cell key={`cell-payment-${entryIdx}`} fill={dataEntryRecord.fill} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
                  {lifetimeTotalSalesSum > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {`৳${(lifetimeTotalSalesSum / 1000).toFixed(0)}k`}
                    </text>
                  )}
                  {lifetimeTotalSalesSum > 0 && (
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
            <Select onValueChange={(valString) => setSelectedDisplayMonth(new Date(valString))} defaultValue={uniqueDateStringFormatter(selectedDisplayMonth, 'yyyy-MM-dd')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.selectMonth} />
              </SelectTrigger>
              <SelectContent>
                {availableMonthDropdownOptions.map(mInstance => (
                  <SelectItem key={mInstance.toISOString()} value={mInstance.toISOString()}>
                    {uniqueDateStringFormatter(mInstance, 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : orderStatusAnalyticsData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {t.noOrdersThisMonth}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={dashboardChartTooltipStyle}
                    itemStyle={dashboardChartItemTextStyle}
                  />
                  <Pie
                    data={orderStatusAnalyticsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    strokeWidth={0}
                  >
                    {orderStatusAnalyticsData.map((dataEntryRecord, entryIdx) => (
                      <Cell key={`cell-status-${entryIdx}`} fill={dataEntryRecord.fill} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
                  {monthlyTotalOrdersSum > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {monthlyTotalOrdersSum}
                    </text>
                  )}
                  {monthlyTotalOrdersSum > 0 && (
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
