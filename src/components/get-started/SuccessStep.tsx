'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

interface SuccessStepProps {
    formData: FormData;
    lang: 'en' | 'bn';
}

const translations = {
    bn: {
        title: "অভিনন্দন!",
        desc: "আপনার নতুন দোকান সফলভাবে সেটআপ করা হয়েছে।",
        store: "দোকান:",
        url: "ইউআরএল:",
        plan: "প্ল্যান:",
        nextAction: "পরবর্তী করণীয়",
        actionDesc: "আপনার দোকান পরিচালনা করতে, পণ্য যোগ করতে এবং কাস্টমার অর্ডার ম্যানেজ করতে এখনই আপনার অ্যাডমিন অ্যাকাউন্ট তৈরি করুন।",
        btn: "ড্যাশবোর্ডে প্রবেশ করুন"
    },
    en: {
        title: "Congratulations!",
        desc: "Your new store has been successfully set up.",
        store: "Store:",
        url: "URL:",
        plan: "Plan:",
        nextAction: "Next Steps",
        actionDesc: "Create your admin account now to manage your store, add products, and handle customer orders.",
        btn: "Enter Dashboard"
    }
};

const domainSuffix = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dokanbd.shop';

export default function SuccessStep({ formData, lang }: SuccessStepProps) {
    const t = translations[lang];
    const registrationUrl = `/register?siteName=${encodeURIComponent(formData.siteName)}&domain=${encodeURIComponent(formData.domain)}&plan=${formData.plan}&siteDescription=${encodeURIComponent(formData.siteDescription)}&paymentMethod=${formData.paymentMethod || ''}&transactionId=${formData.transactionId || ''}`;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="bg-green-500/10 p-6 rounded-[2.5rem] border-2 border-green-500/20"><CheckCircle2 className="h-16 w-16 text-green-500" /></motion.div>
                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
            </div>

            <Card className="text-center border-2 shadow-2xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-muted/30 p-10 border-b"><CardTitle className="text-4xl font-black font-headline">{t.title}</CardTitle><CardDescription className="text-lg mt-2">{t.desc}</CardDescription></CardHeader>
                <CardContent className="p-10 space-y-10">
                    <div className="grid gap-4 max-w-sm mx-auto">
                        <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border-2 border-primary/10"><span className="text-xs font-black uppercase text-muted-foreground">{t.store}</span><span className="font-bold text-primary">{formData.siteName}</span></div>
                        <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border-2 border-border/50"><span className="text-xs font-black uppercase text-muted-foreground">{t.url}</span><span className="font-mono text-xs font-black">{formData.domain}.{domainSuffix}</span></div>
                        <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border-2 border-border/50"><span className="text-xs font-black uppercase text-muted-foreground">{t.plan}</span><Badge variant="secondary" className="font-black uppercase text-[10px]">{formData.plan}</Badge></div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 space-y-6">
                        <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs"><Sparkles className="w-4 h-4" /> {t.nextAction}</div>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-md mx-auto">{t.actionDesc}</p>
                        <Button asChild size="lg" className="w-full h-16 rounded-2xl text-xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"><Link href={registrationUrl} className="flex items-center justify-center gap-3">{t.btn} <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></Link></Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}