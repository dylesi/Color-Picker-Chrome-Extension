var pressing = false;
const names = ["red","green","blue","hex","hue","saturation","lightness"];
var values = [255,255,255,"#FFFFFF",0,0,1];
var savedColor = [];
var pinned = false;
const zeroPad = (num, places) => String(num).padStart(places, '0');
var colorPieRadius = 128;
let eyeDropper;


function start()
{
    document.getElementById("colorPie").addEventListener("mousedown", function myFunction(e)
    {
        pressing = true;
        colorPie(e);
    });
    document.getElementById("colorPie").addEventListener("mousemove", function myFunction(e)
    {
        colorPie(e);
    });
    document.getElementById("colorPie").addEventListener("mouseup", function myFunction()
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

    //Inputfields
    for(let i = 0; i < 3; i++)
    {
        document.getElementById(names[i]).addEventListener('change', function myFunction()
        {
            values[i] = clamp(0, 255, parseInt(document.getElementById(names[i]).value));
            document.getElementById(names[i]).value = values[i];
            rgbChanged();
        });
    }
    document.getElementById(names[3]).addEventListener('change', function myFunction()
    {
        var holder = document.getElementById(names[3]).value.toUpperCase();
        document.getElementById(names[3]).value = holder;
        if(holder.length != 7 || holder[0] != "#")
        {
            displayHex();
            return;
        }
        var hexSymbols = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
        for(let i = 1; i < 7; i++)
        {
            if(!hexSymbols.includes(holder[i]))
            {
                displayHex();
                return;
            }
        }
        values[3] = holder;
        hexChanged();
    });
    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i]).addEventListener('change', function myFunction()
        {
            values[i] = values[i] = clamp(0, 1, parseFloat(document.getElementById(names[i]).value));
            document.getElementById(names[i]).value = values[i];
            hsvChanged();
        });
    }

    //Sliders
    for(let i = 0; i < 3; i++)
    {
        document.getElementById(names[i] + "Slider").addEventListener("mousemove", function myFunction()
        {
            if(parseInt(document.getElementById(names[i] + "Slider").value) == values[i]) //if value didn't change
            {
                return;
            }
            values[i] = parseInt(document.getElementById(names[i] + "Slider").value);
            document.getElementById(names[i]).value = values[i];
            rgbChanged(); 
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
            hsvChanged();
        });   
    }
    
    if (window.EyeDropper === undefined)
    {
        console.log("Unsupported!");
    }
    else
    {
        eyeDropper = new EyeDropper();
        document.getElementById("eyeDropButton").addEventListener("click", pickColor, false);
    }
    document.getElementById("saveButton").addEventListener('click', saveColor, false);
    document.getElementById("pinButton").addEventListener('click', pin, false);

    displayVisuals();
    
    chrome.storage.local.get("key").then((result) => {
        if(result.key != undefined)
        {
            savedColor = result.key;
        }
        setColorPresets();
    });
    
}

// ----- value Change ----- //

function rgbChanged()
{
    calculateHex();
    calculateHSV();
    displayHex();
    displayHSV();
    displayVisuals();
}

function hexChanged()
{
    calculateRGB();
    calculateHSV();
    displayRPG();
    displayHSV();
    displayVisuals();
}

function hsvChanged()
{
    calculateAngleHSV(values[4] * Math.PI * 2);
    displayRPG();
    calculateHex();
    displayHex();
    displayVisuals();
}

function calculateRGB() //Based on hex
{
    values[0] = hexadeciToDecimal(values[3].substring(1,3));
    values[1] = hexadeciToDecimal(values[3].substring(3,5));
    values[2] = hexadeciToDecimal(values[3].substring(5,7));
}

function calculateHex()
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();
}

function calculateHSV() //Calculates HSV values based on RPG
{
    //Converts rgb to prosent format.
    var holderValues = [values[0] / 255, values[1] / 255, values[2] / 255];
    var max = Math.max(holderValues[0],holderValues[1],holderValues[2]);
    var min = Math.min(holderValues[0],holderValues[1],holderValues[2]);

    values[4] = 0;
    if(max != min)
    {
        switch (max) //one of the cases must be the max value.
        {
            case holderValues[0]: // max = red
                values[4] = ((holderValues[1] - holderValues[2]) / (max - min)) / 6;
                break;
            case holderValues[1]: // max = green
                values[4] = (2 + (holderValues[2] - holderValues[0]) / (max - min)) / 6;
                break;
            case holderValues[2]: // max = blue
                values[4] = (4 + (holderValues[0] - holderValues[1]) / (max - min)) / 6;
                break;
        }
        if(values[4] < 0) //we don't want negative numbers
        {
            values[4]++;
        }
        values[4] = fourDecimals(values[4].toFixed(4)); //Limits to 4 desimals
    }

    values[5] = 0;
    if(max != 0)
    {
        values[5] = fourDecimals(((max - min) / max).toFixed(4)); 
    }

    values[6] = fourDecimals(max.toFixed(4));
}

function calculateAngleHSV(angle) //Sets RGB based on the angle.
{
    angle = (angle + Math.PI * 2) % (Math.PI * 2); //Limits angle to 0 <= angle < 2 * Math.PI
    var holder = calculateAngleRGB(angle);
    for(let i = 0; i < 3; i++)
    {
        values[i] = holder[i];
        values[i] = Math.round(lerp(values[i], 255, 1 - values[5])); //saturation
        values[i] = Math.round(values[i] * values[6]); //lightness
    }
}

