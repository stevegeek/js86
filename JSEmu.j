@implementation JSEmu : CPObject
{
    PC computer;
}

- (id)init
{
    if(self = [super init])
    {
        computer = [[PC alloc] init];
    }
    return self;
}

- (BOOL)loadROMBinary
{
    //[computer setROMContents:data];
}

- (BOOL)loadFloppyDiskBinary
{
    //[computer setROMContents:data];
}

- (void)startEmulation
{
    [computer powerUpAndStartRunning:YES];
}

- (void)pauseEmulation
{
    [computer pause];
}

- (void)stopEmulation
{
    [computer powerDown];
}

@end