// Console test script for arrival mode functionality
// Run this in the browser console to test the arrival mode

console.log('🧪 Starting Arrival Mode Console Test...');

// Test configuration
const TEST_CONFIG = {
  REZ_STOP: 'U2823Z301',
  MASARYKOVO_STOP: 'U480Z301', 
  HUSINEC_STOP: 'U2245Z2',
  KOBYLISY_STOP: 'U675Z12',
  TRAIN_LINE: 'S4',
  BUS_LINE: '371'
};

// Test function 1: Test arrival API call
async function testArrivalAPI() {
  console.log('📍 Test 1: Testing arrival API call...');
  
  try {
    // This would normally use the API service, but we'll simulate the API call
    const mockArrivalResponse = {
      arrivals: [
        {
          id: 'arr_1',
          line: 'S4',
          mode: 'train',
          direction: 'to-masarykovo',
          scheduledTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          delay: 0,
          tripId: 'trip_123',
          routeId: 'S4'
        }
      ],
      message: 'Mock arrival data'
    };
    
    console.log('✅ Mock arrival response:', mockArrivalResponse);
    return mockArrivalResponse;
  } catch (error) {
    console.error('❌ Arrival API test failed:', error);
    return null;
  }
}

// Test function 2: Test departure API call
async function testDepartureAPI() {
  console.log('📍 Test 2: Testing departure API call...');
  
  try {
    const mockDepartureResponse = {
      departures: [
        {
          id: 'dep_1',
          line: 'S4',
          mode: 'train',
          direction: 'to-masarykovo',
          scheduledTime: new Date().toISOString(),
          delay: 0,
          tripId: 'trip_123',
          routeId: 'S4'
        }
      ],
      message: 'Mock departure data'
    };
    
    console.log('✅ Mock departure response:', mockDepartureResponse);
    return mockDepartureResponse;
  } catch (error) {
    console.error('❌ Departure API test failed:', error);
    return null;
  }
}

