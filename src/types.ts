import React from 'react';

export interface Departure {
  id: string;
  line: string;
  mode: 'train' | 'bus';
  direction: string;
  scheduledTime: string;
  predictedTime?: string;

  delay: number | null;
  platform?: string | null;
  routeId: string;
  tripId: string;
}

export interface DepartureBoardResponse {
  departures: Departure[];
  message?: string;
}

export interface Route {
  id: string;
  name: string;
  mode: 'train' | 'bus';
  fromStop: string;
  toStop: string;
  fromStopId: string;
  toStopId: string;
  direction: 'from' | 'to';
}

export interface ApiError {
  message: string;
  status?: number;
}

// Simplified title types for DepartureBoard
export type DepartureBoardTitle = 
  | string 
  | React.ReactElement 
  | { icon: React.ReactElement; content: React.ReactElement };

// More specific title variants for better type safety
export interface TitleWithIcon {
  icon: React.ReactElement;
  content: React.ReactElement;
}

export type SimpleTitle = string | React.ReactElement;

// Enhanced types for travel time calculation
export interface Arrival {
  id: string;
  line: string;
  mode: 'train' | 'bus';
  direction: string;
  scheduledTime: string;
  predictedTime?: string;
  delay: number | null;
  platform?: string | null;
  routeId: string;
  tripId: string;
}

export interface ArrivalBoardResponse {
  arrivals: Arrival[];
  message?: string;
}

export interface TripWithDuration {
  departure: Departure;
  arrival: Arrival;
  duration: number; // minutes
  isRealTime: boolean;
  calculatedAt: Date;
}

export interface TravelTimeCalculation {
  tripId: string;
  line: string;
  mode: 'train' | 'bus';
  duration: number;
  isRealTime: boolean;
  fallbackUsed: boolean;
  calculatedAt: Date;
  departureTime?: Date;
  arrivalTime?: Date;
  delay?: number;
  sampleCount?: number;
  minDuration?: number;
  maxDuration?: number;
}
