var pressing = false;
const names = ["red","green","blue","hex","hue","saturation","lightness"];
var values = [255,255,255,"#FFFFFF",0,0,1];
var savedColours = [];
var savedCoulourUpperLimit = 20;
var pinned = false;
const zeroPad = (num, places) => String(num).padStart(places, '0');
let eyeDropper;

var pieRadius = document.getElementById("pie").offsetWidth / 2;
let selectorRadius = document.getElementById("selector").offsetWidth / 2;

function start()
{
    // ----- Event listeners ----- //
    document.getElementById("pie").addEventListener("mousedown", function myFunction(e)
    {
        console.log("Pressing!!!");
        pressing = true;
        colourPie(e);
    });
    document.addEventListener("mousemove", function myFunction(e)
    {
        colourPie(e);
    });
    document.addEventListener("mouseup", function myFunction()
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
    //Hex input field
    document.getElementById(names[3]).addEventListener('change', function myFunction()
    {
        var holder = document.getElementById(names[3]).value.toUpperCase(); //Converts uppercase
        if(!isHex(holder))
        {
            displayHex();
            return;
        }
        values[3] = holder;
        hexChanged();
    });

    //Hue input fields.
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
            if(parseFloat(decimalLimit(document.getElementById(names[i] + "Slider").value,4)) == decimalLimit(values[i],4))
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
        console.log("Eyedropper unsupported!");
    }
    else
    {
        eyeDropper = new EyeDropper();
        document.getElementById("eyeDropButton").addEventListener("click", pickColour, false);
    }
    document.getElementById("saveButton").addEventListener('click', saveColour, false);
    document.getElementById("pinButton").addEventListener('click', pin, false);


    // ----- Color Presets ----- //

    setupColourPresetObjects();
    chrome.storage.local.get("key").then((result) => {
        if(result.key != undefined && result.key != null)
        {
            values[3] = result.key[0];
            savedColours = result.key.splice(1, result.key.length);
            setColourPresets();
            hexChanged();
        }
    });


    displayVisuals();
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
    saveToStorage();
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

// ----- Calculations based on change ----- //

function calculateRGB() //Based on hex
{
    for(let i = 0; i < 3; i++)
    {
        values[i] = parseInt(values[3].substring(2 * i + 1, 2 * i + 3), 16);
    }
}

function calculateHex() //Based on RPG
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();
    saveToStorage();
}

function calculateHSV() //Based on RPG
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
        values[4] = decimalLimit(values[4].toFixed(4)); //Limits to 4 desimals
    }

    values[5] = 0;
    if(max != 0)
    {
        values[5] = decimalLimit(((max - min) / max).toFixed(4)); 
    }

    values[6] = decimalLimit(max.toFixed(4),4);
}

function calculateAngleHSV(angle) //Sets RGB based on the angle.
{
    angle = (angle + Math.PI * 2) % (Math.PI * 2); //0 <= angle < 2π
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
        document.getElementById(names[i]).value = decimalLimit(values[i],4); //Set input field values.
        document.getElementById(names[i] + "Slider").value = decimalLimit(values[i],4); //Set slider values.
    }
}

function displayHex(){
    document.getElementById(names[3]).value = values[3];
}

function displayVisuals() //What ever value have been changed, this needs to be called.
{
    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    document.getElementById("colourDisplay").style.backgroundColor = values[3];
    
    displaySelector();
    displaySliderColours();
    displaySliderValues();
}

function displaySelector()
{
    // var posX = document.getElementById("pie").getBoundingClientRect().left + pieRadius - selectorRadius + Math.cos(-values[4] * Math.PI * 2) * pieRadius * values[5];
    // var posY = document.getElementById("pie").getBoundingClientRect().top + pieRadius - selectorRadius + Math.sin(-values[4] * Math.PI * 2) * pieRadius * values[5];
    // document.getElementById("selector").style.top = posY.toString() + "px";
    // document.getElementById("selector").style.left = posX.toString() + "px";


    var posX = document.getElementById("pie").getBoundingClientRect().left - selectorRadius + pieRadius + Math.cos(-values[4] * Math.PI * 2) * pieRadius * values[5];
    var posY = document.getElementById("pie").getBoundingClientRect().top - selectorRadius +  pieRadius + Math.sin(-values[4] * Math.PI * 2) * pieRadius * values[5];
    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";


}

