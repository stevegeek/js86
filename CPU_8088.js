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

            $.log('i8086: INST: addALIb ' + imm);

            if (res > 255) {
                // FIXME: SET OVERFLOW + SET CORRECT RES
                $.log('addALIb FIX OVERFLOW')
            }
            this.registers.AX = (this.registers.AX & 0xFF00) + (res & 0xFF);
            this.addCycles(4);
            break;

        case 0x90:
            $.log('i8086: INST: NOP');
            // NOP: do nothing
            // 1 3
            this.addCycles(3);
            break;

        case 0xB0:
            // MOV AL, Ib : Move the immediate byte literal into AL
            // 2+i(1,2) 4
            var imm = this.fetch();
            $.log('i8086: INST: movALIb ' + imm);
            this.registers.AX = (this.registers.AX & 0xFF00) + (imm & 0xFF); // FUNC THESE?
            this.addCycles(4);
            break;

        case 0xE6:
            // OUT  Ib  AL : Output the value in AL to port specified by the immediate
            // 2 14
            var imm = this.fetch();
            $.log('i8086: INST: outIbAL, imm ' + imm + ' AL ' + (this.registers.AX & 0xFF));
            this.portWriteByte(imm & 0xFF, this.registers.AX & 0xFF);
            this.addCycles(14);
            break;

        case 0xEA:
            // JMP seg:a16
            // 5  15
            var segment = this.fetch() + (this.fetch() << 8),
                offset = this.fetch() + (this.fetch() << 8);
            $.log('i8086: INST: jmpAp ' + segment + ':' + offset);
            this.registers.CS = segment;
            this.registers.IP = offset;
            this.addCycles(15);
            break;

        case 0xFA:
            // CLI : Clear interrupt flags
            // 1 2
            $.log('i8086: INST: CLI NOT IMPLEMENTED');
            this.addCycles(2);
            break;

        case 0xF4:
            // HLT : Halt CPU
            // 1 2
            $.log('i8086: INST: HALT CPU');
            this.state = Constants.CPUHalted;
            this.addCycles(2);
            break;

        default:
            $.log('UNKNOWN x86 INSTRUCTION:' + instructionByte)
            throw "UnknownInstruction Exception";
    }
}
i8086.prototype.interruptRequest = function(interruptData) {
    // data contains vector - top 5 bits are address of table, bottom 3 are interrupt id
    var baseAddress = interruptData & 0xF8,
        interrupt = interruptData & 0x07,
        tableAddress = baseAddress + (interrupt*2),
        IP = this.memory.words[tableAddress],
        CS = this.memory.bytes[tableAddress + 1];
    $.log('i8086: INTERRUPT : ID ' + interrupt + ' base vector table address ' + baseAddress + ' - IP ' + IP + ' CS ' + CS);
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
    this.portDevices[port].portWrite(port);
}
i8086.prototype.portDeviceWriteByte = function(port, data) {
    this.ports8Bit[port] = data;
}
i8086.prototype.portDeviceWriteWord = function(port, data) {
    this.ports16Bit[port] = data;
}
i8086.prototype.portReadByte = function(port) {
    return this.ports8Bit[port];
}
i8086.prototype.portReadWord = function(port) {
    return this.ports16Bit[port];
}
