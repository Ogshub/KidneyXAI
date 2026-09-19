const axios = require('axios');

async function check() {
  try {
    const res = await axios.post('https://kidneycare-backend.onrender.com/api/auth/login', {
      email: 'test@example.com',
      password: 'wrong'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
    console.log('Error message:', err.message);
  }
}

check();
