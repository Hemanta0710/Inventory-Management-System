import { Link } from "react-router-dom";

function Sidebar({ role }) {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      backgroundColor: "#1f2937",
      color: "white",
      padding: "20px"
    }}>
      <h2>IMS</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/" style={{ color: "white" }}>Home</Link></li>

        {role === "ADMIN" && (
          <li><Link to="/admin" style={{ color: "white" }}>Admin Panel</Link></li>
        )}

        {role === "MANAGER" && (
          <>
            <li><Link to="/manager" style={{ color: "white" }}>Dashboard</Link></li>
          </>
        )}

        {role === "EMPLOYEE" && (
          <>
            <li><Link to="/employee" style={{ color: "white" }}>Dashboard</Link></li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;