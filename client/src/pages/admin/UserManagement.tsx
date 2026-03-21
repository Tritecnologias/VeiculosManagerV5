import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ActiveUsers from "./ActiveUsers";

type User = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  roleId: number;
  role?: {
    id: number;
    name: string;
    description?: string | null;
  };
};

type Role = {
  id: number;
  name: string;
  description?: string | null;
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Buscar todos os usuários
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn(),
    enabled: !!currentUser && currentUser.role?.name === "Administrador"
  });

  // Buscar todos os papéis de usuário
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    queryFn: getQueryFn(),
    enabled: !!currentUser && currentUser.role?.name === "Administrador"
  });

  // Mutation para atualizar o papel de um usuário
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { userId: number, roleId: number }) => {
      const response = await apiRequest(
        'PUT', 
        `/api/users/${data.userId}/role`, 
        { roleId: data.roleId }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Atualizar lista de usuários
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Papel atualizado",
        description: "O papel do usuário foi atualizado com sucesso.",
      });
      setShowRoleDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar papel: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar o status de um usuário
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { userId: number, isActive: boolean }) => {
      const response = await apiRequest(
        'PUT', 
        `/api/users/${data.userId}/status`, 
        { isActive: data.isActive }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Atualizar lista de usuários
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado com sucesso.",
      });
      setShowStatusDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar status: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.roleId);
    setShowRoleDialog(true);
  };

  const handleOpenStatusDialog = (user: User) => {
    setSelectedUser(user);
    setShowStatusDialog(true);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(Number(value));
  };

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole !== null) {
      updateRoleMutation.mutate({ 
        userId: selectedUser.id, 
        roleId: selectedRole 
      });
    }
  };

  const handleUpdateStatus = (activate: boolean) => {
    if (selectedUser) {
      updateStatusMutation.mutate({ 
        userId: selectedUser.id, 
        isActive: activate 
      });
    }
  };

  if (isLoadingUsers || isLoadingRoles) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="active-users">Usuários Logados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-primary/10">
                    {user.role?.name || "Sem papel"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="default" className="bg-green-500">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-300">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoleDialog(user)}
                  >
                    Alterar Papel
                  </Button>
                  <Button
                    variant={user.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleOpenStatusDialog(user)}
                  >
                    {user.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="active-users" className="mt-6">
          <ActiveUsers />
        </TabsContent>
      </Tabs>

      {/* Diálogo para alterar papel */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Papel do Usuário</DialogTitle>
            <DialogDescription>
              Altere o papel do usuário {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              value={selectedRole?.toString()} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para alterar status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status do Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser?.isActive 
                ? `Tem certeza que deseja desativar o usuário ${selectedUser?.name}?`
                : `Tem certeza que deseja ativar o usuário ${selectedUser?.name}?`
              }
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant={selectedUser?.isActive ? "destructive" : "default"}
              onClick={() => handleUpdateStatus(!selectedUser?.isActive)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending 
                ? "Processando..." 
                : (selectedUser?.isActive ? "Desativar" : "Ativar")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;