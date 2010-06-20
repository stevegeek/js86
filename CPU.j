@implementation CPU : GenericDevice
{    
    Memory mem;
    int cycleCount; // Used to compute emulated cycles Per second say
}

- (id)initWithMemory:(RAM)theRAM
{
    if(self = [super init])
    {
        mem = theRAM;
    }
    return self;
}

@end
