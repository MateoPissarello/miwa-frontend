// components/AdminDashboard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  ApiUser,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/lib/api/users";
import { Edit, LogOut, Settings, Shield, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const router = useRouter();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showUserList, setShowUserList] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ApiUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    rol: "",
    password: "",
  });

  // Create (nuevo)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    rol: "Usuario",
    password: "",
  });

  // Banner global
  const [bannerMsg, setBannerMsg] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        const data = await listUsers();
        setUsers(data);
        setFetchError(null);
      } catch (e: any) {
        setFetchError(
          e instanceof ApiError ? e.message : "Error cargando usuarios"
        );
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const handleDeleteClick = (user: ApiUser) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.user_id);
      setUsers((prev) =>
        prev.filter((u) => u.user_id !== userToDelete.user_id)
      );
    } catch (e: any) {
      alert(e instanceof ApiError ? e.message : "Error eliminando");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleEditClick = (user: ApiUser) => {
    setUserToEdit(user);
    setEditFormData({
      nombre: user.first_name,
      apellido: user.last_name,
      correo: user.email,
      rol: user.role,
      password: "",
    });
    setShowEditModal(true);
  };
  const handleEditSubmit = async () => {
    if (!userToEdit) return;
    const payload = {
      first_name: editFormData.nombre,
      last_name: editFormData.apellido,
      email: editFormData.correo,
      role: editFormData.rol,
      ...(editFormData.password ? { password: editFormData.password } : {}),
    };

    try {
      const updated = await updateUser(userToEdit.user_id, payload);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === updated.user_id ? updated : u))
      );
      setBannerMsg({ type: "ok", text: "Usuario modificado exitosamente." });
      setShowEditModal(false);
      setUserToEdit(null);
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : "Error modificando usuario";
      setBannerMsg({ type: "error", text: msg });
    }
  };

  // 👇 NUEVO: abrir modal de creación
  const handleOpenCreate = () => {
    setCreateFormData({
      nombre: "",
      apellido: "",
      correo: "",
      rol: "Usuario",
      password: "",
    });
    setShowCreateModal(true);
  };

  // 👇 NUEVO: submit de creación
  const handleCreateSubmit = async () => {
    const payload = {
      first_name: createFormData.nombre,
      last_name: createFormData.apellido,
      email: createFormData.correo,
      password: createFormData.password,
      // Incluye role si tu CreateUserBase lo soporta
      ...(createFormData.rol ? { role: createFormData.rol } : {}),
    };

    try {
      const created = await createUser(payload); // 201 esperado
      setUsers((prev) => [created, ...prev]); // agrega al inicio
      setBannerMsg({ type: "ok", text: "Usuario creado correctamente." });
      setShowCreateModal(false);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Error creando usuario";
      setBannerMsg({ type: "error", text: msg });
      // Puedes dejar el modal abierto para corregir datos
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/admin-login");
  };

  const totalUsers = users.length;
  const totalAdmins = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role?.toLowerCase() === "admin" ||
          u.role?.toLowerCase() === "administrador"
      ).length,
    [users]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">
            MIWA ADMIN DASHBOARD
          </h1>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Banner global */}
      {bannerMsg && (
        <div
          className={`mx-6 mt-4 rounded border px-4 py-3 text-sm ${
            bannerMsg.type === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {/* Usuario Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usuario</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Usuarios
                </CardTitle>
                <Users className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingUsers ? "…" : totalUsers}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Administradores
                </CardTitle>
                <Shield className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingUsers ? "…" : totalAdmins}
                </div>
                <p className="text-xs text-gray-500">Sin cambios</p>
              </CardContent>
            </Card>
          </div>

          {/* User Management Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setShowUserList(!showUserList)}
                >
                  {showUserList ? "Ocultar Usuarios" : "Ver Todos los Usuarios"}
                </Button>

                {/* 👇 cambia: ahora abre el modal de crear */}
                <Button
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 bg-transparent"
                  onClick={handleOpenCreate}
                >
                  Agregar Usuario
                </Button>

                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  Exportar Datos
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </div>

              {showUserList && (
                <div className="mt-6">
                  {fetchError ? (
                    <div className="text-sm text-red-600">{fetchError}</div>
                  ) : loadingUsers ? (
                    <div className="text-sm text-gray-500">
                      Cargando usuarios…
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Nombre
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Apellido
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Rol
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Último Acceso
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr
                              key={u.user_id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-900">
                                {u.first_name}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {u.last_name}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    u.role?.toLowerCase() === "admin"
                                      ? "bg-teal-100 text-teal-800"
                                      : u.role?.toLowerCase() === "moderador"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {formatDate(u.last_login)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleEditClick(u)}
                                  className="p-2 text-gray-400 hover:text-teal-600 transition-colors duration-200"
                                  title="Editar usuario"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(u)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Usuario
            </h3>
            <div className="space-y-4">
              {/* Campos iguales a antes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <Input
                  value={editFormData.nombre}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, nombre: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <Input
                  value={editFormData.apellido}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      apellido: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo
                </label>
                <Input
                  type="email"
                  value={editFormData.correo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, correo: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={editFormData.rol}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, rol: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Dejar vacío para mantener actual"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Modificar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 👇 NUEVO: Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agregar Usuario
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <Input
                  value={createFormData.nombre}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <Input
                  value={createFormData.apellido}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      apellido: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo
                </label>
                <Input
                  type="email"
                  value={createFormData.correo}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      correo: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={createFormData.rol}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      rol: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      password: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Crear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <span className="font-semibold">
                {userToDelete?.first_name} {userToDelete?.last_name}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
