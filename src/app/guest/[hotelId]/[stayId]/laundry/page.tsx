
'use client';
import { GenericServiceDialog } from "@/components/guest/generic-service-dialog";
import { useRouter } from "next/navigation";

export default function LaundryPage() {
    const router = useRouter();
    return <GenericServiceDialog isOpen={true} onClose={() => router.back()} categoryName="Laundry" />
}
