// ******	Funksjon for å sette bestemme enkelt-bit eller hele byte som skal sendes i karakteristikk
//			
// 			byteOffset: 	int 0 - 19		
//			bitOffset: 		int 0 - 7, 		eller 	char 'b' dersom hel byte skal settes 
//											posisjon 0 er mest signifkante bit
//			value: 			int 0 - 255
//
	// Setter bitmaske. Satt med utgangspunkt i posisjonen lengst til venstre, den mest signifikante, som 0.
	var bitMask = [128, 64, 32, 16, 8, 4, 2, 1];

	function setBit(byteOffset, bitOffset, value) {
		// Sjekker om det er hel byte som skal settes
		if(bitOffset == 'b') { 
			// Dersom byte skal, settes byttes hele den eksisterende verdien ut med den nye
			charVal[byteOffset] = value;
		} else {
			// Enkelt-bit skal settes
			// Sjekker om den aktuelle biten allerede er satt høy
			if(charVal[byteOffset] & bitMask[bitOffset]) { 
				if(value == 0) { 
					// Dersom biten er høy og ny verdi er lav, byttes denne
					charVal[byteOffset] -= bitMask[bitOffset];
				}
			} else {
					/// Dersom biten er lav og ny verdi er høy, byttes denne
				 if (value == 1) {
					charVal[byteOffset] += bitMask[bitOffset];
				}
			} 
		}
	};