var pressing = false;

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
    var posY = e.clientY - 64 - 8;
    var dist = Math.sqrt(Math.pow(posX - 120,2) + Math.pow(posY - 120,2));
    
    var angle = Math.atan2(posX - 120,posY - 120) - Math.PI / 2;
    
    if(dist > 128){
        posX = 120 + 128 * Math.cos(angle);
        posY = 120 - 128 * Math.sin(angle);
    }
    document.getElementById("r").value = posX;
    document.getElementById("g").value = posY;
    document.getElementById("b").value = dist;
    document.getElementById("hex").value = angle;
    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";
    console.log("X:",posX,"Y:",posY);
}

function hexChange(value)
{
    console.log("HexChange called!");
    document.getElementById("r").innerHTML = value;
}

function setColorFromHue(angle) //Angle in radians
{
    var r = 0;
    var g = 0;
    var b = 0;

    if(angle <= Math.PI / 3) //Less than 60 deg.
    {
        r = 255;
    }

    if(angle <= Math.PI / 3 * 2) //Less than 120 deg.
    {
        b = 0;
    }
    if(angle <= Math.PI && angle >= Math.PI / 3) //Less than 180 deg. more than 60 deg.
    {
        g = 255;
    }
}