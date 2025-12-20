import { Pencil, Calendar } from 'lucide-react';
import { User } from '@/types/erp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StudentTableProps {
  students: User[];
  onEdit: (student: User) => void;
  onViewAttendance?: (student: User) => void;
  canEdit: boolean;
  canViewAttendance?: boolean;
}

export function StudentTable({ students, onEdit, onViewAttendance, canEdit, canViewAttendance }: StudentTableProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No students found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Department/Grade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Joined</TableHead>
              {(canEdit || canViewAttendance) && <TableHead className="text-right font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => (
            <TableRow 
              key={student.id}
              className="animate-fade-in-up hover:bg-muted/50 transition-colors duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.department || '-'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={student.status === 'active' ? 'default' : 'secondary'}
                  className={student.status === 'active' ? 'bg-success hover:bg-success/90' : ''}
                >
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {student.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              {(canEdit || canViewAttendance) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canViewAttendance && onViewAttendance && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewAttendance(student)}
                        title="View attendance"
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(student)}
                    title="Edit student"
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

