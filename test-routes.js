// Test script para verificar rutas API
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRoutes() {
  console.log('🧪 Testing API routes...\n');

  try {
    // Test 1: Obtener artistas
    console.log('1. Testing GET /artists...');
    const artistsResponse = await axios.get(`${BASE_URL}/artists`, { timeout: 5000 });
    console.log('✅ Artists endpoint works:', artistsResponse.data?.artists?.length || 0, 'artists');
  } catch (error) {
    console.log('❌ Artists endpoint failed:', error.response?.status || error.message);
  }

  try {
    // Test 2: Obtener categorías
    console.log('\n2. Testing GET /api/categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, { timeout: 5000 });
    console.log('✅ Categories endpoint works:', categoriesResponse.data?.length || 0, 'categories');
  } catch (error) {
    console.log('❌ Categories endpoint failed:', error.response?.status || error.message);
  }

  try {
    // Test 3: Obtener usuario específico (sin auth)
    console.log('\n3. Testing GET /api/users/:id...');
    const userResponse = await axios.get(`${BASE_URL}/api/users/1`, { timeout: 5000 });
    console.log('✅ User endpoint works:', !!userResponse.data);
  } catch (error) {
    console.log('❌ User endpoint failed:', error.response?.status || error.message);
  }

  console.log('\n🏁 Route testing completed!');
}

testRoutes().catch(console.error);
