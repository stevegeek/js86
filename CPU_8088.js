/*  i8086 processor
    ---------------

    Intel 8088 processor emulation.

    Interrupts:
        - http://www.bime.ntu.edu.tw/~ttlin/Course15/lecture_notes/C15_LECTURE_NOTE_11(2%20in%201).pdf
        - http://ftp.utcluj.ro/pub/users/nedevschi/PMP/WLab/x86per/week9.pdf

    Interrupt Vector Table:
    Vector 0 = Divide Error
    Vector 1 = Single Step
    Vector 2 = NMI
    Vector 3 = Breakpoint
    Vector 4 = Signed number overflow
    Vector 5 - 31 = Reserved
    Vector 32 - 255 = User Available
*/

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
i8086.prototype.fetchWord = function() {
    //this.cycleCount += 8; // Each bus operation requires 4 CLK cycles. (THESE ARE ADDED ALREADY BY COUNTS)
    // Little-endian
    var word = this.memory.bytes[ (this.registers.CS << 4) + this.registers.IP] + (this.memory.bytes[ (this.registers.CS << 4) + this.registers.IP + 1] << 8);
    this.registers.IP = this.registers.IP + 2 > 0xFFFF ? 0 : this.registers.IP + 2;
    return word;
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

        case 0xCC:
            // INT alias (INT 3) : Call to Interrupt Procedure, Breakpoint
            // 1 72
            $.log('i8086: INST: int3 - Breakpoint');
            this.softwareInterruptRequest(3);
            this.addCycles(72);
            break;

        case 0xCD:
            // INT Ib : Call to Interrupt Procedure
            // 2 71
            var imm = this.fetch();
            $.log('i8086: INST: int ' + imm);
            this.softwareInterruptRequest(imm);
            this.addCycles(71);
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
            var offset = this.fetchWord(),
                segment = this.fetchWord();
            $.log('i8086: INST: jmpAp ' + segment + ':' + offset);
            this.registers.CS = segment;
            this.registers.IP = offset;
            this.addCycles(15);
            break;

        case 0xFA:
            // CLI : Clear interrupt flag
            // 1 2
            $.log('i8086: INST: CLI NOT IMPLEMENTED');
            this.addCycles(2);
            break;

        case 0xFB:
            // STI : Set interrupt flag
            // 1 2
            $.log('i8086: INST: STI NOT IMPLEMENTED');
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
i8086.prototype.hardwareInterruptRequest = function(interruptData) {
    // data contains vector - top 5 bits are address of table, bottom 3 are interrupt id
    var baseAddress = interruptData & 0xF8,
        interrupt = interruptData & 0x07,
        tableAddress = baseAddress + (interrupt*2),
        IP = this.memory.words[tableAddress],
        CS = this.memory.bytes[tableAddress + 1],
        enabled = this.registers.FLAGS & Constants.Flags.IF;
    $.log('i8086: HW INTERRUPT (enabled - ' + enabled + ') : ID ' + interrupt + ' base vector ' + baseAddress + ' - IP ' + IP + ' CS ' + CS);
}
i8086.prototype.softwareInterruptRequest  = function(interrupt) {
    $.log('i8086: SW INTERRUPT');
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
