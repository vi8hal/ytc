
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUsersAction } from '@/lib/actions/user';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  const users = await getUsersAction();

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-lg text-muted-foreground">
                Manage all users registered in the DCX1 system.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>A list of all users in the database.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Verified</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    {user.isAdmin ? (
                                        <Badge variant="destructive">Admin</Badge>
                                    ) : (
                                        <Badge variant="secondary">User</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    {user.verified ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-destructive inline-block" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>
    </main>
  );
}
