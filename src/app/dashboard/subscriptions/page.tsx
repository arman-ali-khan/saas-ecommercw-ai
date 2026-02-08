'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mock data, in a real app this would come from your user data
const subscriptions = [
  { id: '1', user: 'আরিফুল ইসলাম', plan: 'Pro', status: 'Active', nextBilling: '2024-08-25' },
  { id: '2', user: 'সুমাইয়া খাতুন', plan: 'Free', status: 'Active', nextBilling: 'N/A' },
  { id: '3', user: 'রাশেদ আহমেদ', plan: 'Pro', status: 'Canceled', nextBilling: '2024-07-30' },
  { id: '4', user: 'জান্নাতুল ফেরদৌস', plan: 'Enterprise', status: 'Active', nextBilling: '2025-01-01' },
];

export default function SubscriptionsAdminPage() {
    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
        switch (status) {
          case 'Active':
            return 'default';
          case 'Canceled':
            return 'destructive';
          default:
            return 'secondary';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>View and manage all user subscriptions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Next Billing Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.map(sub => (
                            <TableRow key={sub.id}>
                                <TableCell className="font-medium">{sub.user}</TableCell>
                                <TableCell><Badge variant={sub.plan === 'Pro' ? 'default' : 'secondary'}>{sub.plan}</Badge></TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge>
                                </TableCell>
                                <TableCell>{sub.nextBilling}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
