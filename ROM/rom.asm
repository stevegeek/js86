; rom.asm
; Stephen Paul Ierodiaconou

; For NASM

; http://wiki.osdev.org/Babystep1
; nasm boot.asm -f bin -o boot.bin
; dd if=boot.bin of=/dev/fd0

; ROM start location in IBM PCs
; [ORG 0xF0000]
;
; start:
;    mov al,0x1
;    add al,0x1
;    hlt
;    times 0xFFFF-($-$$) db 0


[ORG 0x0]

start:
    mov al,0x1
    add al,0x1
    add al,0x1
    out 0x20,al

    ; The next instructions are from the 8259 initialisation code in BIOS.ASM V20 NEC BIOS
    cli
    mov al, 0x13
    out 0x20,al
    mov al,8
    out 0x21,al
    mov al,9
    out 0x21,al
    mov al,0xFF
    out 0x21,al

    ; more stuff
    add al,0x1
    add al,0x1
    add al,0x1

    hlt
    
    
    ; create file size of RAM
    times 1048560-($-$$) db 0

    ; This is the reset vector of i8086/8 processors
    jmp 0x0:start