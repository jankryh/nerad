import axios from 'axios';
import { DepartureBoardResponse, ApiError } from '../types';
import { API_KEY } from '../constants';

// Golemio V2 PID Departure Boards API - funkční endpoint
const V2_API_BASE_URL = 'https://api.golemio.cz/v2';

const api = axios.create({
  baseURL: V2_API_BASE_URL,
  headers: {
    'X-Access-Token': API_KEY,
    'Accept': 'application/json',
  },
});

// Funkce pro získání odjezdů z V2 PID Departure Boards API
export const getDepartures = async (
  stopPlaceId: string,
  lineId: string,
  limit: number = 3,
  direction?: string
): Promise<DepartureBoardResponse> => {
  try {
    console.log(`🔍 Načítám odjezdy pro zastávku ${stopPlaceId}, linku ${lineId}, směr: ${direction}`);
    
    const response = await api.get('/pid/departureboards', {
      params: {
        'ids[]': stopPlaceId,
        limit: 50, // Zvýšit limit na 50 pro lepší filtrování
        minutesAfter: 240, // 4 hodiny dopředu
        mode: 'departures',
        order: 'real'
      }
    });

    if (response.data && response.data.departures) {
      console.log(`📊 API vrátilo ${response.data.departures.length} odjezdů celkem`);
      
      // Filtrovat podle linky a směru
      let filteredDepartures = response.data.departures;
      
      // Nejdříve filtrovat podle linky
      if (lineId) {
        filteredDepartures = response.data.departures.filter(
          (dep: any) => dep.route?.short_name === lineId
        );
        console.log(`🚂 Po filtrování podle linky ${lineId}: ${filteredDepartures.length} odjezdů`);
      }
      
      // Pak filtrovat podle směru, pokud je specifikován
      if (direction) {
        console.log(`🔍 Filtruji podle směru: ${direction}`);
        console.log(`📋 Před filtrováním: ${filteredDepartures.length} odjezdů`);
        
        filteredDepartures = filteredDepartures.filter((dep: any) => {
          const headsign = dep.trip?.headsign || '';
          console.log(`🚦 Kontroluji odjezd: ${dep.route?.short_name} → ${headsign}`);
          
          if (direction === 'to-masarykovo') {
            const matches = headsign.includes('Masarykovo') || headsign.includes('Praha');
            console.log(`  ✅ Směr Praha: ${matches ? 'ANO' : 'NE'} (${headsign})`);
            return matches;
          } else if (direction === 'to-rez') {
            // Pro směr z Prahy do Řeže: Ústí, Kralupy, Řež, ale ne Praha
            const matches = (headsign.includes('Ústí') || headsign.includes('Kralupy') || headsign.includes('Řež')) && 
                           !headsign.includes('Praha');
            console.log(`  ✅ Směr Řeže: ${matches ? 'ANO' : 'NE'} (${headsign})`);
            return matches;
          } else if (direction === 'to-husinec') {
            // Pro autobusy z Prahy do Řeže: pouze ty co jedou do Husince/Řeže, ne do Klecany
            const matches = (headsign.includes('Husinec') || headsign.includes('Řež')) && 
                           !headsign.includes('Klecany') && 
                           !headsign.includes('Astrapark') &&
                           !headsign.includes('Klecánky');
            console.log(`  ✅ Směr Husinec/Řež: ${matches ? 'ANO' : 'NE'} (${headsign})`);
            return matches;
          }
          return true;
        });
        
        console.log(`📋 Po filtrování: ${filteredDepartures.length} odjezdů`);
      }

      // Přeformátovat data do požadovaného formátu
      const formattedDepartures = filteredDepartures.map((dep: any) => ({
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

      // Omezit na požadovaný počet odjezdů
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
    console.error('Error fetching departures from V2 API:', error);
    
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.error_message || 'Chyba při načítání dat z PID API',
        status: error.response?.status,
      } as ApiError;
    }
    
    throw {
      message: 'Neočekávaná chyba při komunikaci s PID API',
    } as ApiError;
  }
};

// Funkce pro získání všech potřebných odjezdů
export const getAllDepartures = async () => {
  try {
    console.log('🚀 Načítám všechny odjezdy z V2 PID API...');
    
    const [rezToMasarykovo, masarykovoToRez, husinecsToKobylisy, kobylisyToHusinec] = await Promise.allSettled([
      getDepartures('U2823Z301', 'S4', 3, 'to-masarykovo'), // Řež → Praha Masarykovo (vlak S4)
      getDepartures('U480Z301', 'S4', 3, 'to-rez'),         // Praha Masarykovo → Řež (vlak S4)
      getDepartures('U2245Z2', '371', 3, 'to-kobylisy'),    // Husinec → Kobylisy (autobus 371)
      getDepartures('U675Z12', '371', 3, 'to-husinec')      // Kobylisy → Husinec (autobus 371)
    ]);

    return {
      rezToMasarykovo: rezToMasarykovo.status === 'fulfilled' ? rezToMasarykovo.value : { departures: [], message: 'Chyba při načítání' },
      masarykovoToRez: masarykovoToRez.status === 'fulfilled' ? masarykovoToRez.value : { departures: [], message: 'Chyba při načítání' },
      husinecsToKobylisy: husinecsToKobylisy.status === 'fulfilled' ? husinecsToKobylisy.value : { departures: [], message: 'Chyba při načítání' },
      kobylisyToHusinec: kobylisyToHusinec.status === 'fulfilled' ? kobylisyToHusinec.value : { departures: [], message: 'Chyba při načítání' }
    };
  } catch (error) {
    console.error('Error fetching all departures:', error);
    throw error;
  }
};
