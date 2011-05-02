// http://www.ibm5150.net/repair_center.html

$(function()
{
    var emulator = new JSEmu.Emulator( function () 
    {
        // when ready
        //var icd = new JSEmu.Debugger();

        emulator.loadBinaryFileAndRun('Tests/testinit.bin', function () {
            console.log('now running...');
        });
    });
});





/*
icd.pollForStatePeriodically(1, function () {
    console.log('debugger pong...');
})*/

/*
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

- (void)computerDidHalt
{
    CPLog.warn("JSEMU: Computer Halted ... Core Dump :")
    [[computer cpu] dumpRegistersToLog];
    
    [computer powerDown];
}

- (BOOL)loadBinaryFromURL:(CPString)url
{
    CPLog('JSEMU: Loading binary file : ' + url);
    // Fill the RAM with this file
    // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    // The following line says we want to receive data as Binary and not as Unicode
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    return req.responseText;
}

- (BOOL)loadROMBinary
{
    //[computer setROMContents:data];
}

- (BOOL)loadFloppyDiskBinary
{
    //[computer setROMContents:data];
}

- (void)startEmulationAndCallOnHalt:(function)func
{
    [computer powerUpAndStartRunning:YES callbackOnHalt:func];
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

- (BOOL)loadHibernatedBinary
{

}

- (BOOL)hiberateSystem
{
    // create a binary file which is a dump of the RAM and a header of the register state and
    // device state.
}

- (void)runTestFromBinary:testURL
{
    CPLog('JSEMU: test start from binary file');
    // write a jmp in to 0:0 and some data at 0:0 to exec
    
    
    var data = [self loadBinaryFromURL:testURL];
    [computer setRAMContentsWithString:data address:0];
    
    [self startEmulationAndCallOnHalt:function()
    {
        
        // ********************************** NEED A WAY TO DO TESTS AFTER RUN
        // HOW TO SHORTCUT ACCESS TO LOW BYTES?
        if ((computer.cpu.regs[i8086RegisterAX] & 255) == 2)
            CPLog('AL = 2 ? : YES');
        else
            CPLog('AL = 2 ? : NO');

        [self computerDidHalt];
    }];
}

@end
*/
/*var testramstartjmp = [234, 0, 0, 0, 0]; // far jmp 0:0  -> (Jmp Ap) Ap = 32 bit segment:offset -> EAh 00h 00h : 00h 00h
var testram = [176, 1, 4, 1, 244]; // mov al,1 ; add al, 1 ; hlt -> B0h 01h ; 04h 01h ; F4h

[computer setRAMContentsWithArray:testramstartjmp address:i8086ResetVectorLinearAddress];
[computer setRAMContentsWithArray:testram address:0];

[self startEmulationAndCallOnHalt:function()
{
    CPLog('Halted! In Halt Callback')
    [self computerDidHalt];
}];*/