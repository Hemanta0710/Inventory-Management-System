import Sidebar from "../components/Sidebar";
import AISuggestions from "../components/AISuggestions";
import StatsCards from "../components/StatsCards";
import SalesChart from "../components/SalesChart";

function ManagerDashboard() {
  return (
    <div style={{ display: "flex", backgroundColor: "#f3f4f6" }}>
      <Sidebar role="MANAGER" />

      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Manager Dashboard</h1>

        <StatsCards />

        <AISuggestions />
      </div>
    </div>
  );
}

export default ManagerDashboard;