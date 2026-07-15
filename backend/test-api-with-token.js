async function test() {
  try {
    const loginRes = await fetch('https://office-erp-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nexus.com', password: 'admin' }) // Guessing default credentials
    });
    
    if (!loginRes.ok) {
      console.error("Login failed", await loginRes.text());
      return;
    }
    
    const { token } = await loginRes.json();
    console.log("Logged in!");

    const res = await fetch('https://office-erp-production.up.railway.app/api/transactions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      // Using FormData to simulate the frontend
      body: (() => {
        const fd = new FormData();
        fd.append('date', '2026-07-15T00:00:00.000Z');
        fd.append('type', 'PURCHASE');
        fd.append('status', 'PENDING');
        fd.append('paymentMode', 'CASH');
        fd.append('partAccountName', 'Shreeji enterp');
        fd.append('unit', '1');
        fd.append('rate', '2400');
        fd.append('totalAmount', '2400.00');
        return fd;
      })()
    });
    const text = await res.text();
    console.log("Response:", res.status, text);
  } catch (error) {
    console.error("Catch error:", error.message);
  }
}

test();
