'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const Countdown = ({ endDate }: { endDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  
    useEffect(() => {
      const calculateTimeLeft = () => {
        const difference = new Date(endDate).getTime() - new Date().getTime();
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        } else {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };
  
      const timer = setInterval(calculateTimeLeft, 1000);
      calculateTimeLeft();
  
      return () => clearInterval(timer);
    }, [endDate]);

    const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && (new Date(endDate) < new Date());
  
    if (isOver) {
        return (
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>অফার শেষ</span>
            </div>
        )
    }

    return (
      <div className="flex absolute right-0 top-0 items-center gap-2 text-xs text-destructive">
          <Clock className="h-4 w-4" />
          <span>{timeLeft.days} : {timeLeft.hours} : {timeLeft.minutes} : {timeLeft.seconds}</span>
      </div>
    );
};

export default Countdown;
