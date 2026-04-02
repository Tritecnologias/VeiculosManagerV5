import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import OptionalList from "./OptionalList";
import OptionalForm from "./OptionalForm";
import VersionOptionalForm from "./VersionOptionalForm";
import VersionOptionalList from "./VersionOptionalList";

const tabOptions = [
  { value: "list", label: "Lista de Opcionais" },
  { value: "associate", label: "Associar Versão" },
  { value: "associations", label: "Opcionais Associados" },
];

export default function OptionalTabs() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("list");
  const [editId, setEditId] = useState<number | null>(null);
  const isMobile = useMobile();

  const handleNewOptional = () => {
    setEditId(null);
    setActiveTab("form");
  };

  const handleEditOptional = (id: number) => {
    setEditId(id);
    setActiveTab("form");
  };

  const handleCancel = () => {
    setEditId(null);
    setActiveTab("list");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Opcionais</h1>
        <div className="flex gap-2">
          {activeTab === "list" && (
            <Button onClick={handleNewOptional} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Novo Opcional
            </Button>
          )}
          {activeTab === "form" && (
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {isMobile ? (
        <div className="mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted grid w-full max-w-2xl grid-cols-3">
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="mt-4">
        {activeTab === "list" && <OptionalList onEdit={handleEditOptional} />}
        {activeTab === "form" && (
          <OptionalForm id={editId} onCancel={handleCancel} />
        )}
        {activeTab === "associate" && <VersionOptionalForm />}
        {activeTab === "associations" && <VersionOptionalList />}
      </div>
    </div>
  );
}
