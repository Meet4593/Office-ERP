async function test() {
  try {
    const res = await fetch('https://office-erp-production.up.railway.app/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({name: 'Meet Patel', email: 'Meet', password: 'password123', securityQuestion: 'food', securityAnswer: 'dosa'})
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
test();
