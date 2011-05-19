importScripts('libs/jquery-hive/jquery.hive.pollen.js');

//var jsPC = {};
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

// ************************************************************************
// TODO: MAKE THIS INHERITED FROM ARRAY
function RAM(initialValues){
    this.size = Constants.RAMSize;
    this.bytes = new Array(this.size);
    this.writeBytesWithRange(initialValues, MakeRange(Constants.ResetVectorLinearAddress, initialValues.length))
}
RAM.prototype.writeBytesWithRange = function (data, range) {
    // TEST RANGE RETURN FALSE IF OUT?
    var i = 0;

    // FIXME: NOT LOOPS
    for (; i < range.length; i++)
        this.bytes[range.start + i] = data[i]; 

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
    //this.instructionStreamByteQueue = [];
    //this.instructionStreamIndex = 0;
    this.cycleCount = 0;
    this.state = Constants.CPURunning;
    return this;
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
    //this.instructionStreamByteQueue[this.instructionStreamIndex++] = (this.memory[ (this.registers.CS << 4) + this.registers.IP ];
    //return this;
    
    this.cycleCount += 4; // Each bus operation requires 4 CLK cycles.
    var byte = this.memory.bytes[ (this.registers.CS << 4) + this.registers.IP ];
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
        case 144:
            // Return actual execute function to be run in i8086 object context
            return function() {
                this.cycleCount++; // where this is going to now be the cpu object as we bind this
                //nop
                $.log('NOP')
            }
        case 176: // needs another fetch
            return  function() {
                // Move the immediate byte literal into AL
                // --- MOV AL, Ib
                var imm = this.fetch();
                $.log('i8086: INST: movALIb ' + imm);
                this.registers.AX = (this.registers.AX & 0xFF00) + (imm & 0xFF); // FUNC THESE?
                //this.addCycles(4);
                return this;
            }
        case 244: // HLT
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

var cpu = new i8086(new RAM([144, 176, 1, 244, 1, 1]));

$(function(message) {
    cpu.run(500);
    $.log('ack');
});

$.log = function(msg) {
    this.send(msg + '\n');
}

