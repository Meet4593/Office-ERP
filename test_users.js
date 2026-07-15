async function test() {
  try {
    const loginRes = await fetch('https://office-erp-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email:'meet17727@gmail.com',password:'password123'})
    });
    const login = await loginRes.json();
    const token = login.token;
    
    const usersRes = await fetch('https://office-erp-production.up.railway.app/api/users', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log("Status:", usersRes.status);
    const users = await usersRes.text();
    console.log(users);
  } catch(e) {
    console.error(e);
  }
}
test();
