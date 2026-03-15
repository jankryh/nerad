// Služba pro odjezdy s modulární architekturou

import { BaseAPIService } from './BaseAPIService';
import { DepartureBoardResponse, ArrivalBoardResponse, ApiError, TravelTimeCalculation } from '../../types';
import { cacheKeys } from '../../utils/cache';

export interface DepartureRequest {
  stopPlaceId: string;
  lineId: string;
  limit?: number;
  direction?: string;
  useCache?: boolean;
}

export interface BatchDepartureRequest {
  requests: DepartureRequest[];
  maxConcurrent?: number;
}

export interface ArrivalRequest {
  stopPlaceId: string;
  lineId: string;
  limit?: number;
  direction?: string;
  useCache?: boolean;
}

export interface TravelTimeRequest {
  departureStopId: string;
  arrivalStopId: string;
  lineId: string;
  direction?: string;
  useCache?: boolean;
}

export class DeparturesService extends BaseAPIService {
  constructor() {
    super({
      cacheTTL: 30000, // 30 sekund pro odjezdy
      retries: 2,      // Méně retry pro odjezdy
      timeout: 8000    // Kratší timeout pro rychlejší UX
    });
  }

  /**
   * Získá odjezdy pro jednu zastávku
   */
  async getDepartures(request: DepartureRequest): Promise<DepartureBoardResponse> {
    const { stopPlaceId, lineId, limit = 3, direction, useCache = true } = request;
    
    try {
      const cacheKey = cacheKeys.departures(stopPlaceId, lineId, direction);
      
      console.log(`🔍 Načítám odjezdy pro zastávku ${stopPlaceId}, linku ${lineId}, směr: ${direction}`);
      
      const response = await this.get<any>(
        '/departureboards',
        {
          params: {
            'ids[]': stopPlaceId,
            limit: 50,
            minutesAfter: 240,
            mode: 'departures',
            order: 'real'
          }
        },
        cacheKey,
        useCache
      );

      if (response.data && response.data.departures) {
        console.log(`📊 API vrátilo ${response.data.departures.length} odjezdů celkem`);
        
        const filteredDepartures = this.filterDepartures(
          response.data.departures,
          lineId,
          direction
        );

        const formattedDepartures = this.formatDepartures(filteredDepartures);
        const limitedDepartures = formattedDepartures.slice(0, limit);

        console.log(`✅ Načteno ${limitedDepartures.length} odjezdů pro zastávku ${stopPlaceId}, směr: ${direction}`);
        
        return {
          departures: limitedDepartures,
          message: `Načteno ${limitedDepartures.length} odjezdů`
        };
      }

      return {
        departures: [],
        message: 'Žádné odjezdy nenalezeny'
      };

    } catch (error) {
      console.error('Error fetching departures:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Získá příjezdy pro jednu zastávku
   */
  async getArrivals(request: ArrivalRequest): Promise<ArrivalBoardResponse> {
    const { stopPlaceId, lineId, limit = 3, direction, useCache = true } = request;
    
    try {
      const cacheKey = `arrivals:${stopPlaceId}:${lineId}:${direction || 'all'}`;
      
      console.log(`🔍 Načítám příjezdy pro zastávku ${stopPlaceId}, linku ${lineId}, směr: ${direction}`);
      
      const response = await this.get<any>(
        '/pid/departureboards',
        {
          params: {
            'ids[]': stopPlaceId,
            limit: 50,
            minutesAfter: 240,
            mode: 'arrivals',
            order: 'real'
          }
        },
        cacheKey,
        useCache
      );

      if (response.data && response.data.departures) {
        console.log(`📊 API vrátilo ${response.data.departures.length} příjezdů celkem`);
        
        const filteredArrivals = this.filterDepartures(
          response.data.departures,
          lineId,
          direction
        );

        const formattedArrivals = this.formatArrivals(filteredArrivals);
        const limitedArrivals = formattedArrivals.slice(0, limit);

        console.log(`✅ Načteno ${limitedArrivals.length} příjezdů pro zastávku ${stopPlaceId}, směr: ${direction}`);
        
        return {
          arrivals: limitedArrivals,
          message: `Načteno ${limitedArrivals.length} příjezdů`
        };
      }

      return {
        arrivals: [],
        message: 'Žádné příjezdy nenalezeny'
      };

    } catch (error) {
      console.error('Error fetching arrivals:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Získá odjezdy pro více zastávek najednou (batch)
   */
  async getBatchDepartures(batchRequest: BatchDepartureRequest): Promise<DepartureBoardResponse[]> {
    const { requests, maxConcurrent = 5 } = batchRequest;
    
    console.log(`🚀 Batch request pro ${requests.length} zastávek`);
    
    const requestFunctions = requests.map(request => 
      () => this.getDepartures(request)
    );

    try {
      const results = await this.batchRequests(requestFunctions, maxConcurrent);
      console.log(`✅ Batch request dokončen: ${results.length} úspěšných`);
      return results;
    } catch (error) {
      console.error('❌ Batch request failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Získá všechny potřebné odjezdy pro současnou aplikaci
   */
  async getAllDepartures(): Promise<{
    rezToMasarykovo: DepartureBoardResponse;
    masarykovoToRez: DepartureBoardResponse;
    husinecsToKobylisy: DepartureBoardResponse;
    kobylisyToHusinec: DepartureBoardResponse;
  }> {
    const requests: DepartureRequest[] = [
      { stopPlaceId: 'U2823Z301', lineId: 'S4', limit: 3, direction: 'to-masarykovo' },
      { stopPlaceId: 'U480Z301', lineId: 'S4', limit: 3, direction: 'to-rez' },
      { stopPlaceId: 'U2245Z2', lineId: '371', limit: 3, direction: 'to-kobylisy' },
      { stopPlaceId: 'U675Z12', lineId: '371', limit: 3, direction: 'to-husinec' }
    ];

    try {
      const results = await this.getBatchDepartures({ requests, maxConcurrent: 4 });
      
      return {
        rezToMasarykovo: results[0] || { departures: [], message: 'Chyba při načítání' },
        masarykovoToRez: results[1] || { departures: [], message: 'Chyba při načítání' },
        husinecsToKobylisy: results[2] || { departures: [], message: 'Chyba při načítání' },
        kobylisyToHusinec: results[3] || { departures: [], message: 'Chyba při načítání' }
      };
    } catch (error) {
      console.error('Error fetching all departures:', error);
      throw error;
    }
  }

  /**
   * Filtruje odjezdy podle linky a směru
   */
  private filterDepartures(departures: any[], lineId?: string, direction?: string): any[] {
    let filtered = departures;

    // Filtrování podle linky
    if (lineId) {
      filtered = filtered.filter(dep => dep.route?.short_name === lineId);
      console.log(`[TRAIN] Po filtrování podle linky ${lineId}: ${filtered.length} odjezdů`);
    }

    // Filtrování podle směru
    if (direction) {
      console.log(`🔍 PŘED filtrováním podle směru "${direction}": ${filtered.length} odjezdů`);
      filtered.forEach((dep, index) => {
        console.log(`  ${index + 1}. "${dep.trip?.headsign || 'N/A'}" (${dep.route?.short_name || 'N/A'})`);
      });
      
      filtered = filtered.filter(dep => this.matchesDirection(dep, direction));
      console.log(`📋 Po filtrování podle směru: ${filtered.length} odjezdů`);
    }

    return filtered;
  }

  /**
   * Kontroluje, zda odjezd odpovídá směru
   */
  private matchesDirection(departure: any, direction: string): boolean {
    const headsign = departure.trip?.headsign || '';
    
    console.log(`🎯 matchesDirection: checking "${headsign}" for direction "${direction}"`);
    
    let matches = false;
    switch (direction) {
      case 'to-masarykovo':
        matches = headsign.includes('Masarykovo') || headsign.includes('Praha');
        break;
      
      case 'to-rez':
        matches = (headsign.includes('Ústí') || headsign.includes('Kralupy') || headsign.includes('Řež')) && 
               !headsign.includes('Praha');
        break;
      
      case 'to-kobylisy':
        matches = headsign.includes('Kobylisy') || headsign.includes('Praha') || headsign.includes('Klecany');
        break;
      
      case 'to-husinec':
        matches = (headsign.includes('Husinec') || headsign.includes('Řež')) && 
               !headsign.includes('Klecany') && 
               !headsign.includes('Astrapark') &&
               !headsign.includes('Klecánky');
        break;
      
      default:
        matches = true;
        break;
    }
    
    console.log(`🎯 matchesDirection result: "${headsign}" ${matches ? '✅ MATCHES' : '❌ DOES NOT MATCH'} "${direction}"`);
    return matches;
  }

  /**
   * Formátuje odjezdy do požadovaného formátu
   */
  private formatDepartures(departures: any[]): any[] {
    return departures.map(dep => ({
      id: dep.trip?.id || `dep_${Date.now()}_${Math.random()}`,
      scheduledTime: dep.departure_timestamp?.scheduled || dep.departure_timestamp?.predicted,
      predictedTime: dep.departure_timestamp?.predicted,
      delay: dep.delay?.minutes || 0,
      line: dep.route?.short_name || 'N/A',
      direction: dep.trip?.headsign || 'N/A',
      mode: dep.route?.type === 2 ? 'train' : 'bus',
      platform: dep.stop?.platform_code || null,
      routeId: dep.route?.short_name || 'N/A',
      tripId: dep.trip?.id || 'N/A'
    }));
  }

  /**
   * Formátuje příjezdy do požadovaného formátu
   */
  private formatArrivals(arrivals: any[]): any[] {
    return arrivals.map(arr => ({
      id: arr.trip?.id || `arr_${Date.now()}_${Math.random()}`,
      scheduledTime: arr.arrival_timestamp?.scheduled || arr.arrival_timestamp?.predicted,
      predictedTime: arr.arrival_timestamp?.predicted,
      delay: arr.delay?.minutes || 0,
      line: arr.route?.short_name || 'N/A',
      direction: arr.trip?.headsign || 'N/A',
      mode: arr.route?.type === 2 ? 'train' : 'bus',
      platform: arr.stop?.platform_code || null,
      routeId: arr.route?.short_name || 'N/A',
      tripId: arr.trip?.id || 'N/A'
    }));
  }

  /**
   * Vypočítá dobu jízdy mezi dvěma zastávkami s vylepšenou logikou
   */
  async calculateTravelTime(request: TravelTimeRequest): Promise<TravelTimeCalculation[]> {
    const { departureStopId, arrivalStopId, lineId, direction, useCache = true } = request;
    
    try {
      console.log(`🚀 Vypočítávám dobu jízdy: ${departureStopId} → ${arrivalStopId}, linka ${lineId}`);
      
      // Získat odjezdy a příjezdy paralelně s větším limitem pro lepší přesnost
      const [departureResponse, arrivalResponse] = await Promise.allSettled([
        this.getDepartures({
          stopPlaceId: departureStopId,
          lineId,
          limit: 20, // Více dat pro lepší průměr
          direction,
          useCache
        }),
        this.getArrivals({
          stopPlaceId: arrivalStopId,
          lineId,
          limit: 20, // Více dat pro lepší průměr
          direction,
          useCache
        })
      ]);

      if (departureResponse.status === 'rejected' || arrivalResponse.status === 'rejected') {
        console.warn('⚠️ Nepodařilo se načíst data pro výpočet doby jízdy');
        return [];
      }

      const departures = departureResponse.value.departures;
      const arrivals = arrivalResponse.value.arrivals;

      console.log(`📊 Načteno ${departures.length} odjezdů a ${arrivals.length} příjezdů`);

      // Spárovat odjezdy s příjezdy podle tripId
      const tripDurations: TravelTimeCalculation[] = [];
      const durationMap = new Map<string, number[]>(); // Pro seskupení podle linky

      // Pokud nejsou dostupné příjezdy (konečná zastávka), použijeme fallback
      if (arrivals.length === 0) {
        console.warn(`⚠️ Žádné příjezdy na zastávku ${arrivalStopId} - pravděpodobně konečná zastávka`);
        
        // Pro autobusy 371 použijeme standardní dobu jízdy na základě směru
        if (lineId === '371') {
          let estimatedDuration: number;
          
          // Určit směr na základě zastávek
          if (departureStopId === 'U675Z12' && arrivalStopId === 'U2823Z301') {
            // Kobylisy → Řež
            estimatedDuration = 20;
            console.log(`🕒 Kobylisy → Řež: ${estimatedDuration} minut`);
          } else if (departureStopId === 'U2245Z2' && arrivalStopId === 'U675Z12') {
            // Husinec → Kobylisy (Řež → Kobylisy)
            estimatedDuration = 23;
            console.log(`🕒 Husinec → Kobylisy: ${estimatedDuration} minut`);
          } else {
            // Fallback pro ostatní směry
            estimatedDuration = 20;
            console.log(`🕒 Fallback doba jízdy pro autobus ${lineId}: ${estimatedDuration} minut`);
          }
          
          return [{
            tripId: 'estimated_371',
            line: lineId,
            mode: 'bus' as const,
            duration: estimatedDuration,
            isRealTime: false,
            fallbackUsed: true,
            calculatedAt: new Date(),
            departureTime: new Date(),
            arrivalTime: new Date(Date.now() + estimatedDuration * 60 * 1000),
            sampleCount: 1
          }];
        }
        
        return [];
      }
      
      for (const departure of departures) {
        const matchingArrival = arrivals.find(arrival => arrival.tripId === departure.tripId);
        
        if (matchingArrival) {
          // Použít skutečný čas odjezdu (s delay) a příjezdu
          const actualDepartureTime = departure.delay && departure.delay > 0
            ? new Date(new Date(departure.scheduledTime).getTime() + departure.delay * 60 * 1000)
            : new Date(departure.scheduledTime);
            
          const actualArrivalTime = matchingArrival.delay && matchingArrival.delay > 0
            ? new Date(new Date(matchingArrival.scheduledTime).getTime() + matchingArrival.delay * 60 * 1000)
            : new Date(matchingArrival.scheduledTime);
          
          const duration = Math.round((actualArrivalTime.getTime() - actualDepartureTime.getTime()) / (1000 * 60));
          
          if (duration > 0 && duration < 180) { // Rozumné limity: 0-180 minut
            // Seskupit doby jízdy podle linky pro výpočet průměru
            if (!durationMap.has(departure.line)) {
              durationMap.set(departure.line, []);
            }
            durationMap.get(departure.line)!.push(duration);
            
            tripDurations.push({
              tripId: departure.tripId,
              line: departure.line,
              mode: departure.mode,
              duration,
              isRealTime: true,
              fallbackUsed: false,
              calculatedAt: new Date(),
              departureTime: actualDepartureTime,
              arrivalTime: actualArrivalTime,
              delay: departure.delay || 0
            });
          }
        }
      }

      // Vypočítat průměrnou dobu jízdy pro každou linku
      const averageDurations: TravelTimeCalculation[] = [];
      for (const [line, durations] of durationMap.entries()) {
        if (durations.length > 0) {
          const averageDuration = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
          const mode = line === 'S4' ? 'train' : 'bus';
          
          averageDurations.push({
            tripId: `average_${line}`,
            line,
            mode,
            duration: averageDuration,
            isRealTime: true,
            fallbackUsed: false,
            calculatedAt: new Date(),
            sampleCount: durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations)
          });
        }
      }

      // Vrátit jak jednotlivé jízdy, tak průměrné hodnoty
      const allResults = [...tripDurations, ...averageDurations];
      
      console.log(`✅ Vypočítáno ${tripDurations.length} jednotlivých dob jízdy a ${averageDurations.length} průměrných pro linku ${lineId}`);
      return allResults;

    } catch (error) {
      console.error('Error calculating travel time:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Zpracuje chyby a vrátí standardizovaný formát
   */
  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.error_message || 'Chyba při načítání dat z PID API',
        status: error.response.status,
      };
    }
    
    return {
      message: 'Neočekávaná chyba při komunikaci s PID API',
    };
  }

  /**
   * Získá cache statistiku pro odjezdy
   */
  public getDeparturesCacheStats() {
    return this.getCacheStats();
  }

  /**
   * Vyčistí cache pro odjezdy
   */
  public clearDeparturesCache(): void {
    this.clearCache();
  }
}

// Export instance služby
export const departuresService = new DeparturesService();
export default DeparturesService;
