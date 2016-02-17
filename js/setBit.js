// ******	Funksjon for å sette bestemme enkelt-bit eller hele byte som skal sendes i karakteristikk
//			
// 			byteOffset: 	int 0 - 19		
//			bitOffset: 		int 0 - 7, 		eller 	char 'b' dersom hel byte skal settes 
//											posisjon 0 er mest signifkante bit
//			value: 			int 0 - 255
//
	// Setter bitmaske
	var bitMask = [128, 64, 32, 16, 8, 4, 2, 1];

	function setBit(byteOffset, bitOffset, value) {
		// Sjekker om det er hel byte som skal settes
		if(bitOffset == 'b') { 
			charVal[byteOffset] = value;
		} else {
			// Setter enkeltbit
			if(charVal[byteOffset] & bitMask[bitOffset]) {
				if(value == 0) {
					charVal[byteOffset] -= bitMask[bitOffset];
				}
			} else {
				 if (value == 1) {
					charVal[byteOffset] += bitMask[bitOffset];
				}
			}
		}
	};