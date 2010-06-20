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

- (void)reset
{
}

- (void)powerDown
{
}

-(void)powerUp
{
    [self reset];
}

- (void)performCycle
{
    
}
@end