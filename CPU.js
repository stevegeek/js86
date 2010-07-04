/*
Bit manipulation JS
http://stackoverflow.com/questions/1436438/how-do-you-set-clear-and-toggle-a-single-bit-in-javascript

i8086/8088 CPUs
---------------
http://pdf1.alldatasheet.com/datasheet-pdf/view/66062/INTEL/8088.html

CPU Memory map
0xFFFFF 
RESET BOOTSTRAP PROGRAM JUMP
0xFFFF0   <- CPU resets to here

0x003FF
INTERRUPT POINTER (type 255)
0x003F0

0x00007F
INTERRUPT POINTER (type 1)
0x00004
0x00003
INTERRUPT POINTER (type 0)
0x00000
*/

JSEmu.Devices.i8086 = JSEmu.Devices.Generic.extend(
{
    init: function (theRAM)
    {        
        this.halted = true; // FIXME? (false?)

        this.mem = theRAM;
        
        this.irq = -1;
        this.nmi = -1;
            
        this.reset();
    },
    
    reset: function ()
    {
        this.halted = false;
        this.regs = [0,0,0,0,0,0,0,0,0,0,0,0];

        this.ip = JSEmu.i8086.ResetVectorIP;
        this.regs[JSEmu.i8086.Registers.CS] = JSEmu.i8086.ResetVectorCS;

        this.flags = 0;
        this.cycleCount = 0;
    },
    
    isHalted: function ()
    {
        return this.halted;
    },
    
    fetchAndExecute: function ()
    {
        this.decodeAndExecute(this.fetchNextCodeSegmentByte());
        
        // service interrupts
        //if ((this.interruptIsReady && this.nmi)
        this.serviceHardwareInterrupts();
        
        this.serviceSoftwareInterrupts();
    },
    
    serviceHardwareInterrupts: function ()
    {
        
    },
    
    serviceSoftwareInterrupts: function ()
    {
        
    },
    
    fetchNextCodeSegmentByte: function ()
    {
        JSEmu.logToConnectedScripts('i8086: fetch cs byte ' )  
        var b = this.mem.readByteAt( ((this.regs[JSEmu.i8086.Registers.CS] << 4) + this.ip) );
        JSEmu.logToConnectedScripts('i8086: fetched ' + b);
        this.dumpRegistersToLog();
        this.ip++;
        // set overflow flag? No - http://stackoverflow.com/questions/3078821/flags-on-instruction-pointer-overflow-in-8086-8088
        if (this.ip > 0xFFFF)
            this.ip = 0;
        return b;
    },

    fetchNextCodeSegmentWord: function ()
    {
        JSEmu.logToConnectedScripts('i8086: fetch cs word')  
        var w = this.mem.readWordAt( ((this.regs[JSEmu.i8086.Registers.CS] << 4) + this.ip) );
        this.ip += 2;
        // set overflow flag? No - http://stackoverflow.com/questions/3078821/flags-on-instruction-pointer-overflow-in-8086-8088
        if (this.ip > 0xFFFF)
            this.ip = 0;
        return w;
    }, 
    

    /*  See: 
             http://www.mlsite.net/8086/   (an Excellent reference for this processor)
             http://developer.intel.com/design/PentiumII/manuals/24319102.pdf (Intel Reference)
             http://www.swansontec.com/sintel.html  (For an intro into what all this info means)
             http://ref.x86asm.net/geek.html 

        This is obviously not a cycle accurate simulation. The methods which actually execute can perform
        fetches with no time penalty.
    */
    decodeAndExecute: function (instruction)
    {
        // test for primary opcode

        // Each Methods implementation has a description in the form
        /* OPCODENAME dest, src
        bytes - cycles
        flagsaffected */
        JSEmu.logToConnectedScripts('i8086: decode ' + instruction);
        // Decode
        switch(instruction)
        {
            // High nibble 
            //0x0
            case 000: this.execute_addEbGb(); break;
            case 001: this.execute_addEvGv(); break;
            case 002: this.execute_addGbEb(); break;
            case 003: this.execute_addGvEv(); break;
            case 004: this.execute_addALIb(); break;
            case 005: this.execute_addAXIv(); break;
            case 006: this.execute_addPushES(); break;
            case 007: this.execute_popES(); break;
            case 008: this.execute_orEbGb(); break;
            case 009: this.execute_orEvGv(); break;
            case 010: this.execute_orGbEb(); break;
            case 011: this.execute_orGvEv(); break;
            case 012: this.execute_orALIb(); break;
            case 013: this.execute_orAXIv(); break;
            case 014: this.execute_pushCS(); break;
            case 015: this.invalidOpcodeException(); break;
            //0x1
            case 016: this.execute_adcEbGb(); break;
            case 017: this.execute_adcEvGv(); break;
            case 018: this.execute_adcGbEb(); break;
            case 019: this.execute_adcGvEv(); break;
            case 020: this.execute_adcALIb(); break;
            case 021: this.execute_adcAXIv(); break;
            case 022: this.execute_pushSS(); break;
            case 023: this.execute_popSS(); break;
            case 024: this.execute_sbbEbGb(); break;
            case 025: this.execute_sbbEvGv(); break;
            case 026: this.execute_sbbGbEb(); break;
            case 027: this.execute_sbbGvEv(); break;
            case 028: this.execute_sbbALIb(); break;
            case 029: this.execute_sbbAXIv(); break;
            case 030: this.execute_pushDS(); break;
            case 031: this.execute_popDS(); break;
            //0x2
            case 032: this.execute_andEbGb(); break;
            case 033: this.execute_andEvGv(); break;
            case 034: this.execute_andGbEb(); break;
            case 035: this.execute_andGvEv(); break;
            case 036: this.execute_andALIb(); break;
            case 037: this.execute_andAXIv(); break;
    /* P */ case 038: this.execute_prefixES(); break; 
            case 039: this.execute_daa(); break;
            case 040: this.execute_subEbGb(); break;
            case 041: this.execute_subEvGv(); break;
            case 042: this.execute_subGbEb(); break;
            case 043: this.execute_subGvEv(); break;
            case 044: this.execute_subALIb(); break;
            case 045: this.execute_subAXIv(); break;
    /* P */ case 046: this.execute_prefixCS(); break; 
            case 047: this.execute_das(); break;
            //0x3
            case 048: this.execute_xorEbGb(); break;
            case 049: this.execute_xorEvGv(); break;
            case 050: this.execute_xorGbEb(); break;
            case 051: this.execute_xorGvEv(); break;
            case 052: this.execute_xorALIb(); break;
            case 053: this.execute_xorAXIv(); break;
    /* P */ case 054: this.execute_prefixSS(); break;
            case 055: this.execute_aaa(); break;
            case 056: this.execute_cmpEbGb(); break;
            case 057: this.execute_cmpEvGv(); break;
            case 058: this.execute_cmpGbEb(); break;
            case 059: this.execute_cmpGvEv(); break;
            case 060: this.execute_cmpALIb(); break;
            case 061: this.execute_cmpAXIv(); break;
    /* P */ case 062: this.execute_prefixDS(); break;
            case 063: this.execute_AAS(); break;
            //0x4
            case 064: this.execute_incAX(); break;
            case 065: this.execute_incCX(); break;
            case 066: this.execute_incDX(); break;
            case 067: this.execute_incBX(); break;
            case 068: this.execute_incSP(); break;
            case 069: this.execute_incBP(); break;
            case 070: this.execute_incSI(); break;
            case 071: this.execute_incDI(); break;
            case 072: this.execute_decAX(); break;
            case 073: this.execute_decCX(); break;
            case 074: this.execute_decDX(); break;
            case 075: this.execute_decBX(); break;
            case 076: this.execute_decSP(); break;
            case 077: this.execute_decBP(); break;
            case 078: this.execute_decSI(); break;
            case 079: this.execute_decDI(); break;
            //0x5
            case 080: this.execute_pushAX(); break;
            case 081: this.execute_pushCX(); break;
            case 082: this.execute_pushDX(); break;
            case 083: this.execute_pushBX(); break;
            case 084: this.execute_pushSP(); break;
            case 085: this.execute_pushBP(); break;
            case 086: this.execute_pushSI(); break;
            case 087: this.execute_pushDI(); break;
            case 088: this.execute_popAX(); break;
            case 089: this.execute_popCX(); break;
            case 090: this.execute_popDX(); break;
            case 091: this.execute_popBX(); break;
            case 092: this.execute_popSP(); break;
            case 093: this.execute_popBP(); break;
            case 094: this.execute_popSI(); break;
            case 095: this.execute_popDI(); break;
            //0x6
            case 096:
            case 097: 
            case 098: 
            case 099: 
            case 100: 
            case 101: 
            case 102: 
            case 103: 
            case 104: 
            case 105: 
            case 106: 
            case 107: 
            case 108: 
            case 109: 
            case 110: 
            case 111: this.invalidOpcodeException(); break;
            //0x7
            case 112: this.execute_joJb(); break;
            case 113: this.execute_jnoJb(); break;
            case 114: this.execute_jbJb(); break;
            case 115: this.execute_jnbJb(); break;
            case 116: this.execute_jzJb(); break;
            case 117: this.execute_jnzJb(); break;
            case 118: this.execute_jbeJb(); break;
            case 119: this.execute_jaJb(); break;
            case 120: this.execute_jsJb(); break;
            case 121: this.execute_jnsJb(); break;
            case 122: this.execute_jpeJb(); break;
            case 123: this.execute_jpoJb(); break;
            case 124: this.execute_jlJb(); break;
            case 125: this.execute_jgeJb(); break;
            case 126: this.execute_jleJb(); break;
            case 127: this.execute_jgJb(); break;
            //0x8
            case 128:   // Group 1 EbIb
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_addEbIb(); break;
                            case 001: this.execute_orEbIb(); break;
                            case 002: this.execute_adcEbIb(); break;
                            case 003: this.execute_sbbEbIb(); break;
                            case 004: this.execute_andEbIb(); break;
                            case 005: this.execute_subEbIb(); break;
                            case 006: this.execute_xorEbIb(); break;
                            case 007: this.execute_cmpEbIb(); break;
                        }
                        break;
            case 129:   // Group 1 EvIv
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_addEvIv(); break;
                            case 001: this.execute_orEvIv(); break;
                            case 002: this.execute_adcEvIv(); break;
                            case 003: this.execute_sbbEvIv(); break;
                            case 004: this.execute_andEvIv(); break;
                            case 005: this.execute_subEvIv(); break;
                            case 006: this.execute_xorEvIv(); break;
                            case 007: this.execute_cmpEvIv(); break;
                        }
                        break;
            case 130:   // Group 1 EbIb  -- Clone of case 128, seems to be the same instructions
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_addEbIb(); break;
                            case 001: this.execute_orEbIb(); break;
                            case 002: this.execute_adcEbIb(); break;
                            case 003: this.execute_sbbEbIb(); break;
                            case 004: this.execute_andEbIb(); break;
                            case 005: this.execute_subEbIb(); break;
                            case 006: this.execute_xorEbIb(); break;
                            case 007: this.execute_cmpEbIb(); break;
                        }
                        break;
            case 131:   // Group 1 EvIb
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_addEvIb(); break;
                            case 001: this.execute_orEvIb(); break;
                            case 002: this.execute_adcEvIb(); break;
                            case 003: this.execute_sbbEvIb(); break;
                            case 004: this.execute_andEvIb(); break;
                            case 005: this.execute_subEvIb(); break;
                            case 006: this.execute_xorEvIb(); break;
                            case 007: this.execute_cmpEvIb(); break;
                        }
                        break;
            case 132: this.execute_testGbEb(); break;
            case 133: this.execute_testGvEv(); break;
            case 134: this.execute_xchgGbEb(); break;
            case 135: this.execute_xchgGvEv(); break;
            case 136: this.execute_movEbGb(); break;
            case 137: this.execute_movEvGv(); break;
            case 138: this.execute_movGbEb(); break;
            case 139: this.execute_movGvEv(); break;
            case 140: this.execute_movEwSw(); break;
            case 141: this.execute_leaGvM(); break;
            case 142: this.execute_movSwEw(); break;
            case 143: this.execute_popEv(); break;
            //0x9
            case 144: this.execute_nop(); break;
            case 145: this.execute_xchgCXAX(); break;
            case 146: this.execute_xchgDXAX(); break;
            case 147: this.execute_xchgBXAX(); break;
            case 148: this.execute_xchgSPAX(); break;
            case 149: this.execute_xchgBPAX(); break;
            case 150: this.execute_xchgSIAX(); break;
            case 151: this.execute_xchgDIAX(); break;
            case 152: this.execute_cbw(); break;
            case 153: this.execute_cwd(); break;
            case 154: this.execute_callAp(); break;
            case 155: this.execute_wait(); break;
            case 156: this.execute_pushf(); break;
            case 157: this.execute_popf(); break;
            case 158: this.execute_sahf(); break;
            case 159: this.execute_lahf(); break;
            //0xA
            case 160: this.execute_movALOb(); break;
            case 161: this.execute_movAXOb(); break;
            case 162: this.execute_movObAL(); break;
            case 163: this.execute_movObAX(); break;
            case 164: this.execute_movsb(); break;
            case 165: this.execute_movsw(); break;
            case 166: this.execute_cmpsb(); break;
            case 167: this.execute_cmpsw(); break;
            case 168: this.execute_testALIb(); break;
            case 169: this.execute_testAXIv(); break;
            case 170: this.execute_stosb(); break;
            case 171: this.execute_stosw(); break;
            case 172: this.execute_lodsb(); break;
            case 173: this.execute_lodsw(); break;
            case 174: this.execute_scasb(); break;
            case 175: this.execute_scasw(); break;
            //0xB
            case 176: this.execute_movALIb(); break;
            case 177: this.execute_movCLIb(); break;
            case 178: this.execute_movDLIb(); break;
            case 179: this.execute_movBLIb(); break;
            case 180: this.execute_movAHIb(); break;
            case 181: this.execute_movCHIb(); break;
            case 182: this.execute_movDHIb(); break;
            case 183: this.execute_movBHIb(); break;
            case 184: this.execute_movAXIv(); break;
            case 185: this.execute_movCXIv(); break;
            case 186: this.execute_movDXIv(); break;
            case 187: this.execute_movBXIv(); break;
            case 188: this.execute_movSPIv(); break;
            case 189: this.execute_movBPIv(); break;
            case 190: this.execute_movSIIv(); break;
            case 191: this.execute_movDIIv(); break;
            //0xC
            case 192: 
            case 193: this.invalidOpcodeException(); break;
            case 194: this.execute_retIw(); break;
            case 195: this.execute_ret(); break;
            case 196: this.execute_lesGvMp(); break;
            case 197: this.execute_ldsGvMp(); break;
            case 198: this.execute_movEbIb(); break;
            case 199: this.execute_movEvIv(); break;
            case 200:
            case 201: this.invalidOpcodeException(); break;
            case 202: this.execute_retfIw(); break;
            case 203: this.execute_retf(); break;
            case 204: this.execute_int3(); break;
            case 205: this.execute_intIb(); break;
            case 206: this.execute_into(); break;
            case 207: this.execute_iret(); break;
            //0xD
            case 208:   // Group 2 Eb1
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_rolEb1(); break;
                            case 001: this.execute_rorEb1(); break;
                            case 002: this.execute_rclEb1(); break;
                            case 003: this.execute_rcrEb1(); break;
                            case 004: this.execute_shlEb1(); break;
                            case 005: this.execute_shrEb1(); break;
                            case 006: this.invalidOpcodeException(); break;
                            case 007: this.execute_sarEb1(); break;
                        }
                        break;
            case 209:   // Group 2 Ev1
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_rolEv1(); break;
                            case 001: this.execute_rorEv1(); break;
                            case 002: this.execute_rclEv1(); break;
                            case 003: this.execute_rcrEv1(); break;
                            case 004: this.execute_shlEv1(); break;
                            case 005: this.execute_shrEv1(); break;
                            case 006: this.invalidOpcodeException(); break;
                            case 007: this.execute_sarEv1(); break;
                        }
                        break;
            case 210:   // Group 2 EbCL
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_rolEbCL(); break;
                            case 001: this.execute_rorEbCL(); break;
                            case 002: this.execute_rclEbCL(); break;
                            case 003: this.execute_rcrEbCL(); break;
                            case 004: this.execute_shlEbCL(); break;
                            case 005: this.execute_shrEbCL(); break;
                            case 006: this.invalidOpcodeException(); break;
                            case 007: this.execute_sarEbCL(); break;
                        }
                        break;
            case 211:   // Group 2 EvCL
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_rolEvCL(); break;
                            case 001: this.execute_rorEvCL(); break;
                            case 002: this.execute_rclEvCL(); break;
                            case 003: this.execute_rcrEvCL(); break;
                            case 004: this.execute_shlEvCL(); break;
                            case 005: this.execute_shrEvCL(); break;
                            case 006: this.invalidOpcodeException(); break;
                            case 007: this.execute_sarEvCL(); break;
                        }
                        break;
            case 212: this.execute_aamI0(); break;
            case 213: this.execute_aadI0(); break;
            case 214: this.invalidOpcodeException(); break;
            case 215: this.execute_xlat(); break;
            case 216:
            case 217:
            case 218:
            case 219:
            case 220: 
            case 221: 
            case 222:
            case 223: this.invalidOpcodeException(); break;
            //0xE
            case 224: this.execute_loopnzJb(); break;
            case 225: this.execute_loopzJb(); break;
            case 226: this.execute_loopJb(); break;
            case 227: this.execute_jcxzJb(); break;
            case 228: this.execute_inALIb(); break;
            case 229: this.execute_inAXIb(); break;
            case 230: this.execute_outIbAL(); break;
            case 231: this.execute_outIbAX(); break;
            case 232: this.execute_callJv(); break;
            case 233: this.execute_jmpJv(); break;
            case 234: this.execute_jmpAp(); break;
            case 235: this.execute_jmpJb(); break;
            case 236: this.execute_inALDX(); break;
            case 237: this.execute_inAXDX(); break;
            case 238: this.execute_outDXAL(); break;
            case 239: this.execute_outDXAX(); break;
            //0xF
    /* P */ case 240: this.execute_prefixLock(); break;
            case 241: this.invalidOpcodeException(); break;
    /* P */ case 242: this.execute_prefixRepnz(); break;
    /* P */ case 243: this.execute_prefixRepz(); break;
            case 244: this.execute_hlt(); break;
            case 245: this.execute_cmc(); break;
            case 246:   // Group 3a Eb
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_testEbIb(); break;
                            case 001: this.invalidOpcodeException(); break;
                            case 002: this.execute_notEb(); break;
                            case 003: this.execute_negEb(); break;
                            case 004: this.execute_mulEb(); break;
                            case 005: this.execute_imulEb(); break;
                            case 006: this.execute_divEb(); break;
                            case 007: this.execute_idivEb(); break;
                        }
                        break;
            case 247:   // Group 3b Ev
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_testEvIv(); break;
                            case 001: this.invalidOpcodeException(); break;
                            case 002: this.execute_notEv(); break;
                            case 003: this.execute_negEv(); break;
                            case 004: this.execute_mulEv(); break;
                            case 005: this.execute_imulEv(); break;
                            case 006: this.execute_divEv(); break;
                            case 007: this.execute_idivEv(); break;
                        }
                        break;
            case 248: this.execute_clc(); break;
            case 249: this.execute_stc(); break;
            case 250: this.execute_cli(); break;
            case 251: this.execute_sti(); break;
            case 252: this.execute_cld(); break;
            case 253: this.execute_std(); break;
            case 254:   // Group 4 Eb
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_incEb(); break;
                            case 001: this.execute_decEb(); break;
                            case 002: 
                            case 003: 
                            case 004: 
                            case 005: 
                            case 006: 
                            case 007: this.invalidOpcodeException(); break;
                        }
                        break;
            case 255:   // Group 5 Ev
                        var modrm = JSEmu.i8086.ModRM.Make(this.mem.readByteAt(this.ip)); // The fetch of the byte will be done by the respective exec method
                        switch (modrm.reg2) //modrm.nnn
                        {
                            case 000: this.execute_incEv(); break;
                            case 001: this.execute_decEv(); break;
                            case 002: this.execute_callEv(); break;
                            case 003: this.execute_callMp(); break;
                            case 004: this.execute_jmpEv(); break;
                            case 005: this.execute_jmpMp(); break;
                            case 006: this.execute_pushEv(); break;
                            case 007: this.invalidOpcodeException(); break;
                        }
                        break;
            
            // End instruction decode
        }
    },
    
    addCycles: function (cyc)
    {
        this.cycleCount += cyc;
    },
    
    // shortcuts methods, ideally I will get rid of these and create a compile step to inline
    // all these methods.
    rAL: function () {return this.regs[JSEmu.i8086.Registers.AX] & 0xFF;},
    wAL: function (v) {this.regs[JSEmu.i8086.Registers.AX] = (this.regs[JSEmu.i8086.Registers.AX] & 0xFF00) + (v & 0xFF);},
    //aAL: function (v) {},
    //sAL: function (v) {},
    rAH: function () {return (this.regs[JSEmu.i8086.Registers.AX] & 0xFF00) >> 8;},
    wAH: function (v) {this.regs[JSEmu.i8086.Registers.AX] = (this.regs[JSEmu.i8086.Registers.AX] & 0xFF) + ((v & 0xFF) << 8);},
    //aAH: function (v) {},
    //sAH: function (v) {},
    rAX: function () {return this.regs[JSEmu.i8086.Registers.AX];},
    wAX: function (v) {this.regs[JSEmu.i8086.Registers.AX] = (v & 0xFFFF);},
    //aAX: function (v) {},
    //sAX: function (v) {},
    rBL: function () {return this.regs[JSEmu.i8086.Registers.BX] & 0xFF;},
    wBL: function (v) {this.regs[JSEmu.i8086.Registers.BX] = (this.regs[JSEmu.i8086.Registers.BX] & 0xFF00) + (v & 0xFF);},
    //aBL: function (v) {},
    //sBL: function (v) {},
    rBH: function () {return (this.regs[JSEmu.i8086.Registers.BX] & 0xFF00) >> 8;},
    wBH: function (v) {this.regs[JSEmu.i8086.Registers.BX] = (this.regs[JSEmu.i8086.Registers.BX] & 0xFF) + ((v & 0xFF) << 8);},
    //aBH: function (v) {},
    //sBH: function (v) {},
    rBX: function () {return this.regs[JSEmu.i8086.Registers.BX];},
    wBX: function (v) {this.regs[JSEmu.i8086.Registers.BX] = (v & 0xFFFF);},
    //aBX: function (v) {},
    //sBX: function (v) {},
    rCL: function () {return this.regs[JSEmu.i8086.Registers.CX] & 0xFF;},
    wCL: function (v) {this.regs[JSEmu.i8086.Registers.CX] = (this.regs[JSEmu.i8086.Registers.CX] & 0xFF00) + (v & 0xFF);},
    //aCL: function (v) {},
    //sCL: function (v) {},
    rCH: function () {return (this.regs[JSEmu.i8086.Registers.CX] & 0xFF00) >> 8;},
    wCH: function (v) {this.regs[JSEmu.i8086.Registers.CX] = (this.regs[JSEmu.i8086.Registers.CX] & 0xFF) + ((v & 0xFF) << 8);},
    //aCH: function (v) {},
    //sCH: function (v) {},
    rCX: function () {return this.regs[JSEmu.i8086.Registers.CX];},
    wCX: function (v) {this.regs[JSEmu.i8086.Registers.CX] = (v & 0xFFFF);},
    //aCX: function (v) {},
    //sCX: function (v) {},
    rDL: function () {return this.regs[JSEmu.i8086.Registers.DX] & 0xFF;},
    wDL: function (v) {this.regs[JSEmu.i8086.Registers.DX] = (this.regs[JSEmu.i8086.Registers.DX] & 0xFF00) + (v & 0xFF);},
    //aDL: function (v) {},
    //sDL: function (v) {},
    rDH: function () {return (this.regs[JSEmu.i8086.Registers.DX] & 0xFF00) >> 8;},
    wDH: function (v) {this.regs[JSEmu.i8086.Registers.DX] = (this.regs[JSEmu.i8086.Registers.DX] & 0xFF) + ((v & 0xFF) << 8);},
    //aDH: function (v) {},
    //sDH: function (v) {},
    rDX: function () {return this.regs[JSEmu.i8086.Registers.DX];},
    wDX: function (v) {this.regs[JSEmu.i8086.Registers.DX] = (v & 0xFFFF);},
    //aDX: function (v) {},
    //sDX: function (v) {},

    rIP: function () {return this.ip;},
    wIP: function (v) {this.ip = (v & 0xFFFF);},

    rSP: function () {return this.regs[JSEmu.i8086.Registers.SP];},
    wSP: function (v) {this.regs[JSEmu.i8086.Registers.SP] = (v & 0xFFFF);},
    rBP: function () {return this.regs[JSEmu.i8086.Registers.BP];},
    wBP: function (v) {this.regs[JSEmu.i8086.Registers.BP] = (v & 0xFFFF);},
    rSI: function () {return this.regs[JSEmu.i8086.Registers.SI];},
    wSI: function (v) {this.regs[JSEmu.i8086.Registers.SI] = (v & 0xFFFF);},
    rDI: function () {return this.regs[JSEmu.i8086.Registers.DI];},
    wDI: function (v) {this.regs[JSEmu.i8086.Registers.DI] = (v & 0xFFFF);},
    rCS: function () {return this.regs[JSEmu.i8086.Registers.CS];},
    wCS: function (v) {this.regs[JSEmu.i8086.Registers.CS] = (v & 0xFFFF);},
    rDS: function () {return this.regs[JSEmu.i8086.Registers.DS];},
    wDS: function (v) {this.regs[JSEmu.i8086.Registers.DS] = (v & 0xFFFF);},
    rSS: function () {return this.regs[JSEmu.i8086.Registers.SS];},
    wSS: function (v) {this.regs[JSEmu.i8086.Registers.SS] = (v & 0xFFFF);},
    rES: function () {return this.regs[JSEmu.i8086.Registers.ES];},
    wES: function (v) {this.regs[JSEmu.i8086.Registers.ES] = (v & 0xFFFF);},
            
    rCF: function () {return this.flags & JSEmu.i8086.Flags.CF;},
    sCF: function () {this.flags |= JSEmu.i8086.Flags.CF;}      ,
    cCF: function () {this.flags &= ~JSEmu.i8086.Flags.CF;}     ,
    rPF: function () {return this.flags & JSEmu.i8086.Flags.PF;},
    sPF: function () {this.flags |= JSEmu.i8086.Flags.PF;}      ,
    cPF: function () {this.flags &= ~JSEmu.i8086.Flags.PF;}     ,
    rAF: function () {return this.flags & JSEmu.i8086.Flags.AF;},
    sAF: function () {this.flags |= JSEmu.i8086.Flags.AF;}      ,
    cAF: function () {this.flags &= ~JSEmu.i8086.Flags.AF;}     ,
    rZF: function () {return this.flags & JSEmu.i8086.Flags.ZF;},
    sZF: function () {this.flags |= JSEmu.i8086.Flags.ZF;}      ,
    cZF: function () {this.flags &= ~JSEmu.i8086.Flags.ZF;}     ,
    rSF: function () {return this.flags & JSEmu.i8086.Flags.SF;},
    sSF: function () {this.flags |= JSEmu.i8086.Flags.SF;}      ,
    cSF: function () {this.flags &= ~JSEmu.i8086.Flags.SF;}     ,
    rTF: function () {return this.flags & JSEmu.i8086.Flags.TF;},
    sTF: function () {this.flags |= JSEmu.i8086.Flags.TF;}      ,
    cTF: function () {this.flags &= ~JSEmu.i8086.Flags.TF;}     ,
    rIF: function () {return this.flags & JSEmu.i8086.Flags.IF;},
    sIF: function () {this.flags |= JSEmu.i8086.Flags.IF;}      ,
    cIF: function () {this.flags &= ~JSEmu.i8086.Flags.IF;}     ,
    rDF: function () {return this.flags & JSEmu.i8086.Flags.DF;},
    sDF: function () {this.flags |= JSEmu.i8086.Flags.DF;}      ,
    cDF: function () {this.flags &= ~JSEmu.i8086.Flags.DF;}     ,
    rOF: function () {return this.flags & JSEmu.i8086.Flags.OF;},
    sOF: function () {this.flags |= JSEmu.i8086.Flags.OF;}      ,
    cOF: function () {this.flags &= ~JSEmu.i8086.Flags.OF;}     ,

    cNMI: function () {this.nmi = false;},
    sNMI: function () {this.nmi = true;},
    rNMI: function () {return this.nmi;},
    cIRQ: function () {this.irq = false;},
    sIRQ: function () {this.irq = true;},
    rIRQ: function () {return this.irq;},

    // Group: Misc
    // NEEDSTEST
    execute_aaa : function ()
    {
        /* 0x37 - AAA
        ASCII adjust AL after addition
        1  8
        O---SZAPC 
        The AF and CF flags are set to 1 if the adjustment results in a decimal carry; otherwise they are cleared to 0. The OF, SF, ZF, and PF flags are undefined.
        */
        var al = this.rAL(),
            ah = this.rAH();

        if ((al & 0x0F) > 9 || this.rAF())
        {
            al += 6;
            ah += 1;
            this.sAF();
            this.sCF();
        } 
        else
        {
            this.cAF();
            this.cCF();
        }
        this.wAL(al);
    },
    
    // Group: Misc
    // NEEDSTEST
    execute_aadI0 : function ()
    {
        /* 0xD5 - AAD *d8
        ASCII Adjust AX Before Division
        2  60
        O---SZAPC
        The SF, ZF, and PF flags are set according to the result; the OF, AF, and CF flags are undefined.
        */
        var al = this.rAL(),
            ah = this.rAH(),
            base = this.fetchNextCodeSegmentByte(),
            soln = (al + (ah * base)) & 0x00FF; // WHAT ABOUT MUL OVERFLOWS??
        
        this.wAL(soln);
    },

    // *** Arithmetic
    execute_addEbGb: function ()
    {
        /* ADD r/m8,r8
        2+ - 3/24+
        O---SZAPC */
        var modrm = JSEmu.i8086.ModRM.Make(this.fetchNextCodeSegmentByte());
    },

    execute_addEvGv : function ()
    {
        /* ADD r/m16,r16
        2+  3/24+
        O---SZAPC */
        var modrm = JSEmu.i8086.ModRM.Make(this.fetchNextCodeSegmentByte());
    },
    
    //case 002: this.execute_addGbEb(); break;
    //case 003: this.execute_addGvEv(); break;

    execute_addALIb: function ()
    {
        var imm = this.fetchNextCodeSegmentByte(),
            al = this.rAL(),
            res = al + imm;

        JSEmu.logToConnectedScripts('i8086: INST: addALIb ' + imm);

        if (res > 255)
        {
            // FIXME: SET OVERFLOW + SET CORRECT RES
            JSEmu.logToConnectedScripts('addALIb FIX OVERFLOW')
        }

        this.wAL(res);

        this.addCycles(4);
    },
    /*case 005: this.execute_addAXIv(); break;
    case 006: this.execute_addPushES(); break;
    case 007: this.execute_popES(); break;
    case 008: this.execute_orEbGb(); break;
    case 009: this.execute_orEvGv(); break;
    case 010: this.execute_orGbEb(); break;
    case 011: this.execute_orGvEv(); break;
    case 012: this.execute_orALIb(); break;
    case 013: this.execute_orAXIv(); break;
    case 014: this.execute_pushCS(); break;*/

    // *** Moves
    execute_movALIb: function ()
    {
        var imm = this.fetchNextCodeSegmentByte();

        JSEmu.logToConnectedScripts('i8086: INST: movALIb ' + imm);

        this.wAL(imm);

        this.addCycles(4);
    },

    // *** Jumps
    execute_jmpAp: function ()
    {
        /* JMP seg:a16
        5  15
        ---------*/
        var segment = this.fetchNextCodeSegmentWord(),
            offset = this.fetchNextCodeSegmentWord();

        JSEmu.logToConnectedScripts('i8086: INST: jmpAp ' + segment + ':' + offset);
        
        
        this.wCS(segment);
        this.wIP(offset);

        this.addCycles(15);
    },

    // *** MISC
    execute_hlt: function ()
    {
        this.halted = true;
        /*if (haltCallback)
            haltCallback();*/
        this.addCycles(1);
        
        //this.messageWorkers("CPU:state:hlt");
    },

    // Debugging

    dumpRegistersToLog: function ()
    {
        var string = "i8086 REGISTER DUMP: ";
        string += "IP : " + this.ip;
        string += " AX : " + this.regs[JSEmu.i8086.Registers.AX];
        string += " BX : " + this.regs[JSEmu.i8086.Registers.BX];
        string += " CX : " + this.regs[JSEmu.i8086.Registers.CX];
        string += " DX : " + this.regs[JSEmu.i8086.Registers.DX];
        string += " SP : " + this.regs[JSEmu.i8086.Registers.SP];
        string += " BP : " + this.regs[JSEmu.i8086.Registers.BP];
        string += " SI : " + this.regs[JSEmu.i8086.Registers.SI];
        string += " DI : " + this.regs[JSEmu.i8086.Registers.DI];
        string += " CS : " + this.regs[JSEmu.i8086.Registers.CS];
        string += " DS : " + this.regs[JSEmu.i8086.Registers.DS];
        string += " SS : " + this.regs[JSEmu.i8086.Registers.SS];
        string += " ES : " + this.regs[JSEmu.i8086.Registers.ES];
        string += " Flags : " + this.flags;
        JSEmu.logToConnectedScripts(string);
    }


});
