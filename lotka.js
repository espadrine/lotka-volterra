/* 
 * Copyright (c) 2010 Thaddée Tyl. All rights reserved.
 */

// 1. DATA
var canSize  = 400;
var rows  = 80;
var field = new Array(rows); // 1:grass, 2:man, 3:cow (men reincarnate into cow)
for( i=0; i<rows; i++ ) // defining field.
    field[i] = new Array(rows);
var iNumMan = 0.02; // (it's actually in %).
var iNumDeer = 0.2;  // initial number of deers.
var pDeleteMan = 0.02; // probability of death of man.
var pNewMan = 0.9;  // probability of birth of man.
var pNewDeer = 0.04; // probability of birth of deer.
var speed = 10; // in milliseconds.
var stopper; // clears timeouts.
var manIm = new Image();
var deerIm = new Image();
manIm.src = 'man.png';
deerIm.src = 'deer.png';
var numMan = 0;
var numDeer = 0;
var graphMan  = new Array(canSize);
var graphDeer = new Array(canSize);
for( var k=0; k<canSize; k++ ) {
    graphMan[k] = 0; graphDeer[k] = 0;
}
var gIndex  = 0;
var gUpdate = 0;
var nbBox = rows * rows;

// 2. INITIALIZATION
function chooseState() {
    var chances = Math.random();
    var state = 1;
    if( chances < iNumMan ) {
        state = 2; // we have a man!
        numMan++;
    }
    else if( chances < iNumMan+iNumDeer ) {
        state = 3; // we have a deer!
        numDeer++;
    }
    // no idea which one is preferable.
    return state;
}
function start() {
    if( stopper != undefined ) clearTimeout(stopper);
    // check for change in data.
    iNumMan    = Number( document.getElementById("iNumMan").textContent );
    iNumDeer   = Number( document.getElementById("iNumDeer").textContent );
    pDeleteMan = Number( document.getElementById("pDeleteMan").textContent );
    pNewMan    = Number( document.getElementById("pNewMan").textContent );
    pNewDeer   = Number( document.getElementById("pNewDeer").textContent );
    speed      = Number( document.getElementById("speed").textContent );
    // get the canvas environment.
    var can = document.getElementById( "can" );
    can.width = canSize;can.height = canSize;
    var cx = can.getContext( '2d' );
    cx.fillStyle = '#787';
    cx.fillRect( 0, 0, can.width, can.height );
    // time to initialize our field.
    var i=0;
    numMan = 0;
    numDeer = 0;
    for( i=0; i<rows; i++ ) // filling up the field.
        for( var j=0; j<rows; j++ )
            // we need to randomly have men, deers, and emptiness.
            field[i][j] = chooseState();
    // Three, two, one... GO!
    launch( cx );
}

//3. LAUNCH
function launch( cx ) {
    // update graphics.
    paint( cx );
    // calculate trajectories.
    for( var i=0; i<rows; i++ ) {
        for( var j=0; j<rows; j++ ) {
            var point = field[i][j];
            if( point == 1 ) continue; // nobody out there!
            if( Math.random() > 0.5 ) continue; // randomly stay
            // we need to pick a neighbouring place.
            var neigX = Math.ceil(Math.random()*3) - 2;
            var neigY;
            if( neigX != 0 )
                neigY = Math.ceil(Math.random()*3) - 2;
            else
                neigY = (Math.random() > 0.5? 1: -1);
            // what is it there?
            var otherX = i+neigX, otherY = j+neigY;
            if( otherX < 0 ) otherX = rows-1;
            else if( otherX >= rows ) otherX = 0;
            if( otherY < 0 ) otherY = rows-1;
            else if( otherY >= rows ) otherY = 0;
            var other = field[otherX][otherY];
            var delta1 = point + other; // keep the count of inhabitants.
            // let's play a lethal game now...
            if( point == 2 ) { // i am a man.
                if( other == 3 ) { // he is a deer.
                    if( Math.random() > pNewMan )
                        field[otherX][otherY] = 1; //well, a dead deer at least.
                    else
                        field[otherX][otherY] = 2; // he made me have a baby!
                }
                else if( Math.random() < pDeleteMan )
                    field[i][j] = 1; // if I don't eat, I die *snif*!
                else if( other == 1 ) { // some place to move to!
                    field[i][j] = 1;field[otherX][otherY] = 2;
                }
            }
            else if( point == 3 ) { // i am a dear deer.
                if( other == 2 ) // Oops! He is my predator!
                    field[i][j] = 1; // now I can see its stomach.
                else if( other == 1 ) { // some nice-looking grazing there!
                    if( Math.random() < pNewDeer )
                        field[otherX][otherY] = 3; // got pregnant...
                    else
                        field[i][j] = 1;field[otherX][otherY] = 3; // going!
                }
            }
            // keep the count of inhabitants.
            delta = (field[i][j] + field[otherX][otherY]) - delta1;
            if( delta == -1 ) {
                if( delta1 < 5 ) numMan--; // famine.
                else {numMan++;numDeer--;} // newborn man.
            }
            else if( delta == -2 ) numDeer--; // hunter eats its game.
            else if( delta == 2 ) numDeer++;
        }
    }
    if( ++gUpdate%7 == 0 ) {
        graphMan[gIndex] = numMan;
        graphDeer[gIndex++] = numDeer;
        gIndex %= canSize; // a ring of data.
        gUpdate = 0;
    }
    stopper = setTimeout( launch, speed, cx );
}

// 4. PAINT
function paint( cx ) {
    cx.canvas.width = canSize; // clear.
    var i;
    // graph of population growth (by the way, did you know human population
    cx.strokeStyle = 'rgba(170,51,34,0.15)';
    cx.beginPath();
    cx.moveTo( 0, canSize-graphMan[gIndex]*canSize/nbBox );
    for( i=1; i<canSize; i++ ) {
        cx.lineTo( i, canSize-
            graphMan[(gIndex+i)%canSize]*canSize/nbBox );
    }
    cx.stroke();
    // growth is decreasing nowadays? jseed.sourceforge.net/lotka/growth.png).
    cx.strokeStyle = 'rgba(221,221,119,0.2)';
    cx.beginPath();
    cx.moveTo( 0, canSize-graphDeer[gIndex]*canSize/nbBox );
    for( i=1; i<canSize; i++ ) {
        cx.lineTo( i, canSize-
            graphDeer[(gIndex+i)%canSize]*canSize/nbBox );
    }
    cx.stroke();
    // dropping a bucket of paint on the wall.
    var box = canSize / rows;
    for( i=0; i<rows; i++ ) {
        for( var j=0; j<rows; j++ ) {
            var point = field[i][j];
            if( point != 1 )
            cx.drawImage( point==2?manIm:deerIm, box*i, box*j, box, box);
        }
    }
    cx.save();
}
