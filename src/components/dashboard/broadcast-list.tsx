'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { Broadcast } from "@/lib/types"
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BroadcastListProps {
  broadcasts: Broadcast[];
  onEdit: (broadcast: Broadcast) => void;
  onDelete: (broadcastId: string) => void;
}

export function BroadcastList({ broadcasts, onEdit, onDelete }: BroadcastListProps) {
    if (broadcasts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>You haven't created any broadcasts yet.</p>
                <p className="text-sm">Click "New Broadcast" to get started.</p>
            </div>
        )
    }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {broadcasts.map((broadcast) => (
            <TableRow key={broadcast.id}>
              <TableCell className="font-medium">{broadcast.title}</TableCell>
              <TableCell>
                <Badge variant={broadcast.status === 'Active' ? 'default' : 'secondary'}>
                  {broadcast.status}
                </Badge>
              </TableCell>
              <TableCell>{broadcast.type}</TableCell>
              <TableCell className="text-sm">
                {format(broadcast.startDate, 'MMM d, yyyy')} - {format(broadcast.endDate, 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => onEdit(broadcast)}>
                  <Edit className="mr-2 h-4 w-4"/> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4"/> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the broadcast "{broadcast.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(broadcast.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