function calculateAngleRGB(angle)
{
    var holder = [0,0,0];
    holder[0] = 255 * Math.min(Math.max(2-Math.min(angle,2*Math.PI-angle)/(1/3*Math.PI), 0), 1);
    holder[1] = 255 * Math.min(Math.max(2-(Math.abs(2/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    holder[2] = 255 * Math.min(Math.max(2-(Math.abs(4/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    return holder;
}

// ----- Display ----- //

function displayRPG()
{
    for(let i = 0; i < 3; i++)
    {
        document.getElementById(names[i]).value = values[i]; //Set input field values.
        document.getElementById(names[i] + "Slider").value = values[i]; //Set slider values.
    } 
}

function displayHSV()
{
    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i]).value = fourDecimals(values[i]); //Set input field values.
        document.getElementById(names[i] + "Slider").value = fourDecimals(values[i]); //Set slider values.
    }
}

function displayHex(){
    document.getElementById(names[3]).value = values[3];
}

function displayVisuals() //What ever value have been changed, this needs to be called.
{
    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    document.getElementById("colorDisplay").style.backgroundColor = values[3];
    
    displaySelector();
    displaySliderColors();
    displaySliderValues();
}

function displaySelector()
{
    var posX = 142 + Math.cos(-values[4] * Math.PI * 2) * 128 * values[5];
    var posY = 142 + Math.sin(-values[4] * Math.PI * 2) * 128 * values[5];
    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";
}

function displaySliderColors()
{
    document.getElementById("redSlider").style.background = "linear-gradient(to right, #00" + values[3].substring(3,7) + ", #FF" + values[3].substring(3,7) + ")";
    document.getElementById("greenSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,3) + "00" + values[3].substring(5,7) + ", #" + values[3].substring(1,3) + "FF" + values[3].substring(5,7) + ")";
    document.getElementById("blueSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,5) + "00, #" + values[3].substring(1,5) + "FF)";

    var holder = calculateAngleRGB(values[4] * Math.PI * 2);
    for(let i = 0; i < 3; i++)
    {
        holder[i] = zeroPad(Math.round(holder[i]).toString(16),2);
    }
    var saturationColor = "#" + holder[0] + holder[1] + holder[2];
    document.getElementById("saturationSlider").style.background = "linear-gradient(to right, #FFFFFF," + saturationColor + ")";
    document.getElementById("lightnessSlider").style.background = "linear-gradient(to right, #000000," + saturationColor + ")";
}

function displaySliderValues()
{
    //Slider values
    for(let i = 0; i < 7; i++)
    {
        if(i == 3)
        {
            continue;   
        }
        document.getElementById(names[i] + "Slider").value = values[i];
    }
}

// ----- Color pie ----- //

function colorPie(e)
{
    if(!pressing)
    {
        return;
    }
    var posX = e.clientX - 30;
    var posY = e.clientY - 94;
    var dist = Math.sqrt(Math.pow(posX - colorPieRadius,2) + Math.pow(posY - colorPieRadius,2));
    
    var angle = Math.atan2(posX - colorPieRadius, posY - colorPieRadius) - Math.PI / 2;
    
    if(dist > colorPieRadius){
        posX = colorPieRadius + colorPieRadius * Math.cos(angle);
        posY = colorPieRadius - colorPieRadius * Math.sin(angle);
        dist = colorPieRadius;
    }
    values[5] = dist / colorPieRadius;
    angle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 <= angle < 2 * PI
    calculateAngleHSV(angle);
    calculateHex();
    calculateHSV();
    displayRPG();
    displayHex();
    displayHSV();
    displayVisuals();
}

// ----- Color picker and presets ----- //

function pickColor() {
    if(!pinned)
    {
        document.getElementById("body").style.display = "none";
    }
    setTimeout(async function() //Forces a delay, so popup has time to hide.
    {
        let pickedColor = await eyeDropper.open();
        values[3] = pickedColor.sRGBHex.toUpperCase();
        navigator.clipboard.writeText(values[3]);
        hexChanged();
        newPresetValue(values[3]);
        setColorPresets();
        document.getElementById("body").style.display = "inline-block";
    },1);
}

function createColorPresets()
{
    for(var i = 0; i < 20; i++)
    {
        var div = document.createElement("div");
        div.className = "colorPreset";
        div.id = i.toString();
        document.getElementById("savedColors").appendChild(div);
    }
}

function removeColorPresets()
{
    var a = document.getElementById("savedColors");
    while(a.firstChild != null){
        a.removeChild(a.firstChild);
    }
}

function setColorPresets()
{
    removeColorPresets();
    createColorPresets();
    for(let i = 0; i < 20; i++)
    {
        let colorHolder = "#2B2B2B";
        if(i < savedColor.length)
        {
            colorHolder = savedColor[i];
        }

        var div = document.getElementById(i.toString());
        div.style.backgroundColor = colorHolder;
        
        div.addEventListener("click",function()
        {
            values[3] = colorHolder;
            hexChanged();
            displayHex();
            navigator.clipboard.writeText(values[3]);
        });
    }
}

function newPresetValue(colorValue)
{
    savedColor.unshift(colorValue);
    if(savedColor.length > 20)
    {
        savedColor = savedColor.splice(0,20);
    }
    chrome.storage.local.set({ "key" : savedColor}, null);
}

function saveColor()
{
    newPresetValue(values[3]);
    setColorPresets();
}

function pin()
{
    pinned = !pinned;
    document.getElementById("pinButton").src = "images/pin.png";
    if(!pinned)
    {
        document.getElementById("pinButton").src = "images/unpin.png";
    }
}

// ----- Utility function ----- //

function hexadeciToDecimal(hex) {
    return parseInt(hex, 16);
}

function lerp(start,end,value)
{
    return start + (end - start) * value;
}

function clamp(min,max,value)
{
    return Math.min(Math.max(value, min), max);
}

function fourDecimals(value)
{
    const formattedNumber = new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
    return parseFloat(formattedNumber);
}

start();