
'use client';
import { GenericServiceDialog } from "@/components/guest/generic-service-dialog";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
    const router = useRouter();
    return <GenericServiceDialog isOpen={true} onClose={() => router.back()} categoryName="Maintenance" />
}
