import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    if (role === "ADMIN") navigate("/admin");
    if (role === "MANAGER") navigate("/manager");
    if (role === "EMPLOYEE") navigate("/employee");
  };

  return (
    <div>
      <h2>Select Role to Login</h2>
      <button onClick={() => handleLogin("ADMIN")}>Admin</button>
      <button onClick={() => handleLogin("MANAGER")}>Manager</button>
      <button onClick={() => handleLogin("EMPLOYEE")}>Employee</button>
    </div>
  );
}

export default Login;