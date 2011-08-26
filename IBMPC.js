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

    MIT License : Copyright (C) 2010,2011 by Stephen Ierodiaconou
*/

importScripts('libs/jquery-hive/jquery.hive.pollen.js');

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
    Master8259DataPort:     0x0021,
    Slave8259CommandPort:   0x00A0,
    Slave8259DataPort:      0x00A1, 
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


// i8086 processor
// ************************************************************************
function i8086(memory) {
    this.memory = memory;
    this.reset();
}
i8086.prototype.reset = function() {
    // Actual ports
    this.portsBuffer = new ArrayBuffer(Constants.CPUPorts);
    this.ports8Bit = new Uint8Array(this.portsBuffer);
    this.ports16Bit = new Uint16Array(this.portsBuffer);
    // Callbacks on write of port
    this.portDevices = Array(Constants.CPUPorts);

    this.registers = {
        // Execution Unit
        AX:0, BX:0, CX:0, DX:0,
        SP:0, BP:0,
        SI:0, DI:0,
        // Bus Interface Unit
        CS:Constants.ResetVectorCS, DS:0, SS:0, ES:0,
        IP:Constants.ResetVectorIP,
        // Other registers
        FLAGS:0
    };
    this.cycleCount = 0;
    this.state = Constants.CPURunning;
    return this;
}
i8086.prototype.addCycles = function (cycles) {
    this.cycleCount += cycles;
}
i8086.prototype.run = function(numberOfCycles) {
    var tick = 0;
    while (tick < numberOfCycles && this.state == Constants.CPURunning) {
        this.performFetchDecodeExecuteCycle();
        tick++;
    }
}
i8086.prototype.fetch = function() {
    //this.cycleCount += 4; // Each bus operation requires 4 CLK cycles. (THESE ARE ADDED ALREADY BY COUNTS)
    var byte = this.memory.bytes[ (this.registers.CS << 4) + this.registers.IP];
    // set overflow flag? No - http://stackoverflow.com/questions/3078821/flags-on-instruction-pointer-overflow-in-8086-8088
    this.registers.IP = this.registers.IP + 1 > 0xFFFF ? 0 : this.registers.IP + 1;
    return byte;
}
i8086.prototype.performFetchDecodeExecuteCycle = function() {
    this.decodeAndExecute(this.fetch());
    return this;
}
i8086.prototype.decodeAndExecute = function(instructionByte) {
    switch (instructionByte) {

        // http://www.pastraiser.com/cpu/i8088/i8088_opcodes.html

        /*case OPCODE:
            // ASM CODE : desc
            // bytes cycles
            (sim)
        */
        case 0x04:
            // ADD AL, Ib : add the immediate value to the al
            // 2+i(1,2) 4
            // Add the immediate byte literal into AL
            var imm = this.fetch() & 0xFF,
                al = this.registers.AX & 0xFF,
                res = al + imm;
            if (res > 255) {
                // FIXME: SET OVERFLOW + SET CORRECT RES
                $.log('addALIb FIX OVERFLOW')
            }
            this.registers.AX = (this.registers.AX & 0xFF00) + (res & 0xFF);
            this.addCycles(4);
            $.log('i8086: INST: addALIb ' + imm);
            break;

        case 0x90:
            // NOP: do nothing
            // 1 3
            this.addCycles(3);
            $.log('i8086: INST: NOP');
            break;

        case 0xB0:
            // MOV AL, Ib : Move the immediate byte literal into AL
            // 2+i(1,2) 4
            var imm = this.fetch();
            this.registers.AX = (this.registers.AX & 0xFF00) + (imm & 0xFF); // FUNC THESE?
            this.addCycles(4);
            $.log('i8086: INST: movALIb ' + imm);
            break;

        case 0xE6:
            // OUT  Ib  AL : Output the value in AL to port specified by the immediate
            // 2 14
            var imm = this.fetch();
            this.portWriteByte(imm & 0xFF, this.registers.AX & 0xFF);
            this.addCycles(14);
            $.log('i8086: INST: outIbAL, imm ' + imm + ' AL ' + (this.registers.AX & 0xFF));
            break;

        case 0xEA:
            // JMP seg:a16
            // 5  15
            var segment = this.fetch() + (this.fetch() << 8),
                offset = this.fetch() + (this.fetch() << 8);
            this.registers.CS = segment;
            this.registers.IP = offset;
            this.addCycles(15);
            $.log('i8086: INST: jmpAp ' + segment + ':' + offset);
            break;

        case 0xFA:
            // CLI : Clear interrupt flags
            // 1 2
            this.addCycles(2);
            $.log('i8086: INST: CLI NOT IMPLEMENTED');
            break;

        case 0xF4:
            // HLT : Halt CPU
            // 1 2
            this.state = Constants.CPUHalted;
            this.addCycles(2);
            $.log('i8086: INST: HALT CPU');
            break;

        default:
            $.log('UNKNOWN x86 INSTRUCTION:' + instructionByte)
            throw "UnknownInstruction Exception";
    }
}
i8086.prototype.interruptRequest = function(interruptData) {
    // data contains vector - top 5 bits are address of table, bottom 3 are interrupt id
    $.log('i8086: INTERRUPT : ID ' + interruptData & 0x07);
}
i8086.prototype.addPortDevice = function(port, device) {
    //$.log('i8086: ADD PORT : ' + port + ' ' + device)
    this.portDevices[port] = device;
}
i8086.prototype.portWriteByte = function(port, data) {
    //$.log('i8086: WR PORT : ' + port + ' ' + data)
    this.ports8Bit[port] = data;
    this.portDevices[port].portWrite(port);
}
i8086.prototype.portWriteWord = function(port, data) {
    // FIXME: check this makes sense , ie is port address linear?
    this.ports16Bit[port] = data;
    this.portHandlers[port].call();
}
i8086.prototype.portReadByte = function(port) {
    return this.ports8Bit[port];
}
i8086.prototype.portReadWord = function(port) {
    return this.ports16Bit[port];
}

// 8259 Programmable Interrupt Controller
// http://en.wikipedia.org/wiki/Intel_8259
// ************************************************************************
function PIC_8259(cpu) {
    this.cpu = cpu;
    this.cpu.addPortDevice(Constants.Master8259CommandPort, this);
    this.cpu.addPortDevice(Constants.Master8259DataPort, this);
    this.cpu.addPortDevice(Constants.Slave8259CommandPort, this);
    this.cpu.addPortDevice(Constants.Slave8259DataPort, this);

    this.registers = {
        IMR: 0,
        ISR: 0,
        IRR: new Array(8)
    }
}
PIC_8259.prototype.interruptRequest = function(id) {
    // fire interrupt with id, 8 for the master , or 15 with master/slave
    //this.registers.IRR[id] = true;

    // TODO: check priority/mask etc
    this.cpu.interruptRequest(id);
}
PIC_8259.prototype.portWrite = function(port) {
    $.log('PIC8259 : PORTS : saw port write ' + port)
    // TODO: Here we could cause an update too, thus servicing an interripts at this point too.
}
PIC_8259.prototype.update = function() {
    // Get some processing time
    $.log('PIC8259 : UPDATE : tick');

    // STUFF

    // TEST :::: Interrupt needs servicing
    var data = 1;
    this.cpu.interruptRequest(data);
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
System.prototype.isHalted = function() {
    return this.cpu.state === Constants.CPUHalted;
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
            if (!ibmpc.isHalted())
                ibmpc.cycle(parseInt(message.data));
            // Tell the app
            $.send({
                name: 'ack',
                request: message
            });
    }
});
