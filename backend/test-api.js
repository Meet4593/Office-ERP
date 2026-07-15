async function test() {
  try {
    const res = await fetch('https://office-erp-production.up.railway.app/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-07-15T00:00:00.000Z',
        type: 'PURCHASE',
        status: 'PENDING',
        paymentMode: 'CASH',
        createdByUserId: 1
      })
    });
    const data = await res.json();
    console.log(res.status, data);
  } catch (error) {
    console.error(error.message);
  }
}

test();
