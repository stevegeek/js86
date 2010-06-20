/*
 * AppController.j
 * js8086emu
 *
 * Created by You on June 18, 2010.
 * Copyright 2010, Your Company All rights reserved.
 */

@import <Foundation/CPObject.j>

@import "GenericDevice.j"
@import "Memory.j"
//@import "CPU.j"
@import "MemoryMappedDevice.j"
@import "Storage.j"

@import "ROM.j"
@import "PIT.j"
@import "PIC.j"
@import "i8086.j"
@import "i8087.j"

@import "VGA.j"

@import "IBMPC.j"

@import "JSEmu.j"
/*
//_JSEmuLogString = "";
_JSEmuConsole = nil;

function formatMessage(aString, aLevel, aTitle)
{
    var now = new Date();
    aLevel = ( aLevel == null ? '' : ' [' + aLevel + ']' );    
    return now + " " + aTitle + aLevel + ": " + aString;
}

JSEmuLog = function(aString, aLevel, aTitle)
{
    var message = formatMessage(aString, aLevel, aTitle);
    //_JSEmuLogString += (message + "\n");
    //[_JSEmuConsole setStringValue:[_JSEmuConsole stringValue]+message+"\n"];
    //[_JSEmuConsole sizeToFit];
    [[CPRunLoop currentRunLoop] limitDateForMode:CPDefaultRunLoopMode];
}*/

@implementation AppController : CPObject
{
}

- (void)applicationDidFinishLaunching:(CPNotification)aNotification
{
    CPLogUnregister(CPLogConsole);
    CPLogRegister(CPLogPopup);
    //CPLogRegister(JSEmuLog);
    
    var theWindow = [[CPWindow alloc] initWithContentRect:CGRectMakeZero() styleMask:CPBorderlessBridgeWindowMask],
        contentView = [theWindow contentView];

    _JSEmuConsole = [[CPTextField alloc] initWithFrame:CGRectMakeZero()];


    [_JSEmuConsole setStringValue:"Running...\n"];
    [_JSEmuConsole setFont:[CPFont systemFontOfSize:10.0]]; 
    [_JSEmuConsole sizeToFit];

    [_JSEmuConsole setAutoresizingMask:CPViewMinXMargin | CPViewMaxXMargin | CPViewMinYMargin | CPViewMaxYMargin];
    [_JSEmuConsole setFrameOrigin:CPMakePoint(20,20)];

    [contentView addSubview:_JSEmuConsole];

    [theWindow orderFront:self];

    var emu = [[JSEmu alloc] init];
    
    [emu runTestFromBinary:"Tests/testinit.bin"];

    // Uncomment the following line to turn on the standard menu bar.
    //[CPMenu setMenuBarVisible:YES];
}

@end
