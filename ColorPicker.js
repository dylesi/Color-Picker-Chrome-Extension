var pressing = false;
const names = ["red","green","blue","hex","hue","saturation","lightness"];
var values = [255,255,255,"#000000",0,0,1];

const zeroPad = (num, places) => String(num).padStart(places, '0');

function start()
{
    console.log("ColorPicker started!");
    document.getElementById("pie").ondragstart = function() { return false; };
    document.getElementById("selector").ondragstart = function() { return false; };
    document.getElementById("pie").addEventListener("mousedown", function myFunction()
    {
        pressing = true;
    });
    document.getElementById("pie").addEventListener("mousemove", function myFunction()
    {
        pressedPie();
    });
    document.getElementById("pie").addEventListener("mouseup", function myFunction()
    {
        pressing = false;
    });

    //Copy buttons
    for(let i = 0; i < names.length; i++)
    {
        document.getElementById("copy" + names[i]).addEventListener("click", function myFunction()
        {
            navigator.clipboard.writeText(values[i]);
        });
    }

    //Sliders
    for(let i = 0; i < 3; i++)
    {
        document.getElementById(names[i] + "Slider").addEventListener("mousemove", function myFunction()
        {
            if(parseInt(document.getElementById(names[i] + "Slider").value) == values[i])
            {
                return;
            }
            values[i] = parseInt(document.getElementById(names[i] + "Slider").value);
            document.getElementById(names[i]).value = values[i];
            rgbChange();
            writehsvValues(); 
        });    
    }
    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i] + "Slider").addEventListener("mousemove", function myFunction()
        {
            if(parseFloat(fourDecimals(document.getElementById(names[i] + "Slider").value)) == fourDecimals(values[i]))
            {
                return;
            }
            values[i] = parseFloat(parseFloat(document.getElementById(names[i] + "Slider").value));
            document.getElementById(names[i]).value = values[i];
            hsvChange(fourDecimals(values[4]) * Math.PI * 2);
            writeRGBValues();
        });   
    }
}
start();

function pressedPie()
{
    if(!pressing)
    {
        return;
    }
    var e = window.event;

    var posX = e.clientX - 8 - 8;
    var posY = e.clientY - 64 - 8 - 8;
    var dist = Math.sqrt(Math.pow(posX - 120,2) + Math.pow(posY - 120,2));
    
    var angle = Math.atan2(posX - 120,posY - 120) - Math.PI / 2;
    
    if(dist > 128){
        posX = 120 + 128 * Math.cos(angle);
        posY = 120 - 128 * Math.sin(angle);
        dist = 128;
    }
    values[5] = 1 - dist / 128;

    angle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 <= angle < 2 * PI
    hsvChange(angle);
    writeRGBValues();
    rgbChange();
    writehsvValues();

    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";
}

function rgbChange()
{
    var rHolder = values[0] / 255;
    var gHolder = values[1] / 255;
    var bHolder = values[2] / 255;
    var max = Math.max(rHolder,gHolder,bHolder);
    var min = Math.min(rHolder,gHolder,bHolder);
    if(max == min)
    {
        values[4] = 0;
    }
    else
    {
        if(rHolder == max)
        {
            values[4] = (gHolder - bHolder) / (max - min);
        }
        else if(gHolder == max)
        {
            values[4] = 2 + (bHolder - rHolder) / (max - min);
        }
        else if(bHolder == max)
        {
            values[4] = 4 + (rHolder - gHolder) / (max - min);
        }
        values[4] /= 6;
        if(values[4] < 0)
        {
            values[4]++;
        }
        values[4] = fourDecimals(values[4].toFixed(4));
    }
    values[6] = fourDecimals(max.toFixed(4));
    if(max == 0)
    {
        values[5] = 0;
    }
    else
    {
        values[5] = fourDecimals(((max - min) / max).toFixed(4));
    }
}

function writehsvValues()
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();
    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    document.getElementById("colorShower").style.backgroundColor = values[3];
    
    document.getElementById(names[3]).value = values[3];

    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i]).value = fourDecimals(values[i]);
        document.getElementById(names[i] + "Slider").value = fourDecimals(values[i]);
    }
    writeColorChange();
}

function hsvChange(angle)
{
    console.log("Angle:",angle);
    //Set root color
    values[0] = 255 * Math.min(Math.max(2-Math.min(angle,2*Math.PI-angle)/(1/3*Math.PI), 0), 1);
    values[1] = 255 * Math.min(Math.max(2-(Math.abs(2/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    values[2] = 255 * Math.min(Math.max(2-(Math.abs(4/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    
    for(let i = 0; i < 3; i++)
    {
        values[i] = Math.round(lerp(values[i], 255, 1 - values[5]));//saturation
        values[i] = Math.round(values[i] * values[6]);//lightness
    }
}

function writeRGBValues()
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();

    for(let i = 0; i < 4; i++)
    {
        document.getElementById(names[i]).value = values[i];
        if(i != 3)
        {
            document.getElementById(names[i] + "Slider").value = values[i];
        }
    }

    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    writeColorChange();
}

function writeColorChange()
{
    document.getElementById("colorShower").style.backgroundColor = values[3];
    var posX = 120 + Math.cos(-values[4] * Math.PI * 2) * 128 * values[5];
    var posY = 120 + Math.sin(-values[4] * Math.PI * 2) * 128 * values[5];
    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";
}

function lerp(start,end,value)
{
    return start + (end - start) * value;
}

function fourDecimals(value)
{
    const formattedNumber = new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
    return parseFloat(formattedNumber);
}