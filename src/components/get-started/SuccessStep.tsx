'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { FormData } from "@/app/get-started/page";

interface SuccessStepProps {
    formData: FormData;
}

export default function SuccessStep({ formData }: SuccessStepProps) {
    return (
        <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-3 rounded-full w-fit">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="mt-4">অভিনন্দন!</CardTitle>
                <CardDescription>আপনার নতুন দোকান সফলভাবে তৈরি হয়েছে।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-left bg-muted p-4 rounded-md">
                    <p><strong>দোকানের নাম:</strong> {formData.siteName}</p>
                    <p><strong>ডোমেইন:</strong> <span className="font-mono">{formData.domain}.banglanaturals.site</span></p>
                    <p><strong>প্ল্যান:</strong> <span className="capitalize">{formData.plan}</span></p>
                </div>
                <p className="text-muted-foreground">
                    আপনার দোকান পরিচালনা করতে এবং পণ্য যোগ করা শুরু করতে, অনুগ্রহ করে আপনার অ্যাডমিন অ্যাকাউন্টের জন্য নিবন্ধন করুন।
                </p>
                <Button asChild size="lg">
                    <Link href={`/register?siteName=${encodeURIComponent(formData.siteName)}&domain=${encodeURIComponent(formData.domain)}&plan=${formData.plan}&siteDescription=${encodeURIComponent(formData.siteDescription)}`}>
                        অ্যাডমিন অ্যাকাউন্ট তৈরি করুন
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
