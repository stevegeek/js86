/* In first IBM PCs this is where the ROM resided that contained the BIOS and a BASIC interpreter,
 however in later machines the ROM exists at the end of the addressable space and then the BIOS
 is loaded into this location in memory. The CPU starts using the address located at the very end
 of the addressable space.
 
 Memory Map: http://www.elecnet.chandra.ac.th/learn/tipntrick/xt/default.htm
*/

var IBMPC_ROMStartAddress = 983040, // 0xF0000 (F000:0)
    IBMPC_ROMSize = 65535;          // 0xFFFF
    
@implementation PC : CPObject
{
    BOOL on;
    
    CPU cpu;
    RAM ram;
    ROM rom;
    
    CPArray devices;
}

- (id)init
{
    if(self = [super init])
    {
        devices = {};
        regs = [];
    }
    return self;
}

- (void)setROMContents:data
{
    [rom setContents:data];
}

- (void)run
{
    
}

- (void)runForCycles:cycles
{
    
}

- (void)runUntil
{
    
}

- (void)pause
{
    
}

- (void)performCycle
{
    if (!on)
        return;
        
    //[cpu fetch];
    //[cpu execute];
    [cpu fetchAndExecute];
    //[ram performCycle];
    //[rom performCycle];
    var i = 0,
        count = devices.length;
    for (;i < count; i++)
        [devices[i] performCycle];
}

- (void)reset
{
    var i = 0,
        count = devices.length;
    [cpu reset];
    [ram reset];
    [rom reset];
    for (;i < count; i++)
        [devices[i] reset];
}

- (void)powerUp
{
    on = YES;
    // send powerDown to everything
    var i = 0,
        count = devices.length;
    [cpu powerUp];
    [ram powerUp];
    [rom powerUp];
    for (;i < count; i++)
        [devices[i] powerUp];
}

- (void)powerUpAndStartRunning:running
{
    [self powerUp];
    
    if (running)
        [self run];
}

- (void)powerDown
{
    on = NO;
    // send powerDown to everything
    var i = 0,
        count = devices.length;
    [cpu powerDown];
    [ram powerDown];
    [rom powerDown];
    for (;i < count; i++)
        [devices[i] powerDown];
}

@end
