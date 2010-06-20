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

@implementation AppController : CPObject
{
}

- (void)applicationDidFinishLaunching:(CPNotification)aNotification
{
    var theWindow = [[CPWindow alloc] initWithContentRect:CGRectMakeZero() styleMask:CPBorderlessBridgeWindowMask],
        contentView = [theWindow contentView];
/*
    var label = [[CPTextField alloc] initWithFrame:CGRectMakeZero()];

    [label setStringValue:@"Hello World!"];
    [label setFont:[CPFont boldSystemFontOfSize:24.0]];

    [label sizeToFit];

    [label setAutoresizingMask:CPViewMinXMargin | CPViewMaxXMargin | CPViewMinYMargin | CPViewMaxYMargin];
    [label setCenter:[contentView center]];

    [contentView addSubview:label];

    [theWindow orderFront:self];
    */
    var emu = [[JSEmu alloc] init];
    [emu runTestFromBinary:"Tests/testinit.bin"];
    

    // Uncomment the following line to turn on the standard menu bar.
    //[CPMenu setMenuBarVisible:YES];
}

@end