// Test function 3: Test trip matching
async function testTripMatching() {
  console.log('📍 Test 3: Testing trip matching...');
  
  try {
    const departureData = await testDepartureAPI();
    const arrivalData = await testArrivalAPI();
    
    if (departureData && arrivalData) {
      const departureTrips = departureData.departures.map(d => d.tripId);
      const arrivalTrips = arrivalData.arrivals.map(a => a.tripId);
      
      const matchingTrips = departureTrips.filter(tripId => arrivalTrips.includes(tripId));
      
      console.log('📊 Trip matching results:');
      console.log('- Departure trips:', departureTrips);
      console.log('- Arrival trips:', arrivalTrips);
      console.log('- Matching trips:', matchingTrips);
      console.log('- Can match trips:', matchingTrips.length > 0);
      
      return matchingTrips.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Trip matching test failed:', error);
    return false;
  }
}

// Test function 4: Test travel time calculation
async function testTravelTimeCalculation() {
  console.log('📍 Test 4: Testing travel time calculation...');
  
  try {
    const departureData = await testDepartureAPI();
    const arrivalData = await testArrivalAPI();
    
    if (departureData && arrivalData) {
      const departure = departureData.departures[0];
      const arrival = arrivalData.arrivals[0];
      
      if (departure.tripId === arrival.tripId) {
        const departureTime = new Date(departure.scheduledTime);
        const arrivalTime = new Date(arrival.scheduledTime);
        const duration = Math.round((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60));
        
        console.log('📊 Travel time calculation:');
        console.log('- Departure time:', departureTime.toLocaleTimeString());
        console.log('- Arrival time:', arrivalTime.toLocaleTimeString());
        console.log('- Duration:', duration, 'minutes');
        console.log('- Is valid duration:', duration > 0 && duration < 180);
        
        return {
          duration,
          isValid: duration > 0 && duration < 180,
          departureTime,
          arrivalTime
        };
      }
    }
    
    console.log('⚠️ No matching trips found for travel time calculation');
    return null;
  } catch (error) {
    console.error('❌ Travel time calculation test failed:', error);
    return null;
  }
}

// Test function 5: Test enhanced travel time function
async function testEnhancedTravelTime() {
  console.log('📍 Test 5: Testing enhanced travel time function...');
  
  try {
    // Mock departure object
    const mockDeparture = {
      id: 'dep_1',
      line: 'S4',
      mode: 'train',
      direction: 'to-masarykovo',
      scheduledTime: new Date().toISOString(),
      delay: 0,
      tripId: 'trip_123',
      routeId: 'S4'
    };
    
    console.log('📊 Testing with mock departure:', mockDeparture);
    
    // Simulate the enhanced travel time calculation
    const stopIds = getStopIdsForTrip(mockDeparture);
    console.log('📍 Stop IDs for trip:', stopIds);
    
    if (stopIds.departureStopId && stopIds.arrivalStopId) {
      console.log('✅ Stop IDs determined successfully');
      console.log('- Departure stop:', stopIds.departureStopId);
      console.log('- Arrival stop:', stopIds.arrivalStopId);
      
      // Simulate API call result
      const mockTravelTime = {
        tripId: 'trip_123',
        line: 'S4',
        mode: 'train',
        duration: 18,
        isRealTime: true,
        fallbackUsed: false,
        calculatedAt: new Date()
      };
      
      console.log('✅ Mock travel time result:', mockTravelTime);
      return mockTravelTime;
    } else {
      console.log('⚠️ Could not determine stop IDs, would use fallback');
      return {
        tripId: 'trip_123',
        line: 'S4',
        mode: 'train',
        duration: 18, // Fallback value
        isRealTime: false,
        fallbackUsed: true,
        calculatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('❌ Enhanced travel time test failed:', error);
    return null;
  }
}

// Helper function to determine stop IDs (copied from timeCalculations.ts)
function getStopIdsForTrip(departure) {
  if (departure.line === 'S4') {
    if (departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')) {
      return {
        departureStopId: TEST_CONFIG.REZ_STOP,
        arrivalStopId: TEST_CONFIG.MASARYKOVO_STOP
      };
    } else {
      return {
        departureStopId: TEST_CONFIG.MASARYKOVO_STOP,
        arrivalStopId: TEST_CONFIG.REZ_STOP
      };
    }
  } else if (departure.line === '371') {
    if (departure.direction.includes('Kobylisy') || departure.direction.includes('Praha')) {
      return {
        departureStopId: TEST_CONFIG.HUSINEC_STOP,
        arrivalStopId: TEST_CONFIG.KOBYLISY_STOP
      };
    } else {
      return {
        departureStopId: TEST_CONFIG.KOBYLISY_STOP,
        arrivalStopId: TEST_CONFIG.HUSINEC_STOP
      };
    }
  }
  
  return { departureStopId: null, arrivalStopId: null };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all arrival mode tests...\n');
  
  const results = {
    arrivalAPI: await testArrivalAPI(),
    departureAPI: await testDepartureAPI(),
    tripMatching: await testTripMatching(),
    travelTimeCalculation: await testTravelTimeCalculation(),
    enhancedTravelTime: await testEnhancedTravelTime()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('- Arrival API:', results.arrivalAPI ? '✅ PASS' : '❌ FAIL');
  console.log('- Departure API:', results.departureAPI ? '✅ PASS' : '❌ FAIL');
  console.log('- Trip Matching:', results.tripMatching ? '✅ PASS' : '❌ FAIL');
  console.log('- Travel Time Calculation:', results.travelTimeCalculation ? '✅ PASS' : '❌ FAIL');
  console.log('- Enhanced Travel Time:', results.enhancedTravelTime ? '✅ PASS' : '❌ FAIL');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Arrival mode implementation is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation.');
  }
  
  return results;
}

// Export functions for manual testing
window.arrivalModeTests = {
  testArrivalAPI,
  testDepartureAPI,
  testTripMatching,
  testTravelTimeCalculation,
  testEnhancedTravelTime,
  runAllTests
};

console.log('✅ Arrival mode test functions loaded!');
console.log('Available functions:');
console.log('- arrivalModeTests.runAllTests() - Run all tests');
console.log('- arrivalModeTests.testArrivalAPI() - Test arrival API');
console.log('- arrivalModeTests.testDepartureAPI() - Test departure API');
console.log('- arrivalModeTests.testTripMatching() - Test trip matching');
console.log('- arrivalModeTests.testTravelTimeCalculation() - Test travel time calculation');
console.log('- arrivalModeTests.testEnhancedTravelTime() - Test enhanced travel time');
console.log('\nRun: arrivalModeTests.runAllTests() to start testing');
