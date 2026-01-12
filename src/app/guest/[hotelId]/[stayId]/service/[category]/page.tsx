
'use client';

import { GenericServiceDialog } from "@/components/guest/generic-service-dialog";
import { useServices } from "@/context/service-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function GenericServicePage() {
    const params = useParams();
    const router = useRouter();
    const { serviceCategories } = useServices();
    
    const categorySlug = params.category as string;
    const category = serviceCategories.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === categorySlug);
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    // When closed, we navigate back.
    const handleClose = () => {
        router.back();
    };

    if (!isClient) {
        // Render nothing on the server to avoid hydration mismatches
        // related to dialogs and routing.
        return null;
    }
    
    // The dialog's `isOpen` is controlled by the presence of a valid category.
    // We now also pass the category name to the component.
    return (
        <GenericServiceDialog
            isOpen={!!category}
            onClose={handleClose}
            categoryName={category?.name || null}
        />
    );
}
