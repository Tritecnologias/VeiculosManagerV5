import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Info, Shield, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ROUTE_PERMISSIONS, UserRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";

export default function PermissionSettings() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const [selectedRole, setSelectedRole] = useState<string>("Cadastrador");
  const [selectedCategory, setSelectedCategory] = useState<string>("Visualização");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const { data: customPermissions, isLoading } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/permissions');
        return await response.json();
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = {
    "Visualização": ROUTE_PERMISSIONS.filter(p => 
      !p.path.includes('new') && !p.path.includes('edit') && !p.path.includes('admin') &&
      p.path !== "/" && p.path !== "/configurator" && p.path !== "/settings" && p.path !== "/user/profile"
    ),
    "Dashboard e Configurador": ROUTE_PERMISSIONS.filter(p => p.path === "/" || p.path === "/configurator"),
    "Cadastro e Edição": ROUTE_PERMISSIONS.filter(p => p.path.includes('new') || p.path.includes('edit')),
    "Perfil de Usuário": ROUTE_PERMISSIONS.filter(p => p.path === "/user/profile"),
    "Gerencial": ROUTE_PERMISSIONS.filter(p => p.path.includes('admin') || p.path === "/settings")
  };

  const saveMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: string, permissions: Record<string, boolean> }) => {
      const response = await apiRequest('POST', '/api/permissions', { role, permissions });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Permissões atualizadas", description: "As permissões foram atualizadas com sucesso." });
      queryClient.invalidateQueries({queryKey: ['/api/permissions']});
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar permissões", description: error.message, variant: "destructive" });
    }
  });

  const resetMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest('DELETE', `/api/permissions/${role}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Permissões resetadas", description: "As permissões foram resetadas para os valores padrão." });
      queryClient.invalidateQueries({queryKey: ['/api/permissions']});
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao resetar permissões", description: error.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (customPermissions && selectedRole) {
      if (customPermissions[selectedRole]) {
        setPermissions(customPermissions[selectedRole]);
      } else {
        const defaultPermissions: Record<string, boolean> = {};
        ROUTE_PERMISSIONS.forEach(permission => {
          defaultPermissions[permission.description] = permission.allowedRoles.includes(selectedRole as UserRole);
        });
        setPermissions(defaultPermissions);
      }
    }
  }, [customPermissions, selectedRole]);

  const handlePermissionChange = (key: string, value: boolean) => {
    if (!isEditing) setIsEditing(true);
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => saveMutation.mutate({ role: selectedRole, permissions });

  const handleReset = () => {
    if (window.confirm(`Restaurar permissões padrão para ${selectedRole}?`)) {
      resetMutation.mutate(selectedRole);
    }
  };

  const handleSelectAll = (category: string, value: boolean) => {
    const newPermissions = { ...permissions };
    categories[category as keyof typeof categories].forEach(p => {
      newPermissions[p.description] = value;
    });
    setPermissions(newPermissions);
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  const categoryOptions = Object.keys(categories);
  const currentPermissions = categories[selectedCategory as keyof typeof categories] || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Configurações de Permissões</h1>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">Personalize as permissões por papel</AlertTitle>
        <AlertDescription className="text-xs">
          O papel de Administrador sempre terá acesso total.
        </AlertDescription>
      </Alert>

      {/* Papel + Ações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Papel de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedRole === "Cadastrador" ? "default" : "outline"}
              onClick={() => setSelectedRole("Cadastrador")}
              className="flex-1"
              size="sm"
            >
              Cadastrador
            </Button>
            <Button
              variant={selectedRole === "Usuário" ? "default" : "outline"}
              onClick={() => setSelectedRole("Usuário")}
              className="flex-1"
              size="sm"
            >
              Usuário
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={customPermissions && customPermissions[selectedRole] ? "default" : "outline"} className="text-xs">
              {customPermissions && customPermissions[selectedRole] ? "Personalizado" : "Padrão"}
            </Badge>
            {isEditing && (
              <Badge variant="secondary" className="text-xs">Alterações não salvas</Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={resetMutation.isPending} className="flex-1">
              <RotateCcw className="mr-1 h-3 w-3" />
              {resetMutation.isPending ? "Resetando..." : "Restaurar"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isEditing || saveMutation.isPending} className="flex-1">
              <Shield className="mr-1 h-3 w-3" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissões por Categoria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de categoria */}
          {isMobile ? (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-5">
                {categoryOptions.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Ações em lote */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSelectAll(selectedCategory, true)} className="flex-1 text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              Marcar todos
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSelectAll(selectedCategory, false)} className="flex-1 text-xs">
              <XCircle className="mr-1 h-3 w-3" />
              Desmarcar todos
            </Button>
          </div>

          {/* Lista de permissões */}
          <div className="space-y-2">
            {currentPermissions.map((permission) => (
              <div key={permission.path} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1 min-w-0 mr-3">
                  <Label htmlFor={`perm-${permission.path}`} className="text-sm leading-tight">
                    {permission.description}
                  </Label>
                  <p className="text-xs text-muted-foreground truncate">{permission.path}</p>
                </div>
                <Switch
                  id={`perm-${permission.path}`}
                  checked={permissions[permission.description] || false}
                  onCheckedChange={(value) => handlePermissionChange(permission.description, value)}
                />
              </div>
            ))}
            {currentPermissions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma permissão nesta categoria</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
