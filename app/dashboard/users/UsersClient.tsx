"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Users, UserCheck, Shield, Plus, Search, Filter, 
  Edit, Key, Power, Trash2 
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { UserModal } from "@/components/UserModal"
import { ResetPasswordModal } from "@/components/ResetPasswordModal"
import { AuditLogsViewer } from "./AuditLogsViewer"
import { useSession } from "next-auth/react"

interface UsersClientProps {
  stats: {
    totalUsers: number
    activeSessions: string
    activeUsers: number
    roleDistribution: { role: string; count: number }[]
  }
}

export const getRoleColor = (role: string) => {
  switch(role) {
    case 'SUPER_ADMIN': return 'bg-red-100 text-red-700 border-red-200'
    case 'TRUST_MGMT': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'PROGRAM_MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'MEO_OFFICER': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'SCHOOL_AUTHORITY': return 'bg-green-100 text-green-700 border-green-200'
    case 'HOSTEL_INCHARGE': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'RFL_COORDINATOR': return 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export const getRoleBgColor = (role: string) => {
  switch(role) {
    case 'SUPER_ADMIN': return 'bg-red-500'
    case 'TRUST_MGMT': return 'bg-purple-500'
    case 'PROGRAM_MANAGER': return 'bg-blue-500'
    case 'MEO_OFFICER': return 'bg-cyan-500'
    case 'SCHOOL_AUTHORITY': return 'bg-green-500'
    case 'HOSTEL_INCHARGE': return 'bg-orange-500'
    case 'RFL_COORDINATOR': return 'bg-[#C9A84C]'
    default: return 'bg-slate-500'
  }
}

export default function UsersClient({ stats }: UsersClientProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"USERS" | "AUDIT">("USERS")
  
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("ALL")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [userToReset, setUserToReset] = useState<any>(null)

  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("")
  const [userToDelete, setUserToDelete] = useState<any>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        role
      })
      const res = await fetch(`/api/users?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, role])

  useEffect(() => {
    if (activeTab === "USERS") {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers()
      }, 300)
      return () => clearTimeout(delayDebounceFn)
    }
  }, [fetchUsers, activeTab])

  const toggleStatus = async (user: any) => {
    if (session?.user?.id === user.id) {
      toast.error("You cannot deactivate your own account")
      return
    }
    
    try {
      const res = await fetch(`/api/users/${user.id}/toggle-status`, { method: 'PUT' })
      if (res.ok) {
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
        fetchUsers()
      } else {
        toast.error("Failed to toggle status")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    if (deleteEmailConfirm !== userToDelete.email) {
      toast.error("Email does not match")
      return
    }

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("User deleted permanently")
        setUserToDelete(null)
        setDeleteEmailConfirm("")
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete user")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">System Management</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>System</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Users & Audit</span>
          </div>
        </div>
        
        {activeTab === "USERS" && (
          <button 
            onClick={() => { setSelectedUser(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'USERS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'AUDIT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          Audit Log
        </button>
      </div>

      {activeTab === "USERS" ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Users</p>
                <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.totalUsers}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-500">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.activeSessions}</p>
                <p className="text-xs text-slate-400 mt-1">{stats.activeUsers} Active Accounts</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Roles Distribution
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  {stats.roleDistribution.map((rd, i) => (
                    <div 
                      key={i} 
                      className={`h-full ${getRoleBgColor(rd.role)}`} 
                      style={{ width: `${(rd.count / stats.totalUsers) * 100}%` }}
                      title={`${rd.role}: ${rd.count}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.roleDistribution.slice(0, 3).map((rd, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className={`w-2 h-2 rounded-full ${getRoleBgColor(rd.role)}`} />
                      {rd.role.replace("_", " ")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="text-slate-400 w-5 h-5 hidden sm:block" />
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white min-w-[180px]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="TRUST_MGMT">Trust Mgmt</option>
                  <option value="PROGRAM_MANAGER">Program Manager</option>
                  <option value="MEO_OFFICER">M&E Officer</option>
                  <option value="SCHOOL_AUTHORITY">School Authority</option>
                  <option value="HOSTEL_INCHARGE">Hostel Incharge</option>
                  <option value="RFL_COORDINATOR">RFL Coordinator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4">Last Login</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4 flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-200" />
                          <div><div className="w-24 h-4 bg-slate-200 rounded mb-1"/><div className="w-32 h-3 bg-slate-200 rounded"/></div>
                        </td>
                        <td className="px-6 py-4"><div className="w-24 h-6 bg-slate-200 rounded-full" /></td>
                        <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="w-24 h-6 bg-slate-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRoleColor(u.role)}`}>
                              {getInitials(u.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleColor(u.role)}`}>
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                            <span className={u.isActive ? "text-slate-700" : "text-slate-400"}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {format(new Date(u.createdAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-slate-600 italic">
                          Never
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setSelectedUser(u); setIsModalOpen(true) }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setUserToReset(u); setIsResetModalOpen(true) }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => toggleStatus(u)}
                              disabled={session?.user?.id === u.id}
                              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${u.isActive ? 'text-slate-500 hover:bg-slate-100' : 'text-green-600 hover:bg-green-50'}`} 
                              title={u.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setUserToDelete(u)}
                              disabled={session?.user?.id === u.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50" title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-700">{users.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="font-medium text-slate-700">{Math.min(page * 10, totalCount)}</span> of <span className="font-medium text-slate-700">{totalCount}</span> users
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <AuditLogsViewer />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2 font-playfair">Delete User</h3>
            <p className="text-sm text-slate-500 mb-6 font-dm-sans">
              This action cannot be undone. This will permanently delete the user account for <strong className="text-slate-800">{userToDelete.email}</strong>.
              Please type the email to confirm.
            </p>
            <input 
              type="text"
              value={deleteEmailConfirm}
              onChange={(e) => setDeleteEmailConfirm(e.target.value)}
              placeholder={userToDelete.email}
              className="w-full h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 mb-6 font-dm-sans"
            />
            <div className="flex gap-3 justify-end font-dm-sans">
              <button 
                onClick={() => { setUserToDelete(null); setDeleteEmailConfirm("") }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteEmailConfirm !== userToDelete.email}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userData={selectedUser}
          onSuccess={fetchUsers}
        />
      )}

      {isResetModalOpen && (
        <ResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          user={userToReset}
        />
      )}
    </div>
  )
}
