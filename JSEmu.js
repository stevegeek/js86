
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//http://stackoverflow.com/questions/183214/javascript-callback-scope
function bind(scope, fn) {
    return function () {
        fn.apply(scope, arguments);
    };
}

// Javascript Emulator

// Generic classes, constants in JSEmu namespace
JSEmu = {};
JSEmu.Devices = {};

JSEmu.logToHTMLLog = function(extrainfo, roottype, text)
{
    var level = "Info";
    switch (extrainfo)
    {
        case 'info':
            level = "Info";
            break;
        case 'warn':
            level = "Warning";
            break;
        case 'error':
            level = "Error";
            break;
        case 'fatal':
            level = "FATAL";
            break;
    }
    $('#jsemu-log').append($('<p><b>'+roottype+'</b> : <em>'+level+'</em> : ' + text + '</p>'));
}

// These globals are right???
JSEmu.connectedScriptID = 0;
JSEmu.messageID = 0;
JSEmu.connectedScripts = new Array();

// MOVE TO GENERIC DEVICE
JSEmu.messageWatchers = function (type, message)
{
    for (var i = 0; i < JSEmu.connectedScripts.length; i++)
        JSEmu.connectedScripts[i].postMessage({
            type:type,
            body:message});
}
/*
JSEmu.messageWatcher = function (port, type, message)
{
    port.postMessage({
        type:type,
        body:message});
}*/

JSEmu.messageWatcherWithID = function (id, type, message)
{
    JSEmu.connectedScripts[id].postMessage({
        type:type,
        body:message});
}

JSEmu.respondToWatcherWithID = function (id, messageid, type, message)
{
    JSEmu.connectedScripts[id].postMessage({
        id: messageid,
        type:type,
        body:message});
}
JSEmu.logToConnectedScriptWithID = function (id, message, level)
{
    if (typeof level == undefined)
        level = 'info';
    JSEmu.messageWatcherWithID(id, 'log:'+level, message);
}

JSEmu.logToConnectedScripts = function (message, level)
{
    if (typeof level == undefined)
        level = 'info';
    JSEmu.messageWatchers('log:'+level, message);
}


// Classes definisions and constants

JSEmu.MemoryRange = Class.extend(
{
    init: function (sizeInBytes, startAddress)
    {
        this.count = sizeInBytes;
        this.startAddress = startAddress;
    }
});

JSEmu.IBMPC = {
    ROMStartAddress: 0xF0000,   // 983040 (F000:0)
    ROMSize: 0xFFFF,            // 65535
    RAMSize: 1048576,           // 2^20

    CPUFrequency: 4772700,      // Hz


};

JSEmu.i8086 = {
    ResetVectorLinearAddress: 0xFFFF0,  // 1048560 (FFFF:0)
    ResetVectorCS: 0xFFFF,              // 65535
    ResetVectorIP: 0,                   // 0x0
    Registers: {
        AX: 0,
        CX: 1,
        DX: 2,
        BX: 3,
        SP: 4,
        BP: 5,
        SI: 6,
        DI: 7,
        CS: 8,
        DS: 9,
        SS: 10,
        ES: 11,
    },

    Flags: {
        CF: 1, // Carry
        PF: 4, // Parity
        AF: 16, // Auxilliary
        ZF: 64, // Zero
        SF: 128, // Sign
        TF: 256, // Trap
        IF: 512, // Interrupt
        DF: 1024, // Direction
        OF: 2048 // Overflow
    },

    /* ModRM */
    ModRM: {
        ModMask: 196,
        Reg2Mask: 56,
        Reg1Mask: 7,
        Make: function (/*byte*/ modrm)
        {
            return {mod: (modrm & this.ModMask) >> 6, reg2: (modrm & this.Reg2Mask) >> 3, reg1: (modrm & this.Reg1Mask)};
        }
    }
}

JSEmu.Devices.Generic = Class.extend(
{
    init: function(){},
    reset: function() {},
    powerUp: function()
    {
        this.reset();
    },
    powerDown: function() {},
    performCycle: function() {}
});
