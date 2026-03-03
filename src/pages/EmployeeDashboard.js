import Sidebar from "../components/Sidebar";
import { useState } from "react";

function EmployeeDashboard() {
  const [inventory, setInventory] = useState([
    { id: 1, name: "Rice", stock: 100, price: 50 },
    { id: 2, name: "Sugar", stock: 50, price: 40 },
    { id: 3, name: "Oil", stock: 30, price: 120 }
  ]);

  const [cart, setCart] = useState([]);
  const [bill, setBill] = useState(null);

  // Add product to cart
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if(existing){
      setCart(cart.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item));
    } else {
      setCart([...cart, {...product, qty: 1}]);
    }
  };

  // Update quantity or remove
  const updateCartQty = (id, qty) => {
    if(qty <= 0){
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? {...item, qty} : item));
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.qty * item.price, 0);
  };

  // Generate bill
  const generateBill = () => {
    if(cart.length === 0) return;
    const total = calculateTotal();
    setBill({ items: [...cart], total });
    // Optional: reduce stock
    setInventory(inventory.map(product => {
      const cartItem = cart.find(c => c.id === product.id);
      if(cartItem){
        return {...product, stock: product.stock - cartItem.qty};
      }
      return product;
    }));
    // Reset cart
    setCart([]);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar role="EMPLOYEE" />

      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Employee Dashboard</h1>

        <h2>Inventory</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Product</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Stock</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Price</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(product => (
              <tr key={product.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{product.name}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{product.stock}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>₹{product.price}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Add to Cart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ marginTop: "30px" }}>Cart</h2>
        {cart.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Product</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Qty</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Price</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="number"
                      value={item.qty}
                      min="0"
                      style={{ width: "60px" }}
                      onChange={(e) => updateCartQty(item.id, parseInt(e.target.value))}
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>₹{item.qty * item.price}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => updateCartQty(item.id, 0)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: "red",
                        color: "white",
                        border: "none"
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {cart.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3>Total: ₹{calculateTotal()}</h3>
            <button
              onClick={generateBill}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                backgroundColor: "green",
                color: "white",
                border: "none"
              }}
            >
              Generate Bill
            </button>
          </div>
        )}

        {bill && (
          <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
            <h2>Bill</h2>
            <ul>
              {bill.items.map(item => (
                <li key={item.id}>{item.name} x {item.qty} = ₹{item.qty * item.price}</li>
              ))}
            </ul>
            <h3>Total: ₹{bill.total}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;