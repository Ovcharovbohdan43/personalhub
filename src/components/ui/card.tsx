import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('glass min-w-0 max-w-full', className)} {...props} />; }
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('p-4 pb-2 sm:p-5 sm:pb-2', className)} {...props} />; }
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn('font-semibold', className)} {...props} />; }
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('min-w-0 p-4 pt-2 sm:p-5 sm:pt-2', className)} {...props} />; }
