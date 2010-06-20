// A flat memory attached to a linear address bus
@implementation Memory : GenericDevice
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
    self = [self execute_init];
    size = range.length;
    lowStartAddress = range.location;
}

- (byte)getByteAt:(address)location
{
    // WHAT HAPPENS WITH OUT OF RANGE?
    // wrap around I suppose
    return bytes[location];
}

- (word)getWordAt:(address)location
{
    return (bytes[location] bytes[location+1]);
}

@end
