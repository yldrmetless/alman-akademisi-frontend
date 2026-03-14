import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-500 flex-wrap">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <div key={index} className="flex items-center mt-1">
                        {item.href ? (
                            <Link href={item.href} className="hover:text-[#1a365d] transition-colors">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-slate-700 font-medium cursor-default">{item.label}</span>
                        )}
                        {!isLast && <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />}
                    </div>
                );
            })}
        </nav>
    );
}
