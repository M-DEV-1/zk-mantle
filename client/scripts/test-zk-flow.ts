
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:3000';

async function runTest() {
    console.log('--- STARTING ZK FLOW TEST ---');

    const userAddress = '0xTestUser' + Math.floor(Math.random() * 10000);

    // 1. Generate Proof (Age)
    console.log('\n1. Testing POST /api/proof/generate (Age)...');
    try {
        const genRes = await axios.post(`${BASE_URL}/api/proof/generate`, {
            type: 'age',
            userAddress,
            birthYear: "2000",
            birthMonth: "1",
            birthDay: "1",
            referenceYear: "2024",
            challenge: '123456789'
        });

        if (genRes.data.success) {
            console.log('✅ Age Proof Generated Successfully!');
            const { proof, publicSignals } = genRes.data;

            // 2. Verify Age
            const verifyRes = await axios.post(`${BASE_URL}/api/verify`, {
                type: 'age',
                proof,
                publicSignals
            });

            if (verifyRes.data.verified) {
                console.log('✅ Age Verified Successfully!');
            } else {
                console.error('❌ Age Verification Failed');
            }

        } else {
            console.error('❌ Age Proof Generation Failed (success=false)');
        }
    } catch (error: any) {
        console.error('❌ Age API Error:', error.response?.data || error.message);
        if (error.response?.data?.inputDebug) {
            console.log('DEBUG: Input used:', JSON.stringify(error.response.data.inputDebug, null, 2));
        }
    }

    // 3. Generate Proof (Location)
    try {
        console.log('\n3. Testing POST /api/proof/generate (Location)...');
        const locRes = await axios.post(`${BASE_URL}/api/proof/generate`, {
            type: 'location',
            userAddress,
            userLat: 40.7128,
            userLon: -74.0060,
            providerLat: 40.7128,
            providerLon: -74.0060,
            radiusKm: 1.0
        });

        if (locRes.data.success) {
            console.log('✅ Location Proof Generated Successfully!');
            const { proof, publicSignals } = locRes.data;

            // 4. Verify Location
            console.log('\n4. Testing POST /api/verify (Location)...');
            const verifyLocRes = await axios.post(`${BASE_URL}/api/verify`, {
                type: 'location',
                proof,
                publicSignals
            });

            if (verifyLocRes.data.verified) {
                console.log('✅ Location Proof Verified Successfully!');
            } else {
                console.error('❌ Location Verification Failed');
            }
        } else {
            console.error('❌ Location Proof Generation Failed');
            console.log(locRes.data);
        }

    } catch (error: any) {
        console.error('❌ Location API Error:', error.response?.data || error.message);
        if (error.response?.data?.inputDebug) {
            console.log('DEBUG: Input used:', JSON.stringify(error.response.data.inputDebug, null, 2));
        }
    }
}

runTest();
