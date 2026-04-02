import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import ColorList from "./ColorList";
import ColorForm from "./ColorForm";
import VersionColorForm from "./VersionColorForm";
import VersionColorList from "./VersionColorList";

const tabOptions = [
  { value: "list", label: "Lista de Cores" },
  { value: "associate", label: "Associar Versão" },
  { value: "associations", label: "Cores Associadas" },
];

export default function ColorTabs() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [editVersionColorId, setEditVersionColorId] = useState<number | null>(null);
  const isMobile = useMobile();

  const handleNewColor = () => {
    setEditId(null);
    setActiveTab("form");
  };

  const handleEditColor = (id: number) => {
    setEditId(id);
    setActiveTab("form");
  };

  const handleCancel = () => {
    setEditId(null);
    setActiveTab("list");
  };

  const handleEditVersionColor = (id: number) => {
    setEditVersionColorId(id);
    setActiveTab("associate");
  };

  const handleCancelVersionColorEdit = () => {
    setEditVersionColorId(null);
    setActiveTab("associations");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Cores/Pinturas</h1>
        <div className="flex gap-2">
          {activeTab === "list" && (
            <Button onClick={handleNewColor} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Nova Cor
            </Button>
          )}
          {activeTab === "form" && (
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Select dropdown | Desktop: Tabs */}
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
        {activeTab === "list" && <ColorList onEdit={handleEditColor} />}
        {activeTab === "form" && (
          <ColorForm id={editId} onCancel={handleCancel} />
        )}
        {activeTab === "associate" && (
          <VersionColorForm id={editVersionColorId} onCancel={handleCancelVersionColorEdit} />
        )}
        {activeTab === "associations" && (
          <VersionColorList onEdit={handleEditVersionColor} />
        )}
      </div>
    </div>
  );
}
