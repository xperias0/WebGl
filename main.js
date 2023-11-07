

var canvas;
var gl;

var program ;

var near = -100;
var far = 200;
var deltaTime = 0;

var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;
var timeLastFrame;

var seaWeedFrequency ;
var seaweedLeft   = {};
var seaweedMiddle = {};
var seaweedRight  = {};
var bubbles       = {};
var robot         = {};
var fish          = {};
var bubbleStart = vec3(-0.3,1.5,0);

var bubbleTime = 0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(10.0, 50.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MVS = [] ; 
var TIME = 0.0 ; 
var timeSec = 0.0;
function setColor(r,g,b)
{
    var c = vec4(r,g,b,1.0) ;
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {
   
    canvas       = document.getElementById( "gl-canvas" );
    canvasGround = document.getElementById("canvasGround");

    startTime = new Date().getTime() / 1000.0;
    gl  = WebGLUtils.setupWebGL( canvas );
    glg = WebGLUtils.setupWebGL( canvasGround );

    if ( !gl ) { alert( "WebGL isn't available" ); }

    
     gl.viewport( 0, 0, canvas.width, canvas.height );
     gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

   
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse) ;

    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;
    seaWeedFrequency = 0.6;
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
   
    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelViewMatrix = mult(modelViewMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelViewMatrix = mult(modelViewMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelViewMatrix = mult(modelViewMatrix,scale(sx,sy,sz)) ;
}

// Pops MVS and stores the result as the current modelViewMatrix
function gPop() {
    modelViewMatrix = MVS.pop() ;
}

// pushes the current modelViewMatrix in the stack MVS
function gPush() {
    MVS.push(modelViewMatrix) ;
}




function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    glg.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(0,0,50);
   
    MVS = [] ; // Initialize modelviewmatrix stack
    
    modelViewMatrix = mat4() ;
    
    eye[1] = eye[1] + 0 ;
    modelViewMatrix = mult(modelViewMatrix,lookAt(eye, at , up));
    
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    
    setAllMatrices() ;
    
    var timer = new Date() ;
    deltaTime = ((timer.getTime() /1000.0) - timeLastFrame).toFixed(3);
    TIME = timer.getTime() /1000.0 ;
     timeSec = TIME / 1000000000000.0;
    
    
    gTranslate(-0.5,2,0);
   // console.log("bnubtio" + TIME);
    //Rocks
    gPush();{
        gTranslate(0,-5.2,0);
        gScale(0.7,0.7,0.7);
        setColor(vec4(0.26,0.24,0.24,1.0));
        drawSphere();
       
    }
    gPop();

    gPush();{
        gTranslate(-1.2,-5.5,0);
        gScale(0.4,0.4,0.4);
        setColor(vec4(0.26,0.24,0.24,1.0));
        drawSphere();
    }
    gPop();


    gPush();{
        gScale(10,1.2,0.6);
        gTranslate(0,-5.9,0);
        setColor(vec4(0.26,0.24,0.24,1.0));
        drawCube();
    }
    gPop();

    //
    //Seaweeds

    gPush();{
    
    seaweedLeft.update(TIME);
    seaweedLeft.draw();
    
    seaweedMiddle.update(TIME);
    seaweedMiddle.draw();
    
    seaweedRight.update(TIME);
    seaweedRight.draw();
    }
    gPop();
    //
    var UpNDown = 0.4*Math.sin(TIME*0.4);

    gTranslate(3.9+UpNDown,UpNDown,0);

    gRotate(-30,0,1,0);

    var angleLeft       = 12*Math.sin(2+TIME) + 40;
    var angleRight      = 9 *Math.cos(2+TIME) + 40;
    var angleLowerLeft  = 2 *Math.sin(2+TIME);
    var angleLowerRight = 2 *Math.cos(2+TIME);
    
    //Robot
    robot.draw(angleLeft, angleLowerLeft, angleRight, angleLowerRight);
    //

    //Bubbles
    bubbles.update(timeSec,bubbleStart,0.2);
    bubbles.draw(timeSec);

    var rotRadius  = 1.9;
    var angleFish  = 40;
    var angleRidus = angleFish * (Math.PI / 180);
    var rotXPos = rotRadius * Math.cos(TIME*angleRidus);
    var rotZPos = rotRadius * Math.sin(TIME*angleRidus);

    //Fish
    gTranslate(-3.4+rotXPos,-3.5,1.3+rotZPos);
    gRotate(TIME*(-angleFish),0,1,0);
    fish.draw();
    //
   
    
    window.requestAnimFrame(render);
    timeLastFrame = TIME;
}




//draw fish
fish.draw = function(){
    gPush();{
        gRotate(180,0,1,0);
        
        gScale(0.3,0.3,1.5);
        setColor(1,0,0,1);
        drawCone();
    }
    gPop();
    
    gPush();{ 
        gTranslate(0,0,0.95);
        gScale(0.3,0.3,0.4);
        setColor(0.4,0.4,0.4,1);
        drawCone();
    }
    gPop();
    //Left eye
    gPush();{ 
        gTranslate(-0.1,0.12,0.93);
        gScale(0.07,0.07,0.07);
        setColor(1,1,1,1);
        drawSphere();
    }
    gPop();

    gPush();{ 
        gTranslate(-0.1,0.12,0.99);
        gScale(0.03,0.03,0.03);
        setColor(0,0,0,1);
        drawSphere();
    }
    gPop();
    //Right eye
    gPush();{ 
        gTranslate(0.1,0.12,0.93);
        gScale(0.07,0.07,0.07);
        setColor(1,1,1,1);
        drawSphere();
    }
    gPop();

    gPush();{ 
        gTranslate(0.1,0.12,0.99);
        gScale(0.03,0.03,0.03);
        setColor(0,0,0,1);
        drawSphere();
    }
    gPop();

    var tailRot = 10 * Math.sin(10+TIME*10);
    gRotate(tailRot,0,1,0);
    gPush();{
        gTranslate(0,-0.2,-0.7);
        gRotate(100,1,0,0);
        gScale(0.1,0.1,0.4);
        setColor(1,0,0,1);
        drawCone();
    }
    gPop();

    gPush();{
        gTranslate(0,0.35,-0.7);
        gRotate(-100,1,0,0);
        gScale(0.1,0.1,0.7);
        setColor(1,0,0,1);
        drawCone();
    }
    gPop();

}

//draw robot
robot.draw = function(angleLeft, angleLowerLeft, angleRight, angleLowerRight)   
{

    //Robot
        //head
        gPush();{
            gTranslate(0,1.4,0);
            gScale(0.35,0.35,0.35);
            setColor(0.6,0,0.6,1);
            drawSphere();
        }
        gPop();
    
        //body
        gPush();{
           // gTranslate(4,-1.5,0);
            gScale(0.6,1,0.3);
            setColor(0.6,0,0.6,1);
            drawCube();
        }
        gPop();
    

        gPush();{
            gRotate(angleLeft,1,0,0);
        //left Legs
        gPush();{
           // gRotate(angleLeft,1,0,0);
             gTranslate(-0.25,-1.5,0);
             gScale(0.15,0.6,0.1);
             setColor(0.6,0,0.6,1);
             drawCube();
         }
         gPop();
    
         gPush();{
            //gRotate(angleLeft+angleLowerLeft,1,0,0);
            //gRotate(angleLowerLeft,1,0,0);
            gTranslate(-0.25,-2.55,-0.06);
            gRotate(20,1,0,0);
            gScale(0.15,0.6,0.1);
            setColor(0.6,0,0.6,1);
    
            gTranslate(0,-0.2,-1);
            drawCube();
        }
        gPop();
    
        gPush();{
            //gRotate(angleLeft+angleLowerLeft,1,0,0);
            //gRotate(angleLowerLeft,1,0,0);
            gTranslate(-0.25,-3.3,0.22);
            gRotate(20,1,0,0);
            gScale(0.2,0.1,0.4);
            setColor(0.6,0,0.6,1);
    
            gTranslate(0,-0.2,-1);
            drawCube();
        }
        gPop();
        }
        gPop();
        //
        //right Legs

        gPush();{
            gRotate(angleRight,1,0,0);
        gPush();{
           // gRotate(angleRight,1,0,0);
            gTranslate(0.25,-1.5,0.1);
            gScale(0.15,0.6,0.1);
            setColor(0.6,0,0.6,1);
            drawCube();
        }
        gPop();
    
        gPush();{
           //gRotate(angleRight+angleLowerRight,1,0,0);
           gTranslate(0.25,-2.55,0);
           gRotate(20,1,0,0);
           gScale(0.15,0.6,0.1);
           setColor(0.6,0,0.6,1);
    
           gTranslate(0,-0.2,-1);
           drawCube();
       }
       gPop();
    
       gPush();{
        //gRotate(angleRight+angleLowerRight,1,0,0);
        gTranslate(0.25,-3.3,0.22);
        gRotate(20,1,0,0);
        gScale(0.2,0.1,0.4);
        setColor(0.6,0,0.6,1);
    
        gTranslate(0,-0.2,-1);
        drawCube();
    }
    gPop();
    }
    gPop();
}

//Bubbles
bubbles.create = function(numSpheres, radius, position ) {
	bubbles.sphereList = [];
    bubbles.position = vec3(position[0]+offsetRandom,position[1],position[2]) ;
    bubbles.radius   = radius; 

	for( let i = 0 ; i < numSpheres ; i++) {
        var offsetRandom = 0.3*Math.sin(2+Math.random()* 2);
       // console.log(offsetRandom);
		let b = new Object();
		b.pos = vec3(position[0]+offsetRandom,position[1]+i*0.4,position[2]) ;
		b.radius = radius;
        
		bubbles.sphereList.push(b) ;
	}
	bubbles.numSpheres = numSpheres;
    
  
}
bubbles.create(4,0.1,bubbleStart);


bubbles.draw = function(t){
    if(this.numSpheres !=0){
    for( let i = 0 ; i < this.numSpheres; i++) {
		gPush() ;
            gTranslate(this.sphereList[i].pos[0],  this.sphereList[i].pos[1],this.sphereList[i].pos[2]);
			gScale(this.sphereList[i].radius,this.sphereList[i].radius,this.sphereList[i].radius);
            setColor(vec4(1,1,1,1));
			drawSphere() ;
		gPop() ;
	}
    }
}




bubbles.update = function(t,position,maxRadius) {
    
    if(this.numSpheres !=0){
       
        for( let i = 0 ; i < this.numSpheres; i++) {
           
            bubbles.sphereList[i].pos[1] += t;
             
            if(bubbles.sphereList[i].pos[1] >= 5 ){
                var offsetRandom = 0.3*Math.sin(2+Math.random()* 2);
                bubbles.sphereList[i].pos = vec3(position[0]+offsetRandom,position[1],position[2]);
                
            }	
        }
    }

	
}


seaweedLeft.create = function(numSpheres,radius) {
	seaweedLeft.sphereList = [];
	for( let i = 0 ; i < numSpheres ; i++) {
		let b = new Object();
		b.pos = vec3(-7.5,-25+i*radius*3.6,0) ;
		b.radius = radius;
		seaweedLeft.sphereList.push(b) ;
	}
	seaweedLeft.numSpheres = numSpheres;
	
}

seaweedLeft.create(10,0.1);
seaweedLeft.draw = function() {
    
	for( let i = 0 ; i < this.numSpheres; i++) {
        var seaweedMove = 0.1*Math.cos(i*0.02+TIME);
        var pos  = i* 0.3*Math.sin(i*seaWeedFrequency+TIME);
		gPush() ;
            
            gScale(this.sphereList[i].radius,this.sphereList[i].radius*2,this.sphereList[i].radius);  
            gTranslate(this.sphereList[i].pos[0]+pos, this.sphereList[i].pos[1]+i*1.6,this.sphereList[i].pos[2]);
            gRotate(i*seaweedMove*2,0,0,1);
            setColor(vec4(0,0.6,0.3,1));
			drawSphere() ;
		gPop() ;
	}
}
seaweedLeft.update = function(t) {
	for( let i = 0 ; i < this.numSpheres; i++) {
		//this.sphereList[i].pos[0] = i*0.08*Math.sin(seaWeedFrequency+t)-0.6;
       // this.sphereList[i].pos[0] =i* 0.3*Math.sin(i*seaWeedFrequency+t)-7;
	}
}

seaweedMiddle.create = function(numSpheres,radius) {
	seaweedMiddle.sphereList = [];
	for( let i = 0 ; i < numSpheres ; i++) {
		let b = new Object();
		b.pos = vec3(0,-21.6+i*radius*3.6,0) ;
		b.radius = radius;
		seaweedMiddle.sphereList.push(b) ;
	}
	seaweedMiddle.numSpheres = numSpheres;
	
}

seaweedMiddle.create(10,0.1);
seaweedMiddle.draw = function() {
    
	for( let i = 0 ; i < this.numSpheres; i++) {
        var seaweedMove = 0.1*Math.sin(i*0.03+TIME);
        var pos  =i* 0.3*Math.sin(i*seaWeedFrequency+TIME);
		gPush() ;
            gRotate(i*seaweedMove*5,0,0,1);
            gScale(this.sphereList[i].radius,this.sphereList[i].radius*2,this.sphereList[i].radius);  
            
			gTranslate(this.sphereList[i].pos[0]+pos, this.sphereList[i].pos[1]+i*1.6,this.sphereList[i].pos[2]);	
            setColor(vec4(0,0.6,0.3,1));
			drawSphere() ;
		gPop() ;
	}
}
seaweedMiddle.update = function(t) {
	for( let i = 0 ; i < this.numSpheres; i++) {
		
			
	}
}


seaweedRight.create = function(numSpheres,radius) {
	seaweedRight.sphereList = [];
	for( let i = 0 ; i < numSpheres ; i++) {
		let b = new Object();
		b.pos = vec3(7.5,-25+i*radius*3.6,0) ;
		b.radius = radius;
		seaweedRight.sphereList.push(b) ;
	}
	seaweedRight.numSpheres = numSpheres;
	
}

seaweedRight.create(10,0.1);
seaweedRight.draw = function() {
   
	for( let i = 0 ; i < this.numSpheres; i++) {
        
        var seaweedMove = 0.1*Math.sin(i*0.03+TIME);
        var pos  =i* 0.3*Math.sin(i*seaWeedFrequency+TIME);
		gPush() ;
            gRotate(i*seaweedMove,0,0,1);
            gScale(this.sphereList[i].radius,this.sphereList[i].radius*2,this.sphereList[i].radius);  
			gTranslate(this.sphereList[i].pos[0]+pos, this.sphereList[i].pos[1]+i*1.6,this.sphereList[i].pos[2]);	
            setColor(vec4(0,0.6,0.3,1));
			drawSphere() ;
		gPop() ;
	}
}

seaweedRight.update = function(t) {
	for( let i = 0 ; i < this.numSpheres; i++) {
		//this.sphereList[i].pos[0] = i*0.04 * Math.sin(seaWeedFrequency+t) + 0.6;
		// if( (t - i) > 0) {
		// 	this.sphereList[i].pos[0] = 2*Math.sin(2*(t-i));
		// }
			
	}
}