import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaintType } from "@/lib/types";
import PaintTypeForm from "@/pages/paint-types/PaintTypeForm";

export default function PaintTypeList() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paintTypes = [], isLoading } = useQuery({
    queryKey: ["/api/paint-types"],
    queryFn: async () => {
      try {
        const response = await fetch("api/paint-types");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Paint Types API Response:", data);
        return data || [];
      } catch (error) {
        console.error("Failed to fetch paint types:", error);
        return [];
      }
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este tipo de pintura?")) {
      try {
        const response = await fetch(`api/paint-types/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        toast({
          title: "Tipo de pintura removido",
          description: "O tipo de pintura foi removido com sucesso.",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/paint-types"] });
      } catch (error) {
        console.error("Error deleting paint type:", error);
        toast({
          title: "Erro ao remover tipo de pintura",
          description: "Não foi possível remover o tipo de pintura.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
  };

  const handleFormSuccess = () => {
    setEditingId(null);
    setIsAdding(false);
    queryClient.invalidateQueries({ queryKey: ["/api/paint-types"] });
  };

  if (isAdding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Novo Tipo de Pintura</CardTitle>
        </CardHeader>
        <CardContent>
          <PaintTypeForm onCancel={handleCancelEdit} onSuccess={handleFormSuccess} />
        </CardContent>
      </Card>
    );
  }

  if (editingId !== null) {
    const paintType = paintTypes.find((pt) => pt.id === editingId);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editar Tipo de Pintura</CardTitle>
        </CardHeader>
        <CardContent>
          <PaintTypeForm
            id={editingId}
            initialData={paintType}
            onCancel={handleCancelEdit}
            onSuccess={handleFormSuccess}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tipos de Pintura</CardTitle>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Carregando...</div>
        ) : paintTypes.length > 0 ? (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paintTypes.map((paintType) => (
                <TableRow key={paintType.id}>
                  <TableCell>{paintType.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(paintType.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(paintType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        ) : (
          <div className="text-center py-6">
            Nenhum tipo de pintura cadastrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}