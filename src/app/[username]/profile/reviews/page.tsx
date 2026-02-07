'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Edit, Trash2 } from 'lucide-react';

// Mock data
const reviews = [
    { id: '1', productName: 'হিমসাগর আম', rating: 5, comment: 'অসাধারণ স্বাদ! একেবারে টাটকা এবং মিষ্টি।', date: '২০২৩-০৬-১৫'},
    { id: '2', productName: 'সুন্দরবনের মধু', rating: 4, comment: 'খুবই খাঁটি মনে হলো, তবে দামটা একটু বেশি।', date: '২০২৩-০৭-২০'},
    { id: '3', productName: 'মরিয়ম খেজুর', rating: 5, comment: 'മികച്ച মানের খেজুর, পরিবারের সবাই খুব পছন্দ করেছে।', date: '২০২৩-০৯-১০'},
];

export default function ReviewsPage() {

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">আমার রিভিউ</h1>
                <p className="text-muted-foreground">আপনি যে পণ্যগুলির জন্য রিভিউ দিয়েছেন।</p>
            </div>
            
            {reviews.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    {reviews.map(review => (
                        <Card key={review.id} className="flex flex-col">
                             <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl">{review.productName}</CardTitle>
                                    <div className="flex items-center gap-1 shrink-0">
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
                                <CardDescription>{review.date}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{review.comment}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    সম্পাদনা
                                </Button>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    মুছুন
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="text-center py-16">
                        <p className="text-muted-foreground">আপনি এখনো কোনো রিভিউ দেননি।</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
