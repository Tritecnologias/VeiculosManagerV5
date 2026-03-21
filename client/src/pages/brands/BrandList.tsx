import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Brand } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function BrandList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });
  
  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/brands/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Marca excluída",
        description: "A marca foi excluída com sucesso.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Failed to delete brand:", error);
      
      // Verificar se é um erro de dependência (409 Conflict)
      if (error.message && error.message.includes("409")) {
        // Extrair a mensagem do erro que vem do backend
        let errorDetails = "Não foi possível excluir esta marca.";
        let modelList = [];
        let directSaleList = [];
        
        try {
          const errorJson = JSON.parse(error.message.split(": ")[1]);
          if (errorJson.message) {
            // Usar apenas a primeira parte da mensagem, sem os nomes de modelos
            const baseMessage = errorJson.message.split(':')[0];
            errorDetails = baseMessage;
          }
          
          // Capturar informações sobre modelos associados, se houver
          if (errorJson.models && errorJson.models.length > 0) {
            modelList = errorJson.models;
            
            // Criar uma lista formatada de modelos para exibir
            const modelCount = modelList.length;
            const modelNames = modelList.map(model => model.name).join(', ');
            
            // Construir uma descrição mais detalhada
            errorDetails = `${errorDetails}\n\nQuantidade de Modelos Associados: ${modelCount}\nModelos Associados: ${modelNames}`;
          }
          
          // Capturar informações sobre vendas diretas associadas, se houver
          if (errorJson.directSales && errorJson.directSales.length > 0) {
            directSaleList = errorJson.directSales;
            
            // Adicionar informações sobre vendas diretas associadas
            const directSaleCount = directSaleList.length;
            errorDetails = `${errorDetails}\n\nQuantidade de Vendas Diretas Associadas: ${directSaleCount}`;
          }
        } catch (e) {
          // Se não conseguir fazer o parse, usa a mensagem genérica
          console.error("Error parsing error message:", e);
        }
        
        toast({
          title: "Erro ao excluir marca",
          description: errorDetails,
          variant: "destructive",
          className: "whitespace-pre-line", // Permitir quebras de linha
        });
      } else {
        toast({
          title: "Erro ao excluir marca",
          description: "Ocorreu um erro ao tentar excluir esta marca. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };
  
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Marcas</h1>
        <Link href="/brands/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Marca
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Marcas</CardTitle>
          <CardDescription>
            Gerencie as marcas de veículos disponíveis
          </CardDescription>
          <div className="flex mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar marcas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p>Carregando...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma marca encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.id}</TableCell>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/brands/${brand.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a marca "{brand.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(brand.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
