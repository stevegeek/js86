/* In first IBM PCs this is where the ROM resided that contained the BIOS and a BASIC interpreter,
 however in later machines the ROM exists at the end of the addressable space and then the BIOS
 is loaded into this location in memory. The CPU starts using the address located at the very end
 of the addressable space.
 
 Memory Map: http://www.elecnet.chandra.ac.th/learn/tipntrick/xt/default.htm
*/

    IBMPCROMStartAddress = 983040, // 0xF0000 (F000:0)
    IBMPCROMSize = 65535,          // 0xFFFF
    IBMPCRAMSize = 1048576; // 2^20
 
@implementation PC : CPObject
{
    BOOL on;
    
    CPU cpu         @accessors(readonly); // for debugging
    Memory mem;
    ROM rom;
    
    CPArray devices;
}

- (id)init
{
    if(self = [super init])
    {
        mem = [[Memory alloc] initWithRange:CPMakeRange(0,IBMPCRAMSize)];
        cpu = [[i8086 alloc] initWithMemory:mem];
        rom = [[ROM alloc] init];
        devices = {};
        regs = [];
    }
    return self;
}

- (void)setROMContents:data
{
    [rom setContents:data];
}

- (void)setRAMContentsWithString:string address:address
{
    [mem writeBytesFromString:string range:CPMakeRange(address,string.length)];
}

- (void)setRAMContentsWithArray:array address:address
{
    [mem writeBytes:array range:CPMakeRange(address,[array count])];
}

- (void)run
{
    CPLog('run')
    [CPTimer scheduledTimerWithTimeInterval:0.001 callback:function()
    {
        var cyclesPerRun = 5,
            cycles = 0;
        while ([self performCycle] && cyclesPerRun < 10)
        {
            cycles++;
            CPLog(cycles)
        }
    } repeats:YES];
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

- (BOOL)performCycle
{
    if (!on)
        return;        
    //[cpu fetch];
    //[cpu execute];
    [cpu fetchAndExecute];
    //[mem performCycle];
    //[rom performCycle];
    var i = 0,
        count = devices.length;
    for (;i < count; i++)
        [devices[i] performCycle];
        
    return ![cpu halted];
}

- (void)reset
{
    var i = 0,
        count = devices.length;
    [cpu reset];
    [mem reset];
    [rom reset];
    for (;i < count; i++)
        [devices[i] reset];
}

- (void)powerUp
{
    CPLog('IBMPC: Power Up');
    on = YES;
    // send powerDown to everything
    var i = 0,
        count = devices.length;
    [cpu powerUp];
    [mem powerUp];
    [rom powerUp];
    for (;i < count; i++)
        [devices[i] powerUp];
}

- (void)powerUpAndStartRunning:running callbackOnHalt:callback
{
    [cpu setHaltCallback:callback]
    [self powerUp];
    
    if (running)
    {
        [self run];
    }
}

- (void)powerDown
{
    CPLog('IBMPC: Power Down');
    on = NO;
    // send powerDown to everything
    var i = 0,
        count = devices.length;
    [cpu powerDown];
    [mem powerDown];
    [rom powerDown];
    for (;i < count; i++)
        [devices[i] powerDown];
}

@end
