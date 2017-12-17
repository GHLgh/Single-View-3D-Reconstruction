/**
 * @fileoverview Utilities for setting up cube map for environment mapping and neccessary objects on HTML, adopted from CS 418 Discussion 5 Demo example
 * @author gluo2@illinois.com (Guanheng Luo)
 */

/*
 * TODO: change functions
 * DONE: 
 */

var gl;
var canvas;
var canvasRect;

var shaderProgram;
var imgShaderProgram;
var modelShaderProgram;

var selectedControlPointIdx = -1;
var DIST_THRESHOLD = 0.05;

var rearWallVertexPositionBuffer;
var vanishingLinesPositionBuffer;

var imgChecked = 0;
// -1 is a flag
var imgLoaded = -1;
var preprocessImgLoaded = 0;

var imgTexture;
var imgEnum = -1;
var filledTexture;
var filledEnum = -1;
var frontMaskTexture;
var frontEnum = -1;

var preDefinedImg = ["../sources/perspective_room.bmp", "../sources/buddhist_temple_at_varanasi.bmp", "../sources/anotherRoom.jpg", "../outputs/original.jpg"];

var preprocessImg = ["../outputs/mask.jpg", "../outputs/filled.jpg"];

var f = 1.0;
var d = 0;
var rearX = 0;
var rearY = 0;
var rearDownShift3D = 0;
var rearUpShift3D = 0;
var rearLeftShift3D = 0;
var rearRightShift3D = 0;
var perspectiveCreated = false;
var toSelectFrontObject = false;

var rearDownShift2D = 0;
var rearUpShift2D = 0;
var rearLeftShift2D = 0;
var rearRightShift2D = 0;

var cameraTransitionX = 0.0;
var cameraTransitionY = 0.0;
var cameraTransitionZ = 0.0;

// View parameters
var eyePt = vec3.fromValues(0.0, 0.0, 0.0);
var viewDir = vec3.fromValues(0.0, 0.0, -1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();
var p2TexMatrix = mat4.create();


var mvMatrixStack = [];

var squareVertices = [
    -0.5, -0.5, 0.0,
    -0.5,  0.5, 0.0,
     0.5,  0.5, 0.0,
     0.5, -0.5, 0.0,
     0.0,  0.0, 0.0
];

// contains 8 pts here
var vanishingLineVertices = [
     0.0,  0.0, 0.0,
    -0.5, -0.5, 0.0,
     0.0,  0.0, 0.0,
    -0.5,  0.5, 0.0,
     0.0,  0.0, 0.0,
     0.5,  0.5, 0.0,
     0.0,  0.0, 0.0,
     0.5, -0.5, 0.0,
     0.0,  0.0, 0.0,
    -0.5, -0.5, 0.0,
     0.0,  0.0, 0.0,
    -0.5,  0.5, 0.0,
     0.0,  0.0, 0.0,
     0.5,  0.5, 0.0,
     0.0,  0.0, 0.0,
     0.5, -0.5, 0.0,
];

var selectedAreas = [];
var projectAreas = [];
var startX = 0;
var startY = 0;
var endX = 0;
var endY = 0;

var frontObjectBuffer;
var frontProjBuffer;

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
        return null;
    }
 
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
 
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}

//----------------------------------------------------------------------------------
/**
 * Compile Shaders
 */
// TODO: fix this
function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
  
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    //gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    //shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    //gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    
    shaderProgram.skyboxUniform = gl.getUniformLocation(shaderProgram, "isSkybox");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    //Matrix to translate light position to world (skybox) coordinate
    shaderProgram.lwMatrixUniform = gl.getUniformLocation(shaderProgram, "uLWMatrix");
    shaderProgram.ecMatrixUniform = gl.getUniformLocation(shaderProgram, "uEnvCorrectionMatrix");
    
    
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    
    
}

