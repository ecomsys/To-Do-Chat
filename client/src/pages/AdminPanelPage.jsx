import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, ArrowLeft } from "lucide-react";
import useChatStore from "../stores/useChatStore";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const navigate = useNavigate();
  
  const adminRoles = useChatStore((state) => state.adminRoles);
  const fetchAdminRoles = useChatStore((state) => state.fetchAdminRoles);
  const fetchRoles = useChatStore((state) => state.fetchRoles);

  const [newRole, setNewRole] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchAdminRoles();
  }, [fetchAdminRoles]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRole || !newPass) return;
    const res = await fetch("/api/roles/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole, password: newPass, name: newName }),
      credentials: "include",
    });
    if (res.ok) {
      setNewRole("");
      setNewPass("");
      setNewName("");
      fetchAdminRoles();
      fetchRoles();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (roleName) => {
    if (!window.confirm(`Удалить роль ${roleName}?`)) return;
    const res = await fetch(`/api/roles/admin/${encodeURIComponent(roleName)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      fetchAdminRoles();
      fetchRoles();
    } else {
      alert((await res.json()).error);
    }
  };

  return (
    // Обертка на весь экран, flex-column
    <div className="h-full flex flex-col w-full">
      
      {/* Шапка (не скроллится) */}
      <div className="shrink-0 py-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-slate-700 hover:text-white/80"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Назад в чат
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Управление ролями
          </h1>
        </div>
      </div>

      {/* Основная скроллящаяся область */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pb-10 md:mb-10 md:pb-0 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Левая колонка: Список ролей */}
          <Card className="bg-slate-800/80 border-slate-700 flex flex-col md:max-h-[calc(100dvh-5rem)]">
            <CardHeader className="shrink-0">
              <CardTitle className="text-white">Существующие роли</CardTitle>
            </CardHeader>
            {/* На десктопе скроллится только этот блок, на мобилке тянется вниз */}
            <CardContent className="flex-1 min-h-0 overflow-y-auto custom-scroll space-y-3">
              {adminRoles.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">Список пуст</p>
              )}
              {adminRoles.map((r) => (
                <div
                  key={r.role}
                  className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-600"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {r.role}
                      {r.name && (
                        <span className="text-slate-400 font-normal ml-1">
                          ({r.name})
                        </span>
                      )}
                    </p>
                    <p className="text-slate-400 text-sm font-mono truncate">
                      {r.password}
                    </p>
                  </div>
                  {r.role !== "Программист" && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="shrink-0 ml-2"
                      onClick={() => handleDelete(r.role)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Правая колонка: Форма добавления */}
          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Добавить / Обновить роль
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-slate-300">Название роли</label>
                  <Input
                    placeholder="Например: Менеджер"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-slate-300">Пароль</label>
                  <Input
                    placeholder="Пароль для входа"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-slate-300">
                    Имя по умолчанию <span className="text-slate-500 text-xs">(необязательно)</span>
                  </label>
                  <Input
                    placeholder="Как отображать в чате"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base mt-2"
                >
                  <PlusCircle className="w-5 h-5 mr-2" /> Сохранить
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}