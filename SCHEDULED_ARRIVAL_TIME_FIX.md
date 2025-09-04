# Scheduled Arrival Time Fix

## 🐛 **Issue Identified**

The crossed-out (scheduled) arrival time was not being calculated correctly when using enhanced travel times from the API.

### **Problem Example**
- **Scheduled departure**: 17:53
- **Travel duration**: 24 minutes (enhanced/real-time)
- **Expected scheduled arrival**: 17:53 + 24min = **18:17**
- **Actual display**: **18:12** ❌ (incorrect - using hardcoded 18min travel time)

## 🔍 **Root Cause Analysis**

The issue was in the arrival time display logic:

### **Problematic Code**
```typescript
// This was using hardcoded travel time (18min) for scheduled arrival
{formatArrivalTime(departure)}  // ❌ Wrong - used hardcoded travel time
```

### **The Issue**
- `formatArrivalTime(departure)` was calling `calculateArrivalTime(departure)`
- `calculateArrivalTime()` was using `TRAVEL_TIMES[departure.mode]` (hardcoded 18min)
- But the system was configured to use enhanced travel times (24min from API)
- This created inconsistency between scheduled and actual arrival times

## ✅ **Solution Implemented**

### **New Function**
Created `calculateScheduledArrivalTime()` that properly handles:
1. **Scheduled departure time** (no delay)
2. **Enhanced travel time** (real-time API data)
3. **Fallback to hardcoded travel time**

```typescript
const calculateScheduledArrivalTime = (departure: Departure): string => {
  try {
    // Use scheduled time (no delay)
    const scheduledTime = new Date(departure.scheduledTime);
    
    // Get travel time (enhanced or hardcoded) - use original departure for scheduled time
    const originalDeparture = { ...departure, delay: null };
    const travelMinutes = getTravelTime(originalDeparture);
    
    // Calculate scheduled arrival time
    const arrivalTime = new Date(scheduledTime.getTime() + travelMinutes * 60 * 1000);
    
    return arrivalTime.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '--:--';
  }
};
```

### **Key Features**
1. **Enhanced Travel Time**: Uses real-time API data when available
2. **No Delay**: Calculates based on scheduled departure time
3. **Fallback**: Falls back to hardcoded travel times if API fails
4. **Consistent**: Uses same travel time source as actual arrival time

## 🎯 **How It Works Now**

### **Calculation Flow**
1. **Input**: `departure` (original, no delay applied)
2. **Scheduled Departure Time**: 17:53 (no delay)
3. **Travel Time**: 24 minutes (from enhanced API calculation)
4. **Scheduled Arrival Time**: 17:53 + 24min = 18:17 ✅

### **Display Logic**
```typescript
{debugDeparture.delay !== null && debugDeparture.delay > 0 ? (
  <>
    {/* Original scheduled arrival time - crossed out */}
    <time className="line-through text-white/40">
      {calculateScheduledArrivalTime(departure)}  // Shows 18:17 (correct!)
    </time>
    {/* Actual arrival time with delay - highlighted */}
    <time className="text-red-400 font-bold">
      {calculateArrivalTimeWithDelay(debugDeparture)}  // Shows 18:18 (correct!)
    </time>
  </>
) : (
  // Normal display when no delay
  <time>{calculateArrivalTimeWithDelay(debugDeparture)}</time>
)}
```

## 📊 **Example with Fix**

### **Scenario**: Train S4 with 1-minute delay
- **Scheduled departure**: 17:53
- **Actual departure**: 17:54 (17:53 + 1min delay)
- **Travel time**: 24 minutes (enhanced/real-time)
- **Scheduled arrival**: 18:17 (17:53 + 24min)
- **Actual arrival**: 18:18 (17:54 + 24min)

### **UI Display**
```
┌─────────────────────────────────────┐
│ 🚂 S4 to Masarykovo                │
│                                     │
│ 17:53 → 18:17 (24 min)             │ ← Scheduled (crossed out) ✅
│ 17:54 → 18:18 (24 min)             │ ← Actual (highlighted) ✅
│        (+1m)                       │
└─────────────────────────────────────┘
```

## 🧪 **Testing**

### **Debug Mode**
To test the fix, enable debug mode:
```typescript
const DEBUG_ADD_DELAY = true;  // Enable debug delay
const DEBUG_DELAY_MINUTES = 1; // 1-minute delay
```

### **Expected Results**
- ✅ **Scheduled arrival time**: 18:17 (crossed out) - using enhanced travel time
- ✅ **Actual arrival time**: 18:18 (highlighted) - using enhanced travel time
- ✅ **Delay indicator**: (+1m)
- ✅ **Travel time**: 24 minutes (enhanced) for both scheduled and actual

## 🎉 **Benefits of the Fix**

1. **Consistent Calculations**: Both scheduled and actual arrival times use same travel time source
2. **Enhanced Travel Times**: Real-time API data is properly applied to scheduled times
3. **Accurate Display**: Passengers see correct scheduled arrival times
4. **Better UX**: Consistent and accurate time information
5. **Robust Fallback**: Works with both enhanced and hardcoded travel times

## 🔧 **Files Modified**

- **`src/components/DepartureBoard.tsx`**:
  - Added `calculateScheduledArrivalTime()` function
  - Updated scheduled arrival time display logic
  - Replaced `formatArrivalTime(departure)` calls with new function
  - Removed unused `formatArrivalTime` import
  - Fixed both mobile and desktop layouts

## ✅ **Verification**

- ✅ **TypeScript compilation**: No errors
- ✅ **Build process**: Successful
- ✅ **Logic verification**: Scheduled arrival time uses enhanced travel time
- ✅ **UI consistency**: Both mobile and desktop layouts fixed
- ✅ **Enhanced travel times**: Real-time API data properly applied to scheduled times

## 🚀 **Key Improvements**

1. **Unified Travel Time Source**: Both scheduled and actual times use same calculation method
2. **Enhanced Support**: Properly integrates with real-time travel time API
3. **Consistent Display**: Scheduled arrival times now match the enhanced travel time
4. **Fallback Logic**: Graceful degradation when API data is unavailable
5. **Accurate Information**: Passengers see correct scheduled arrival times

The scheduled arrival time calculation now works correctly with enhanced travel times, ensuring passengers see accurate and consistent arrival time information!
