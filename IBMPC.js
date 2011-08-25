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
i8086.prototype.getRAM = function() {
    return this.memory;
}
i8086.prototype.addCycles = function (cycles)
{
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
    this.cycleCount += 4; // Each bus operation requires 4 CLK cycles.
    $.log(Constants.ResetVectorLinearAddress);
    $.log(this.memory.bytes[Constants.ResetVectorLinearAddress])
    var byte = this.memory.bytes[ (this.registers.CS << 4) + this.registers.IP];
    $.log(byte)
    // set overflow flag? No - http://stackoverflow.com/questions/3078821/flags-on-instruction-pointer-overflow-in-8086-8088
    this.registers.IP = this.registers.IP + 1 > 0xFFFF ? 0 : this.registers.IP + 1;
    return byte;
}
i8086.prototype.performFetchDecodeExecuteCycle = function() {
    this.decode(this.fetch()).call(this);
    return this;
}
i8086.prototype.decode = function(instructionByte) {
    switch (instructionByte) {
        case 004:
            // ADD AL, Ib
            // Add the immediate byte literal into AL
            return function() {
                var imm = this.fetch() & 0xFF,
                    al = this.registers.AX & 0xFF,
                    res = al + imm;

                if (res > 255) {
                    // FIXME: SET OVERFLOW + SET CORRECT RES
                    JSEmu.logToConnectedScripts('addALIb FIX OVERFLOW')
                }
                this.registers.AX = (this.registers.AX & 0xFF00) + (res & 0xFF);

                $.log('i8086: INST: addALIb ' + imm);
            }
        case 144:
            // NOP
            // Do nothing
            return function() {
                this.cycleCount++; // where this is going to now be the cpu object as we bind this

                $.log('NOP')
            }
        case 176:
            // MOV AL, Ib
            // Move the immediate byte literal into AL
            return  function() {
                var imm = this.fetch();
                $.log('i8086: INST: movALIb ' + imm);
                this.registers.AX = (this.registers.AX & 0xFF00) + (imm & 0xFF); // FUNC THESE?
                return this;
            }
        case 234:
            // JMP seg:a16
            // 5  15
            return  function() {
                var segment = this.fetch() + (this.fetch() << 8),
                    offset = this.fetch() + (this.fetch() << 8);

                $.log('i8086: INST: jmpAp ' + segment + ':' + offset);

                this.registers.CS = segment;
                this.registers.IP = offset;
            }
        case 244:
            // HLT
            // Halt CPU
            return function() {
                this.state = Constants.CPUHalted;
                this.cycleCount++;
            }
        default:
            $.log('UNKNOWN x86 INSTRUCTION:' + instructionByte)
            return function() {
                throw "UnknownInstruction Exception";
            }

    }
}

// Create system, empty RAM
var cpu = new i8086(new RAM());

$(function(message) {
    // Parse message
    switch(message.name) {
        case 'loadBinaryAndSetAsRAM':
            LoadBinaryFile(message.data, function(dataBuffer) {
                cpu.getRAM().writeBytes(new Uint8Array(dataBuffer));
                $.send({
                    name: 'ack',
                    request: message
                });
            });
            break;
        case 'doSystemCycle':
        default:
            // Do a run loop
            cpu.run(parseInt(message.data));
            $.send({
                name: 'ack',
                request: message
            });
    }
});
