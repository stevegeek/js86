/*
 * AppController.j
 * js8086emu
 *
 * Created by You on June 18, 2010.
 * Copyright 2010, Your Company All rights reserved.
 */

@import <Foundation/Foundation.j>
//@import <AppKit/AppKit.j>

//@import "AppController.j"


@implementation GenericDevice : CPObject
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

// A flat memory attached to a linear address bus
@implementation Memory : CPObject
{
    CPArray bytes;
    unsigned size;
    unsigned startAddress;   //@accessors(readonly);
}

- (id)init
{
    if(self = [super init])
    {
        bytes = [];
        size = 0;
        lowStartAddress = 0;
    }
    return self;
}

- (id)initWithRange:(CPRange)range
{
    self = [self init];
    size = range.length;
    lowStartAddress = range.location;
}

@end


@implementation CPU : CPObject
{    
    Memory memoryBus;
    long cyclecount;
}

- (id)initWithMemory:(RAM)theRAM
{
    if(self = [super init])
    {
        memoryBus = theRAM;
    }
    return self;
}

@end


@implementation MemoryMappedDevice : CPObject
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation Storage : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation ROM : Storage
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation PIT : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation PIC : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation BIOS : ROM
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

/*
i8086/8088 CPUs
---------------
http://pdf1.alldatasheet.com/datasheet-pdf/view/66062/INTEL/8088.html

CPU Memory map
0xFFFFF 
RESET BOOTSTRAP PROGRAM JUMP
0xFFFF0   <- CPU resets to here

0x003FF
INTERRUPT POINTER (type 255)
0x003F0

0x00007F
INTERRUPT POINTER (type 1)
0x00004
0x00003
INTERRUPT POINTER (type 0)
0x00000
*/
var i8086ResetVectorAddress = 1048560; //0xFFFF0 (FFFF:0)
    

@implementation i8086 : CPU
{
    short ax;
    short bx;
    short cx;
    short dx;
    
    short si;
    short di;
    
    short sp;
    short bp;
    
    short ip;
    
    short cs;
    short ds;
    short ss;
    short es;
    
    short flag;
    

}



@end

// FPU instruction extensions
@implementation i8086 (i8087)

@end


/* In first IBM PCs this is where the ROM resided that contained the BIOS and a BASIC interpreter,
 however in later machines the ROM exists at the end of the addressable space and then the BIOS
 is loaded into this location in memory. The CPU starts using the address located at the very end
 of the addressable space.
*/

var IBMPC_ROMStartAddress = 983040, // 0xF0000 (F000:0)
    IBMPC_ROMSize = 65535;          // 0xFFFF
    
@implementation PC : CPObject
{
    CPU cpu;
    RAM ram;
    ROM rom;
}

@end

@implementation JSEmu : CPObject
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

function main(args, namedArgs)
{
    //CPApplicationMain(args, namedArgs);
}
