import { getFirestore, collection, getDocs } from 'firebase/firestore';
import type { Room } from './types';
import { initializeFirebase } from '@/firebase';

// This is a placeholder function. In a real app, you'd have more robust
// error handling and data transformation.
export async function getRoomsForHotel(hotelId: string): Promise<Room[]> {
  try {
    const { firestore } = initializeFirebase();
    const roomsCollection = collection(firestore, `hotels/${hotelId}/rooms`);
    const roomsSnapshot = await getDocs(roomsCollection);
    
    if (roomsSnapshot.empty) {
      console.log(`No rooms found for hotelId: ${hotelId}`);
      return [];
    }
    
    const roomsList = roomsSnapshot.docs.map(doc => {
      const data = doc.data();
      const stays = (data.stays || []).map((stay: any) => ({
        ...stay,
        checkInDate: stay.checkInDate.toDate(),
        checkOutDate: stay.checkOutDate.toDate(),
      }));
      return {
        id: doc.id,
        ...data,
        stays,
      } as Room;
    })
    
    return roomsList;
  } catch (error) {
    console.error(`Error fetching rooms for hotel ${hotelId}:`, error);
    // In a real app, you might want to re-throw the error or handle it differently
    return [];
  }
}
