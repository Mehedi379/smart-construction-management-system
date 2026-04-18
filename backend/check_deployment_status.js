const axios = require('axios');
require('dotenv').config();

console.log('\n========================================');
console.log('🔍 CHECKING LIVE DEPLOYMENT STATUS');
console.log('========================================\n');

async function checkDeployment() {
    // Check Railway Backend URL
    const railwayUrl = process.env.RAILWAY_BACKEND_URL || 'https://your-backend.railway.app';
    const healthUrl = `${railwayUrl}/api/health`;
    
    console.log('1️⃣  CHECKING RAILWAY BACKEND:');
    console.log('─────────────────────────────────────');
    console.log(`URL: ${railwayUrl}`);
    console.log(`Health Check: ${healthUrl}`);
    console.log('');
    
    try {
        const response = await axios.get(healthUrl, { timeout: 10000 });
        
        if (response.status === 200) {
            console.log('✅ Backend is LIVE and responding!');
            console.log(`Status: ${response.data.status || 'OK'}`);
            console.log(`Message: ${response.data.message}`);
            console.log(`Environment: ${response.data.environment}`);
            console.log('');
        }
    } catch (error) {
        console.log('❌ Backend NOT accessible');
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('Possible issues:');
        console.log('  - Backend not deployed to Railway yet');
        console.log('  - Wrong URL');
        console.log('  - Railway service is stopped');
        console.log('');
    }

    // Check Vercel Frontend
    const vercelUrl = process.env.VERCEL_FRONTEND_URL || 'https://your-app.vercel.app';
    
    console.log('2️⃣  CHECKING VERCEL FRONTEND:');
    console.log('─────────────────────────────────────');
    console.log(`URL: ${vercelUrl}`);
    console.log('');
    
    try {
        const response = await axios.get(vercelUrl, { timeout: 10000 });
        
        if (response.status === 200) {
            console.log('✅ Frontend is LIVE and accessible!');
            console.log(`Status: ${response.status}`);
            console.log('');
        }
    } catch (error) {
        console.log('❌ Frontend NOT accessible');
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('Possible issues:');
        console.log('  - Frontend not deployed to Vercel yet');
        console.log('  - Wrong URL');
        console.log('  - Vercel deployment failed');
        console.log('');
    }

    // Check Frontend API Connection
    const frontendApiUrl = `${vercelUrl}/api/health`;
    
    console.log('3️⃣  CHECKING FRONTEND → BACKEND CONNECTION:');
    console.log('─────────────────────────────────────');
    console.log(`API URL: ${frontendApiUrl}`);
    console.log('');
    
    try {
        const response = await axios.get(frontendApiUrl, { timeout: 10000 });
        
        if (response.status === 200) {
            console.log('✅ Frontend can connect to Backend!');
            console.log('CORS is properly configured');
            console.log('');
        }
    } catch (error) {
        console.log('❌ Frontend CANNOT connect to Backend');
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('Possible issues:');
        console.log('  - VITE_API_URL not set correctly in Vercel');
        console.log('  - CORS not configured on backend');
        console.log('  - Backend URL is wrong');
        console.log('');
    }

    // Summary
    console.log('========================================');
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('========================================\n');
    
    console.log('Check your Railway Dashboard:');
    console.log('  https://railway.app');
    console.log('  → zippy-unity project');
    console.log('  → backend service');
    console.log('  → Copy the URL from top');
    console.log('');
    
    console.log('Check your Vercel Dashboard:');
    console.log('  https://vercel.com');
    console.log('  → smart-construction-frontend project');
    console.log('  → Check deployment status');
    console.log('  → Verify VITE_API_URL environment variable');
    console.log('');
    
    console.log('To verify manually:');
    console.log(`  Backend: ${railwayUrl}/api/health`);
    console.log(`  Frontend: ${vercelUrl}`);
    console.log('');
}

checkDeployment().catch(err => {
    console.error('Error:', err.message);
});
