
var curfile;

var theprocessed;

const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination); 

const thegranular = audioCtx.createBuffer(
    2,
    audioCtx.sampleRate * 4,
    audioCtx.sampleRate
);

var grainsize = document.getElementById("GranuleSize").value +0;

function loadarbitary(e) {

    let files = e.target.files;
    let file = files[0];
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function () {
        let text = reader.result;
        if (text != undefined) {
            curfile = text;
            console.log(curfile)
            audioCtx.decodeAudioData(curfile, (buffer) => {
                theprocessed = buffer;
                let button = document.getElementById("play");
                button.onclick = ()=>{play(theprocessed);};
                button.disabled = false;
                makeGrains(buffer)
                granularsynthy(buffer)
                let button2 = document.getElementById("play2");
                button2.onclick = ()=>{play(thegranular);};
                button2.disabled = false;
                let button3 = document.getElementById("regen");
                button3.onclick = ()=>{
                    if( grainsize != document.getElementById("GranuleSize").value){
                        makeGrains(theprocessed);
                        grainsize = document.getElementById("GranuleSize").value;                   
                    }
                    granularsynthy(theprocessed);
                };
                button3.disabled = false;
              },
            (err) => console.error(`Error with decoding audio data: ${err.err}`))
        }
    }
}

document.getElementById("volume").oninput = (e)=>{
    gainNode.gain.value = e.target.value/100;
    document.getElementById("volumeBox").value = e.target.value;
}
document.getElementById("volumeBox").oninput = (e)=>{
    gainNode.gain.value = e.target.value/100;
    document.getElementById("volume").value = e.target.value;
}

function play(audioBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.gain.value = document.getElementById("volume").value/100;
    source.start();
}

function lerp(start, target, mix) {
    return start + mix * (target - start);
}

var granules = [];
function makeGrains(audioBuffer) {
    let granulesize = document.getElementById("GranuleSize").value * (audioCtx.sampleRate/1000);
    let scale = 30;
    granules = []
    for(let c = 0; c< audioBuffer.numberOfChannels; c++){
        let inchannel = audioBuffer.getChannelData(c);
        for(let i = 0; i< Math.floor(inchannel.length/granulesize)*granulesize; i++){
            if(i%granulesize==0) granules.push([]);
            granules[granules.length-1][i%granulesize] = inchannel[i];
        }
    }
    if(document.getElementById("imagesinner") !== undefined){
        let immy = document.getElementById("images");
        immy.removeChild(document.getElementById("imagesinner"));
        let inner = document.createElement("span");
        inner.id = "imagesinner";
        for(let i = 0; i < granules.length; i++){
            let grain = granules[i];
            let can = document.createElement("canvas");
            can.width = grain.length/scale;
            can.height = 60;
            ctxx = can.getContext("2d");
            ctxx.fillStyle = "#020"
            ctxx.fillRect(0,0,can.width,can.height);
            for(let h = 0; h < grain.length; h++){
                ctxx.fillStyle = "#f00"
                ctxx.fillRect(h/scale,(grain[h]+1)*30,1,1);
            }
            inner.append(can);
            // let tempp = document.createElement("span")
            // tempp.innerText=" ";
            inner.append(" ");
        }
        immy.appendChild(inner);
    }
    
}


function granularsynthy(audioBuffer) {
    let granulesize = document.getElementById("GranuleSize").value * (audioCtx.sampleRate/1000);
    let overlapA = document.getElementById("overlap").value/100;
    let random = document.getElementById("random").checked;
        let speed = document.getElementById("speed").value/100;
    
    let canvas1 = document.getElementById("canvas1");
    let ctx1 = canvas1.getContext("2d");
    
    
    let Lchannelout = thegranular.getChannelData(0);
    let Rchannelout = thegranular.getChannelData(1);
    
    
    for(let i = 0; i < Lchannelout.length; i++){
        Lchannelout[i] = 0;
        Rchannelout[i] = 0;
    }
    let overlap = Math.floor(overlapA*granulesize);
    let placement = Math.floor((granulesize-overlap)/speed );
    let scale = 40;
    canvas1.width = Lchannelout.length/scale;
    canvas1.height = 60;
    ctx1.fillStyle = "#020"
    ctx1.fillRect(0, 0, canvas1.width, canvas1.height)
    ctx1.fillStyle = "#00a6"
    let firstGrain = true;
    function placeGrain(inx){
        let col = ""+`rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.2)`;
        ctx1.fillStyle = col;
        
        let grain = granules[ (random) ? Math.floor(Math.random()*(granules.length-1)) : Math.floor(inx/placement)%granules.length ]
        let pan = ((Math.random()*2+3)/8)*2;
        
        ctx1.fillRect(inx/scale,0,grain.length/speed/scale,60);
        let crossover;
        for(let i = 0; i < Math.floor(grain.length/speed); i++){
            let aa = Math.floor(i);
            let ii = Math.floor(i*speed);
            let indx = (inx+aa) % Lchannelout.length;
            // if(Lchannelout[indx] != 0 ){
            //     Lchannelout[indx] = (Lchannelout[indx] + ( grain[i] * pan ))/2
            // }else{
            //     Lchannelout[indx] = ( grain[i] * pan )
            // }
            // if(Rchannelout[indx] != 0 ){
            //     Rchannelout[indx] = (Rchannelout[indx] + ( grain[i] * (1-pan) ))/2
            // }else{
            //     Rchannelout[indx] = ( grain[i] * (1-pan) )
            // }
            
            if(aa < overlap && !firstGrain){
                // Lchannelout[indx] = (Lchannelout[indx] + ( grain[i] * pan ))/2
                // Rchannelout[indx] = (Rchannelout[indx] + ( grain[i] * (1-pan) ))/2
                let interp = aa/(overlap/speed);
                interp = interp > 1? 1: interp < 0? 0 : interp;
                Lchannelout[indx] = lerp(Lchannelout[indx], grain[ii], interp);
                Rchannelout[indx] = lerp(Rchannelout[indx], grain[ii], interp);
            }else if((inx+aa) > Lchannelout.length ){
                if(crossover == undefined) {
                    crossover = aa;
                    ctx1.fillRect(0,0,(grain.length-aa)/speed/scale, 60)
                }
                let interp = (aa-crossover)/ (grain.length-crossover-1);
                interp = interp > 1? 1: interp < 0? 0 : interp;
                Lchannelout[indx] = lerp(grain[ii], Lchannelout[indx], interp);
                Rchannelout[indx] = lerp(grain[ii], Rchannelout[indx], interp);
            } else {
                Lchannelout[indx] = ( grain[ii]  );
                Rchannelout[indx] = ( grain[ii]  );
            }
        }
    }
    
    for(let i = 0; i < Lchannelout.length; i++){
        if(i%placement==0) placeGrain(i);
        firstGrain = false;
    }
    ctx1.fillStyle = "#c01"
    for(let i = 0; i < Lchannelout.length; i++){
        ctx1.fillRect(i/scale,(Lchannelout[i]+1)*30,1,1)
    }
    ctx1.fillStyle = "#0c1"
    for(let i = 0; i < Rchannelout.length; i++){
        ctx1.fillRect(i/scale,(Rchannelout[i]+1)*30,1,1)
    }
}