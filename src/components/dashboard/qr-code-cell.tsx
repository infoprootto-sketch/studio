

'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, View, Shield } from 'lucide-react';
import type { Room } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Logo } from '../logo';
import { createRoot } from 'react-dom/client';
import { useSettings } from '@/context/settings-context';
import { useHotelId } from '@/context/hotel-id-context';


interface QrCodeCellProps {
  room: Room;
}

export function QrCodeCell({ room }: QrCodeCellProps) {
  const [url, setUrl] = useState('');
  const { legalName } = useSettings();
  const hotelId = useHotelId();

  useEffect(() => {
    if (typeof window !== 'undefined' && hotelId) {
      setUrl(`${window.location.origin}/guest/login/${hotelId}`);
    }
  }, [room.number, hotelId]);

  const downloadQRCode = async () => {
    if (!url) {
        console.error("URL for QR code is not generated yet.");
        return;
    }

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 400;
    mainCanvas.height = 500;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) {
        console.error("Could not get canvas context.");
        return;
    }

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Hotel Name
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(legalName, mainCanvas.width / 2, 50);
    
    // Welcome Text
    ctx.fillStyle = '#374151';
    ctx.font = '16px sans-serif';
    ctx.fillText('Welcome', mainCanvas.width / 2, 80);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    const root = createRoot(tempDiv);

    await new Promise<void>(resolve => {
        root.render(
          <QRCodeCanvas
            value={url}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
          />
        );
        setTimeout(resolve, 50);
    });
    
    const qrCanvasForDownload = tempDiv.querySelector('canvas');

    if (!qrCanvasForDownload) {
      console.error("Canvas context or QR canvas not found for download.");
      root.unmount();
      document.body.removeChild(tempDiv);
      return;
    }
    
      ctx.drawImage(qrCanvasForDownload, (mainCanvas.width - 200) / 2, 110, 200, 200);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Scan for Guest Services', mainCanvas.width / 2, 360);
      
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px sans-serif';
      ctx.fillText('Order food, request amenities, and more.', mainCanvas.width / 2, 390);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Powered by StayCentral', mainCanvas.width / 2, 475);
      
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(50, 420, mainCanvas.width - 100, 1);
      
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Room ${room.number}`, mainCanvas.width / 2, 450);

      const link = document.createElement('a');
      link.href = mainCanvas.toDataURL('image/png');
      link.download = `qr-room-${room.number}.png`;
      link.click();
    

    root.unmount();
    document.body.removeChild(tempDiv);
  };

  return (
    <div className="flex items-center gap-2">
       <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={!url}>
            <View className="mr-2 h-4 w-4" />
            View QR
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            {url ? (
              <div className="p-6 bg-white flex flex-col items-center gap-4 text-center rounded-lg shadow-lg">
                  <Logo className="size-12" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{legalName}</h3>
                    <p className="text-sm text-gray-500">Welcome to Room {room.number}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border-2 border-primary">
                    <QRCodeCanvas
                        value={url}
                        size={128}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Scan for Guest Services</p>
                    <p className="text-xs text-gray-500">Order food, request amenities, and more.</p>
                  </div>
                   <div className="w-full border-t pt-2 mt-2">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><Shield className="size-3"/> Powered by StayCentral</p>
                   </div>
              </div>
            ) : <p className="text-sm text-muted-foreground p-4">Generating URL...</p>}
        </PopoverContent>
      </Popover>
      <Button variant="secondary" size="sm" onClick={downloadQRCode} disabled={!url}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
