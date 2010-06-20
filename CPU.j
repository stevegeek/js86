@implementation CPU : GenericDevice
{    
    Memory mem;
    int cycleCount; // Used to compute emulated cycles Per second say
}

- (id)init
{
    CPLog('init from CPU')    
    if(self = [super init])
    {
    }
    return self;
}


- (id)initWithMemory:(RAM)theRAM
{
    CPLog('initWithMem from CPU')
    if(self = [self init])
    {
        mem = theRAM;
    }
    return self;
}

@end
