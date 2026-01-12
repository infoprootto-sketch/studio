
'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { handleExtractMenuItems, type MenuExtractorState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Terminal, UploadCloud, PlusCircle, Save, XCircle, Trash2 } from 'lucide-react';
import type { HotelService, Restaurant } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import type { ExtractMenuItemsOutput } from '@/ai/flows/extract-menu-items-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EditableMenuItem = ExtractMenuItemsOutput['menuItems'][0] & { originalIndex: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Extracting...' : 'Extract Menu Items'}
      <Wand2 className="ml-2" />
    </Button>
  );
}

interface MenuExtractorProps {
    onAddItems: (items: HotelService[], restaurantId: string) => void;
    restaurants: Restaurant[];
}

export function MenuExtractor({ onAddItems, restaurants }: MenuExtractorProps) {
  const initialState: MenuExtractorState = { formState: 'initial', message: '', data: null };
  const [state, formAction] = useActionState(handleExtractMenuItems, initialState);
  
  const [fileName, setFileName] = useState('');
  const [editableItems, setEditableItems] = useState<EditableMenuItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(restaurants[0]?.id || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useSettings();

  useEffect(() => {
    if (state.formState === 'success' && state.data?.menuItems) {
      setEditableItems(state.data.menuItems.map((item, index) => ({ ...item, originalIndex: index })));
    } else {
      setEditableItems([]);
    }
  }, [state]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : '');
  };

  const handleInputChange = (index: number, field: keyof EditableMenuItem, value: any) => {
    const newItems = [...editableItems];
    (newItems[index] as any)[field] = value;
    setEditableItems(newItems);
  };
  
  const handleVariantChange = (itemIndex: number, variantIndex: number, field: 'size' | 'price', value: string) => {
    const newItems = [...editableItems];
    const item = newItems[itemIndex];
    const newVariants = [...item.variants];
    newVariants[variantIndex] = { ...newVariants[variantIndex], [field]: field === 'price' ? Number(value) || 0 : value };
    newItems[itemIndex] = { ...item, variants: newVariants };
    setEditableItems(newItems);
  }

  const addVariant = (itemIndex: number) => {
    const newItems = [...editableItems];
    newItems[itemIndex].variants.push({ size: 'New Size', price: 0 });
    setEditableItems(newItems);
  }

  const removeVariant = (itemIndex: number, variantIndex: number) => {
    const newItems = [...editableItems];
    newItems[itemIndex].variants.splice(variantIndex, 1);
    setEditableItems(newItems);
  }

  const handleAddAllToServices = () => {
    const newServices: HotelService[] = [];
    editableItems.forEach(item => {
        if (item.variants.length === 1 && item.variants[0].size.toLowerCase() === 'standard') {
             newServices.push({
                id: '',
                name: item.name,
                description: item.description,
                price: item.variants[0].price,
                category: 'Food & Beverage',
            });
        } else {
            item.variants.forEach(variant => {
                newServices.push({
                    id: '',
                    name: `${item.name} (${variant.size})`,
                    description: item.description,
                    price: variant.price,
                    category: 'Food & Beverage',
                });
            });
        }
    });
    onAddItems(newServices, selectedRestaurant);
    resetState();
  };
  
  const resetState = () => {
     setEditableItems([]);
     setFileName('');
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
     // A better state reset for the form action might be needed if useActionState doesn't provide a reset function
  }

  return (
    <Card className="bg-muted/40">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="menuImage">Menu Image</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            id="menuImage"
                            name="menuImage"
                            type="file"
                            accept="image/*"
                            required
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud className="mr-2" />
                            Choose File
                        </Button>
                        {fileName && <p className="text-sm text-muted-foreground self-center truncate">{fileName}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="restaurant-select">Add to Restaurant</Label>
                    <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                        <SelectTrigger id="restaurant-select">
                            <SelectValue placeholder="Select a restaurant..." />
                        </SelectTrigger>
                        <SelectContent>
                            {restaurants.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <SubmitButton />
            </div>
        </form>

        {state.formState === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {editableItems.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <h3 className="font-semibold">Edit Extracted Items ({editableItems.length})</h3>
                <div className="flex gap-2">
                    <Button onClick={resetState} size="sm" variant="outline">
                        <XCircle className="mr-2" />
                        Discard All
                    </Button>
                    <Button onClick={handleAddAllToServices} size="sm">
                        <PlusCircle className="mr-2" />
                        Add All to Services
                    </Button>
                </div>
            </div>
            <ScrollArea className="h-96 w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Item</TableHead>
                    <TableHead className="w-1/4">Category</TableHead>
                    <TableHead>Price Variants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableItems.map((item, index) => (
                    <TableRow key={item.originalIndex}>
                      <TableCell>
                        <Input value={item.name} onChange={e => handleInputChange(index, 'name', e.target.value)} className="font-medium mb-1"/>
                        <Input value={item.description} onChange={e => handleInputChange(index, 'description', e.target.value)} className="text-xs"/>
                      </TableCell>
                      <TableCell>
                        <Input value={item.category} onChange={e => handleInputChange(index, 'category', e.target.value)} />
                      </TableCell>
                      <TableCell>
                          <div className="space-y-2">
                            {item.variants.map((variant, vIndex) => (
                                <div key={vIndex} className="flex items-center gap-2">
                                    <Input value={variant.size} onChange={e => handleVariantChange(index, vIndex, 'size', e.target.value)} placeholder="e.g., Half"/>
                                    <Input type="number" value={variant.price} onChange={e => handleVariantChange(index, vIndex, 'price', e.target.value)} placeholder="Price"/>
                                    <Button size="icon" variant="ghost" onClick={() => removeVariant(index, vIndex)}><Trash2 className="size-4 text-destructive"/></Button>
                                </div>
                            ))}
                             <Button size="sm" variant="outline" onClick={() => addVariant(index)}>Add Variant</Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