function setupModelShaders() {
    vertexShader = loadShaderFromDOM("3d-shader-vs");
    fragmentShader = loadShaderFromDOM("3d-shader-fs");
  
    modelShaderProgram = gl.createProgram();
    gl.attachShader(modelShaderProgram, vertexShader);
    gl.attachShader(modelShaderProgram, fragmentShader);
    gl.linkProgram(modelShaderProgram);

    if (!gl.getProgramParameter(modelShaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(modelShaderProgram);

    modelShaderProgram.vertexPositionAttribute = gl.getAttribLocation(modelShaderProgram, "aVertexPosition");
    //gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexRealPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexProjPosition");
    //gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    
    modelShaderProgram.skyboxUniform = gl.getUniformLocation(modelShaderProgram, "isSkybox");
    modelShaderProgram.mvMatrixUniform = gl.getUniformLocation(modelShaderProgram, "uMVMatrix");
    modelShaderProgram.pMatrixUniform = gl.getUniformLocation(modelShaderProgram, "uPMatrix");
    modelShaderProgram.nMatrixUniform = gl.getUniformLocation(modelShaderProgram, "uNMatrix");

    //Matrix to translate light position to world (skybox) coordinate
    modelShaderProgram.lwMatrixUniform = gl.getUniformLocation(modelShaderProgram, "uLWMatrix");
    modelShaderProgram.ecMatrixUniform = gl.getUniformLocation(modelShaderProgram, "uEnvCorrectionMatrix");
    
    
    modelShaderProgram.uniformLightPositionLoc = gl.getUniformLocation(modelShaderProgram, "uLightPosition");    
    modelShaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(modelShaderProgram, "uAmbientLightColor");  
    modelShaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(modelShaderProgram, "uDiffuseLightColor");
    modelShaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(modelShaderProgram, "uSpecularLightColor");
    
    modelShaderProgram.textureSample = gl.getUniformLocation(modelShaderProgram, "uTexture");
    modelShaderProgram.filteredSample = gl.getUniformLocation(modelShaderProgram, "uFilteredTexture");
    modelShaderProgram.maskSample = gl.getUniformLocation(modelShaderProgram, "uMask");
    modelShaderProgram.useMask = gl.getUniformLocation(modelShaderProgram, "isMask");
}

function setupImgShaders() {
    imgVertexShader = loadShaderFromDOM("showImg-vs");
    imgFragmentShader = loadShaderFromDOM("showImg-fs");
  
    imgShaderProgram = gl.createProgram();
    gl.attachShader(imgShaderProgram, imgVertexShader);
    gl.attachShader(imgShaderProgram, imgFragmentShader);
    gl.linkProgram(imgShaderProgram);

    if (!gl.getProgramParameter(imgShaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(imgShaderProgram);

    imgShaderProgram.vertexPositionAttribute = gl.getAttribLocation(imgShaderProgram, "aPosition");
    //gl.enableVertexAttribArray(imgShaderProgram.vertexPositionAttribute);

    imgShaderProgram.textureCoordinateAttribute = gl.getAttribLocation(imgShaderProgram, "aTexCoord");
    //gl.enableVertexAttribArray(imgShaderProgram.textureCoordinateAttribute);

    imgShaderProgram.matrixUniform = gl.getUniformLocation(imgShaderProgram, "uMatrix");
    imgShaderProgram.textureSample = gl.getUniformLocation(imgShaderProgram, "uTexture");
    imgShaderProgram.maskSample = gl.getUniformLocation(imgShaderProgram, "uMask");
    imgShaderProgram.useMask = gl.getUniformLocation(imgShaderProgram, "isMask");
    
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 * @param {int} flag indicator of if it is drawing the skybox (flag == 1)
 */
function setMatrixUniforms(flag) {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadCorrectionMatrixToShader();
    gl.uniform1i(shaderProgram.skyboxUniform, flag);
}


function setupBuffers(){
    setupRearWallBuffers();
    //setupCubeBuffers();
}

function setupRearWallBuffers(){
    rearWallVertexPositionBuffer = gl.createBuffer();
    
    vanishingLinesPositionBuffer = gl.createBuffer();
    
    updateVanishingLines();
    
    
}

// TODO: check behavior if vanishing point is out of box
function updateVanishingLines(){
    var slopes = [Infinity, Infinity, Infinity, Infinity];
    var xEdges = [-1, -1, 1, 1];
    var yEdges = [-1, 1, 1, -1];
    for(i = 0; i < 4; i++){
        var diffX = squareVertices[3*i] - squareVertices[12];
        var diffY = squareVertices[3*i+1] - squareVertices[13];
        if(diffX != 0){
            slopes[i] = diffY / diffX;
        }
    }
    // update BL
    for(i = 0; i < 4; i++){
        if(slopes[i] != Infinity){
//        var xSign = 1;
//        var ySign = 1;
//        if(squareVertices[12] < squareVertices[0])
//            xSign = -1;
//        if(squareVertices[13] < squareVertices[1])
//            ySing = -1;
        
            // 3
            vanishingLineVertices[12*i+3] =(yEdges[i]-squareVertices[13])/slopes[i]+squareVertices[12];
            vanishingLineVertices[12*i+4] = yEdges[i];
        
            // 5
            vanishingLineVertices[12*i+9] = xEdges[i];
            vanishingLineVertices[12*i+10] = (xEdges[i]-squareVertices[12])*slopes[i]+squareVertices[13];
        }
    }
    
    rearDownShift2D = Math.abs(squareVertices[1] - squareVertices[13]);
    rearUpShift2D = Math.abs(squareVertices[7] - squareVertices[13]);
    rearLeftShift2D = Math.abs(squareVertices[0] - squareVertices[12]);
    rearRightShift2D = Math.abs(squareVertices[6] - squareVertices[12]);
    
    //console.log(vanishingLineVertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, rearWallVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vanishingLinesPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vanishingLineVertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


//----------------------------------------------------------------------------------
/**
 * Program entry
 */
function startup() {
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    gl.blendFunc(gl.ONE,  gl.ONE_MINUS_SRC_ALPHA);
    setupShaders();
    setupBuffers();
    setupImgShaders();
    setupModelShaders();
    loadImageAsBackground();
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    tick();
}

function reset(){
    selectedControlPointIdx = -1;
    preprocessImgLoaded = 0
    
    imgEnum = -1;
    filledEnum = -1;
    frontEnum = -1;
    
    f = 1.0;
    d = 0;
    rearX = 0;
    rearY = 0;
    rearDownShift3D = 0;
    rearUpShift3D = 0;
    rearLeftShift3D = 0;
    rearRightShift3D = 0;
    perspectiveCreated = false;
    toSelectFrontObject = false;

    rearDownShift2D = 0;
    rearUpShift2D = 0;
    rearLeftShift2D = 0;
    rearRightShift2D = 0;

    selectedAreas = [];
    projectAreas = [];
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    
    // View parameters
    eyePt = vec3.fromValues(0.0, 0.0, 0.0);
    viewDir = vec3.fromValues(0.0, 0.0, -1.0);
    up = vec3.fromValues(0.0,1.0,0.0);
    viewPt = vec3.fromValues(0.0,0.0,0.0);

    // Create ModelView matrix
    mvMatrix = mat4.create();

    //Create Projection matrix
    pMatrix = mat4.create();
    p2TexMatrix = mat4.create();

    squareVertices = [
        -0.5, -0.5, 0.0,
        -0.5,  0.5, 0.0,
        0.5,  0.5, 0.0,
        0.5, -0.5, 0.0,
        0.0,  0.0, 0.0
    ];

    // contains 8 pts here
    vanishingLineVertices = [
        0.0,  0.0, 0.0,
        -0.5, -0.5, 0.0,
        0.0,  0.0, 0.0,
        -0.5,  0.5, 0.0,
        0.0,  0.0, 0.0,
        0.5,  0.5, 0.0,
        0.0,  0.0, 0.0,
        0.5, -0.5, 0.0,
        0.0,  0.0, 0.0,
        -0.5, -0.5, 0.0,
        0.0,  0.0, 0.0,
        -0.5,  0.5, 0.0,
        0.0,  0.0, 0.0,
        0.5,  0.5, 0.0,
        0.0,  0.0, 0.0,
        0.5, -0.5, 0.0,
    ];
}

//----------------------------------------------------------------------------------
/**
 * Function which will be called on every frame to handle user input and to draw the scene
 */
function tick() {
    requestAnimFrame(tick);
    
    if(imgLoaded != -1){
        animate();
        draw();
        checkParameter();
    }
}

function checkParameter(){
    
    if ((document.getElementById("img0").checked) && imgLoaded != 0){
        reset();
        imgChecked = 0;
        loadImageAsBackground();
    }
    
    if ((document.getElementById("img1").checked) && imgLoaded != 1){
        reset();
        imgChecked = 1;
        loadImageAsBackground();
    }

    if ((document.getElementById("img2").checked) && imgLoaded != 2){
        reset();
        imgChecked = 2;
        loadImageAsBackground();
    }
    
    if ((document.getElementById("img3").checked) && imgLoaded != 3){
        reset();
        imgChecked = 3;
        loadImageAsBackground();
        
        loadPreprocessImg(gl, filledTexture, preprocessImg[1]);
        loadPreprocessImg(gl, frontMaskTexture, preprocessImg[0]);
    }
}

//----------------------------------------------------------------------------------
/**
 * Draw function
 */
function draw() { 
    var transformVec = vec3.create();

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    //mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
    
    if(perspectiveCreated){
        draw3DModel();
    }
    else{
        if((imgChecked == 3 && toSelectFrontObject == false) || imgChecked != 3 ){
            drawRearWall();
            drawImg(0);
        }
        else if(toSelectFrontObject == true){
            drawSelectArea();
            drawImg(2);
        }
    }
    //drawImg();
}

function drawSelectArea(){
    //console.log("dummy");
    gl.useProgram(shaderProgram);
    
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    var positions = [
            startX, startY, 0,
            startX, endY, 0,
            endX, endY, 0,
            endX, startY, 0
        ];
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Draw the rear wall
    gl.drawArrays(gl.LINE_LOOP, 0, 4);
    
    gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, frontProjBuffer);
    for(i = 0; i < projectAreas.length/3; i += 3){
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        // Point an attribute to the currently bound VBO
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_LOOP, i, 3);
        gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    }
    
    
}

function draw3DModel(){
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    
    gl.useProgram(modelShaderProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, filledTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, frontMaskTexture);
    
    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //console.log(imgChecked);
    if(imgChecked == 3){
        gl.uniform1i(modelShaderProgram.filteredSample, 1);
        gl.uniform1i(modelShaderProgram.maskSample, 2);
    }
    else{
        gl.uniform1i(modelShaderProgram.filteredSample, 0);
        gl.uniform1i(modelShaderProgram.maskSample, 0);
    }
    gl.uniform1i(modelShaderProgram.textureSample, 0);
    
    
    // Put a unit quad in the buffer
    
    
    var side = -1;
    var positions = [
            // rear plane
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            // left plane
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            // right plane
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (0)* side,
            // ceiling
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (0)* side,
            // floor
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
        ];
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
 
    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(modelShaderProgram.vertexPositionAttribute);
    gl.vertexAttribPointer(modelShaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the matrix.
    // TODO: chnage it to real perspective projection matrix
    //console.log(p2TexMatrix);
    
    gl.uniformMatrix4fv(modelShaderProgram.mvMatrixUniform, false, mvMatrix);
    
    gl.uniformMatrix4fv(modelShaderProgram.pMatrixUniform, false, p2TexMatrix);
    
    gl.enableVertexAttribArray(modelShaderProgram.vertexPositionAttribute);
    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, positions.length/3);
    
    
    
    // draw frontground if needed
    // TODO
    if(imgChecked == 3){
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        
        gl.uniform1i(modelShaderProgram.useMask, 1);
        gl.uniform1i(modelShaderProgram.skyboxUniform, 1);
        // Setup the attributes to pull data from our buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, frontObjectBuffer);
        gl.enableVertexAttribArray(modelShaderProgram.vertexPositionAttribute);
        gl.vertexAttribPointer(modelShaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, frontProjBuffer);
        gl.enableVertexAttribArray(modelShaderProgram.vertexRealPositionAttribute);
        gl.vertexAttribPointer(modelShaderProgram.vertexRealPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, selectedAreas.length/3);
        
        gl.disableVertexAttribArray(modelShaderProgram.vertexRealPositionAttribute);
    }
//    gl.disable(gl.DEPTH_TEST);
//    gl.depthMask(false);
//    gl.disable(gl.BLEND);
    
    gl.uniform1i(modelShaderProgram.useMask, 0);
    gl.uniform1i(modelShaderProgram.skyboxUniform, 0);
    
    gl.disableVertexAttribArray(modelShaderProgram.vertexPositionAttribute);
}

function drawImg(offset){
    gl.useProgram(imgShaderProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, frontMaskTexture);
    
    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Put a unit quad in the buffer
    var positions = [
        -1, -1,
        -1, 1,
        1, -1,
        1, -1,
        -1, 1,
        1, 1,
    ];
    
    if(perspectiveCreated){
        
        var side = -1;
//        var width = rearLeftShift3D + rearRightShift3D;
//        var height = rearDownShift3D + rearUpShift3D;
//        var rearX = 0;
//        var rearY = 0;
//        var rearLeftShift3D = width/2;
//        var rearRightShift3D = width/2;
//        var rearDownShift3D = height/2;
//        var rearUpShift3D = height/2;
        positions = [
            // rear plane
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            // left plane
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            // right plane
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (0)* side,
            // ceiling
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (d)* side,
            rearX - rearLeftShift3D, rearY + rearUpShift3D, (0)* side,
            rearX + rearRightShift3D, rearY + rearUpShift3D, (0)* side,
            // floor
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (0)* side,
            rearX - rearLeftShift3D, rearY - rearDownShift3D, (d)* side,
            rearX + rearRightShift3D, rearY - rearDownShift3D, (d)* side,
        ];
    }
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coords
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Put texcoords in the buffer
    var rearSX = (squareVertices[0]+1)/2;
    var rearSY = (squareVertices[1]+1)/2;
    var rearBX = (squareVertices[6]+1)/2;
    var rearBY = (squareVertices[7]+1)/2;
    var leftCX = (vanishingLineVertices[3]+1)/2;
    var leftLY = (vanishingLineVertices[4]+1)/2;
    var leftHY = (vanishingLineVertices[16]+1)/2;
    //console.log(rearSX);
    var texcoords = [
        rearSX, rearSY,
        rearSX, rearBY,
        rearBX, rearSY,
        rearBX, rearSY,
        rearSX, rearBY,
        rearBX, rearBY,
        leftCX, leftLY,
        leftCX, leftHY,
        rearSX, leftLY,
        rearSX, leftLY,
        leftCX, leftHY,
        rearSX, leftHY,
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]
    
    if(perspectiveCreated == false){
        texcoords = [0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1];
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
 
    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(imgShaderProgram.vertexPositionAttribute);
    if(perspectiveCreated){
        gl.vertexAttribPointer(imgShaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    }
    else{
        gl.vertexAttribPointer(imgShaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(imgShaderProgram.textureCoordinateAttribute);
    gl.vertexAttribPointer(imgShaderProgram.textureCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
 
    // this matirx will convert from pixels to clip space
    var matrix = mat4.create();
 
    // this matrix will translate our quad to dstX, dstY
    //matrix = m4.translate(matrix, dstX, dstY, 0);
 
    // this matrix will scale our 1 unit quad
    // from 1 unit to texWidth, texHeight units
    //matrix = mat4.scale(matrix, canvas.width, canvas.height, 1);
 
    // Set the matrix.
    if(perspectiveCreated){
        var mvMatrix = mat4.create();
        mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(-squareVertices[12], -squareVertices[13], 0))
        mat4.mul(mvMatrix, p2TexMatrix, mvMatrix);
        gl.uniformMatrix4fv(imgShaderProgram.matrixUniform, false, mvMatrix);
    }
    else{
        gl.uniformMatrix4fv(imgShaderProgram.matrixUniform, false, matrix);
    }
    // Tell the shader to get the texture from texture unit 0
    if(offset == 2)
        gl.uniform1i(imgShaderProgram.useMask, 1);
    else
        gl.uniform1i(imgShaderProgram.useMask, 0);
    gl.uniform1i(imgShaderProgram.textureSample, 0);
    gl.uniform1i(imgShaderProgram.maskSample, 2);
 
    gl.enableVertexAttribArray(imgShaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(imgShaderProgram.textureCoordinateAttribute);
    
    // draw the quad (2 triangles, 6 vertices)
    if(perspectiveCreated){
        gl.drawArrays(gl.TRIANGLES, 0, positions.length/3);
    }
    else{
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.disableVertexAttribArray(imgShaderProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(imgShaderProgram.textureCoordinateAttribute);
    
}

function drawRearWall(){
    /*======= Associating shaders to buffer objects ======*/
    gl.useProgram(shaderProgram);
    
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, rearWallVertexPositionBuffer);

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Draw the rear wall
    gl.drawArrays(gl.LINE_LOOP, 0, 4);
    
    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vanishingLinesPositionBuffer);

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 16);
    
    gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}

//----------------------------------------------------------------------------------
/**
 * animate function to upload parameter
 */
function animate() {
    handleKeys();
    updateVanishingLines();
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var moonRotationMatrix = mat4.create();
mat4.identity(moonRotationMatrix);

function handleMouseDown(event) {
    canvasRect = canvas.getBoundingClientRect();
    mouseDown = true;
    
    // convert to viewport
    var canvasX = 2*(event.clientX - canvasRect.left)/canvas.width - 1;
    // invert y
    var canvasY = -1 * (2*(event.clientY - canvasRect.top)/canvas.height - 1);
    
    if(canvasX > 1)
        canvasX = 1;
    else if(canvasX < -1)
        canvasX = -1;
    
    if(canvasY > 1)
        canvasY = 1;
    else if(canvasY < -1)
        canvasY = -1;
    
    console.log(canvasX);
    console.log(canvasY);
    if(toSelectFrontObject){
        startX = canvasX;
        startY = canvasY;
    }
    else{
        // get control point based on distance
        // max dist is 2^2 * 2 = 8
        closestDist = 10;
        for(i = 0; i < 5; i++){
            var diffX = Math.abs(canvasX - squareVertices[3*i]);
            var diffY = Math.abs(canvasY - squareVertices[3*i+1]);
            var currDist = diffX + diffY;//diffX * diffX + diffY * diffY;
            if(currDist < DIST_THRESHOLD && currDist < closestDist){
                closestDist = currDist;
                selectedControlPointIdx = i;
                console.log("Pickup: "+i);
            }
        }
    }
}

function handleMouseUp(event) {
    mouseDown = false;
    selectedControlPointIdx = -1;
    if(toSelectFrontObject && !perspectiveCreated && startY != endY && startX != endX){
        // add into selectedAreas
        lbX = startX;
        lbY = startY;
        rtX = endX;
        rtY = endY;
        if(startX > endX){
            lbX = endX;
            rtX = startX;
        }
        if(startY > endY){
            lbY = endY;
            rtY = startY;
        }
        
        var scale = ((squareVertices[13]+1) - (squareVertices[13] - lbY))/ (squareVertices[13] - lbY);
        var objectD = -1 * d - scale * f;//scale * f * -1 - f; // -1 as side
        
        scale += 1;
        
        var downShift = (lbY - squareVertices[13]) * scale;
        var upShift = (rtY - squareVertices[13]) * scale;
        var leftShift = (lbX - squareVertices[12]) * scale;
        var rightShift = (rtX - squareVertices[12]) * scale;
        
        selectedAreas.push(rearX + leftShift);
        selectedAreas.push(rearY - rearDownShift3D);
        selectedAreas.push(objectD);
        projectAreas.push(lbX);
        projectAreas.push(lbY);
        projectAreas.push(0);
        
        selectedAreas.push(rearX + leftShift);
        selectedAreas.push(rearY + upShift);
        selectedAreas.push(objectD);
        projectAreas.push(lbX);
        projectAreas.push(rtY);
        projectAreas.push(0);
        
        selectedAreas.push(rearX + rightShift);
        selectedAreas.push(rearY - rearDownShift3D);
        selectedAreas.push(objectD);
        projectAreas.push(rtX);
        projectAreas.push(lbY);
        projectAreas.push(0);
        
        selectedAreas.push(rearX + rightShift);
        selectedAreas.push(rearY - rearDownShift3D);
        selectedAreas.push(objectD);
        projectAreas.push(rtX);
        projectAreas.push(lbY);
        projectAreas.push(0);
        
        selectedAreas.push(rearX + leftShift);
        selectedAreas.push(rearY + upShift);
        selectedAreas.push(objectD);
        projectAreas.push(lbX);
        projectAreas.push(rtY);
        projectAreas.push(0);
        
        selectedAreas.push(rearX + rightShift);
        selectedAreas.push(rearY + upShift);
        selectedAreas.push(objectD);
        projectAreas.push(rtX);
        projectAreas.push(rtY);
        projectAreas.push(0);
        
        frontObjectBuffer = gl.createBuffer();
        frontProjBuffer = gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, frontObjectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selectedAreas), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, frontProjBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(projectAreas), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        startX = 0;
        startY = 0;
        endX = 0;
        endY = 0;
    }
}

function handleMouseMove(event) {
    if (!mouseDown || perspectiveCreated) {
        return;
    }
    // convert to viewport
    var canvasX = 2*(event.clientX - canvasRect.left)/canvas.width - 1;
    // invert y
    var canvasY = -1 * (2*(event.clientY - canvasRect.top)/canvas.height - 1);
    
    if(canvasX > 1)
        canvasX = 1;
    else if(canvasX < -1)
        canvasX = -1;
    
    if(canvasY > 1)
        canvasY = 1;
    else if(canvasY < -1)
        canvasY = -1;
    
    if(toSelectFrontObject){
        endX = canvasX;
        endY = canvasY;
    }
    else{
        squareVertices[3*selectedControlPointIdx] = canvasX;
        squareVertices[3*selectedControlPointIdx+1] = canvasY;
        switch(selectedControlPointIdx){
            case 0:
                squareVertices[3*(selectedControlPointIdx+1)] = canvasX;
                squareVertices[3*(selectedControlPointIdx+3)+1] = canvasY;
                break;
            case 1:
                squareVertices[3*(selectedControlPointIdx-1)] = canvasX;
                squareVertices[3*(selectedControlPointIdx+1)+1] = canvasY;
                break;
            case 2:
                squareVertices[3*(selectedControlPointIdx+1)] = canvasX;
                squareVertices[3*(selectedControlPointIdx-1)+1] = canvasY;
                break;
            case 3:
                squareVertices[3*(selectedControlPointIdx-1)] = canvasX;
                squareVertices[3*(selectedControlPointIdx-3)+1] = canvasY;
                break;
            case 4:
                for(i = 0; i < 8; i++){
                    vanishingLineVertices[6*i] = canvasX;
                    vanishingLineVertices[6*i+1] = canvasY;
                }
        }
    }
}

var currentlyPressedKeys = {};

/**
 * Function called when a key down input is detected to set up variables for handling user input
 */
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

/**
 * Function called when a key up input is detected to set up variables for handling user input
 */
function handleKeyUp(event) {
    if(currentlyPressedKeys[13]){
        if(imgChecked != 3){
            if(!perspectiveCreated)
                computeGeometry();
            perspectiveCreated = !perspectiveCreated;
        }
        else{
            if(toSelectFrontObject){
                if(perspectiveCreated){
                    toSelectFrontObject = !toSelectFrontObject;
                    selectedAreas = [];
                    projectAreas = [];
                }
                
                perspectiveCreated = !perspectiveCreated;
            }
            else{
                toSelectFrontObject = !toSelectFrontObject;
                computeGeometry();
            }
        }
    }
    currentlyPressedKeys[event.keyCode] = false;
    
}

/**
 * Function to generate quaternion that will apply to eye's up vector and look at vector based on user input it receives
 */
function handleKeys() {
//    if (currentlyPressedKeys[33]) {
//      // Page Up
//      objRotationRadians -= 0.01;
//    }
//    if (currentlyPressedKeys[34]) {
//      // Page Down
//      objRotationRadians += 0.01;    
//    }
    // W
    if (currentlyPressedKeys[87])
        vec3.add(eyePt, eyePt, vec3.fromValues(0,0,-0.005));
    if (currentlyPressedKeys[83])
        vec3.add(eyePt, eyePt, vec3.fromValues(0,0,0.005));
    if (currentlyPressedKeys[65])
        vec3.add(eyePt, eyePt, vec3.fromValues(-0.005,0,0));
    if (currentlyPressedKeys[68])
        vec3.add(eyePt, eyePt, vec3.fromValues(0.005,0,0));
    if (currentlyPressedKeys[81])
        vec3.add(eyePt, eyePt, vec3.fromValues(0,-0.005,0));
    if (currentlyPressedKeys[69])
        vec3.add(eyePt, eyePt, vec3.fromValues(0,0.005,0));
}


//----------------------------------------------------------------------------------
/**
 * Load image for one side of cube map
 * @param {gl} gl gl program
 * @param {target} target the target of the mapping
 * @param {texture} textrure the texture object of the target
 * @param {String} url link to the image
 */
function loadImageAsBackground(){
// TODO: Onload call function
    imgTexture = gl.createTexture();
    filledTexture = gl.createTexture();
    frontMaskTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgTexture);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    imgLoaded = -1;
    var img = imgChecked;
    var url = preDefinedImg[img];
    var image = new Image();
    image.onload = function(){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imgTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        // Assume image is not a power of 2. Turn of mips and set wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.viewportWidth = image.width;
        gl.viewportHeight = image.height;
        canvas.width = image.width;
        canvas.height = image.height;
        imgLoaded = img;
    }
    image.src = url;
}

//----------------------------------------------------------------------------------
/**
 * Load image for one side of cube map
 * @param {gl} gl gl program
 * @param {texture} textrure the texture object of the target
 * @param {String} url link to the image
 */
function loadPreprocessImg(gl, texture, url){
// TODO: Onload call function
    var image = new Image();
    image.onload = function(){
        if(url == preprocessImg[0])
            gl.activeTexture(gl.TEXTURE2);
        else
            gl.activeTexture(gl.TEXTURE1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Assume image is not a power of 2. Turn of mips and set wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        preprocessImgLoaded += 1;
    }
    image.src = url;
}

function computeGeometry(){
    var scale = ((squareVertices[13]+1) - (squareVertices[13] - squareVertices[1]))/ (squareVertices[13] - squareVertices[1]);
    d = scale * f;
    scale += 1;
    rearDownShift3D = scale * rearDownShift2D;
    rearUpShift3D = scale * rearUpShift2D;
    rearLeftShift3D = scale * rearLeftShift2D;
    rearRightShift3D = scale * rearRightShift2D;
    rearX = squareVertices[12] * scale;
    rearY = squareVertices[13] * scale;
    vec3.set(eyePt, squareVertices[12], squareVertices[13], 0);
    mat4.perspective(p2TexMatrix,degToRad(90), 1 , 0.1, -1 * d);
    console.log("Geometry computed");
    console.log(p2TexMatrix);
}