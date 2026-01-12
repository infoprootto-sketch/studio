
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RoomManagementTable } from "@/components/dashboard/room-management-table";
import { RoomCategoryManagement } from "@/components/dashboard/room-category-management";
import { useRooms } from "@/context/room-context";

export default function RoomsPage() {
    const { roomCategories, addCategory, updateCategory, deleteCategory } = useRooms();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Room Category Management</CardTitle>
                    <CardDescription>Define the types of rooms available at your hotel. Checklists for cleaning are managed on the Inventory page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RoomCategoryManagement 
                        categories={roomCategories}
                        onAddCategory={addCategory}
                        onUpdateCategory={updateCategory}
                        onDeleteCategory={deleteCategory}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Room Management</CardTitle>
                    <CardDescription>Add, edit, or remove individual rooms from your hotel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RoomManagementTable />
                </CardContent>
            </Card>
        </div>
    )
}
