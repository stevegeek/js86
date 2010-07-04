JSEmu.Debugger = Class.extend(
{
    init: function ()
    {
        this.scriptID = 0;
        this.IBMPC = new SharedWorker('IBMPC.js');
        
        this.IBMPC.port.onmessage = function (event) 
        {
            // 'this' is out of scope, use global 
            emulator.parseMessage(event.data);
        }
    },
    
    parseMessage: function (message)
    {
        var messagetypeinfo =  message.type.split(':'),
            roottype = messagetypeinfo[0],
            extrainfo = messagetypeinfo[1];

        switch (roottype)
        {
            case 'sys':
                switch (extrainfo)
                {
                    case 'connid':
                        console.log('CONNID = '+ message.body)
                        this.scriptID = parseInt(message.body);
                        break;
                    case 'ack':
                        console.log('ACK for '+ message.body)
                        break;
                }
                break;
            case 'log':
                var p = document.createElement('p');
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
                p.innerHTML = "<b>debugger:"+roottype+"</b> : <em>"+level+"</em> : " + event.data.body;
                document.getElementById('jsemu-log').appendChild(p);
                break;    
        }
    },
    
    postMessageToPC: function(message)
    {
        this.IBMPC.port.postMessage(message);
    }
});
