// Služba pro odjezdy s modulární architekturou

import { BaseAPIService } from './BaseAPIService';
import { DepartureBoardResponse, ApiError } from '../../types';
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
        '/pid/departureboards',
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
    
    switch (direction) {
      case 'to-masarykovo':
        return headsign.includes('Masarykovo') || headsign.includes('Praha');
      
      case 'to-rez':
        return (headsign.includes('Ústí') || headsign.includes('Kralupy') || headsign.includes('Řež')) && 
               !headsign.includes('Praha');
      
      case 'to-husinec':
        return (headsign.includes('Husinec') || headsign.includes('Řež')) && 
               !headsign.includes('Klecany') && 
               !headsign.includes('Astrapark') &&
               !headsign.includes('Klecánky');
      
      default:
        return true;
    }
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
