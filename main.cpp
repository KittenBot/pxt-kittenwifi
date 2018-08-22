#include <stdlib.h>
#include "pxt.h"

using namespace std;

namespace kittenwifi {

    //%
    void setSerialBuffer(int size) {
        uBit.serial.setRxBufferSize(size);
        uBit.serial.setTxBufferSize(size);
    }
    
    
    
} // namespace kittenwifi
