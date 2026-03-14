import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { SupportRequest } from "@/lib/features/users/userApi";

interface SupportTicketRowProps {
    ticket: SupportRequest;
    formatDate: (dateString: string) => string;
    statusColorMap: Record<string, string>;
    statusLabelMap: Record<string, string>;
}

export function SupportTicketRow({
    ticket,
    formatDate,
    statusColorMap,
    statusLabelMap,
}: SupportTicketRowProps) {
    const ticketSubject = ticket.name || "Destek Talebi";
    const rawMessage = ticket.message || "Detay bulunmuyor.";
    
    // Create a 60 chars preview string with ellipsis if too long
    const ticketMessagePreview = rawMessage.length > 60 
        ? rawMessage.substring(0, 60) + "..." 
        : rawMessage;

    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
            <div className="col-span-6 md:col-span-7">
                <div className="font-bold text-slate-900 text-sm truncate max-w-sm">
                    {ticketSubject}
                </div>
                
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-sm cursor-help hover:text-slate-700 transition-colors">
                                {ticketMessagePreview}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[400px] p-3 text-sm leading-relaxed shadow-lg">
                            <p className="whitespace-pre-wrap">{rawMessage}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            
            <div className="col-span-3 md:col-span-3">
                <span className="text-sm text-slate-600 font-medium">
                    {formatDate(ticket.created_at)}
                </span>
            </div>
            
            <div className="col-span-3 md:col-span-2 text-right">
                <Badge
                    variant="secondary"
                    className={`font-medium px-2.5 py-0.5 shadow-sm text-xs ${statusColorMap[ticket.status] || statusColorMap.closed}`}
                >
                    {statusLabelMap[ticket.status] || "Bilinmiyor"}
                </Badge>
            </div>
        </div>
    );
}
