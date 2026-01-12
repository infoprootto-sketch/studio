
'use client';

import { useStay } from "@/context/stay-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceRequestStatus } from "@/lib/types";
import { format } from 'date-fns';
import { useMemo } from "react";

const statusColors: Record<ServiceRequestStatus, string> = {
    Pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    'In Progress': "bg-blue-500/20 text-blue-600 border-blue-500/30",
    Completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

export default function RequestsPage() {
    const { serviceLog } = useStay();

    const sortedServiceLog = useMemo(() => {
        if (!serviceLog) return [];
        return [...serviceLog].sort((a, b) => b.creationTime.getTime() - a.creationTime.getTime());
    }, [serviceLog]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl"><History /> Service Request Log</CardTitle>
                <CardDescription>A complete history of all your requests and charges during this stay.</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedServiceLog.length > 0 ? (
                    <div className="space-y-4">
                        {sortedServiceLog.map(request => (
                            <div key={request.id} className="p-4 border rounded-lg flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{request.service}</p>
                                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                        <p className="flex items-center gap-1.5"><Clock className="size-3" /> Requested: {format(request.creationTime, 'MMM d, h:mm a')}</p>
                                        {request.status === 'Completed' && request.completionTime && (
                                            <p className="flex items-center gap-1.5"><CheckCircle className="size-3 text-green-500"/> Completed: {format(request.completionTime, 'MMM d, h:mm a')}</p>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(statusColors[request.status])}>
                                    {request.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">You haven't made any service requests yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
