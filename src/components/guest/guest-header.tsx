
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useStay } from "@/context/stay-context";
import { usePathname, useParams } from "next/navigation";

export function GuestHeader() {
  const { stay } = useStay();
  const pathname = usePathname();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const isOnRestaurantListPage = pathname.endsWith('/order');
  const isOnMenuPage = pathname.includes('/order/') && params.restaurantId;

  let backHref: string;
  let backLabel: string;
  
  if (isOnMenuPage) {
    backHref = `/guest/${hotelId}/${stay?.stayId}/order`;
    backLabel = "Back to Restaurants";
  } else {
    backHref = `/guest/${hotelId}/${stay?.stayId}/`;
    backLabel = "Back to Home";
  }
  
  if (isOnRestaurantListPage) {
    backHref = `/guest/${hotelId}/${stay?.stayId}/`;
    backLabel = "Back to Home";
  }


  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 p-2 container mx-auto">
        <Button asChild variant="ghost">
            <Link href={backHref}>
                <ChevronLeft className="mr-2" />
                {backLabel}
            </Link>
        </Button>
    </header>
  );
}
