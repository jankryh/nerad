# Delay Timer Enhancement

## 🎯 **Requested Enhancement**

The user requested that when there's a delay, it should be automatically added to the "za x min" timer and displayed in red color.

## ✅ **Implementation**

### **How It Works**

The system now automatically:
1. **Includes delay** in the timer calculation (already working via `calculateActualDepartureTime`)
2. **Displays in red** when there's a delay
3. **Shows normal color** when there's no delay

### **Technical Implementation**

```typescript
{(() => {
  const minutesUntil = getMinutesUntilDeparture(debugDeparture);
  const hasDelay = debugDeparture.delay && debugDeparture.delay > 0;
  
  return minutesUntil !== null ? (
    <div className="absolute top-2 left-2 z-10">
      <span className={`text-xs font-medium bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md ${
        hasDelay 
          ? 'text-red-400'     // Red color when delayed
          : 'text-white/60'    // Normal color when on time
      }`}>
        za {minutesUntil} min
      </span>
    </div>
  ) : null;
})()}
```

### **Key Features**

1. **Automatic Delay Inclusion**: The `getMinutesUntilDeparture()` function uses `calculateActualDepartureTime(departure)` which automatically includes delays
2. **Color Coding**: 
   - **Red** (`text-red-400`) when there's a delay
   - **White/Gray** (`text-white/60`) when on time
3. **Real-time Updates**: Timer updates automatically as time passes
4. **Visual Consistency**: Same styling as other delay indicators in the app

## 📊 **Example Scenarios**

### **Scenario 1: On Time Departure**
- **Scheduled departure**: 10:30
- **Current time**: 10:18
- **Timer display**: `za 12 min` (white/gray color)

### **Scenario 2: Delayed Departure**
- **Scheduled departure**: 10:30
- **Actual departure**: 10:33 (3min delay)
- **Current time**: 10:18
- **Timer display**: `za 15 min` (red color)

### **Visual Result**
```
┌─────────────────────────────────────┐
│ za 12 min  🚂 S4 to Masarykovo     │ ← White (on time)
│ 10:30 → 10:48 (18 min)             │
│                                     │
│ za 15 min  🚂 S4 to Masarykovo     │ ← Red (delayed)
│ 10:33 → 10:51 (18 min)             │
└─────────────────────────────────────┘
```

## 🎨 **Visual Design**

### **Color Scheme**
- **On Time**: `text-white/60` - Subtle white/gray
- **Delayed**: `text-red-400` - Bright red for attention
- **Background**: `bg-black/20 backdrop-blur-sm` - Consistent with other elements

### **Styling**
- **Font**: `text-xs font-medium` - Small, readable
- **Padding**: `px-2 py-1` - Comfortable spacing
- **Border**: `rounded-md` - Rounded corners
- **Position**: `absolute top-2 left-2 z-10` - Top-left corner

## 🔄 **Dynamic Behavior**

### **Real-time Updates**
- **Timer calculation**: Updates every second based on current time
- **Delay detection**: Automatically detects if departure has delay
- **Color switching**: Changes color immediately when delay status changes

### **Edge Cases**
- **Past departures**: No timer shown for departures that have already left
- **No delay**: Normal white/gray color
- **With delay**: Red color to indicate delay
- **Error states**: Graceful handling during error conditions

## 🧪 **Testing**

### **Debug Mode**
To test the delay functionality:
```typescript
const DEBUG_ADD_DELAY = true;  // Enable debug delay
const DEBUG_DELAY_MINUTES = 3; // 3-minute delay
```

### **Expected Results**
- ✅ **On-time departures**: White/gray timer
- ✅ **Delayed departures**: Red timer
- ✅ **Correct calculation**: Timer includes delay automatically
- ✅ **Visual distinction**: Clear color difference

## 🎉 **Benefits**

### **1. Better User Experience**
- ✅ **Immediate recognition** - Users instantly see delayed departures
- ✅ **Accurate timing** - Timer reflects actual departure time including delays
- ✅ **Visual hierarchy** - Red color draws attention to delays

### **2. Information Clarity**
- ✅ **No confusion** - Timer shows actual time until departure
- ✅ **Delay awareness** - Users know which departures are delayed
- ✅ **Consistent behavior** - Same logic as other delay indicators

### **3. Accessibility**
- ✅ **Color coding** - Visual indication of delay status
- ✅ **High contrast** - Red color is clearly visible
- ✅ **Consistent styling** - Matches other UI elements

## 🔧 **Technical Details**

### **Calculation Logic**
```typescript
const getMinutesUntilDeparture = (departure: Departure): number | null => {
  try {
    const now = new Date();
    const actualDepartureTime = calculateActualDepartureTime(departure); // Includes delay
    const minutesUntil = Math.round((actualDepartureTime.getTime() - now.getTime()) / (1000 * 60));
    
    return minutesUntil > 0 ? minutesUntil : null;
  } catch {
    return null;
  }
};
```

### **Delay Detection**
```typescript
const hasDelay = debugDeparture.delay && debugDeparture.delay > 0;
```

### **Conditional Styling**
```typescript
className={`text-xs font-medium bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md ${
  hasDelay 
    ? 'text-red-400'     // Red for delays
    : 'text-white/60'    // White for on-time
}`}
```

## ✅ **Verification**

- ✅ **TypeScript compilation**: No errors
- ✅ **Build process**: Successful
- ✅ **Delay inclusion**: Timer automatically includes delays
- ✅ **Color coding**: Red color for delayed departures
- ✅ **Visual consistency**: Matches other delay indicators
- ✅ **Real-time updates**: Timer updates correctly

## 🎯 **Result**

**Successfully implemented delay-aware timer with color coding:**

1. ✅ **Automatic delay inclusion** - Timer shows actual time until departure
2. ✅ **Red color for delays** - Clear visual indication of delayed departures
3. ✅ **White color for on-time** - Normal appearance for punctual departures
4. ✅ **Real-time updates** - Timer updates automatically
5. ✅ **Consistent styling** - Matches other UI elements

**Users now get immediate visual feedback about departure delays directly in the timer!** 🎉
