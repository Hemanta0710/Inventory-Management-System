import Sidebar from "../components/Sidebar";
import { useState } from "react";

function AdminDashboard() {
  const [users, setUsers] = useState([
    { id: 1, name: "Manager1", role: "MANAGER", active: true },
    { id: 2, name: "Employee1", role: "EMPLOYEE", active: true },
    { id: 3, name: "Employee2", role: "EMPLOYEE", active: false }
  ]);

  const toggleActive = (id) => {
    setUsers(users.map(u => u.id === id ? {...u, active: !u.active} : u));
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar role="ADMIN" />
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Admin Dashboard</h1>
        <h2>Manage Users & Privileges</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Role</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{user.name}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{user.role}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {user.active ? "Active" : "Disabled"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <button
                    onClick={() => toggleActive(user.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      backgroundColor: user.active ? "red" : "green",
                      color: "white",
                      border: "none"
                    }}
                  >
                    {user.active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;