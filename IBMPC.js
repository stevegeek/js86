/*
    IBM Personal Computer XT Model 5160
    --------------------------------
    http://en.wikipedia.org/wiki/IBM_Personal_Computer_XT

    Specifications:
    ---------------
    * CPU: Intel 8088 @ 4.77MHz
    * RAM: 128KB to 640KB depending on version
    * ROM: 40KB (up to 48KB)
    * HDD: 20MB

    Technical reference: (includes description, BIOS source listings, circuit diagrams: the works!)
    http://www.retroarchive.org/dos/docs/ibm_techref_v202_1.pdf
    http://www.retroarchive.org/dos/docs/ibm_techref_v202_2.pdf
    http://www.retroarchive.org/dos/docs/ibm_techref_v202_3.pdf

    Components emulated (or partially) so far:
    * Intel 8088 8-BIT HMOS MICROPROCESSOR
    * Intel 8259 PROGRAMMABLE INTERRUPT CONTROLLER

    References:
    -----------
    * Instruction set details http://ref.x86asm.net/index.html
    * Good opcode reference: http://www.pastraiser.com/cpu/i8088/i8088_opcodes.html
    * For Memory map see 1-15 and 1-16 in ibm_techref_v202_1.pdf
    * Interrupts : http://www.slideshare.net/guest0f0fd2c/interrupts-2826774

    MIT License : Copyright (C) 2010,2011 by Stephen Ierodiaconou
*/

importScripts('libs/jquery-hive/jquery.hive.pollen.js', 'CPU_8088.js', 'PIC_8259.js');

// Create a log function on pollen
$.log = function(msg) {
    this.send(msg + '\n');
}

// IBMPC System constants
var Constants = {
    CPURunning: 1,
    CPUHalted:  2,
    CPUInvalid: 3,

    ROMStartAddress: 0xF0000,   // 983040 (F000:0)
    ROMSize: 0xFFFF,            // 65535
    RAMSize: 1048576,           // 2^20

    CPUFrequency: 4772700,      // Hz
    ResetVectorLinearAddress: 0xFFFF0,  // 1048560 (FFFF:0)
    ResetVectorCS: 0xFFFF,              // 65535
    ResetVectorIP: 0,                   // 0x0
    // See Section B-2 of ibm_techref_v202_2.pdf (p156)
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
    Flags: { // 16 bit register
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
    // ModRM
    ModRM: {
        ModMask: 196,
        Reg2Mask: 56,
        Reg1Mask: 7,
        Make: function (/*byte*/ modrm)
        {
            return {mod: (modrm & this.ModMask) >> 6, reg2: (modrm & this.Reg2Mask) >> 3, reg1: (modrm & this.Reg1Mask)};
        }
    },
    CPUPorts: 65536,
    // 8259 PIC
    Master8259CommandPort:  0x0020,
    Master8259DataPort:     0x0021
}

// Utilities
// ************************************************************************
function MakeRange(startAddress, length) {
    return {start: startAddress, length: length};
}

function LoadBinaryFile(fileName, callBack) {
    /*
    // Older browsers

    // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
    var req = new XMLHttpRequest();
    req.open('GET', fileName, false);
    // The following line says we want to receive data as Binary and not as Unicode
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    // Convert to numeric
    return req.responseText; //$.map(req.responseText, function(value) { return value.charCodeAt(0) & 0xFF; });
    */

    // Newer browsers
    var xhr = new XMLHttpRequest();
    xhr.open("GET", fileName, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function(e) {
        callBack(xhr.response);
    };

    xhr.send(null);
    return
}

// ************************************************************************
// TODO: MAKE THIS INHERITED FROM ARRAY
function RAM(initialValues) {
    this.size = Constants.RAMSize;
    this.buffer = new ArrayBuffer(this.size);
    this.bytes = new Uint8Array(this.buffer);
    this.words = new Uint16Array(this.buffer);
    if (initialValues)
        this.writeBytesWithRange(initialValues, MakeRange(0, initialValues.length))
}
RAM.prototype.writeBytesWithRange = function (data, range) {
    var i = 0;
    for (; i < range.length; i++)
    {
        // FIXME: copy as 32bit values for speed?
        this.bytes[range.start + i] = data[i];
    }
    return true;
}
RAM.prototype.writeBytes = function (data) {
    this.writeBytesWithRange(data, MakeRange(0, data.length));
    return true;
}

// System
// ************************************************************************
// Create CPU, empty RAM
function System() {
    this.peripherals = {};

    this.cpu = new i8086(new RAM());
    // Create PIC
    this.peripherals.pic = new PIC_8259(this.cpu);
}
System.prototype.setRAMContents = function(dataBuffer) {
    this.cpu.memory.writeBytes(new Uint8Array(dataBuffer));
}
System.prototype.cycle = function(cycles) {
    this.cpu.run(typeof cycles !== 'undefined' ? cycles : 500);
    var devices = this.peripherals;
    $.each(devices, function(id) {
        $.log('SYS : Device update for ' + id + ':')
        devices[id].update();
    });
}

// ************************************************************************
var ibmpc = new System();

// Message handler
$(function(message) {
    // Parse message
    switch(message.name) {
        case 'loadBinaryAndSetAsRAM':
            LoadBinaryFile(message.data, function(dataBuffer) {
                ibmpc.setRAMContents(dataBuffer);
                $.send({
                    name: 'ack',
                    request: message
                });
            });
            break;
        case 'doSystemCycle':
        default:
            // Do a run loop
            ibmpc.cycle(parseInt(message.data));
            // Tell the app
            $.send({
                name: 'ack',
                request: message
            });
    }
});
