'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Star } from 'lucide-react';

// Mock data
const reviews = [
    { id: '1', productName: 'হিমসাগর আম', rating: 5, comment: 'অসাধারণ স্বাদ! একেবারে টাটকা এবং মিষ্টি।', date: '২০২৩-০৬-১৫'},
    { id: '2', productName: 'সুন্দরবনের মধু', rating: 4, comment: 'খুবই খাঁটি মনে হলো, তবে দামটা একটু বেশি।', date: '২০২৩-০৭-২০'},
    { id: '3', productName: 'মরিয়ম খেজুর', rating: 5, comment: 'മികച്ച মানের খেজুর, পরিবারের সবাই খুব পছন্দ করেছে।', date: '২০২৩-০৯-১০'},
];

export default function ReviewsPage() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>আমার রিভিউ</CardTitle>
                <CardDescription>আপনি যে পণ্যগুলির জন্য রিভিউ দিয়েছেন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="border p-4 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{review.productName}</h3>
                                <p className="text-sm text-muted-foreground">{review.date}</p>
                            </div>
                             <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-5 w-5 ${
                                        i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                    </div>
                ))}
                 {reviews.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">আপনি এখনো কোনো রিভিউ দেননি।</p>
                )}
            </CardContent>
        </Card>
    )
}
