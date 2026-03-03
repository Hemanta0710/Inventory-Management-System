function StatsCards() {
  const stats = [
    { title: "Total Products", value: 120 },
    { title: "Low Stock Items", value: 8 },
    { title: "AI Suggestions", value: 2 },
    { title: "Monthly Sales", value: "₹45,000" }
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginTop: "20px"
    }}>
      {stats.map((stat, index) => (
        <div key={index} style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h4 style={{ color: "gray" }}>{stat.title}</h4>
          <h2>{stat.value}</h2>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;