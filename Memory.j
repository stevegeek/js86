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
    var i = 0;
    self = [self init];
    size = range.length;
    lowStartAddress = range.location;
    
    CPLog('MEMORY : Requesting ' + size + ' bytes');
    
    // FIXME: NOT LOOPS
    for (; i < size; i++)
        bytes[i] = 0;
        
    CPLog('MEMORY : Got ' + bytes.length + ' bytes');
    return self;
}

- (byte)readByteAt:(address)location
{
    CPLog('MEMORY : Read ' + location)
    //[self debugDumpParagraphToLog:location];
    // WHAT HAPPENS WITH OUT OF RANGE?
    // wrap around I suppose
    return bytes[location];
}

- (word)readWordAt:(address)location
{
    return (bytes[location] + (bytes[location+1]<<8));
}

- (BOOL)writeBytes:data range:(CPRange)range
{
    // TEST RANGE RETURN FALSE IF OUT?
    var i = 0,
        count = range.length;

    // FIXME: NOT LOOPS
    for (; i < count; i++)
        bytes[range.location + i] = data[i]; 

    [self debugDumpBytesToLog:range];
    return true;
}

- (BOOL)writeBytesFromString:string range:(CPRange)range
{
    // TEST RANGE RETURN FALSE IF OUT?
    var i = 0,
        count = range.length;

    // FIXME: NOT LOOPS
    for (; i < count; i++)
        bytes[range.location + i] = string.charCodeAt(i) & 0xFF; 

    //[self debugDumpBytesToLog:range];
    return true;
}
{;}

- (void)debugDumpParagraphToLog:location
{
    var string = "MEMORY: PARA(" +location + ") : ";
    for (var i = 0; i < 16; i++)
        string += bytes[location+i] + ",";
    console.log(string);
}

- (void)debugDumpBytesToLog:(CPRange)range
{
    var string = "MEMORY: BYTES(" + range.location + "," + range.length + " ) : ";
    for (var i = 0; i < range.length; i++)
        string += bytes[range.location + i] + ",";
    console.log(string);  
}
@end
