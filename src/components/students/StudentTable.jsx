import { Calendar, Mail, User } from 'lucide-react';
import { User as UserType } from '@/types/erp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

export function StudentTable({ students, onViewAttendance, onViewProfile, canViewAttendance, viewMode = 'grid' }) {
  const isMobile = useIsMobile();
  // Always use grid view on mobile, regardless of viewMode prop
  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No students found</p>
      </div>
    );
  }

  // Table view (desktop only)
  if (effectiveViewMode === 'table') {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Department/Grade</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Joined</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onViewProfile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewProfile(student)}
                          title="View Profile"
                          className="transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      )}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Grid/Card view (default, always on mobile)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {students.map((student, index) => (
        <Card
          key={student.id}
          className="group relative overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 animate-fade-in-up cursor-pointer"
          style={{ animationDelay: `${index * 50}ms` }}
          onClick={() => onViewProfile && onViewProfile(student)}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                    {student.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Department</span>
                <Badge
                  variant="outline"
                  className="text-xs bg-muted/50"
                >
                  {student.department || 'No department'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant={student.status === 'active' ? 'default' : 'secondary'}
                  className={student.status === 'active' ? 'bg-success hover:bg-success/90 text-xs' : 'text-xs'}
                >
                  {student.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Joined</span>
                <span className="text-xs text-muted-foreground">
                  {student.createdAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              {onViewProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile(student);
                  }}
                  className="flex-1 text-xs h-8 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Profile
                </Button>
              )}
              {canViewAttendance && onViewAttendance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAttendance(student);
                  }}
                  className="flex-1 text-xs h-8 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Attendance
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