function displaySliderColours()
{
    document.getElementById("redSlider").style.background = "linear-gradient(to right, #00" + values[3].substring(3,7) + ", #FF" + values[3].substring(3,7) + ")";
    document.getElementById("greenSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,3) + "00" + values[3].substring(5,7) + ", #" + values[3].substring(1,3) + "FF" + values[3].substring(5,7) + ")";
    document.getElementById("blueSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,5) + "00, #" + values[3].substring(1,5) + "FF)";

    var holder = calculateAngleRGB(values[4] * Math.PI * 2);
    for(let i = 0; i < 3; i++)
    {
        holder[i] = zeroPad(Math.round(holder[i]).toString(16),2);
    }
    var saturationColour = "#" + holder[0] + holder[1] + holder[2];
    document.getElementById("saturationSlider").style.background = "linear-gradient(to right, #FFFFFF," + saturationColour + ")";
    document.getElementById("lightnessSlider").style.background = "linear-gradient(to right, #000000," + saturationColour + ")";
}

function displaySliderValues()
{
    //Slider values
    for(let i = 0; i < 7; i++)
    {
        if(i == 3){ continue; } // 3 == hex, not a slider.
        document.getElementById(names[i] + "Slider").value = values[i];
    }
}

// ----- Colour pie ----- //

function colourPie(e)
{
    if(!pressing)
    {
        return;
    }
    var posX = e.clientX - document.getElementById("pie").getBoundingClientRect().left;
    var posY = e.clientY - document.getElementById("pie").getBoundingClientRect().top;
    var dist = Math.sqrt(Math.pow(posX - pieRadius,2) + Math.pow(posY - pieRadius,2));
    
    var angle = Math.atan2(posX - pieRadius, posY - pieRadius) - Math.PI / 2;
    
    if(dist > pieRadius){
        posX = pieRadius + pieRadius * Math.cos(angle);
        posY = pieRadius - pieRadius * Math.sin(angle);
        dist = pieRadius;
    }
    values[5] = dist / pieRadius;
    angle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 <= angle < 2 * PI
    calculateAngleHSV(angle);
    calculateHex();
    calculateHSV();
    displayRPG();
    displayHex();
    displayHSV();
    displayVisuals();
}

// ----- Colour picker and presets ----- //

function pickColour() {
    if(!pinned)
    {
        document.getElementById("body").style.display = "none";
    }
    setTimeout(async function() //Forces a delay, so popup has time to hide.
    {
        let pickedColour = await eyeDropper.open();
        values[3] = pickedColour.sRGBHex.toUpperCase();
        navigator.clipboard.writeText(values[3]);
        hexChanged();
        newPresetValue(values[3]);
        setColourPresets();
        document.getElementById("body").style.display = "inline-block";
    },1);
}

function setupColourPresetObjects()
{
    for(var i = 0; i < savedCoulourUpperLimit; i++)
    {
        var div = document.createElement("div");
        div.className = "colourPreset";
        div.id = i.toString();
        document.getElementById("savedColours").appendChild(div);
    }
}

function removeColourPresets()
{
    var a = document.getElementById("savedColours");
    while(a.firstChild != null)
    {
        a.removeChild(a.firstChild);
    }
}

function setColourPresets()
{
    //removeColourPresets();
    //setupColourPresetObjects();
    for(let i = 0; i < savedCoulourUpperLimit; i++)
    {
        let colourHolder = "#2B2B2B";
        if(i < savedColours.length && isHex(savedColours[i]))
        {
            colourHolder = savedColours[i];
        }

        var div = document.getElementById(i.toString());
        div.style.backgroundColor = colourHolder;
        
        //div.removeEventListener("click", selectColour);
        div.addEventListener("click", function(){
            values[3] = colourHolder;
            hexChanged();
            displayHex();
            navigator.clipboard.writeText(values[3]);
        });
    }
}

function newPresetValue(colourValue)
{
    savedColours.unshift(colourValue);
    if(savedColours.length > 20)
    {
        savedColours = savedColours.splice(0,20);
    }
    saveToStorage();
}

function saveColour()
{
    newPresetValue(values[3]);
    setColourPresets();
}

function saveToStorage() //Saves to the key word of "key" an array containing the currently selected colour and saved coulours.
{
    chrome.storage.local.set({ key : [values[3]].concat(savedColours)}, null);
}

function pin()
{
    pinned = !pinned;
    document.getElementById("pinButton").src = "images/" + (pinned ? "pin" : "unpin") + ".png";
}

// ----- Utility functions ----- //

function lerp(start,end,value)
{
    return start + (end - start) * value;
}

function clamp(min,max,value)
{
    return Math.min(Math.max(value, min), max);
}

function decimalLimit(value,limit = 4)
{
    const formattedNumber = new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: limit }).format(value);
    return parseFloat(formattedNumber);
}

function isHex(text)
{
    if(typeof(text) !== "string") //Wrong type.
    {
        return;
    }
    if(text.length != 7) //Wrong length.
    {
        return false;
    }
    if(text[0] != "#") //No pound sign.
    {
        return false;
    }
    for(let i = 1; i < text.length; i++) //Checking rest of values.
    {
        if(!['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','a','b','c','d','e','f'].includes(text[i]))
        {
            return false;
        }
    }
    return true;
}

start();