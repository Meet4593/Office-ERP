fetch('https://officeproject-azure.vercel.app/')
  .then(r => r.text())
  .then(h => {
    const m = h.match(/src="([^"]+\.js)"/);
    if (m) {
      fetch('https://officeproject-azure.vercel.app' + m[1])
        .then(r => r.text())
        .then(j => console.log(j.match(/https?:\/\/[^\/]+\/api/)[0]))
        .catch(console.error);
    }
  })
  .catch(console.error);
